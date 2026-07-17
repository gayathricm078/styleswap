"""Engine factory. One place decides which backend the service runs."""
from __future__ import annotations

from ..config import settings
from .base import EngineError, TryOnResult, VTONEngine

__all__ = ["EngineError", "TryOnResult", "VTONEngine", "build_engine"]


def build_engine() -> VTONEngine:
    """Instantiate the engine named by VTON_ENGINE. Not yet loaded — the app
    calls .load() at startup so failures surface there, not on first request."""
    if settings.engine == "local":
        from .local import LocalIDMVTONEngine

        return LocalIDMVTONEngine()
    if settings.engine == "remote":
        from .remote import RemoteVTONEngine

        return RemoteVTONEngine()
    raise EngineError(f"Unknown VTON_ENGINE '{settings.engine}' (use 'remote' or 'local')", 500)
