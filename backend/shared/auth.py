"""JWT issuing and verification, shared by every service.

auth-service mints tokens; every other service verifies them locally with the
same secret. No network hop on the hot path, and no service trusts a
caller-supplied user id — identity always comes out of the signed token.
"""
import datetime as dt
from functools import wraps

import jwt
from flask import g, jsonify, request

from shared import config


def issue_token(user_id: str, email: str, role: str) -> str:
    now = dt.datetime.now(dt.timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + dt.timedelta(minutes=config.JWT_EXPIRES_MINUTES),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])


def _bearer() -> str | None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    return header[7:].strip() or None


def require_auth(fn):
    """Populate g.user from the bearer token, or 401."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _bearer()
        if not token:
            return jsonify({"error": "Unauthorized: missing bearer token"}), 401
        try:
            g.user = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Unauthorized: token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Unauthorized: invalid token"}), 401
        return fn(*args, **kwargs)

    return wrapper


def require_role(*roles: str):
    """Gate a route on role. Must be applied under @require_auth."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = getattr(g, "user", None)
            if not user:
                return jsonify({"error": "Unauthorized: no user context"}), 401
            if user.get("role") not in roles:
                return (
                    jsonify({"error": f"Forbidden: requires role {' or '.join(roles)}"}),
                    403,
                )
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def optional_auth(fn):
    """Populate g.user when a valid token is present; never rejects."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        g.user = None
        token = _bearer()
        if token:
            try:
                g.user = decode_token(token)
            except jwt.InvalidTokenError:
                g.user = None
        return fn(*args, **kwargs)

    return wrapper


def current_user_id() -> str:
    return g.user["sub"]
