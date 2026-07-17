"""The engine interface.

An engine turns (person image, garment image) into a composited image plus the
inference time. Everything above this layer — the API, jobs, storage, validation
— is engine-agnostic, so swapping remote for local touches nothing else.
"""
from __future__ import annotations

import abc
from dataclasses import dataclass

from PIL import Image


class EngineError(Exception):
    """A failure inside an engine. status maps to an HTTP code upstream."""

    def __init__(self, message: str, status: int = 502):
        super().__init__(message)
        self.message = message
        self.status = status


@dataclass
class TryOnResult:
    image: Image.Image
    inference_time: float


class VTONEngine(abc.ABC):
    """Base class for a virtual try-on backend."""

    name: str = "base"

    @abc.abstractmethod
    def load(self) -> None:
        """Prepare the engine once, at application startup.

        For a local model this loads weights into the device; for a remote
        engine it establishes the client. Called once — never per request.
        """

    @abc.abstractmethod
    def is_ready(self) -> bool:
        """Whether load() has succeeded and the engine can serve a request."""

    @abc.abstractmethod
    def infer(self, person: Image.Image, garment: Image.Image, garment_desc: str) -> TryOnResult:
        """Composite the garment onto the person. Raises EngineError on failure."""
