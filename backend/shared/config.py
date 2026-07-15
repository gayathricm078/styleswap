"""Central config. Every service and script imports from here."""
import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_ROOT / ".env")


def _require(name: str) -> str:
    val = os.getenv(name, "").strip()
    if not val:
        raise RuntimeError(
            f"{name} is not set. Copy backend/.env.example to backend/.env and fill it in."
        )
    return val


PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB = os.getenv("PG_DB", "styleswap")
PG_USER = os.getenv("PG_USER", "styleswap_app")
PG_PASSWORD = os.getenv("PG_PASSWORD", "styleswap_dev_pw")

PG_SUPERUSER = os.getenv("PG_SUPERUSER", "postgres")
PG_SUPERPASSWORD = os.getenv("PG_SUPERPASSWORD", "")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "720"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_TEXT_MODEL = os.getenv("GEMINI_TEXT_MODEL", "gemini-2.0-flash")
GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-2.0-flash-exp-image-generation")

# Service registry. The gateway proxies to these; services call each other
# through them too (order -> catalog, for example).
PORTS = {
    "gateway": 8000,
    "catalog": 8001,
    "order": 8002,
    "cart": 8003,
    "wishlist": 8004,
    "coupon": 8005,
    "notification": 8006,
    "ai": 8007,
    "auth": 8008,
}


def service_url(name: str) -> str:
    return os.getenv(f"{name.upper()}_SERVICE_URL", f"http://127.0.0.1:{PORTS[name]}")


def dsn(superuser: bool = False, dbname: str | None = None) -> str:
    if superuser:
        pw = PG_SUPERPASSWORD
        user = PG_SUPERUSER
    else:
        pw = PG_PASSWORD
        user = PG_USER
    db = dbname if dbname is not None else PG_DB
    return f"host={PG_HOST} port={PG_PORT} dbname={db} user={user} password={pw}"
