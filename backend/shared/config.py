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
# gemini-2.0-flash has no free-tier quota on a fresh key (429, "limit: 0") and
# gemini-3.5-flash is chronically 503. This one is verified working and free.
GEMINI_TEXT_MODEL = os.getenv("GEMINI_TEXT_MODEL", "gemini-3.1-flash-lite")
GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-lite-image")

# Which backend draws pictures. Gemini's text models have free-tier quota but
# its image models have none — every one returns 429 "limit: 0" on a free key —
# so the default is a provider that is actually free.
#   pollinations : no key, no signup. Community service, no uptime guarantee.
#   gemini       : requires billing enabled on the Google Cloud project.
IMAGE_PROVIDER = os.getenv("IMAGE_PROVIDER", "pollinations").strip().lower()
POLLINATIONS_MODEL = os.getenv("POLLINATIONS_MODEL", "flux").strip()

# Virtual try-on. A free Hugging Face ZeroGPU Space — queued and slow
# (~30-90s). It needs a full-body person photo and a FLAT garment image; a
# headshot, or a garment shot on a model, both produce nonsense.
VTON_SPACE = os.getenv("VTON_SPACE", "yisol/IDM-VTON").strip()
VTON_ENABLED = os.getenv("VTON_ENABLED", "true").strip().lower() == "true"

# A free token lifts the ZeroGPU quota from the tiny anonymous per-IP allowance
# (which runs out after a few try-ons) to a real per-account one. Without it the
# feature works but rate-limits fast. Get one free: https://huggingface.co/settings/tokens
HF_TOKEN = os.getenv("HF_TOKEN", "").strip()

# The standalone VTON inference service (vton-service/). When set, ai-service
# delegates compositing to it over HTTP instead of calling the model inline —
# so there is one home for try-on, swappable between remote and local engines.
VTON_SERVICE_URL = os.getenv("VTON_SERVICE_URL", "http://127.0.0.1:8009").strip()

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
