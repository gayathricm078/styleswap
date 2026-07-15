"""auth-service :8008 — accounts, JWT, addresses."""
import secrets
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import psycopg  # noqa: E402
from flask import jsonify, request  # noqa: E402
from werkzeug.security import check_password_hash, generate_password_hash  # noqa: E402

from shared import auth, db, serialize  # noqa: E402
from shared.config import PORTS  # noqa: E402
from shared.service import ApiError, create_app, json_body, require_fields  # noqa: E402

app = create_app("auth")

DEFAULT_AVATAR = (
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
    "?auto=format&fit=crop&q=80&w=256"
)


def _load_addresses(user_id: str) -> list[dict]:
    return db.query(
        "SELECT * FROM auth.addresses WHERE user_id = %s ORDER BY is_default DESC, address_id",
        (user_id,),
    )


def _user_by_email(email: str) -> dict | None:
    return db.query_one(
        "SELECT * FROM auth.users WHERE lower(email) = lower(%s)", (email,)
    )


@app.post("/register")
def register():
    body = json_body()
    require_fields(body, "email", "password", "name")
    email = body["email"].strip()
    password = body["password"]

    if len(password) < 8:
        raise ApiError("Password must be at least 8 characters", 400)
    if "@" not in email:
        raise ApiError("Enter a valid email address", 400)

    # Self-registration is always a customer. Vendor and admin are granted
    # deliberately (see PUT /users/<id>/role), never chosen by the registrant.
    user_id = f"user-{secrets.token_hex(8)}"
    try:
        row = db.execute(
            """
            INSERT INTO auth.users (user_id, email, password_hash, name, role, profile_pic)
            VALUES (%s, %s, %s, %s, 'customer', %s)
            RETURNING *
            """,
            (user_id, email, generate_password_hash(password), body["name"].strip(), DEFAULT_AVATAR),
        )
    except psycopg.errors.UniqueViolation:
        raise ApiError("An account with that email already exists", 409)

    token = auth.issue_token(row["user_id"], row["email"], row["role"])
    return jsonify({"token": token, "user": serialize.user_json(row, [])}), 201


@app.post("/login")
def login():
    body = json_body()
    require_fields(body, "email", "password")

    row = _user_by_email(body["email"].strip())
    # Same message and same work either way, so the response can't be used to
    # enumerate which emails have accounts.
    if not row or not check_password_hash(row["password_hash"], body["password"]):
        raise ApiError("Invalid email or password", 401)

    token = auth.issue_token(row["user_id"], row["email"], row["role"])
    return jsonify({"token": token, "user": serialize.user_json(row, _load_addresses(row["user_id"]))})


@app.get("/profile")
@auth.require_auth
def get_profile():
    uid = auth.current_user_id()
    row = db.query_one("SELECT * FROM auth.users WHERE user_id = %s", (uid,))
    if not row:
        raise ApiError("User not found", 404)
    return jsonify(serialize.user_json(row, _load_addresses(uid)))


@app.put("/profile")
@auth.require_auth
def update_profile():
    body = json_body()
    uid = auth.current_user_id()

    # Whitelist: role, email, and points are not self-editable.
    allowed = {"name": "name", "phone": "phone", "profilePic": "profile_pic"}
    sets, params = [], []
    for key, column in allowed.items():
        if key in body:
            sets.append(f"{column} = %s")
            params.append(body[key])

    if not sets:
        raise ApiError("No updatable fields provided", 400)

    params.append(uid)
    row = db.execute(
        f"UPDATE auth.users SET {', '.join(sets)} WHERE user_id = %s RETURNING *",
        tuple(params),
    )
    if not row:
        raise ApiError("User not found", 404)
    return jsonify(serialize.user_json(row, _load_addresses(uid)))


@app.get("/addresses")
@auth.require_auth
def list_addresses():
    return jsonify([serialize.address_json(a) for a in _load_addresses(auth.current_user_id())])


@app.post("/addresses")
@auth.require_auth
def create_address():
    body = json_body()
    require_fields(body, "label", "street", "city", "state", "zip")
    uid = auth.current_user_id()
    is_default = bool(body.get("isDefault"))

    with db.cursor(commit=True) as cur:
        # The partial unique index allows only one default per user, so clear
        # the old one in the same transaction.
        if is_default:
            cur.execute(
                "UPDATE auth.addresses SET is_default = false WHERE user_id = %s", (uid,)
            )
        else:
            cur.execute(
                "SELECT 1 FROM auth.addresses WHERE user_id = %s LIMIT 1", (uid,)
            )
            is_default = cur.fetchone() is None  # first address is the default

        cur.execute(
            """
            INSERT INTO auth.addresses (address_id, user_id, label, street, city, state, zip, is_default)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                f"addr-{secrets.token_hex(6)}",
                uid,
                body["label"],
                body["street"],
                body["city"],
                body["state"],
                body["zip"],
                is_default,
            ),
        )
        return jsonify(serialize.address_json(cur.fetchone())), 201


@app.put("/addresses/<address_id>")
@auth.require_auth
def update_address(address_id: str):
    body = json_body()
    uid = auth.current_user_id()

    allowed = {
        "label": "label",
        "street": "street",
        "city": "city",
        "state": "state",
        "zip": "zip",
    }
    sets, params = [], []
    for key, column in allowed.items():
        if key in body:
            sets.append(f"{column} = %s")
            params.append(body[key])

    with db.cursor(commit=True) as cur:
        if body.get("isDefault") is True:
            cur.execute(
                "UPDATE auth.addresses SET is_default = false WHERE user_id = %s", (uid,)
            )
            sets.append("is_default = %s")
            params.append(True)

        if not sets:
            raise ApiError("No updatable fields provided", 400)

        # user_id in the WHERE is the ownership check.
        params.extend([address_id, uid])
        cur.execute(
            f"UPDATE auth.addresses SET {', '.join(sets)} "
            f"WHERE address_id = %s AND user_id = %s RETURNING *",
            tuple(params),
        )
        row = cur.fetchone()
        if not row:
            raise ApiError("Address not found", 404)
        return jsonify(serialize.address_json(row))


@app.delete("/addresses/<address_id>")
@auth.require_auth
def delete_address(address_id: str):
    row = db.execute(
        "DELETE FROM auth.addresses WHERE address_id = %s AND user_id = %s RETURNING address_id",
        (address_id, auth.current_user_id()),
    )
    if not row:
        raise ApiError("Address not found", 404)
    return jsonify({"success": True, "id": address_id})


@app.get("/users/<user_id>")
@auth.require_auth
def get_user(user_id: str):
    """Public-ish profile. Used by other services to attribute reviews."""
    row = db.query_one("SELECT * FROM auth.users WHERE user_id = %s", (user_id,))
    if not row:
        raise ApiError("User not found", 404)
    return jsonify(
        {
            "id": row["user_id"],
            "name": row["name"],
            "profilePic": row["profile_pic"],
            "role": row["role"],
        }
    )


@app.put("/users/<user_id>/role")
@auth.require_auth
@auth.require_role("admin")
def set_role(user_id: str):
    """Grant a role. Admin only — this is the path the old backend lacked
    entirely, which left its vendor/admin routes permanently unreachable."""
    body = json_body()
    require_fields(body, "role")
    if body["role"] not in ("customer", "vendor", "admin"):
        raise ApiError("role must be customer, vendor, or admin", 400)

    row = db.execute(
        "UPDATE auth.users SET role = %s WHERE user_id = %s RETURNING *",
        (body["role"], user_id),
    )
    if not row:
        raise ApiError("User not found", 404)
    return jsonify(serialize.user_json(row, []))


@app.get("/admin/users")
@auth.require_auth
@auth.require_role("admin")
def list_users():
    rows = db.query("SELECT * FROM auth.users ORDER BY created_at DESC")
    return jsonify([serialize.user_json(r, []) for r in rows])


@app.get("/internal/stats")
def internal_stats():
    """Aggregates for the admin dashboard. Called by the gateway."""
    row = db.query_one(
        """
        SELECT COUNT(*) AS user_count,
               COALESCE(AVG(sustainability_score), 100) AS avg_sustainability
        FROM auth.users
        """
    )
    return jsonify(
        {
            "totalUsers": row["user_count"],
            "averageSustainability": round(float(row["avg_sustainability"])),
        }
    )


if __name__ == "__main__":
    app.run(port=PORTS["auth"], debug=False)
