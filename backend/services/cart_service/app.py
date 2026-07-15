"""cart-service :8003 — the user's bag.

Stores product_id references only. Product detail is fetched from
catalog-service at read time, so a price change shows up in the cart
immediately rather than being frozen at add-to-cart time.
"""
import secrets
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from flask import jsonify  # noqa: E402

from shared import auth, db, serialize  # noqa: E402
from shared.config import PORTS  # noqa: E402
from shared.service import (  # noqa: E402
    ApiError,
    call_service,
    create_app,
    incoming_token,
    json_body,
    require_fields,
)

app = create_app("cart")


def _fetch_products(ids: list[str]) -> dict[str, dict]:
    if not ids:
        return {}
    resp = call_service(
        "catalog", "/products/batch", method="POST",
        token=incoming_token(), json={"ids": ids},
    )
    if resp.status_code != 200:
        raise ApiError("Could not load product details from catalog-service", 502)
    return {p["id"]: p for p in resp.json()}


def _serialize_cart(rows: list[dict]) -> list[dict]:
    products = _fetch_products([r["product_id"] for r in rows])
    out = []
    for row in rows:
        product = products.get(row["product_id"])
        # A product deleted from the catalog leaves an orphan cart row; skip it
        # rather than 500 or invent a placeholder.
        if product:
            out.append(serialize.cart_item_json(row, product))
    return out


@app.get("/cart")
@auth.require_auth
def get_cart():
    rows = db.query(
        "SELECT * FROM cart.cart_items WHERE user_id = %s ORDER BY created_at",
        (auth.current_user_id(),),
    )
    return jsonify(_serialize_cart(rows))


@app.post("/cart")
@auth.require_auth
def add_to_cart():
    body = json_body()
    require_fields(body, "productId", "selectedSize", "selectedColor")
    uid = auth.current_user_id()
    duration = int(body.get("rentalDuration") or 4)
    if duration <= 0:
        raise ApiError("rentalDuration must be positive", 400)

    products = _fetch_products([body["productId"]])
    product = products.get(body["productId"])
    if not product:
        raise ApiError("Product not found", 404)

    # Totals are computed here from the catalog's price. The client's numbers
    # are never trusted — otherwise anyone could POST a totalPrice of 0.
    db.execute(
        """
        INSERT INTO cart.cart_items (cart_item_id, user_id, product_id, selected_size,
                                     selected_color, rental_duration, start_date,
                                     security_deposit, total_price)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (user_id, product_id, selected_size, selected_color)
        DO UPDATE SET rental_duration = cart.cart_items.rental_duration + EXCLUDED.rental_duration,
                      total_price = (cart.cart_items.rental_duration + EXCLUDED.rental_duration) * %s
        RETURNING *
        """,
        (
            f"cart-{secrets.token_hex(6)}",
            uid,
            body["productId"],
            body["selectedSize"],
            body["selectedColor"],
            duration,
            body.get("startDate") or date.today().isoformat(),
            product["securityDeposit"],
            product["rentalPrice"] * duration,
            product["rentalPrice"],
        ),
    )

    rows = db.query(
        "SELECT * FROM cart.cart_items WHERE user_id = %s ORDER BY created_at", (uid,)
    )
    return jsonify(_serialize_cart(rows)), 201


@app.put("/cart/<cart_item_id>")
@auth.require_auth
def update_cart_item(cart_item_id: str):
    body = json_body()
    require_fields(body, "rentalDuration")
    duration = int(body["rentalDuration"])
    if duration <= 0:
        raise ApiError("rentalDuration must be positive", 400)

    uid = auth.current_user_id()
    row = db.query_one(
        "SELECT * FROM cart.cart_items WHERE cart_item_id = %s AND user_id = %s",
        (cart_item_id, uid),
    )
    if not row:
        raise ApiError("Cart item not found", 404)

    product = _fetch_products([row["product_id"]]).get(row["product_id"])
    if not product:
        raise ApiError("Product no longer available", 404)

    db.execute(
        """
        UPDATE cart.cart_items SET rental_duration = %s, total_price = %s
        WHERE cart_item_id = %s AND user_id = %s
        """,
        (duration, product["rentalPrice"] * duration, cart_item_id, uid),
    )

    rows = db.query(
        "SELECT * FROM cart.cart_items WHERE user_id = %s ORDER BY created_at", (uid,)
    )
    return jsonify(_serialize_cart(rows))


@app.delete("/cart/<cart_item_id>")
@auth.require_auth
def remove_cart_item(cart_item_id: str):
    row = db.execute(
        "DELETE FROM cart.cart_items WHERE cart_item_id = %s AND user_id = %s RETURNING cart_item_id",
        (cart_item_id, auth.current_user_id()),
    )
    if not row:
        raise ApiError("Cart item not found", 404)
    return jsonify({"success": True, "id": cart_item_id})


@app.delete("/cart")
@auth.require_auth
def clear_cart():
    """Called by order-service once an order is committed."""
    db.execute("DELETE FROM cart.cart_items WHERE user_id = %s", (auth.current_user_id(),))
    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(port=PORTS["cart"], debug=False)
