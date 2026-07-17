"""Image intake: validation, decoding, and aspect-preserving resize.

Accepts raw bytes from a multipart upload, a remote URL, or a data: URL, and
returns a validated PIL image ready for inference.
"""
from __future__ import annotations

import base64
import io
from typing import Tuple

import requests
from PIL import Image, UnidentifiedImageError

from .config import settings

SUPPORTED_FORMATS = {"JPEG", "PNG"}  # Pillow reports JPG as JPEG
SUPPORTED_HINT = "JPG, JPEG, or PNG"


class ImageError(Exception):
    """A problem with a supplied image. Carries an HTTP status for the API."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def load_bytes(source: str | bytes, *, kind: str) -> bytes:
    """Resolve a person/garment source to bytes.

    `source` may be raw bytes (upload), an http(s) URL, or a data: URL.
    `kind` ("person"/"garment") only shapes error messages.
    """
    if isinstance(source, (bytes, bytearray)):
        return bytes(source)

    if not isinstance(source, str) or not source:
        raise ImageError(f"Missing {kind} image", 400)

    if source.startswith("data:"):
        header, _, payload = source.partition(",")
        if not payload:
            raise ImageError(f"Malformed {kind} data URL", 400)
        try:
            return base64.b64decode(payload) if ";base64" in header else payload.encode()
        except Exception as exc:  # noqa: BLE001 - any decode failure is a bad image
            raise ImageError(f"Could not decode {kind} data URL: {exc}", 400) from exc

    if source.startswith(("http://", "https://")):
        try:
            resp = requests.get(source, headers={"User-Agent": "vton-service/1.0"}, timeout=60)
        except requests.RequestException as exc:
            raise ImageError(f"Could not fetch {kind} image: {exc}", 502) from exc
        if resp.status_code != 200:
            raise ImageError(f"{kind} image URL returned HTTP {resp.status_code}", 502)
        return resp.content

    raise ImageError(f"Unsupported {kind} image reference", 400)


def validate_and_open(data: bytes, *, kind: str) -> Image.Image:
    """Enforce the size, format, and resolution rules, then return an RGB image."""
    if len(data) > settings.max_upload_bytes:
        raise ImageError(
            f"{kind} image is {len(data) / 1024 / 1024:.1f}MB; the limit is "
            f"{settings.max_upload_bytes // 1024 // 1024}MB",
            413,
        )
    if not data:
        raise ImageError(f"{kind} image is empty", 400)

    try:
        img = Image.open(io.BytesIO(data))
        img.load()  # forces a decode, so a truncated/corrupt file fails here
    except (UnidentifiedImageError, OSError) as exc:
        raise ImageError(f"{kind} image is corrupt or not a real image ({SUPPORTED_HINT})", 400) from exc

    if img.format not in SUPPORTED_FORMATS:
        raise ImageError(f"{kind} image is {img.format or 'unknown'}; supported: {SUPPORTED_HINT}", 415)

    if img.width < settings.min_resolution or img.height < settings.min_resolution:
        raise ImageError(
            f"{kind} image is {img.width}x{img.height}; minimum is "
            f"{settings.min_resolution}x{settings.min_resolution}",
            400,
        )

    return img.convert("RGB")


def fit_within(img: Image.Image, max_side: int) -> Image.Image:
    """Downscale so the longest side is <= max_side, preserving aspect ratio.

    Never upscales — enlarging a small image would only invent detail.
    """
    if max(img.width, img.height) <= max_side:
        return img
    scale = max_side / max(img.width, img.height)
    new_size: Tuple[int, int] = (round(img.width * scale), round(img.height * scale))
    return img.resize(new_size, Image.LANCZOS)


def prepare(source: str | bytes, *, kind: str) -> Image.Image:
    """Full intake: resolve -> validate -> normalise size. Raises ImageError."""
    data = load_bytes(source, kind=kind)
    img = validate_and_open(data, kind=kind)
    return fit_within(img, settings.max_resolution)
