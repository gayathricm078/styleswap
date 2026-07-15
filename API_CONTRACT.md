# StyleSwap — API contract for the new backend

The old backend was deleted (commit `0dd7826`'s tree; restore any file with
`git show HEAD:server.ts`). The frontend still makes the six `fetch` calls below.
Until a backend answers them, each one falls through to a client-side fallback.

This file is the spec the new backend must satisfy. Shapes are taken from the
actual call sites, not from the deleted server.

## Wiring

The old server hosted Vite in middleware mode, so frontend and API shared origin
`localhost:3000` and relative paths just worked. `npm run dev` is now plain Vite
on `:5173`. When the new backend exists, add a proxy to `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true },
    '/ai':  { target: 'http://localhost:3000', changeOrigin: true },
  },
},
```

The `/api` vs `/ai` split is historical, not meaningful — the old server
implemented `/api/stylist` and `/ai/stylist` as byte-identical handlers. Worth
collapsing to one prefix and updating the call sites.

## Endpoints

### `POST /api/stylist` — [AiStylist.tsx](src/components/AiStylist.tsx#L55)

Request: `{ occasion, budget, bodyType, colors, style, weather }` (all strings)

Response:
```jsonc
{
  "outfitName": "string",
  "explanation": "string",
  "dress":     { "name": "string", "brand": "string", "description": "string", "rentalPrice": 0 },
  "shoes":     { "name": "string", "brand": "string", "description": "string", "rentalPrice": 0 },
  "handbag":   { "name": "string", "brand": "string", "description": "string", "rentalPrice": 0 },
  "jewellery": { "name": "string", "brand": "string", "description": "string", "rentalPrice": 0 },
  "totalPrice": 0,
  "sustainabilityImpact": "string"
}
```
All four garment keys are required — `handleRentCompleteLook` dereferences
`result.dress.name` etc. with no guard and will throw if any are missing.

On failure: shows an error banner, no result. **No fallback.**

### `POST /api/size-recommendation` — [ProductDetails.tsx](src/components/ProductDetails.tsx#L57)

Request: `{ height, weight, preferredFit, itemBrand }`

Response: `{ "recommendedSize": "S|M|L|XL", "confidenceScore": "94%", "reasoning": "string" }`

Note this call site never checks `res.ok`; a non-JSON error page lands in the
catch via a JSON parse failure. Fallback: size `M`, 85%.

### `POST /api/damage-detection` — [App.tsx](src/App.tsx#L250)

Request: `{ damagePreset }` — one of `"perfect" | "stain" | "tear"`

Response:
```jsonc
{
  "condition": "Perfect | Minor Damage | Major Damage",
  "damageSummary": "string",
  "feeCharged": 0,
  "resolvable": true,
  "actionRequired": "None | Dry Clean | Sartorial Seam Repair | Write-off"
}
```
On failure: rethrows to the caller. **No fallback** — the return-scan flow breaks.

### `POST /ai/search` — [BrowseProducts.tsx](src/components/BrowseProducts.tsx#L45)

Request: `{ query, products }` — sends the **entire product catalog** in the body.
The old server pasted it into a Gemini prompt. Rebuild this server-side against
your own datastore; don't trust a client-supplied catalog.

Response: `[{ "productId": "string", "relevanceScore": 0, "relevanceExplanation": "string" }]`

`productId` must match the frontend's `Product.id` (e.g. `"prod-1"`), not a
numeric DB id. Fallback: client-side substring match — this one degrades well.

### `POST /ai/tryon` — [VirtualTryOn.tsx](src/components/VirtualTryOn.tsx#L34)

Request: `{ avatarUrl, productUrl, productName, avatarName, productBrand }`

Response: `{ "imageUrl": "string", "fitReview": "string", "toneHarmony": "string", "styleScore": "96/100" }`

The old server never composited anything — it echoed `productUrl` straight back
as `imageUrl` and had Gemini write the prose. Fallback mirrors that.

### `POST /api/generate-image` — [AiStudio.tsx](src/components/AiStudio.tsx#L85), [VendorDashboard.tsx](src/components/VendorDashboard.tsx#L40)

Request: `{ prompt, aspectRatio }` (default `"1:1"`)

Response: `{ "imageUrl": "data:image/png;base64,…", "isFallback": false, "error": "string?" }`

`AiStudio` special-cases the exact string `"Credentials missing. Applied studio
fallback."` in `error` — a coupling worth removing in the rebuild.

## What the frontend needs beyond AI

None of this is wired to anything today — [App.tsx](src/App.tsx) holds it all in
`useState` seeded from [data.ts](src/data.ts), and it resets on refresh. A real
backend needs to cover:

- **Auth** — login is a `setTimeout` in [WelcomeLogin.tsx](src/components/WelcomeLogin.tsx#L75) that matches an email against three demo personas and **never checks the password**. Roles (`customer`/`vendor`/`admin`) are picked client-side and switchable from the navbar.
- **Products** — read, plus vendor create/update.
- **Cart / wishlist / orders** — full CRUD; order placement computes totals client-side today.
- **Coupons, notifications, addresses, reviews.**
- **Admin analytics** — [AdminDashboard.tsx](src/components/AdminDashboard.tsx) renders hardcoded audit rows; the old `/api/admin/analytics` returned hardcoded chart data too.

`src/types.ts` is the frontend's source of truth for these shapes and survived
the teardown intact — build the new API against it.

## Bugs in the old backend — do not port these

Documented so the rebuild doesn't reintroduce them:

1. **Order tampering.** `PUT /api/orders/:orderId/status` filtered on `orderId`
   only, with no ownership or role check. Any authenticated user could rewrite
   any order's status or clear its `damageReport`. Enforce ownership.
2. **Unreachable roles.** `requireRole(["vendor","admin"])` guarded product
   writes, but `role` defaulted to `"customer"` and nothing ever set it
   otherwise — those routes could never be reached. Need a role-granting path.
3. **Broken search.** The product ILIKE pattern was built as `%"${search}"%`,
   embedding literal quotes, so it only matched text containing `"silk"` *with*
   the quotes. Use `%${search}%`.
4. **ID confusion.** Order creation did `parseInt(item.product.id)`, but
   frontend ids are strings like `"prod-1"` → `NaN`. The old schema kept a
   serial `id` and a text `productId` and the code conflated them. Pick one.
5. **Errors swallowed into fallbacks.** Every AI route caught everything and
   returned canned data, so a missing key, a network failure, and a wrong model
   name were indistinguishable from success. Let failures surface; keep
   fallbacks in the UI where they're visible.
6. **Unverified model ids.** The old code requested `gemini-3.5-flash` and
   `gemini-3.1-flash-lite-image`. Confirm these exist before relying on them —
   given #5, if they don't, every response was silently a fallback.
