# StyleSwap

A fashion-rental marketplace: browse and rent designer clothing and jewellery,
with customer, vendor, and admin workspaces, and six Gemini-backed AI features.

React 19 + Vite frontend, seven Flask microservices behind a gateway,
PostgreSQL for storage.

## Run it

Two terminals. Backend first.

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # fill in PG_SUPERPASSWORD and GEMINI_API_KEY
python -m scripts.create_db   # role, database, schema
python -m scripts.seed        # catalog + demo accounts
python run_all.py             # all 8 services
```

```bash
npm install
npm run dev                   # http://localhost:5173
```

Sign in with `victoria@styleswap.com` / `password123` (customer),
`cos@styleswap.com` (vendor), or `admin@styleswap.com` (admin).

See [backend/README.md](backend/README.md) for architecture, layout, and
troubleshooting; [API_CONTRACT.md](API_CONTRACT.md) for the endpoint surface.

## Layout

```
src/               React frontend
  api/client.ts    every backend call goes through here
  components/      one file per view
  types.ts         shared domain types; the API is built to match
backend/           Flask services + Postgres  (see backend/README.md)
```

## How it fits together

Vite proxies `/api/*` and `/ai/*` to the gateway on `:8000`, so the browser
stays on one origin and `fetch` paths stay relative. The gateway forwards each
path to the service that owns it and passes the `Authorization` header through
untouched — every service verifies the JWT itself.

`src/types.ts` is the contract. The backend's `shared/serialize.py` maps
snake_case rows onto those camelCase shapes in exactly one place.

## What's real and what isn't

Real, and backed by Postgres: accounts and login (hashed passwords, JWT),
products, reviews, cart, wishlist, orders, checkout, coupons, notifications,
addresses, and the admin analytics figures.

The admin dashboard (`admin@styleswap.com`) covers analytics, order
fulfilment, catalog delisting, discount codes, and member roles — all against
Postgres.

Not real yet:

- **Payments.** Choosing "Razorpay (Online)" records the choice; no money moves.
- **Platform settings.** No settings service exists, so the fee/deposit/feature
  panel was removed rather than left pretending to save.
- **Virtual try-on compositing.** The AI writes a fit review; the image shown
  is the product photo, not a composite of you wearing it.
- **Delivery dates** are free text on the product (`"Tomorrow"`), not scheduling.

The six AI features need `GEMINI_API_KEY`. Without it they return 503 and the
UI shows an offline notice — the rest of the app is unaffected.
