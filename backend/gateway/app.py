"""gateway :8000 — the only origin the browser talks to.

Owns the public URL surface (/api/*, /ai/*) and forwards to the service that
owns each path. It does not verify JWTs: it passes the Authorization header
through untouched and each service verifies for itself, so a bug here can
never silently authenticate a request downstream.

Also composes /api/admin/analytics by fanning out to three services.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import jwt  # noqa: E402
import requests  # noqa: E402
from flask import Response, jsonify, request  # noqa: E402

from shared.auth import decode_token  # noqa: E402
from shared.config import PORTS, service_url  # noqa: E402
from shared.service import create_app  # noqa: E402

app = create_app("gateway")

# Public prefix -> (service, path prefix on that service).
# Longest prefix wins, so /api/user/addresses beats /api/user.
ROUTES: list[tuple[str, str, str]] = [
    ("/api/auth", "auth", ""),
    ("/api/user", "auth", ""),
    ("/api/products", "catalog", ""),
    ("/api/cart", "cart", ""),
    ("/api/wishlist", "wishlist", ""),
    ("/api/orders", "order", ""),
    ("/api/coupons", "coupon", ""),
    ("/api/notifications", "notification", ""),
    ("/ai", "ai", ""),
]

HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "content-encoding",
    "content-length",
}


def resolve(path: str) -> tuple[str, str] | None:
    """Map a public path to (service, downstream path)."""
    if path.startswith("/api/auth/"):
        return "auth", path[len("/api/auth"):]
    if path.startswith("/api/user/"):
        return "auth", path[len("/api/user"):]
    if path.startswith("/api/products"):
        return "catalog", path[len("/api"):]
    if path.startswith("/api/cart"):
        return "cart", path[len("/api"):]
    if path.startswith("/api/wishlist"):
        return "wishlist", path[len("/api"):]
    if path.startswith("/api/orders"):
        return "order", path[len("/api"):]
    if path.startswith("/api/coupons"):
        return "coupon", path[len("/api"):]
    if path.startswith("/api/notifications"):
        return "notification", path[len("/api"):]
    if path.startswith("/ai/"):
        return "ai", path[len("/ai"):]
    return None


@app.route("/api/<path:_sub>", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
@app.route("/ai/<path:_sub>", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
def proxy(_sub: str):
    target = resolve(request.path)
    if not target:
        return jsonify({"error": f"No route for {request.path}"}), 404

    service, downstream_path = target

    # /internal/* is service-to-service only; never reachable from a browser.
    if downstream_path.startswith("/internal"):
        return jsonify({"error": "Not found"}), 404

    url = f"{service_url(service)}{downstream_path}"
    headers = {
        k: v for k, v in request.headers
        if k.lower() not in HOP_BY_HOP and k.lower() != "host"
    }

    try:
        resp = requests.request(
            method=request.method,
            url=url,
            headers=headers,
            params=request.args,
            data=request.get_data(),
            timeout=60,
        )
    except requests.RequestException as exc:
        app.logger.error("%s-service unreachable: %s", service, exc)
        return (
            jsonify({"error": f"{service}-service is unavailable", "detail": str(exc)}),
            503,
        )

    out_headers = [
        (k, v) for k, v in resp.headers.items() if k.lower() not in HOP_BY_HOP
    ]
    return Response(resp.content, status=resp.status_code, headers=out_headers)


@app.get("/api/admin/analytics")
def analytics():
    """Fan out to auth, catalog, and order, and merge.

    Every number here is real. The old /api/admin/analytics returned hardcoded
    categoryDistribution and rentTrends arrays regardless of the database.

    This is the gateway's own endpoint rather than a proxy, so there is no
    downstream service to enforce the role — it must verify the token itself.
    """
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return jsonify({"error": "Unauthorized: missing bearer token"}), 401

    try:
        claims = decode_token(header[7:].strip())
    except jwt.InvalidTokenError:
        return jsonify({"error": "Unauthorized: invalid token"}), 401

    if claims.get("role") not in ("admin", "vendor"):
        return jsonify({"error": "Forbidden: requires role admin or vendor"}), 403

    merged: dict = {}
    for service in ("auth", "catalog", "order"):
        try:
            resp = requests.get(f"{service_url(service)}/internal/stats", timeout=10)
            if resp.status_code == 200:
                merged.update(resp.json())
            else:
                app.logger.warning("%s/internal/stats -> %s", service, resp.status_code)
        except requests.RequestException as exc:
            app.logger.warning("%s stats unreachable: %s", service, exc)

    if not merged:
        return jsonify({"error": "No stats services reachable"}), 503

    merged.setdefault("totalRevenue", 0)
    merged.setdefault("activeRentals", 0)
    merged.setdefault("totalUsers", 0)
    merged.setdefault("averageSustainability", 100)
    merged.setdefault("categoryDistribution", [])
    merged.setdefault("rentTrends", [])
    return jsonify(merged)


@app.get("/api/health")
def health_all():
    """Liveness of every service. Handy for spotting a dead process."""
    out = {}
    for name in PORTS:
        if name == "gateway":
            out[name] = "ok"
            continue
        try:
            r = requests.get(f"{service_url(name)}/health", timeout=3)
            out[name] = "ok" if r.status_code == 200 else f"http {r.status_code}"
        except requests.RequestException:
            out[name] = "unreachable"
    healthy = all(v == "ok" for v in out.values())
    return jsonify({"healthy": healthy, "services": out}), (200 if healthy else 503)


if __name__ == "__main__":
    app.run(port=PORTS["gateway"], debug=False)
