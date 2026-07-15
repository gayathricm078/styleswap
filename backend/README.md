# StyleSwap backend

Seven Flask microservices behind a gateway, on PostgreSQL. No Docker — each
service is a plain Python process.

```
                         React (vite :5173)
                                 │  /api/*, /ai/*  (vite proxy)
                                 ▼
                          gateway :8000
        ┌────────┬────────┬──────┴──┬────────┬────────┬────────┐
        ▼        ▼        ▼         ▼        ▼        ▼        ▼
     auth     catalog   cart    wishlist  order   coupon  notification   ai
     :8008     :8001    :8003    :8004    :8002   :8005     :8006      :8007
        └────────┴────────┴─────────┴────────┴────────┴────────┘
                                 │
                          PostgreSQL :5432
                     one database, one schema per service
```

Each service owns its own Postgres schema and never reads another's tables.
Where one needs another's data it makes an HTTP call — order-service asks
catalog-service for product detail, not `catalog.products`. That keeps the
seams real, so any service could move to its own database without a rewrite.

## Setup

```bash
cd backend
pip install -r requirements.txt

cp .env.example .env      # then fill in PG_SUPERPASSWORD and GEMINI_API_KEY

python -m scripts.create_db   # creates role + database, applies schema.sql
python -m scripts.seed        # loads the catalog and demo accounts
python run_all.py             # starts all 8 processes
```

Then in a second terminal:

```bash
npm run dev                   # http://localhost:5173
```

Check everything is alive: <http://localhost:8000/api/health>

## Demo accounts

All use password `password123`. Created by `scripts/seed.py` with hashed
passwords — there is no back door.

| Email | Role |
|---|---|
| `victoria@styleswap.com` | customer |
| `cos@styleswap.com` | vendor |
| `admin@styleswap.com` | admin |

Your account's role comes from the signed JWT. The navbar's portal switcher
only unlocks the workspace your account is entitled to; the rest are shown
locked, because entering them would 403 on every request anyway.

## Layout

```
backend/
  run_all.py              start every service, Ctrl-C stops all
  requirements.txt
  .env                    gitignored; copy from .env.example
  scripts/
    create_db.py          role + database + extensions, applies schema.sql
    schema.sql            every table, index, and constraint
    seed.py               loads seed_data.py  (--reset to wipe first)
    seed_data.py          the catalog, ported from src/data.ts
  shared/
    config.py             env + service registry
    db.py                 psycopg3 connection pool
    auth.py               JWT issue/verify, @require_auth, @require_role
    service.py            Flask factory, ApiError, inter-service client
    serialize.py          snake_case rows -> camelCase JSON (src/types.ts)
  gateway/app.py          :8000  public URL surface
  services/
    auth_service/         :8008  accounts, JWT, addresses
    catalog_service/      :8001  products, reviews
    order_service/        :8002  checkout, history, returns
    cart_service/         :8003  the bag
    wishlist_service/     :8004  saved items
    coupon_service/       :8005  codes + discount maths
    notification_service/ :8006  the bell
    ai_service/           :8007  Gemini
```

## How auth works

`auth-service` mints an HS256 JWT on login. Every other service verifies it
locally with the same `JWT_SECRET` — no network hop, and no service trusts a
caller-supplied user id. Identity always comes from the token's `sub` claim.

The gateway deliberately does **not** verify tokens on proxied routes; it
passes the `Authorization` header through and lets the owning service decide.
A bug in the gateway therefore cannot authenticate a request that the service
itself would reject. Its one self-owned route, `/api/admin/analytics`, does
verify, because there is no downstream service to do it.

## Notes on correctness

Things that are easy to get wrong here, and how they're handled:

- **Money is never client-supplied.** Checkout sends only an address id, a
  payment method, and a coupon code. The server reads your cart, reprices it
  from the catalog, revalidates the coupon, and computes the total.
- **Damage fees come from the server.** `/orders/<id>/return-scan` takes only
  a preset; the fee comes back from ai-service and is clamped, so a customer
  cannot post `feeCharged: 0`.
- **Order status is vendor/admin only**, and every order read is ownership-
  checked. (The previous Node backend filtered on `orderId` alone, so any
  logged-in user could rewrite any order.)
- **Roles are grantable.** `PUT /api/user/users/<id>/role`, admin only. The old
  backend had role guards but no way to ever hold a role other than `customer`,
  which made those routes unreachable.
- **Order items snapshot the product** into `product_snapshot`, so history
  stays truthful when a listing changes price or is deleted.
- **Product ids are text throughout** (`prod-1`). There is no second numeric
  id to confuse them with.
- **AI failures surface.** Missing key or bad model returns 503 with a real
  message rather than canned data that looks like success. The UI renders its
  own offline state.

## Troubleshooting

**`create_db.py` says it can't connect** — `PG_SUPERPASSWORD` is wrong. That's
the password you set for the `postgres` user when installing PostgreSQL.

**A service exits immediately** — usually `.env` is missing or the database
doesn't exist yet. Run `create_db.py` first.

**Frontend shows "Cannot reach the StyleSwap server"** — the gateway isn't
running, or it's on a port other than 8000. Check `/api/health`.

**AI features return 503** — either `GEMINI_API_KEY` is empty in `.env`, or the
model is overloaded. Everything else works without a key.

**AI returns 429** — the key is fine, but your project has no quota for that
model. Free-tier keys report `limit: 0` for `gemini-2.0-flash` and `2.5-pro`
outright. Switch `GEMINI_TEXT_MODEL` to one with quota; `gemini-3.1-flash-lite`
is the verified default. `.env.example` lists what's known good and bad, and
how to list what your key can reach.

**A code change to a service doesn't take effect** — `run_all.py` children can
survive a Ctrl-C on Windows. Check for strays before restarting:

```powershell
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
  Where-Object { $_.CommandLine -like '*styleswap*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```
