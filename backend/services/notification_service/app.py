"""notification-service :8006 — the bell menu.

Other services POST /internal/notify to raise a notification (order placed,
damage detected). That call is service-to-service, so it takes an explicit
userId rather than reading one from a token.
"""
import secrets
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from flask import jsonify  # noqa: E402

from shared import auth, db, serialize  # noqa: E402
from shared.config import PORTS  # noqa: E402
from shared.service import ApiError, create_app, json_body, require_fields  # noqa: E402

app = create_app("notification")

VALID_TYPES = {"reminder", "delivery", "return", "ai", "promo"}


def _insert(user_id: str, title: str, message: str, type_: str, date_label: str) -> dict:
    if type_ not in VALID_TYPES:
        raise ApiError(f"type must be one of: {', '.join(sorted(VALID_TYPES))}", 400)
    return db.execute(
        """
        INSERT INTO notifications.notifications (notification_id, user_id, title, message, type, date)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING *
        """,
        (f"not-{secrets.token_hex(6)}", user_id, title, message, type_, date_label),
    )


@app.get("/notifications")
@auth.require_auth
def list_notifications():
    rows = db.query(
        """
        SELECT * FROM notifications.notifications
        WHERE user_id = %s ORDER BY created_at DESC LIMIT 50
        """,
        (auth.current_user_id(),),
    )
    return jsonify([serialize.notification_json(r) for r in rows])


@app.post("/notifications")
@auth.require_auth
def create_notification():
    body = json_body()
    require_fields(body, "title", "message", "type")
    row = _insert(
        auth.current_user_id(),
        body["title"],
        body["message"],
        body["type"],
        body.get("date", "Just now"),
    )
    return jsonify(serialize.notification_json(row)), 201


@app.put("/notifications/<notification_id>/read")
@auth.require_auth
def mark_read(notification_id: str):
    row = db.execute(
        """
        UPDATE notifications.notifications SET read = true
        WHERE notification_id = %s AND user_id = %s
        RETURNING *
        """,
        (notification_id, auth.current_user_id()),
    )
    if not row:
        raise ApiError("Notification not found", 404)
    return jsonify(serialize.notification_json(row))


@app.put("/notifications/read-all")
@auth.require_auth
def mark_all_read():
    db.execute(
        "UPDATE notifications.notifications SET read = true WHERE user_id = %s",
        (auth.current_user_id(),),
    )
    rows = db.query(
        "SELECT * FROM notifications.notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
        (auth.current_user_id(),),
    )
    return jsonify([serialize.notification_json(r) for r in rows])


@app.post("/internal/notify")
def internal_notify():
    """Service-to-service. Not exposed through the gateway."""
    body = json_body()
    require_fields(body, "userId", "title", "message", "type")
    row = _insert(
        body["userId"],
        body["title"],
        body["message"],
        body["type"],
        body.get("date", "Just now"),
    )
    return jsonify(serialize.notification_json(row)), 201


if __name__ == "__main__":
    app.run(port=PORTS["notification"], debug=False)
