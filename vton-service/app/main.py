"""VTON inference service — FastAPI.

    POST /virtual-tryon               queue a try-on, returns a request_id
    GET  /virtual-tryon/{request_id}  poll status; the image URL when done
    GET  /outputs/{filename}          fetch a generated image
    GET  /health                      engine readiness

The model loads once at startup and is reused for every request.
"""
from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .engines import EngineError, build_engine
from .images import ImageError, prepare
from .jobs import Job, registry
from .logging_config import configure_logging, get_logger, log
from .schemas import (
    ErrorResponse,
    HealthResponse,
    JobState,
    JobStatus,
    TryOnAccepted,
)
from .storage import public_url_for, save_output

logger = get_logger("vton.api")
engine = build_engine()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(settings.log_level)
    settings.ensure_dirs()
    # Load the model ONCE here — never per request. A load failure is logged but
    # does not crash the process, so /health can report it and the remote engine
    # can be retried; the endpoints guard on engine.is_ready().
    try:
        engine.load()
        log(logger, logging.INFO, "startup complete", engine=engine.name, ready=engine.is_ready())
    except EngineError as exc:
        log(logger, logging.ERROR, "engine failed to load", engine=engine.name, error=exc.message)
    yield
    registry.shutdown()


app = FastAPI(title="StyleSwap VTON Service", version="1.0.0", lifespan=lifespan)
# Serve generated images directly when no external store is configured.
app.mount("/outputs", StaticFiles(directory=settings.output_dir, check_dir=False), name="outputs")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    ready = engine.is_ready()
    return HealthResponse(
        status="ok" if ready else "degraded",
        engine=engine.name,
        engine_ready=ready,
        detail=None if ready else "Engine not loaded; see startup logs.",
    )


@app.post(
    "/virtual-tryon",
    response_model=TryOnAccepted,
    responses={400: {"model": ErrorResponse}, 415: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
    status_code=202,
)
async def virtual_tryon(
    person_image: UploadFile = File(..., description="The person. Full-body, JPG/PNG."),
    garment_image: UploadFile = File(..., description="Flat garment image, JPG/PNG."),
    garment_description: str = Form("a garment"),
    request_id: Optional[str] = Form(None),
    wait: bool = Query(False, description="Block until the job finishes and return the URL."),
):
    """Queue a try-on job.

    Async by design: returns 202 with a request_id, then poll
    GET /virtual-tryon/{request_id}. Pass ?wait=true for a blocking call that
    returns the finished URL directly (convenient for server-to-server use).
    """
    if not engine.is_ready():
        raise _http(503, "Try-on engine is not ready", "The model failed to load; check /health.")

    rid = _clean_request_id(request_id)

    # Validate up front so a bad image fails fast with 4xx, before we queue.
    try:
        person_bytes = await person_image.read()
        garment_bytes = await garment_image.read()
        person = prepare(person_bytes, kind="person")
        garment = prepare(garment_bytes, kind="garment")
    except ImageError as exc:
        raise _http(exc.status, exc.message)

    job = registry.create(rid)
    log(logger, logging.INFO, "job accepted", request_id=rid, wait=wait)

    def worker(_job: Job) -> "tuple[str, float]":
        t0 = time.perf_counter()
        result = engine.infer(person, garment, garment_description)
        path = save_output(result.image, _job.request_id)
        log(
            logger, logging.INFO, "job completed",
            request_id=_job.request_id,
            output=path.name,
            inference_s=round(result.inference_time, 2),
            total_s=round(time.perf_counter() - t0, 2),
        )
        return public_url_for(path), result.inference_time

    registry.submit(job, worker)

    if wait:
        finished = registry.wait(rid, timeout=settings.job_timeout_seconds)
        if finished and finished.status == JobStatus.COMPLETED:
            return TryOnAccepted(
                request_id=rid,
                status=finished.status,
                generated_image_url=finished.generated_image_url,
                processing_time=finished.processing_time,
            )
        if finished and finished.status == JobStatus.FAILED:
            log(logger, logging.ERROR, "job failed", request_id=rid, error=finished.error)
            raise _http(502, finished.error or "Try-on failed")
        raise _http(504, "Try-on timed out", f"Exceeded {settings.job_timeout_seconds}s.")

    return TryOnAccepted(request_id=rid, status=job.status)


@app.get(
    "/virtual-tryon/{request_id}",
    response_model=JobState,
    responses={404: {"model": ErrorResponse}},
)
def get_job(request_id: str) -> JobState:
    job = registry.get(request_id)
    if not job:
        raise _http(404, "Unknown request_id", "It may have expired or never existed.")
    return JobState(
        request_id=job.request_id,
        status=job.status,
        generated_image_url=job.generated_image_url,
        processing_time=job.processing_time,
        inference_time=job.inference_time,
        error=job.error,
    )


def _clean_request_id(request_id: Optional[str]) -> str:
    if request_id:
        safe = "".join(c for c in request_id if c.isalnum() or c in "-_")[:64]
        if safe:
            return safe
    return uuid.uuid4().hex


def _http(status: int, error: str, detail: Optional[str] = None) -> HTTPException:
    return HTTPException(status_code=status, detail={"success": False, "error": error, "detail": detail})


@app.exception_handler(HTTPException)
async def http_exception_handler(_request, exc: HTTPException):
    # Normalise every error to the ErrorResponse shape.
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"success": False, "error": str(exc.detail)})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, log_config=None)
