"""Flask app factory + inter-service HTTP client."""
import logging

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from shared import config


class ApiError(Exception):
    """Raise anywhere in a request to return a clean JSON error."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def create_app(name: str) -> Flask:
    app = Flask(name)
    CORS(app)
    logging.basicConfig(
        level=logging.INFO,
        format=f"[{name}] %(levelname)s %(message)s",
    )

    @app.get("/health")
    def health():
        return jsonify({"service": name, "status": "ok"})

    @app.errorhandler(ApiError)
    def handle_api_error(err: ApiError):
        return jsonify({"error": err.message}), err.status

    @app.errorhandler(HTTPException)
    def handle_http_error(err: HTTPException):
        return jsonify({"error": err.description}), err.code

    @app.errorhandler(Exception)
    def handle_unexpected(err: Exception):
        app.logger.exception("Unhandled error on %s %s", request.method, request.path)
        return jsonify({"error": "Internal server error"}), 500

    return app


def json_body() -> dict:
    body = request.get_json(silent=True)
    if body is None or not isinstance(body, dict):
        raise ApiError("Expected a JSON object body", 400)
    return body


def require_fields(body: dict, *fields: str) -> None:
    missing = [f for f in fields if body.get(f) in (None, "")]
    if missing:
        raise ApiError(f"Missing required field(s): {', '.join(missing)}", 400)


def call_service(
    name: str,
    path: str,
    method: str = "GET",
    token: str | None = None,
    timeout: float = 10.0,
    **kwargs,
) -> requests.Response:
    """Call a sibling service. Propagates the caller's bearer token so the
    downstream service authenticates the end user, not the calling service."""
    url = f"{config.service_url(name)}{path}"
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        return requests.request(method, url, headers=headers, timeout=timeout, **kwargs)
    except requests.RequestException as exc:
        raise ApiError(f"{name}-service unreachable: {exc}", 503) from exc


def incoming_token() -> str | None:
    header = request.headers.get("Authorization", "")
    return header[7:].strip() if header.startswith("Bearer ") else None
