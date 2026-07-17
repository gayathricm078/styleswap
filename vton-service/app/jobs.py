"""Async job registry.

Inference takes 30-90s, so POST returns a request_id immediately and the work
runs on a bounded thread pool; GET polls the status. The pool is small (a GPU
serves very few concurrent jobs) which also serialises access to a single-GPU
engine, giving thread-safe inference by construction.
"""
from __future__ import annotations

import threading
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import Callable, Optional

from .config import settings
from .schemas import JobStatus


@dataclass
class Job:
    request_id: str
    status: JobStatus = JobStatus.QUEUED
    generated_image_url: Optional[str] = None
    processing_time: Optional[float] = None
    inference_time: Optional[float] = None
    error: Optional[str] = None
    accepted_at: float = field(default_factory=time.time)
    finished_at: Optional[float] = None


# The unit of work: given a Job, produce (url, inference_time) or raise.
Worker = Callable[[Job], "tuple[str, float]"]


class JobRegistry:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._lock = threading.Lock()
        self._pool = ThreadPoolExecutor(max_workers=settings.max_workers, thread_name_prefix="vton")

    def create(self, request_id: str) -> Job:
        job = Job(request_id=request_id)
        with self._lock:
            self._jobs[request_id] = job
        return job

    def get(self, request_id: str) -> Optional[Job]:
        with self._lock:
            self._prune_locked()
            return self._jobs.get(request_id)

    def submit(self, job: Job, worker: Worker) -> None:
        """Queue the job. The worker runs off-thread; state transitions are
        recorded here so GET always sees a coherent status."""
        self._pool.submit(self._run, job, worker)

    def _run(self, job: Job, worker: Worker) -> None:
        with self._lock:
            job.status = JobStatus.PROCESSING
        try:
            url, inference_time = worker(job)
            with self._lock:
                job.status = JobStatus.COMPLETED
                job.generated_image_url = url
                job.inference_time = round(inference_time, 2)
                job.finished_at = time.time()
                job.processing_time = round(job.finished_at - job.accepted_at, 2)
        except Exception as exc:  # noqa: BLE001 - any failure marks the job failed
            message = getattr(exc, "message", None) or str(exc)
            with self._lock:
                job.status = JobStatus.FAILED
                job.error = message
                job.finished_at = time.time()
                job.processing_time = round(job.finished_at - job.accepted_at, 2)

    def wait(self, request_id: str, timeout: float) -> Optional[Job]:
        """Block until the job leaves a running state, or timeout. Used by the
        synchronous ?wait=true convenience path."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            job = self.get(request_id)
            if job and job.status in (JobStatus.COMPLETED, JobStatus.FAILED):
                return job
            time.sleep(0.5)
        return self.get(request_id)

    def _prune_locked(self) -> None:
        """Drop finished jobs past their retention window. Caller holds the lock."""
        cutoff = time.time() - settings.job_retention_seconds
        stale = [
            rid for rid, j in self._jobs.items()
            if j.finished_at is not None and j.finished_at < cutoff
        ]
        for rid in stale:
            del self._jobs[rid]

    def shutdown(self) -> None:
        self._pool.shutdown(wait=False, cancel_futures=True)


registry = JobRegistry()
