"""Configuration, entirely env-driven.

Every tunable the spec calls for lives here and nowhere else, so deployment is
a matter of environment variables, not code edits.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

SERVICE_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(SERVICE_ROOT / ".env")


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    # --- engine selection -------------------------------------------------
    # "remote": drive IDM-VTON on a Hugging Face Space (works without a GPU).
    # "local":  run the official IDM-VTON pipeline in-process (needs CUDA +
    #           the model checkpoints). See engines/local.py.
    engine: str = field(default_factory=lambda: os.getenv("VTON_ENGINE", "remote").strip().lower())

    # --- remote engine ----------------------------------------------------
    hf_space: str = field(default_factory=lambda: os.getenv("VTON_HF_SPACE", "yisol/IDM-VTON").strip())
    # A free token lifts the ZeroGPU quota off the shared anonymous pool.
    hf_token: str = field(default_factory=lambda: os.getenv("HF_TOKEN", "").strip())

    # --- local engine -----------------------------------------------------
    # Path to a clone of https://github.com/yisol/IDM-VTON (its inference code).
    idm_vton_repo: str = field(default_factory=lambda: os.getenv("IDM_VTON_REPO", "").strip())
    # Directory holding the downloaded checkpoints (unet, image encoder, etc.).
    checkpoint_dir: str = field(default_factory=lambda: os.getenv("VTON_CHECKPOINT_DIR", "").strip())
    device: str = field(default_factory=lambda: os.getenv("VTON_DEVICE", "cuda").strip())
    batch_size: int = field(default_factory=lambda: _int("VTON_BATCH_SIZE", 1))
    denoise_steps: int = field(default_factory=lambda: _int("VTON_DENOISE_STEPS", 30))
    seed: int = field(default_factory=lambda: _int("VTON_SEED", 42))

    # --- storage ----------------------------------------------------------
    upload_dir: str = field(default_factory=lambda: os.getenv("VTON_UPLOAD_DIR", str(SERVICE_ROOT / "data" / "uploads")))
    output_dir: str = field(default_factory=lambda: os.getenv("VTON_OUTPUT_DIR", str(SERVICE_ROOT / "data" / "outputs")))
    # Public base for building returned URLs; the service also serves them itself.
    public_base_url: str = field(default_factory=lambda: os.getenv("VTON_PUBLIC_BASE_URL", "").strip())

    # --- image limits -----------------------------------------------------
    max_upload_bytes: int = field(default_factory=lambda: _int("VTON_MAX_UPLOAD_MB", 20) * 1024 * 1024)
    min_resolution: int = field(default_factory=lambda: _int("VTON_MIN_RESOLUTION", 512))
    max_resolution: int = field(default_factory=lambda: _int("VTON_MAX_RESOLUTION", 1024))

    # --- jobs -------------------------------------------------------------
    # Inference is serialised through a small pool; a GPU fits very few at once.
    max_workers: int = field(default_factory=lambda: _int("VTON_MAX_WORKERS", 1))
    job_timeout_seconds: int = field(default_factory=lambda: _int("VTON_JOB_TIMEOUT", 300))
    # How long a finished job's record is retained for polling.
    job_retention_seconds: int = field(default_factory=lambda: _int("VTON_JOB_RETENTION", 3600))

    port: int = field(default_factory=lambda: _int("VTON_PORT", 8009))
    log_level: str = field(default_factory=lambda: os.getenv("VTON_LOG_LEVEL", "INFO").strip().upper())

    def ensure_dirs(self) -> None:
        Path(self.upload_dir).mkdir(parents=True, exist_ok=True)
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)


settings = Settings()
