# VTON Service

A standalone virtual try-on inference service. It takes a person image and a
garment image and returns the person wearing the garment, preserving face,
hair, skin tone, body, and pose — replacing only the clothing.

It is independent of the rest of StyleSwap: a separate FastAPI process that any
backend can consume over HTTP. It handles no auth, users, or catalogue — those
stay in the calling application.

## Two engines, one interface

The actual model runs behind a pluggable engine (`app/engines/`), chosen by
`VTON_ENGINE`:

| Engine | What it is | Needs a GPU? | State |
|---|---|---|---|
| **`remote`** (default) | Drives the official IDM-VTON on a Hugging Face Space | No | Works out of the box |
| **`local`** | The official IDM-VTON pipeline in-process | **Yes** (~16–24GB VRAM) | Scaffold — see below |

Nothing above the engine (API, jobs, validation, storage) knows which is
active, so switching is one env var.

### About the local engine

`app/engines/local.py` implements the full pipeline the spec describes —
human parsing → pose → DensePose → masked SDXL inpainting — loading every model
once at startup and delegating model-specific calls to the official repo's own
modules. It was **not executed on the machine it was written on** (no CUDA GPU),
so treat it as a faithful integration scaffold. To bring it up on a GPU host:

```bash
git clone https://github.com/yisol/IDM-VTON
huggingface-cli download yisol/IDM-VTON --local-dir /models/idm-vton
pip install -r requirements.txt -r requirements-local.txt   # torch+cu*, diffusers, ...
# in .env:
VTON_ENGINE=local
IDM_VTON_REPO=/path/to/IDM-VTON
VTON_CHECKPOINT_DIR=/models/idm-vton
VTON_DEVICE=cuda
```

The engine refuses to start with an actionable error if the repo, checkpoints,
or GPU are missing — it never silently degrades.

## Run

```bash
cd vton-service
pip install -r requirements.txt
cp .env.example .env            # optional; defaults work
python -m app.main              # http://localhost:8009
```

Health: <http://localhost:8009/health>

## API

### `POST /virtual-tryon`

`multipart/form-data`:

| Field | Required | Notes |
|---|---|---|
| `person_image` | yes | Full-body, JPG/PNG, ≥512×512, ≤20MB |
| `garment_image` | yes | Flat garment shot, JPG/PNG |
| `garment_description` | no | Improves the result |
| `request_id` | no | Supply your own, or one is generated |

Query `?wait=true` blocks until the job finishes and returns the URL directly.
Otherwise it returns **202** immediately:

```json
{ "success": true, "request_id": "ab12…", "status": "queued" }
```

### `GET /virtual-tryon/{request_id}`

```json
{
  "request_id": "ab12…",
  "status": "completed",
  "generated_image_url": "/outputs/tryon_ab12_9f3c1e.png",
  "processing_time": 47.2,
  "inference_time": 41.8
}
```

`status` is `queued` → `processing` → `completed` | `failed`. On failure,
`error` explains why.

### `GET /outputs/{filename}`

Serves generated images when no external store is set.

## Design notes

- **Async by default.** Inference takes 30–90s, so POST queues and GET polls.
  The `?wait=true` path is a convenience for server-to-server callers.
- **Model loaded once** at startup (`lifespan`), reused for every request.
- **Serialised inference.** `VTON_MAX_WORKERS` bounds concurrency (1 for a
  single GPU), which also makes inference thread-safe by construction.
- **Validation before queueing.** Format, size, and resolution are checked up
  front so bad input fails fast with 4xx.
- **Structured JSON logs** carry `request_id`, inference and total time, output
  filename, and errors.
- **Unique output names**; results are never overwritten.

## Layout

```
vton-service/
  app/
    main.py            FastAPI app, endpoints, startup load
    config.py          env-driven settings
    schemas.py         request/response models
    images.py          validation, decode, resize
    storage.py         unique filenames, save, URL
    jobs.py            async job registry + thread pool
    engines/
      base.py          the VTONEngine interface
      remote.py        HF Space engine (default, GPU-free)
      local.py         official IDM-VTON pipeline (GPU)
  requirements.txt         service + remote engine
  requirements-local.txt   local engine (GPU only)
```
