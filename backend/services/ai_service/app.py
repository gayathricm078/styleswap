"""ai-service :8007 — Gemini-backed styling features.

Response shapes are fixed by backend/../API_CONTRACT.md; the frontend parses
them directly. Two deliberate departures from the old Node server:

1. No silent fallbacks. A missing key or a bad model returns 503 with a real
   message. The old server caught everything and returned canned data, so a
   wrong model id was indistinguishable from success. The frontend already
   renders its own offline state.
2. /search ignores any client-supplied catalog and reads from catalog-service.
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from flask import jsonify  # noqa: E402

from shared import auth, config  # noqa: E402
from shared.config import PORTS  # noqa: E402
from shared.service import (  # noqa: E402
    ApiError,
    call_service,
    create_app,
    incoming_token,
    json_body,
)

app = create_app("ai")

_client = None


def client():
    """Lazy Gemini client. Raises 503 when unconfigured so the caller sees a
    real reason rather than a plausible-looking fake result."""
    global _client
    if _client is not None:
        return _client
    if not config.GEMINI_API_KEY:
        raise ApiError(
            "AI service is not configured: set GEMINI_API_KEY in backend/.env", 503
        )
    try:
        from google import genai
    except ImportError:
        raise ApiError("google-genai is not installed: pip install -r backend/requirements.txt", 503)

    _client = genai.Client(api_key=config.GEMINI_API_KEY)
    return _client


def _generate(model: str, prompt: str, cfg) -> object:
    """Call Gemini, retrying transient overload.

    A 503 means the model is busy, not misconfigured, and clears on its own.
    Quota (429) and bad requests are raised immediately — retrying those just
    makes the user wait for the same failure.
    """
    last: Exception | None = None
    for attempt in range(3):
        try:
            return client().models.generate_content(model=model, contents=prompt, config=cfg)
        except ApiError:
            raise
        except Exception as exc:
            last = exc
            if "503" in str(exc) or "UNAVAILABLE" in str(exc):
                app.logger.warning("%s overloaded (attempt %d/3), retrying", model, attempt + 1)
                time.sleep(2 * (attempt + 1))
                continue
            raise
    raise ApiError(
        f"{model} is overloaded right now. Please try again in a moment.", 503
    ) from last


def generate_json(prompt: str, model: str | None = None) -> dict | list:
    """Ask Gemini for JSON and parse it. Tolerates a fenced ```json block,
    which the model still emits occasionally even in JSON mode."""
    from google.genai import types

    try:
        response = _generate(
            model or config.GEMINI_TEXT_MODEL,
            prompt,
            types.GenerateContentConfig(response_mime_type="application/json"),
        )
    except ApiError:
        raise
    except Exception as exc:
        app.logger.exception("Gemini call failed")
        raise ApiError(f"Gemini request failed: {exc}", 502)

    text = (response.text or "").strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        app.logger.error("Gemini returned non-JSON: %s", text[:400])
        raise ApiError("The styling model returned malformed JSON", 502)


@app.post("/stylist")
@auth.require_auth
def stylist():
    b = json_body()
    prompt = f"""You are the lead luxury-minimal stylist for "StyleSwap", a high-fashion
clothing and jewellery rental platform inspired by Zara, COS, and Aesop.

Build one cohesive outfit for:
- Occasion: {b.get("occasion") or "High Fashion Event"}
- Budget per day: ₹{b.get("budget") or "50"}
- Body type: {b.get("bodyType") or "Athletic / Balanced"}
- Preferred colours: {b.get("colors") or "Warm earth tones, neutrals, beige, cream"}
- Style: {b.get("style") or "Luxury minimalist & architectural"}
- Weather: {b.get("weather") or "Mid 70s, clear sky"}

Keep the sum of the four rentalPrice values within the daily budget.
Respond with JSON exactly matching this shape, no extra keys:
{{
  "outfitName": string,
  "explanation": string,
  "dress":     {{"name": string, "brand": string, "description": string, "rentalPrice": number}},
  "shoes":     {{"name": string, "brand": string, "description": string, "rentalPrice": number}},
  "handbag":   {{"name": string, "brand": string, "description": string, "rentalPrice": number}},
  "jewellery": {{"name": string, "brand": string, "description": string, "rentalPrice": number}},
  "totalPrice": number,
  "sustainabilityImpact": string
}}"""
    data = generate_json(prompt)

    # The UI dereferences result.dress.name and friends with no guard, so a
    # malformed model response would crash the page rather than show an error.
    for key in ("dress", "shoes", "handbag", "jewellery"):
        if not isinstance(data.get(key), dict) or "name" not in data[key]:
            raise ApiError("The styling model returned an incomplete outfit", 502)
    return jsonify(data)


@app.post("/size-recommendation")
@auth.require_auth
def size_recommendation():
    b = json_body()
    prompt = f"""You are the size advisor for "StyleSwap", a premium fashion rental app.
- Height: {b.get("height")} cm
- Weight: {b.get("weight")} kg
- Preferred fit: {b.get("preferredFit") or "Regular"}
- Brand context: {b.get("itemBrand") or "Zara/COS sizing"}

Respond with JSON exactly matching:
{{"recommendedSize": "XS"|"S"|"M"|"L"|"XL", "confidenceScore": string like "94%", "reasoning": string}}
Reference the brand's shoulder cut and fabric drape in the reasoning."""
    return jsonify(generate_json(prompt))


@app.post("/damage-detection")
@auth.require_auth
def damage_detection():
    b = json_body()
    preset = b.get("damagePreset", "perfect")
    scenarios = {
        "stain": "a dress returned with a dark fluid splash across the front skirt",
        "tear": "a rented coat returned with a minor seam tear along the lower hem",
        "perfect": "a pristine return with zero visible issues",
    }
    if preset not in scenarios:
        raise ApiError("damagePreset must be perfect, stain, or tear", 400)

    # The fee bands are stated explicitly because this number is charged to a
    # real customer. Left unanchored, the model graded a tea stain as "Major
    # Damage" and asked for the full clamp value.
    prompt = f"""You are the automated return scanner for StyleSwap. Assess {scenarios[preset]}.

Grade conservatively and price the fee against these bands:
- Perfect          -> condition "Perfect",      feeCharged 0,      actionRequired "None"
- Cleanable mark   -> condition "Minor Damage", feeCharged 10-30,  actionRequired "Dry Clean"
- Small seam tear  -> condition "Minor Damage", feeCharged 20-40,  actionRequired "Sartorial Seam Repair"
- Irreparable      -> condition "Major Damage", feeCharged 80-200, actionRequired "Write-off"

A stain that dry cleaning removes is Minor Damage, not Major.

Respond with JSON exactly matching:
{{
  "condition": "Perfect"|"Minor Damage"|"Major Damage",
  "damageSummary": string,
  "feeCharged": number (rupees for laundering/repair; 0 when Perfect),
  "resolvable": boolean,
  "actionRequired": "None"|"Dry Clean"|"Sartorial Seam Repair"|"Write-off"
}}"""
    data = generate_json(prompt)

    # order-service records feeCharged against the customer, so clamp it rather
    # than trusting whatever the model produced. A pristine return is always
    # free regardless of what the model says.
    try:
        fee = max(0, min(int(data.get("feeCharged", 0)), 200))
    except (TypeError, ValueError):
        fee = 0
    data["feeCharged"] = 0 if preset == "perfect" else fee
    if preset == "perfect":
        data["condition"] = "Perfect"
        data["actionRequired"] = "None"
    return jsonify(data)


@app.post("/search")
@auth.require_auth
def search():
    """Semantic product search.

    The frontend still posts its `products` array (the old server pasted it
    straight into the prompt). We ignore it and read the catalog ourselves —
    a client-supplied catalog is not evidence of what exists.
    """
    b = json_body()
    query = (b.get("query") or "").strip()
    if not query:
        raise ApiError("query is required", 400)

    resp = call_service("catalog", "/products", token=incoming_token())
    if resp.status_code != 200:
        raise ApiError("Could not load the catalog", 502)
    products = resp.json()
    if not products:
        return jsonify([])

    catalog = [
        {
            "id": p["id"],
            "name": p["name"],
            "brand": p["brand"],
            "category": p["category"],
            "rentalPrice": p["rentalPrice"],
            "description": p["description"][:300],
        }
        for p in products
    ]

    prompt = f"""You are the AI fashion search engine for "StyleSwap".
Customer query: "{query}"

Catalog:
{json.dumps(catalog, ensure_ascii=False)}

Rank the best matches (at most 6, most relevant first). Only use productId
values present in the catalog above. Score relevance 1-100.

Respond with a JSON array exactly matching:
[{{"productId": string, "relevanceScore": number, "relevanceExplanation": string}}]"""
    data = generate_json(prompt)
    if not isinstance(data, list):
        raise ApiError("The search model returned an unexpected shape", 502)

    # Drop any id the model invented.
    valid = {p["id"] for p in products}
    return jsonify([r for r in data if r.get("productId") in valid][:6])


@app.post("/tryon")
@auth.require_auth
def tryon():
    b = json_body()
    prompt = f"""You are the virtual dressing room assistant at "StyleSwap".
Client "{b.get("avatarName") or "Sofia"}" is trying on "{b.get("productName")}"
from "{b.get("productBrand") or "the StyleSwap archives"}".

Respond with JSON exactly matching:
{{"fitReview": string, "toneHarmony": string, "styleScore": string like "96/100"}}
fitReview should cover drape, silhouette length, and fit guidance.
toneHarmony should give colour-theory advice for the garment's hues."""
    data = generate_json(prompt)

    # No compositing happens — imageUrl echoes the product image back, exactly
    # as the old server did. The UI shows it beside the written review.
    return jsonify(
        {
            "imageUrl": b.get("productUrl"),
            "fitReview": data.get("fitReview"),
            "toneHarmony": data.get("toneHarmony"),
            "styleScore": data.get("styleScore") or "95/100",
        }
    )


@app.post("/generate-image")
@auth.require_auth
def generate_image():
    from google.genai import types

    b = json_body()
    prompt = (b.get("prompt") or "").strip()
    if not prompt:
        raise ApiError("prompt is required", 400)

    styled = (
        f"High fashion archival catalog photograph. Subject: {prompt}. "
        "Premium aesthetic, neutral off-white architectural background, "
        "studio lighting, editorial composition."
    )

    try:
        response = _generate(
            config.GEMINI_IMAGE_MODEL,
            styled,
            types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"]),
        )
    except ApiError:
        raise
    except Exception as exc:
        app.logger.exception("Image generation failed")
        raise ApiError(f"Image generation failed: {exc}", 502)

    import base64

    for candidate in response.candidates or []:
        for part in candidate.content.parts or []:
            if getattr(part, "inline_data", None) and part.inline_data.data:
                raw = part.inline_data.data
                encoded = raw if isinstance(raw, str) else base64.b64encode(raw).decode()
                mime = part.inline_data.mime_type or "image/png"
                return jsonify({"imageUrl": f"data:{mime};base64,{encoded}", "isFallback": False})

    raise ApiError("The image model returned no image data", 502)


if __name__ == "__main__":
    app.run(port=PORTS["ai"], debug=False)
