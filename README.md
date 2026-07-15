# StyleSwap — frontend

A fashion-rental marketplace UI: browse and rent designer clothing and jewelry,
with customer, vendor, and admin views.

**This is the frontend only.** The backend was removed and will be rebuilt. See
[API_CONTRACT.md](API_CONTRACT.md) for the spec the new backend must satisfy.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

No environment variables and no database are needed to run the UI.

## State of things

All data lives in React state, seeded from [src/data.ts](src/data.ts), and resets
on refresh. Nothing persists.

Login is not real: [WelcomeLogin.tsx](src/components/WelcomeLogin.tsx) matches
your email against three demo personas and **does not check the password**. Any
email logs you in as a customer.

| Persona | Email | Lands on |
|---|---|---|
| Victoria Fontaine | `victoria@styleswap.com` | Customer portal |
| Atelier COS Resell | `cos@styleswap.com` | Vendor workspace |
| System Administrator | `admin@styleswap.com` | Admin dashboard |

The six AI features still issue their `fetch` calls, which now fail with no
server to answer them:

| Feature | Without a backend |
|---|---|
| Semantic search (Browse) | Degrades cleanly to client-side substring matching |
| Virtual try-on | Shows the product image plus canned fit commentary |
| Size recommendation | Falls back to size M |
| AI Studio / vendor image generation | Error banner, no image |
| AI Stylist | Error banner, no outfit |
| Return damage scan | Throws; the return flow is broken |

## Stack

React 19, Vite 6, TypeScript, Tailwind 4, `lucide-react`, `motion`.

`src/types.ts` holds the shared domain types and is the reference for the
rebuild.
