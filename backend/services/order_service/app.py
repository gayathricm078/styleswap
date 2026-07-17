"""order-service :8002 — checkout, order history, returns.

Checkout is the one flow that spans services: it reads the cart, prices it
against the catalog, validates the coupon, writes the order, flips product
status, clears the cart, and raises a notification.
"""
import random
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import psycopg  # noqa: E402
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

app = create_app("order")

# Must stay in step with the CHECK constraint on orders.orders.status.
VALID_ORDER_STATUSES = {
    "Booked",
    "Out For Delivery",
    "Currently Rented",
    "Returned",
    "Under Maintenance",
    "Pending Approval",
    "Rejected",
}


def _load_items(order_id: str) -> list[dict]:
    return db.query("SELECT * FROM orders.order_items WHERE order_id = %s ORDER BY id", (order_id,))


@app.get("/orders")
@auth.require_auth
def list_orders():
    """Customers see their own orders. Vendors and admins see all — the
    vendor dashboard needs incoming orders to fulfil."""
    if auth.g.user["role"] in ("admin", "vendor"):
        rows = db.query("SELECT * FROM orders.orders ORDER BY created_at DESC")
    else:
        rows = db.query(
            "SELECT * FROM orders.orders WHERE user_id = %s ORDER BY created_at DESC",
            (auth.current_user_id(),),
        )
    return jsonify([serialize.order_json(r, _load_items(r["order_id"])) for r in rows])


@app.get("/orders/<order_id>")
@auth.require_auth
def get_order(order_id: str):
    row = db.query_one("SELECT * FROM orders.orders WHERE order_id = %s", (order_id,))
    if not row:
        raise ApiError("Order not found", 404)
    if auth.g.user["role"] not in ("admin", "vendor") and row["user_id"] != auth.current_user_id():
        raise ApiError("Forbidden: not your order", 403)
    return jsonify(serialize.order_json(row, _load_items(order_id)))


@app.post("/orders")
@auth.require_auth
def create_order():
    """Place an order from the caller's server-side cart.

    The client sends only an address id, a payment method, and an optional
    coupon. Every number is recomputed here from the catalog — a client that
    posts its own totals cannot underpay.
    """
    body = json_body()
    require_fields(body, "deliveryAddressId", "paymentMethod")
    if body["paymentMethod"] not in ("Razorpay (Online)", "Cash on Delivery"):
        raise ApiError("Unsupported payment method", 400)

    uid = auth.current_user_id()
    token = incoming_token()

    # 1. Address must belong to the caller. auth-service scopes by token, so a
    #    foreign address id simply won't be found.
    addr_resp = call_service("auth", "/addresses", token=token)
    if addr_resp.status_code != 200:
        raise ApiError("Could not verify delivery address", 502)
    address = next(
        (a for a in addr_resp.json() if a["id"] == body["deliveryAddressId"]), None
    )
    if not address:
        raise ApiError("Delivery address not found on your account", 404)

    # 2. Cart is read server-side; the client cannot inject line items.
    cart_resp = call_service("cart", "/cart", token=token)
    if cart_resp.status_code != 200:
        raise ApiError("Could not load your cart", 502)
    cart_items = cart_resp.json()
    if not cart_items:
        raise ApiError("Your bag is empty", 400)

    # 3. Price from the catalog snapshot returned by cart-service.
    rental_total = sum(i["product"]["rentalPrice"] * i["rentalDuration"] for i in cart_items)
    deposit_total = sum(i["product"]["securityDeposit"] for i in cart_items)
    subtotal = rental_total + deposit_total

    # 4. Coupon, if any, is validated and priced by coupon-service.
    discount = 0
    coupon_code = None
    if body.get("couponCode"):
        resp = call_service(
            "coupon", "/coupons/validate", method="POST", token=token,
            json={"code": body["couponCode"], "subtotal": rental_total},
        )
        if resp.status_code != 200:
            raise ApiError("That coupon code is not valid", 400)
        payload = resp.json()
        discount = payload["discountAmount"]
        coupon_code = payload["coupon"]["code"]

    total = max(0, subtotal - discount)
    order_id = f"ord-{random.randint(100000, 999999)}"

    # 5. Order + items in one transaction. Either the whole order lands or none
    #    of it does.
    with db.cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO orders.orders (order_id, user_id, total_amount, status, date,
                                       delivery_address, payment_method, return_status,
                                       coupon_code, discount_amount)
            VALUES (%s, %s, %s, 'Booked', %s, %s, %s, 'Pending', %s, %s)
            RETURNING *
            """,
            (
                order_id,
                uid,
                total,
                date.today().isoformat(),
                psycopg.types.json.Jsonb(address),
                body["paymentMethod"],
                coupon_code,
                discount,
            ),
        )
        order = cur.fetchone()

        for item in cart_items:
            cur.execute(
                """
                INSERT INTO orders.order_items (order_id, product_id, product_snapshot,
                                                selected_size, selected_color, rental_duration,
                                                start_date, security_deposit, total_price)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    order_id,
                    item["product"]["id"],
                    psycopg.types.json.Jsonb(item["product"]),
                    item["selectedSize"],
                    item["selectedColor"],
                    item["rentalDuration"],
                    item["startDate"],
                    item["product"]["securityDeposit"],
                    item["product"]["rentalPrice"] * item["rentalDuration"],
                ),
            )

    # 6. Side effects, after the order is durably committed. These are
    #    best-effort: a notification failure must not undo a paid order.
    for item in cart_items:
        try:
            call_service(
                "catalog", f"/products/{item['product']['id']}/status",
                method="PUT", token=token, json={"status": "Booked"},
            )
        except ApiError:
            app.logger.warning("Could not mark %s booked", item["product"]["id"])

    try:
        call_service("cart", "/cart", method="DELETE", token=token)
    except ApiError:
        app.logger.warning("Could not clear cart for %s", uid)

    try:
        names = ", ".join(i["product"]["name"] for i in cart_items)
        call_service(
            "notification", "/internal/notify", method="POST",
            json={
                "userId": uid,
                "title": "Order Placed Successfully",
                "message": f"Your rental transaction for {names} has been completed.",
                "type": "delivery",
            },
        )
    except ApiError:
        app.logger.warning("Could not raise order notification for %s", uid)

    return jsonify({"success": True, "order": serialize.order_json(order, _load_items(order_id))}), 201


@app.put("/orders/<order_id>/status")
@auth.require_auth
def update_status(order_id: str):
    """Fulfilment transitions. Vendor/admin only.

    The old backend filtered on order_id alone with no ownership or role check,
    so any authenticated user could rewrite any order or clear its damage fee.
    """
    body = json_body()
    require_fields(body, "status")

    # Validate here rather than letting the column's CHECK constraint raise —
    # an unknown status is a client error (400), not a server failure (500).
    if body["status"] not in VALID_ORDER_STATUSES:
        raise ApiError(
            f"status must be one of: {', '.join(sorted(VALID_ORDER_STATUSES))}", 400
        )

    row = db.query_one("SELECT * FROM orders.orders WHERE order_id = %s", (order_id,))
    if not row:
        raise ApiError("Order not found", 404)
    if auth.g.user["role"] not in ("vendor", "admin"):
        raise ApiError("Forbidden: only a vendor or admin can change order status", 403)

    updated = db.execute(
        "UPDATE orders.orders SET status = %s WHERE order_id = %s RETURNING *",
        (body["status"], order_id),
    )
    return jsonify(serialize.order_json(updated, _load_items(order_id)))


@app.post("/orders/<order_id>/return-scan")
@auth.require_auth
def return_scan(order_id: str):
    """Run the AI damage scan on a return and record the verdict.

    The fee comes from ai-service, never from the request body — otherwise a
    customer could POST feeCharged: 0 and clear their own damage charge.
    """
    body = json_body()
    preset = body.get("damagePreset", "perfect")
    if preset not in ("perfect", "stain", "tear"):
        raise ApiError("damagePreset must be perfect, stain, or tear", 400)

    row = db.query_one("SELECT * FROM orders.orders WHERE order_id = %s", (order_id,))
    if not row:
        raise ApiError("Order not found", 404)
    if auth.g.user["role"] not in ("admin", "vendor") and row["user_id"] != auth.current_user_id():
        raise ApiError("Forbidden: not your order", 403)

    token = incoming_token()
    resp = call_service(
        "ai", "/damage-detection", method="POST", token=token,
        json={"damagePreset": preset}, timeout=30.0,
    )
    if resp.status_code != 200:
        raise ApiError("Damage scan is unavailable right now", 502)
    scan = resp.json()

    severity = {"perfect": "None", "stain": "Minor", "tear": "Major"}[preset]
    report = {
        "severity": severity,
        "description": scan.get("damageSummary", ""),
        "charge": scan.get("feeCharged", 0),
    }

    updated = db.execute(
        """
        UPDATE orders.orders
        SET status = %s, return_status = %s, damage_report = %s
        WHERE order_id = %s
        RETURNING *
        """,
        (
            "Returned" if preset == "perfect" else "Under Maintenance",
            "Returned In Perfect Condition" if preset == "perfect" else "Damage Detected",
            psycopg.types.json.Jsonb(report),
            order_id,
        ),
    )

    # Returned garments go back on the shelf; damaged ones go to maintenance.
    for item in _load_items(order_id):
        try:
            call_service(
                "catalog", f"/products/{item['product_id']}/status", method="PUT",
                token=token,
                json={"status": "Available" if preset == "perfect" else "Under Maintenance"},
            )
        except ApiError:
            app.logger.warning("Could not update status for %s", item["product_id"])

    try:
        if preset == "perfect":
            title, message, ntype = (
                "Garment Return Logged",
                "Your returned item passed integrity clearance in perfect condition.",
                "return",
            )
        else:
            title, message, ntype = (
                "Damage Inspection Flagged",
                f"Integrity scan returned a warning: {report['description']} "
                f"A recovery fee of ₹{report['charge']} was noted.",
                "return",
            )
        call_service(
            "notification", "/internal/notify", method="POST",
            json={"userId": row["user_id"], "title": title, "message": message, "type": ntype},
        )
    except ApiError:
        app.logger.warning("Could not raise return notification")

    return jsonify({**scan, "order": serialize.order_json(updated, _load_items(order_id))})


@app.get("/internal/stats")
def internal_stats():
    revenue = db.query_one("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders.orders")
    active = db.query_one(
        """
        SELECT COUNT(*) AS n FROM orders.orders
        WHERE status IN ('Booked', 'Out For Delivery', 'Currently Rented')
        """
    )
    total = db.query_one("SELECT COUNT(*) AS n FROM orders.orders")
    perfect = db.query_one(
        "SELECT COUNT(*) AS n FROM orders.orders WHERE return_status = 'Returned In Perfect Condition'"
    )
    damaged = db.query_one(
        "SELECT COUNT(*) AS n FROM orders.orders WHERE return_status = 'Damage Detected'"
    )
    trends = db.query(
        """
        SELECT to_char(created_at, 'Mon') AS month,
               COUNT(*) AS rentals,
               COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders.orders
        GROUP BY to_char(created_at, 'Mon'), date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
        """
    )

    returned = perfect["n"] + damaged["n"]
    return jsonify(
        {
            "totalRevenue": int(revenue["total"]),
            "activeRentals": active["n"],
            "totalOrders": total["n"],
            "perfectReturns": perfect["n"],
            "damagedReturns": damaged["n"],
            "returnRatePercentage": round(returned / total["n"] * 100) if total["n"] else 0,
            "rentTrends": [
                {"month": t["month"], "rentals": t["rentals"], "revenue": int(t["revenue"])}
                for t in trends
            ],
        }
    )


if __name__ == "__main__":
    app.run(port=PORTS["order"], debug=False)
