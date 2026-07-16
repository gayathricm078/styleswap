"""Output persistence. Unique filenames, never overwriting a prior result."""
from __future__ import annotations

import uuid
from pathlib import Path

from PIL import Image

from .config import settings


def new_output_name(request_id: str) -> str:
    """A collision-proof filename. request_id is embedded for traceability, and
    a uuid guards against a caller reusing an id."""
    safe_id = "".join(c for c in request_id if c.isalnum() or c in "-_")[:40] or "req"
    return f"tryon_{safe_id}_{uuid.uuid4().hex[:12]}.png"


def save_output(img: Image.Image, request_id: str) -> Path:
    settings.ensure_dirs()
    path = Path(settings.output_dir) / new_output_name(request_id)
    # PNG is lossless — no compounding JPEG artefacts on the generated result.
    img.save(path, format="PNG")
    return path


def public_url_for(path: Path) -> str:
    """Build the URL a caller uses to fetch the result.

    When VTON_PUBLIC_BASE_URL is set the file is addressed there; otherwise the
    service serves it itself under /outputs.
    """
    filename = path.name
    if settings.public_base_url:
        return f"{settings.public_base_url.rstrip('/')}/outputs/{filename}"
    return f"/outputs/{filename}"
