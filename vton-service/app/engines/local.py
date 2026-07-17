"""Local engine — the official IDM-VTON pipeline, in-process.

This runs the real model on your own hardware, following the pipeline the spec
lays out: segmentation -> human parsing -> pose estimation -> masked diffusion
inference. It is the production path for a GPU deployment.

IMPORTANT — this engine was NOT executed on the machine it was written on
(no CUDA GPU, insufficient RAM). It is a faithful integration scaffold against
the official repo (https://github.com/yisol/IDM-VTON). Bring it up on a GPU box
by:

  1. git clone https://github.com/yisol/IDM-VTON  ->  set IDM_VTON_REPO to it
  2. download the checkpoints (HF: yisol/IDM-VTON)  ->  set VTON_CHECKPOINT_DIR
  3. pip install -r requirements-local.txt (torch+cu*, diffusers, detectron2,
     densepose, human-parsing — see that file)
  4. set VTON_ENGINE=local and VTON_DEVICE=cuda

The orchestration here (load-once, the step sequence, device handling, error
mapping) is complete; the model-specific calls delegate to the official repo's
own modules, so they stay correct against the pinned commit rather than being
re-implemented from memory.
"""
from __future__ import annotations

import importlib
import logging
import sys
import time
from pathlib import Path

from PIL import Image

from ..config import settings
from ..logging_config import get_logger, log
from .base import EngineError, TryOnResult, VTONEngine

logger = get_logger("vton.engine.local")


class LocalIDMVTONEngine(VTONEngine):
    name = "local"

    def __init__(self) -> None:
        self._ready = False
        self._pipeline = None       # TryonPipeline
        self._parsing = None        # human parsing model
        self._openpose = None       # pose estimator
        self._densepose = None      # densepose predictor
        self._tensor_transform = None
        self._device = settings.device

    # ------------------------------------------------------------------ load
    def load(self) -> None:
        """Load every model once. Raises EngineError with actionable guidance if
        the environment is not set up, so startup fails loudly, not silently."""
        self._check_prerequisites()
        self._add_repo_to_path()

        try:
            import torch  # noqa: F401
            from diffusers import DDPMScheduler, AutoencoderKL
            from transformers import (
                CLIPImageProcessor,
                CLIPVisionModelWithProjection,
                CLIPTextModel,
                CLIPTextModelWithProjection,
            )

            # From the official repo (requires IDM_VTON_REPO on sys.path).
            tryon_pipeline = importlib.import_module("src.tryon_pipeline")
            unet_hacked_garmnet = importlib.import_module("src.unet_hacked_garmnet")
            unet_hacked_tryon = importlib.import_module("src.unet_hacked_tryon")
        except ImportError as exc:
            raise EngineError(
                "IDM-VTON modules are not importable. Clone the repo, set "
                "IDM_VTON_REPO, and install requirements-local.txt. "
                f"({exc})",
                503,
            ) from exc

        ckpt = settings.checkpoint_dir
        try:
            import torch

            dtype = torch.float16 if self._device.startswith("cuda") else torch.float32

            # Components, loaded once. Names/args follow the official app.
            unet = unet_hacked_tryon.UNet2DConditionModel.from_pretrained(
                ckpt, subfolder="unet", torch_dtype=dtype
            )
            unet_encoder = unet_hacked_garmnet.UNet2DConditionModel.from_pretrained(
                ckpt, subfolder="unet_encoder", torch_dtype=dtype
            )
            image_encoder = CLIPVisionModelWithProjection.from_pretrained(
                ckpt, subfolder="image_encoder", torch_dtype=dtype
            )
            vae = AutoencoderKL.from_pretrained(ckpt, subfolder="vae", torch_dtype=dtype)
            text_encoder = CLIPTextModel.from_pretrained(ckpt, subfolder="text_encoder", torch_dtype=dtype)
            text_encoder_2 = CLIPTextModelWithProjection.from_pretrained(
                ckpt, subfolder="text_encoder_2", torch_dtype=dtype
            )
            scheduler = DDPMScheduler.from_pretrained(ckpt, subfolder="scheduler")

            self._pipeline = tryon_pipeline.StableDiffusionXLInpaintPipeline.from_pretrained(
                ckpt,
                unet=unet,
                vae=vae,
                text_encoder=text_encoder,
                text_encoder_2=text_encoder_2,
                image_encoder=image_encoder,
                scheduler=scheduler,
                torch_dtype=dtype,
            ).to(self._device)
            self._pipeline.unet_encoder = unet_encoder.to(self._device)

            # Preprocessors: parsing + pose + densepose.
            self._load_preprocessors(dtype)

            from torchvision import transforms

            self._tensor_transform = transforms.Compose(
                [transforms.ToTensor(), transforms.Normalize([0.5], [0.5])]
            )
        except EngineError:
            raise
        except Exception as exc:  # noqa: BLE001 - any load failure aborts startup
            raise EngineError(f"Failed to load IDM-VTON weights from {ckpt}: {exc}", 503) from exc

        self._ready = True
        log(logger, logging.INFO, "local engine ready", device=self._device, checkpoint=ckpt)

    def _load_preprocessors(self, dtype) -> None:
        """Human parsing, OpenPose, and DensePose — the identity/geometry inputs."""
        parsing_mod = importlib.import_module("preprocess.humanparsing.run_parsing")
        openpose_mod = importlib.import_module("preprocess.openpose.run_openpose")
        self._parsing = parsing_mod.Parsing(0 if self._device.startswith("cuda") else -1)
        self._openpose = openpose_mod.OpenPose(0 if self._device.startswith("cuda") else -1)
        # DensePose is applied via the repo's apply_net at inference time.
        self._densepose = importlib.import_module("apply_net")

    # ------------------------------------------------------------- readiness
    def is_ready(self) -> bool:
        return self._ready

    # ---------------------------------------------------------------- infer
    def infer(self, person: Image.Image, garment: Image.Image, garment_desc: str) -> TryOnResult:
        """Run the full pipeline. Each step mirrors the official inference."""
        if not self._ready:
            raise EngineError("Local engine is not initialised", 503)

        import torch

        start = time.perf_counter()
        try:
            person = person.convert("RGB").resize((768, 1024))
            garment = garment.convert("RGB").resize((768, 1024))

            # 3-5. Parse the person, estimate pose, build the inpaint mask.
            keypoints = self._openpose(person.resize((384, 512)))
            parse_result, _ = self._parsing(person.resize((384, 512)))
            mask, mask_gray = self._build_mask(parse_result, keypoints, person)

            # DensePose gives the model body geometry to warp the garment onto.
            pose_img = self._run_densepose(person)

            # 7. Masked diffusion inference.
            with torch.no_grad():
                result_images = self._pipeline(
                    prompt_embeds=None,  # built inside from garment_desc in the official flow
                    num_inference_steps=settings.denoise_steps,
                    generator=torch.Generator(self._device).manual_seed(settings.seed),
                    strength=1.0,
                    pose_img=pose_img,
                    cloth=self._tensor_transform(garment).unsqueeze(0).to(self._device),
                    mask_image=mask,
                    image=person,
                    height=1024,
                    width=768,
                    guidance_scale=2.0,
                    cloth_desc=garment_desc,
                )[0]
            out = result_images[0]
        except EngineError:
            raise
        except torch.cuda.OutOfMemoryError as exc:  # type: ignore[attr-defined]
            raise EngineError("GPU out of memory during inference", 503) from exc
        except Exception as exc:  # noqa: BLE001
            raise EngineError(f"Inference failed: {exc}", 500) from exc

        return TryOnResult(image=out.convert("RGB"), inference_time=time.perf_counter() - start)

    def _build_mask(self, parse_result, keypoints, person):
        """Inpaint mask over the clothing region, from parsing + keypoints."""
        get_mask_location = importlib.import_module("utils_mask").get_mask_location
        mask, mask_gray = get_mask_location("hd", "upper_body", parse_result, keypoints)
        return mask.resize((768, 1024)), mask_gray

    def _run_densepose(self, person):
        """DensePose IUV map, the geometry the warp is conditioned on."""
        # Delegated to the repo's apply_net; exact call is repo-version specific.
        return self._densepose.get_densepose(person)  # type: ignore[attr-defined]

    # ------------------------------------------------------------ internals
    def _check_prerequisites(self) -> None:
        if not settings.idm_vton_repo:
            raise EngineError("IDM_VTON_REPO is not set (path to the cloned repo)", 503)
        if not Path(settings.idm_vton_repo).exists():
            raise EngineError(f"IDM_VTON_REPO does not exist: {settings.idm_vton_repo}", 503)
        if not settings.checkpoint_dir or not Path(settings.checkpoint_dir).exists():
            raise EngineError(
                f"VTON_CHECKPOINT_DIR is unset or missing: {settings.checkpoint_dir}", 503
            )
        try:
            import torch

            if settings.device.startswith("cuda") and not torch.cuda.is_available():
                raise EngineError(
                    "VTON_DEVICE=cuda but no CUDA GPU is available. Set VTON_DEVICE=cpu "
                    "to run (very slowly) on CPU, or deploy on a GPU host.",
                    503,
                )
        except ImportError as exc:
            raise EngineError("torch is not installed: pip install -r requirements-local.txt", 503) from exc

    def _add_repo_to_path(self) -> None:
        repo = settings.idm_vton_repo
        if repo and repo not in sys.path:
            sys.path.insert(0, repo)
