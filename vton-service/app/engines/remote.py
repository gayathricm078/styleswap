"""Remote engine — drives the official IDM-VTON on a Hugging Face Space.

This is the default because it runs the real model without a local GPU. The
Space is queued and slow (~30-90s) and, unauthenticated, shares a small daily
ZeroGPU quota; a free HF token lifts that. Uptime is not guaranteed.
"""
from __future__ import annotations

import os
import tempfile
import time
from pathlib import Path

from PIL import Image

from ..config import settings
from ..logging_config import get_logger, log
import logging

from .base import EngineError, TryOnResult, VTONEngine

logger = get_logger("vton.engine.remote")


class RemoteVTONEngine(VTONEngine):
    name = "remote"

    def __init__(self) -> None:
        self._client = None

    def load(self) -> None:
        """Establish a persistent gradio client, reused across requests."""
        try:
            from gradio_client import Client
        except ImportError as exc:
            raise EngineError(
                "gradio_client is not installed: pip install -r requirements.txt", 503
            ) from exc

        try:
            self._client = Client(
                settings.hf_space, token=settings.hf_token or None, verbose=False
            )
        except Exception as exc:  # noqa: BLE001 - surface any connect failure clearly
            raise EngineError(f"Could not connect to {settings.hf_space}: {exc}", 503) from exc

        log(logger, logging.INFO, "remote engine ready", space=settings.hf_space,
            authenticated=bool(settings.hf_token))

    def is_ready(self) -> bool:
        return self._client is not None

    def infer(self, person: Image.Image, garment: Image.Image, garment_desc: str) -> TryOnResult:
        if self._client is None:
            raise EngineError("Remote engine is not initialised", 503)

        from gradio_client import handle_file

        person_path = self._to_temp(person, ".png")
        garment_path = self._to_temp(garment, ".jpg")
        start = time.perf_counter()
        try:
            result = self._client.predict(
                dict={"background": handle_file(person_path), "layers": [], "composite": None},
                garm_img=handle_file(garment_path),
                garment_des=garment_desc,
                is_checked=True,       # auto-generate the garment mask
                is_checked_crop=True,  # crop-and-restore keeps the face sharp
                denoise_steps=settings.denoise_steps,
                seed=settings.seed,
                api_name="/tryon",
            )
        except Exception as exc:  # noqa: BLE001
            raise self._translate(exc) from exc
        finally:
            for p in (person_path, garment_path):
                _silent_unlink(p)

        elapsed = time.perf_counter() - start
        out = result[0] if isinstance(result, (list, tuple)) else result
        if not out or not Path(out).exists():
            raise EngineError("The try-on Space returned no image", 502)

        image = Image.open(out).convert("RGB")
        image.load()
        _silent_unlink(out)
        return TryOnResult(image=image, inference_time=elapsed)

    @staticmethod
    def _translate(exc: Exception) -> EngineError:
        msg = str(exc)
        low = msg.lower()
        if "quota" in low or "gpu" in low:
            hint = (
                "add a free HF_TOKEN"
                if not settings.hf_token
                else "wait for the quota to reset"
            )
            return EngineError(f"The free try-on GPU is out of quota right now — {hint}.", 503)
        return EngineError(f"The try-on Space is unavailable: {msg}", 503)

    @staticmethod
    def _to_temp(img: Image.Image, suffix: str) -> str:
        fd, path = tempfile.mkstemp(suffix=suffix, dir=settings.upload_dir)
        os.close(fd)
        img.save(path)
        return path


def _silent_unlink(path: str | None) -> None:
    if path:
        try:
            os.unlink(path)
        except OSError:
            pass
