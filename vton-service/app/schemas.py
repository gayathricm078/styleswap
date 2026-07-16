"""Request/response models. These are the service's public contract."""
from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TryOnAccepted(BaseModel):
    """Returned by POST /virtual-tryon when a job is queued."""

    success: bool = True
    request_id: str
    status: JobStatus
    # Populated only when the caller passed ?wait=true and the job finished.
    generated_image_url: Optional[str] = None
    processing_time: Optional[float] = None


class JobState(BaseModel):
    """Returned by GET /virtual-tryon/{request_id}."""

    request_id: str
    status: JobStatus
    generated_image_url: Optional[str] = None
    processing_time: Optional[float] = Field(
        None, description="Wall-clock seconds from accepted to completed."
    )
    inference_time: Optional[float] = Field(
        None, description="Seconds spent in the model itself."
    )
    error: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    service: str = "vton-service"
    status: str
    engine: str
    engine_ready: bool
    detail: Optional[str] = None
