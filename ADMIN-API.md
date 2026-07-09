# Admin Panel → Laravel API Migration Guide

The admin panel moves off Supabase entirely: **no `supabase-js`, no direct table queries, no RLS, no Supabase storage URLs.** Everything below is plain HTTPS + JSON against the Laravel API. Admin authorization is enforced server-side (`is_admin` middleware) — the panel never needs service-role keys.

- **Base URL:** `https://api.<domain>/api` (local dev: `https://zyra-apis.ddev.site/api`)
- All requests/responses are JSON (`Content-Type: application/json`) except file uploads (multipart).
- All IDs are UUID strings. All timestamps are ISO-8601 (`2026-07-09T10:30:00.000000Z`).

---

## 1. Authentication

Replace Supabase Auth with token auth (Laravel Sanctum):

```
POST /auth/login          { "email": "...", "password": "..." }
→ 200 { "data": { "user": {...}, "token": "1|xxxxx..." }, "error": null }
```

- Store the token; send it on every request: `Authorization: Bearer <token>`.
- The logged-in user must have `is_admin: true` — otherwise every `/admin/*` call returns `403 FORBIDDEN`.
- `POST /auth/refresh` (authed) → new token (old one is revoked). `POST /auth/logout` revokes the current token.
- `GET /auth/me` → current user.
- Login is throttled (30 requests / 5 min). `401 INVALID_CREDENTIALS` on bad password, `403 ACCOUNT_SUSPENDED` if suspended.

## 2. Response envelope — every endpoint, no exceptions

**Success:**
```json
{ "data": <object | array>, "error": null }
```

**Success with pagination** (list endpoints):
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "per_page": 20, "total": 134, "last_page": 7 },
  "error": null
}
```
Request pages with `?page=2`. Pending-moderation lists are fixed at 20/page.

**Error** (non-2xx status):
```json
{ "data": null, "error": { "message": "...", "code": "...", "details": { } } }
```

| HTTP | `error.code` | When |
|------|--------------|------|
| 401 | `UNAUTHENTICATED` / `INVALID_CREDENTIALS` | missing/revoked token, bad login |
| 403 | `FORBIDDEN` / `ACCOUNT_SUSPENDED` | not admin, suspended |
| 404 | `NOT_FOUND` | unknown id/route |
| 409 | `409` | conflict (e.g. campaign already sent) |
| 422 | `VALIDATION_ERROR` | bad input — `error.details` = `{ field: [messages] }` per field |
| 429 | `TOO_MANY_REQUESTS` | throttled |
| 500 | `SERVER_ERROR` | bug — report it |

Write actions that return no entity respond `{ "data": { "success": true }, "error": null }`.

## 3. Analytics (dashboard)

| Endpoint | Params | Returns |
|----------|--------|---------|
| `GET /admin/analytics/overview` | — | headline counters (users, listings, revenue, pending queues) |
| `GET /admin/analytics/revenue` | `?days=30` (max 365) | revenue time series |
| `GET /admin/analytics/users` | `?days=30` | signups time series |
| `GET /admin/analytics/listings` | — | listing counts by status |
| `GET /admin/analytics/views` | `?days=30` | view trends |
| `GET /admin/analytics/top-listings` | `?limit=10` (max 100) | most-viewed listings |
| `GET /admin/analytics/moderation` | `?days=30` | moderation activity stats |

## 4. Moderation queues

**Listings**
```
GET  /admin/listings/pending                     (paginated, oldest first)
GET  /admin/listings/{id}
POST /admin/listings/{id}/approve                { "note": "optional" }
POST /admin/listings/{id}/reject                 { "reason": "required" }
POST /admin/listings/{id}/request-changes        { "reason": "required" }
POST /admin/listings/{id}/mark-suspicious        { "reason": "required" }
POST /admin/listings/{id}/remove                 { "reason": "required" }
```

**Shops** — same pattern: `GET /admin/shops/pending`, `GET /admin/shops/{id}`, then `POST .../approve` (no body), `.../reject`, `.../request-changes`, `.../suspend` (all `{ "reason": "required" }`), `.../reactivate` (no body).

**Payments**
```
GET  /admin/payments/pending
GET  /admin/payments/{id}
POST /admin/payments/{id}/approve                (no body — activates the subscription)
POST /admin/payments/{id}/reject                 { "reason": "required" }
```

**Reports**
```
GET  /admin/reports/pending
POST /admin/reports/{id}/resolve                 { "resolution": "resolved" | "dismissed", "note": "optional" }
```

Every decision automatically notifies the affected user (in-app + push) and writes a moderation log — the panel does not need to create notifications itself (it did via Supabase functions before).

## 5. Users

```
GET  /admin/users?search=<name|email|phone>&is_admin=<bool>&page=1
GET  /admin/users/{id}
GET  /admin/users/{id}/package-usage
POST /admin/users/{id}/suspend
POST /admin/users/{id}/activate
```

Note: users deleted via the mobile app's account deletion appear anonymized (`full_name: "Deleted User"`); they cannot be reactivated.

## 6. Subscriptions & featured credits

```
POST /admin/subscriptions/activate     { "user_id": "...", "package_id": "...", "shop_id": null, "note": null }
→ { "data": { "success": true, "id": "<subscription uuid>" } }

POST /admin/subscriptions/{id}/cancel  { "reason": "required" }

POST /admin/featured-credits {
  "user_id" | "shop_id": "...",           // exactly one required
  "adjustment_type": "extra_credits" | "limit_override" | "unlimited",
  "extra_credits": 5, "limit_override": 10, "is_unlimited": true,   // per type
  "starts_at": null, "expires_at": null, "reason": null, "admin_note": null
}
```

## 7. Master data CRUD

Standard REST on: `/admin/cities`, `/admin/areas`, `/admin/markets`, `/admin/categories`, `/admin/packages` — `GET` (list), `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}`.

Key create fields (update = same, all optional):
- **cities:** `name` (req), `status` (`active|inactive`), `sort_order`, `country_code`
- **areas:** `city_id` (req), `name` (req), `status`, `sort_order`
- **markets:** `city_id` (req), `area_id`, `name` (req), `status`, `sort_order`
- **categories:** `name` (req), `slug` (req, unique), `parent_id`, `status`, `sort_order`
- **packages:** `name` (req), `price` (req), `duration_days` (req), `active_listing_limit`, `featured_listing_limit`, `daily_bump_limit`, `status`, `sort_order`

**Category fields / options** (non-resource routes):
```
POST   /admin/category-fields     { category_id, field_key, field_name, field_type: text|number|boolean|select|multi_select, is_required?, is_filterable?, is_searchable?, show_on_card?, show_on_detail?, sort_order? }
PUT    /admin/category-fields/{id}
DELETE /admin/category-fields/{id}
POST   /admin/field-options       { field_id, label, value, sort_order? }
PUT    /admin/field-options/{id}
DELETE /admin/field-options/{id}
```

**Settings & logs:**
```
GET /admin/settings
PUT /admin/settings               { "settings": { "key": "value", ... } }
GET /admin/logs                   (moderation log, paginated 50/page)
```

## 8. Notifications to users (campaigns / banners)

One model drives both in-app banners and push blasts — managed under `/admin/banners`:

```
GET/POST /admin/banners, GET/PUT/DELETE /admin/banners/{id}

POST /admin/banners {
  "campaign_name": "July promo",
  "title": "...", "message": "...",                       // required
  "display_type": "notification" | "banner" | "both",     // required
  "target_type": "all_logged_in" | "user" | "city" | "user_type" | "package_status",
  "target_user_id": "...",     // required if target_type=user
  "city_id": "...",            // required if target_type=city (area_id/market_id optional)
  "user_type": "buyer"|"seller",          // required if target_type=user_type
  "package_status": "active"|"expired"|"none",  // required if target_type=package_status
  "placement": "home_top",     // banner placement key (banner types)
  "priority": 0, "action_label": null, "action_deep_link": null,
  "starts_at": null, "ends_at": null,     // banner visibility window
  "scheduled_at": null,                   // auto-send time (needs status=scheduled)
  "status": "draft" | "scheduled" | "sent"
}
```

**Sending:**
- `POST /admin/banners/{id}/send` → sends **now**; returns `{ "data": { "campaign_id", "status": "sent", "recipients": N, "dispatched_at" } }`. `409` if already sent, `422` if `display_type` is banner-only.
- Or set `status: "scheduled"` + `scheduled_at` — the server cron sends it automatically.
- Delivery = in-app notification for every targeted user + FCM push to their registered devices (queued server-side; delivery is logged per device).

`display_type: banner` items appear in the app via the public `GET /banners` feed (requires `status` scheduled/sent and within the `starts_at`/`ends_at` window).

## 9. Promotional (discount) campaigns

Separate from notification campaigns — these are displayed offers (`GET /campaigns` public):

```
GET/POST /admin/campaigns, GET/PUT/DELETE /admin/campaigns/{id}

POST /admin/campaigns {
  "name": "Eid sale",                                       // required
  "offer_type": "discount_percentage" | "discount_fixed" | "free_days",   // required
  "value": 20,                                              // required
  "benefit_duration_days": null, "target_package_id": null,
  "availability_starts_at": null, "availability_ends_at": null,
  "status": "active" | "inactive" | "expired"
}
```

> Discounts are **display-only** today — payment amounts are reviewed manually at payment approval. Automatic discount application lands with the payment-gateway integration.

## 10. Files & images (replaces Supabase Storage)

- **Upload:** `POST /storage/{bucket}` — multipart, field `file` (+ `listing_id` for `listing-media`). Buckets: `listing-media`, `shop-media`, `avatars` (public, images ≤10/10/5 MB), `shop-documents` (private, +PDF), `payment-proofs` (private).
- Image uploads are auto-resized server-side (≤1600px WebP) and return `url` **and** `thumbnail_url` — use them as-is.
- **Viewing private files** (payment proofs, shop documents in moderation screens): the returned URLs point at `GET /storage/{bucket}/{path}` — request them **with the admin Bearer token** (admins can read every private file). Plain `<img src>` won't send the header; fetch as blob or proxy accordingly.
- **Delete:** `DELETE /storage/{bucket}/{path}` (admin may delete any file).

Old Supabase storage URLs (`<project>.supabase.co/storage/v1/object/...`) are dead after cutover — any stored references must be migrated or re-uploaded.

## 11. What has no replacement (yet)

- **Realtime subscriptions** (`supabase.channel(...)`): none. Poll the pending queues (e.g. refetch every 30–60 s) or refetch on focus.
- **Direct table access:** everything goes through the endpoints above; if a screen needs data with no endpoint, request one — don't work around it.
