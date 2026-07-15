"""coupon-service :8005 — discount codes and validation."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from flask import jsonify  # noqa: E402

from shared import auth, db, serialize  # noqa: E402
from shared.config import PORTS  # noqa: E402
from shared.service import ApiError, create_app, json_body, require_fields  # noqa: E402

app = create_app("coupon")


def compute_discount(coupon: dict, subtotal: int) -> int:
    """Single source of truth for discount maths. order-service calls
    /coupons/validate rather than reimplementing this, so the checkout preview
    and the committed order can never disagree."""
    if coupon["discount_type"] == "percentage":
        discount = round(subtotal * coupon["value"] / 100)
    else:
        discount = coupon["value"]
    # Never exceed the subtotal — a fixed ₹15 coupon on a ₹8 rental must not
    # produce a negative total.
    return max(0, min(discount, subtotal))


@app.get("/coupons")
def list_coupons():
    rows = db.query("SELECT * FROM coupons.coupons WHERE active ORDER BY code")
    return jsonify([serialize.coupon_json(r) for r in rows])


@app.post("/coupons/validate")
@auth.require_auth
def validate_coupon():
    body = json_body()
    require_fields(body, "code", "subtotal")
    try:
        subtotal = int(body["subtotal"])
    except (TypeError, ValueError):
        raise ApiError("subtotal must be an integer", 400)
    if subtotal < 0:
        raise ApiError("subtotal cannot be negative", 400)

    row = db.query_one(
        "SELECT * FROM coupons.coupons WHERE upper(code) = upper(%s) AND active",
        (body["code"].strip(),),
    )
    if not row:
        raise ApiError("That coupon code is not valid", 404)

    return jsonify(
        {
            "valid": True,
            "coupon": serialize.coupon_json(row),
            "discountAmount": compute_discount(row, subtotal),
        }
    )


@app.post("/coupons")
@auth.require_auth
@auth.require_role("admin")
def create_coupon():
    body = json_body()
    require_fields(body, "code", "discountType", "value", "description")
    if body["discountType"] not in ("percentage", "fixed"):
        raise ApiError("discountType must be 'percentage' or 'fixed'", 400)
    try:
        value = int(body["value"])
    except (TypeError, ValueError):
        raise ApiError("value must be an integer", 400)
    if value <= 0:
        raise ApiError("value must be positive", 400)

    row = db.execute(
        """
        INSERT INTO coupons.coupons (code, discount_type, value, description)
        VALUES (upper(%s), %s, %s, %s)
        ON CONFLICT (code) DO NOTHING
        RETURNING *
        """,
        (body["code"].strip(), body["discountType"], value, body["description"]),
    )
    if not row:
        raise ApiError("A coupon with that code already exists", 409)
    return jsonify(serialize.coupon_json(row)), 201


@app.delete("/coupons/<code>")
@auth.require_auth
@auth.require_role("admin")
def deactivate_coupon(code: str):
    row = db.execute(
        "UPDATE coupons.coupons SET active = false WHERE upper(code) = upper(%s) RETURNING *",
        (code,),
    )
    if not row:
        raise ApiError("Coupon not found", 404)
    return jsonify({"success": True, "code": row["code"]})


if __name__ == "__main__":
    app.run(port=PORTS["coupon"], debug=False)
