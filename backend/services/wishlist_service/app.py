"""wishlist-service :8004 — saved products."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from flask import jsonify  # noqa: E402

from shared import auth, db  # noqa: E402
from shared.config import PORTS  # noqa: E402
from shared.service import (  # noqa: E402
    ApiError,
    call_service,
    create_app,
    incoming_token,
    json_body,
    require_fields,
)

app = create_app("wishlist")


@app.get("/wishlist")
@auth.require_auth
def get_wishlist():
    """Returns ids only. The UI keeps a Set of ids for the heart toggles, and
    already has the full products from catalog-service."""
    rows = db.query(
        "SELECT product_id FROM wishlist.wishlist_items WHERE user_id = %s ORDER BY created_at DESC",
        (auth.current_user_id(),),
    )
    return jsonify([r["product_id"] for r in rows])


@app.get("/wishlist/products")
@auth.require_auth
def get_wishlist_products():
    """Hydrated variant, for the profile page's wishlist grid."""
    rows = db.query(
        "SELECT product_id FROM wishlist.wishlist_items WHERE user_id = %s ORDER BY created_at DESC",
        (auth.current_user_id(),),
    )
    ids = [r["product_id"] for r in rows]
    if not ids:
        return jsonify([])

    resp = call_service(
        "catalog", "/products/batch", method="POST",
        token=incoming_token(), json={"ids": ids},
    )
    if resp.status_code != 200:
        raise ApiError("Could not load products from catalog-service", 502)
    return jsonify(resp.json())


@app.post("/wishlist")
@auth.require_auth
def toggle_wishlist():
    """Idempotent toggle. Returns the full id list so the client replaces
    state wholesale instead of guessing at the new value."""
    body = json_body()
    require_fields(body, "productId")
    uid = auth.current_user_id()
    pid = body["productId"]

    existing = db.query_one(
        "SELECT id FROM wishlist.wishlist_items WHERE user_id = %s AND product_id = %s",
        (uid, pid),
    )
    if existing:
        db.execute(
            "DELETE FROM wishlist.wishlist_items WHERE user_id = %s AND product_id = %s",
            (uid, pid),
        )
        added = False
    else:
        db.execute(
            """
            INSERT INTO wishlist.wishlist_items (user_id, product_id) VALUES (%s, %s)
            ON CONFLICT (user_id, product_id) DO NOTHING
            """,
            (uid, pid),
        )
        added = True

    rows = db.query(
        "SELECT product_id FROM wishlist.wishlist_items WHERE user_id = %s ORDER BY created_at DESC",
        (uid,),
    )
    return jsonify({"added": added, "productIds": [r["product_id"] for r in rows]})


@app.delete("/wishlist/<product_id>")
@auth.require_auth
def remove_from_wishlist(product_id: str):
    db.execute(
        "DELETE FROM wishlist.wishlist_items WHERE user_id = %s AND product_id = %s",
        (auth.current_user_id(), product_id),
    )
    rows = db.query(
        "SELECT product_id FROM wishlist.wishlist_items WHERE user_id = %s ORDER BY created_at DESC",
        (auth.current_user_id(),),
    )
    return jsonify({"productIds": [r["product_id"] for r in rows]})


if __name__ == "__main__":
    app.run(port=PORTS["wishlist"], debug=False)
