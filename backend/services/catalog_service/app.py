"""catalog-service :8001 — products and reviews."""
import secrets
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import psycopg  # noqa: E402
from flask import jsonify, request  # noqa: E402

from shared import auth, db, serialize  # noqa: E402
from shared.config import PORTS  # noqa: E402
from shared.service import ApiError, create_app, json_body, require_fields  # noqa: E402

app = create_app("catalog")

VALID_CATEGORIES = {
    "Women", "Men", "Kids", "Wedding",
    "Jewellery", "Shoes", "Handbags", "Home Decoration",
}


@app.get("/products")
def list_products():
    """Filters are optional and compose. `search` matches name, brand, or
    description as a plain substring — the old backend wrapped the term in
    literal quotes here, so it matched almost nothing."""
    clauses, params = [], []

    if category := request.args.get("category"):
        clauses.append("category = %s")
        params.append(category)
    if badge := request.args.get("badge"):
        clauses.append("badge = %s")
        params.append(badge)
    if status := request.args.get("status"):
        clauses.append("status = %s")
        params.append(status)
    if vendor := request.args.get("vendorUserId"):
        clauses.append("vendor_user_id = %s")
        params.append(vendor)
    if search := request.args.get("search"):
        clauses.append(
            "(lower(name) LIKE %s OR lower(brand) LIKE %s OR lower(description) LIKE %s)"
        )
        needle = f"%{search.lower()}%"
        params.extend([needle, needle, needle])

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    rows = db.query(f"SELECT * FROM catalog.products {where} ORDER BY product_id", tuple(params))

    # One query for every review, grouped in memory — avoids N+1 across the list.
    reviews_by_product: dict[str, list[dict]] = {}
    if rows:
        ids = [r["product_id"] for r in rows]
        for rev in db.query(
            "SELECT * FROM catalog.reviews WHERE product_id = ANY(%s) ORDER BY created_at DESC",
            (ids,),
        ):
            reviews_by_product.setdefault(rev["product_id"], []).append(rev)

    return jsonify(
        [serialize.product_json(r, reviews_by_product.get(r["product_id"], [])) for r in rows]
    )


@app.get("/products/<product_id>")
def get_product(product_id: str):
    row = db.query_one("SELECT * FROM catalog.products WHERE product_id = %s", (product_id,))
    if not row:
        raise ApiError("Product not found", 404)
    reviews = db.query(
        "SELECT * FROM catalog.reviews WHERE product_id = %s ORDER BY created_at DESC",
        (product_id,),
    )
    return jsonify(serialize.product_json(row, reviews))


@app.post("/products/batch")
def get_products_batch():
    """Resolve many ids at once. Cart, wishlist, and order services call this
    to enrich their rows rather than reaching into the catalog's tables."""
    body = json_body()
    ids = body.get("ids") or []
    if not isinstance(ids, list):
        raise ApiError("ids must be an array", 400)
    if not ids:
        return jsonify([])

    rows = db.query("SELECT * FROM catalog.products WHERE product_id = ANY(%s)", (ids,))
    return jsonify([serialize.product_json(r) for r in rows])


@app.post("/products")
@auth.require_auth
@auth.require_role("vendor", "admin")
def create_product():
    body = json_body()
    require_fields(body, "name", "category", "subCategory", "brand", "rentalPrice", "securityDeposit")

    if body["category"] not in VALID_CATEGORIES:
        raise ApiError(f"category must be one of: {', '.join(sorted(VALID_CATEGORIES))}", 400)

    try:
        rental_price = int(body["rentalPrice"])
        security_deposit = int(body["securityDeposit"])
    except (TypeError, ValueError):
        raise ApiError("rentalPrice and securityDeposit must be integers", 400)
    if rental_price < 0 or security_deposit < 0:
        raise ApiError("Prices cannot be negative", 400)

    product_id = f"prod-{secrets.token_hex(6)}"
    row = db.execute(
        """
        INSERT INTO catalog.products (
            product_id, name, category, sub_category, brand, description, image,
            gallery, sizes, colors, rental_price, security_deposit, vendor_name,
            vendor_user_id, vendor_verified, badge, status, delivery_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Available', %s)
        RETURNING *
        """,
        (
            product_id,
            body["name"],
            body["category"],
            body["subCategory"],
            body["brand"],
            body.get("description", ""),
            body.get("image") or "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600",
            psycopg.types.json.Jsonb(body.get("gallery") or []),
            psycopg.types.json.Jsonb(body.get("sizes") or ["S", "M", "L"]),
            psycopg.types.json.Jsonb(body.get("colors") or [{"name": "Neutral", "hex": "#D3C6B8"}]),
            rental_price,
            security_deposit,
            body.get("vendorName") or auth.g.user.get("email", "Verified Vendor"),
            auth.current_user_id(),
            body.get("vendorVerified", "Verified Vendor"),
            body.get("badge", "New"),
            body.get("deliveryDate", "Tomorrow"),
        ),
    )
    return jsonify(serialize.product_json(row, [])), 201


def _owned_or_admin(product_id: str) -> dict:
    row = db.query_one("SELECT * FROM catalog.products WHERE product_id = %s", (product_id,))
    if not row:
        raise ApiError("Product not found", 404)
    if auth.g.user["role"] != "admin" and row["vendor_user_id"] != auth.current_user_id():
        raise ApiError("Forbidden: you do not own this listing", 403)
    return row


@app.put("/products/<product_id>")
@auth.require_auth
@auth.require_role("vendor", "admin")
def update_product(product_id: str):
    _owned_or_admin(product_id)
    body = json_body()

    scalar = {
        "name": "name",
        "subCategory": "sub_category",
        "brand": "brand",
        "description": "description",
        "image": "image",
        "badge": "badge",
        "status": "status",
        "deliveryDate": "delivery_date",
    }
    jsonb = {"gallery": "gallery", "sizes": "sizes", "colors": "colors"}
    numeric = {"rentalPrice": "rental_price", "securityDeposit": "security_deposit"}

    sets, params = [], []
    for key, column in scalar.items():
        if key in body:
            sets.append(f"{column} = %s")
            params.append(body[key])
    for key, column in jsonb.items():
        if key in body:
            sets.append(f"{column} = %s")
            params.append(psycopg.types.json.Jsonb(body[key]))
    for key, column in numeric.items():
        if key in body:
            try:
                params.append(int(body[key]))
            except (TypeError, ValueError):
                raise ApiError(f"{key} must be an integer", 400)
            sets.append(f"{column} = %s")
    if "category" in body:
        if body["category"] not in VALID_CATEGORIES:
            raise ApiError("Invalid category", 400)
        sets.append("category = %s")
        params.append(body["category"])

    if not sets:
        raise ApiError("No updatable fields provided", 400)

    params.append(product_id)
    row = db.execute(
        f"UPDATE catalog.products SET {', '.join(sets)} WHERE product_id = %s RETURNING *",
        tuple(params),
    )
    return jsonify(serialize.product_json(row, []))


@app.delete("/products/<product_id>")
@auth.require_auth
@auth.require_role("vendor", "admin")
def delete_product(product_id: str):
    _owned_or_admin(product_id)
    db.execute("DELETE FROM catalog.products WHERE product_id = %s", (product_id,))
    return jsonify({"success": True, "id": product_id})


@app.put("/products/<product_id>/status")
@auth.require_auth
def set_status(product_id: str):
    """Lifecycle transitions. order-service calls this on checkout and return,
    so it is not restricted to vendors."""
    body = json_body()
    require_fields(body, "status")
    row = db.execute(
        "UPDATE catalog.products SET status = %s WHERE product_id = %s RETURNING *",
        (body["status"], product_id),
    )
    if not row:
        raise ApiError("Product not found", 404)
    return jsonify(serialize.product_json(row, []))


@app.get("/products/<product_id>/reviews")
def list_reviews(product_id: str):
    rows = db.query(
        "SELECT * FROM catalog.reviews WHERE product_id = %s ORDER BY created_at DESC",
        (product_id,),
    )
    return jsonify([serialize.review_json(r) for r in rows])


@app.post("/products/<product_id>/reviews")
@auth.require_auth
def create_review(product_id: str):
    body = json_body()
    require_fields(body, "rating", "comment")
    try:
        rating = int(body["rating"])
    except (TypeError, ValueError):
        raise ApiError("rating must be an integer", 400)
    if not 1 <= rating <= 5:
        raise ApiError("rating must be between 1 and 5", 400)

    if not db.query_one("SELECT 1 FROM catalog.products WHERE product_id = %s", (product_id,)):
        raise ApiError("Product not found", 404)

    uid = auth.current_user_id()
    with db.cursor(commit=True) as cur:
        try:
            cur.execute(
                """
                INSERT INTO catalog.reviews (review_id, product_id, user_id, user_name,
                                             user_avatar, rating, comment, date, variant)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    f"rev-{secrets.token_hex(6)}",
                    product_id,
                    uid,
                    body.get("userName") or auth.g.user.get("email", "Valued Swapper"),
                    body.get("userAvatar", ""),
                    rating,
                    body["comment"],
                    date.today().isoformat(),
                    body.get("variant", "Standard Selection"),
                ),
            )
        except psycopg.errors.UniqueViolation:
            raise ApiError("You have already reviewed this product", 409)

        review = cur.fetchone()

        # Recompute the aggregate inside the same transaction as the insert,
        # so rating and reviews_count can never drift from the rows.
        cur.execute(
            """
            UPDATE catalog.products p
            SET rating = COALESCE(agg.avg_rating, 5.0),
                reviews_count = COALESCE(agg.n, 0)
            FROM (SELECT AVG(rating)::numeric(2,1) AS avg_rating, COUNT(*) AS n
                  FROM catalog.reviews WHERE product_id = %s) agg
            WHERE p.product_id = %s
            """,
            (product_id, product_id),
        )

    return jsonify(serialize.review_json(review)), 201


@app.get("/internal/stats")
def internal_stats():
    rows = db.query("SELECT category, COUNT(*) AS n FROM catalog.products GROUP BY category")
    total = db.query_one("SELECT COUNT(*) AS n FROM catalog.products")
    return jsonify(
        {
            "totalProducts": total["n"],
            "categoryDistribution": [{"name": r["category"], "value": r["n"]} for r in rows],
        }
    )


if __name__ == "__main__":
    app.run(port=PORTS["catalog"], debug=False)
