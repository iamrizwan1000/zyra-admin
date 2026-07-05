# Phase 2F Implementation Summary — Listing Bumps & Shop Reports

**Branch:** `phase2f-bumps-shop-reports`
**Migrations:** 034–037 (locked)
**Remote verification:** 17 passed / 0 failed
**Status:** Completed and locked

---

## What was built

### Migration 034 — Schema additions + search_listings update

**`listings.bumped_at timestamptz`** — added via `ALTER TABLE`. `NULL` = never bumped. `bump_listing()` sets this on every bump so 'bumped' search sort works.

**`listing_bump_logs` table** — append-only record of every bump event. Used to enforce `daily_bump_limit`. Columns: `id, user_id, listing_id, bumped_at`. Index on `(user_id, bumped_at)` for the daily count query. RLS enabled (owner reads own rows).

**`search_listings` updated** — added `'bumped'` to the `p_sort_by` ORDER BY clause via `CREATE OR REPLACE`. Uses `COALESCE(l.bumped_at, l.created_at) DESC` so bumped listings float up and never-bumped listings fall back to `created_at` order. Migration 016 file untouched.

### Migration 035 — Bump RPCs

| RPC | Auth | Notes |
|---|---|---|
| `bump_listing(p_listing_id)` | Required | Validates ownership + active+approved. Checks active subscription + `daily_bump_limit` from `limits_snapshot`. Guards: `no_active_subscription`, `no_bump_credits` (limit=0), `daily_bump_limit_reached`. Updates `listings.bumped_at`, inserts bump log. Returns `{success, bumped_at, bumps_used_today, bumps_remaining}`. |
| `get_my_bump_usage(p_listing_id?)` | Required | Returns `{daily_limit, bumps_used_today, bumps_remaining, last_bumped_at}`. Returns zeros when no active subscription. |

Daily limit resets at midnight UTC (`bumped_at >= CURRENT_DATE`).

### Migration 036 — report_shop RPC

| RPC | Notes |
|---|---|
| `report_shop(p_shop_id, p_reason, p_message?)` | Validates shop exists. Guards duplicate pending report (same reporter + shop). Inserts into `reports` with `shop_id` set. Returns `{success, report_id}`. |

`get_pending_reports` (Phase 2E) already joins `reports LEFT JOIN shops`, so shop reports appear in the admin queue automatically. `resolve_report` (Phase 2E) handles resolution — no new admin RPCs needed.

### TypeScript API wrappers

| File | Change |
|---|---|
| `src/api/bumps.ts` | New — `bumpListing`, `getMyBumpUsage` |
| `src/api/reports.ts` | Added `reportShop` |

`src/types/supabase.ts` updated with 3 new RPC signatures: `bump_listing`, `get_my_bump_usage`, `report_shop`.

---

## Verification

### Local (037_phase2f_verification.sql) — 10 groups

1. Function existence: `bump_listing`, `get_my_bump_usage`, `report_shop`, `search_listings`
2. SECURITY DEFINER on new RPCs
3. Schema: `listings.bumped_at`, `listing_bump_logs` table and columns
4. RLS on `listing_bump_logs`
5. `search_listings` body contains 'bumped' sort case
6. `bump_listing` body contains `no_active_subscription`, `no_bump_credits`, `daily_bump_limit_reached` guards
7. Bump log round-trip: insert, daily count, `bumped_at` update, FK cascade (runs on existing data; SKIP otherwise)
8. `report_shop` body contains shop-exists guard and duplicate-pending guard
9. Locked functions from prior phases still present
10. No service_role references in Phase 2F functions

### Remote user-level (phase2f_remote_tests.mjs) — 17 checks

- Anon blocked from all 3 Phase 2F RPCs
- `search_listings` accepts `p_sort_by='bumped'`
- `get_my_bump_usage` returns zeros with no subscription
- `bump_listing` blocked with `no_active_subscription`
- Subscription activated → `get_my_bump_usage` returns correct daily_limit and remaining
- `bump_listing` fails for non-existent/unowned listing
- `report_shop` full round-trip: submit → duplicate blocked → appears in admin pending → admin resolves
- `report_shop` fails for non-existent shop
- Seller still blocked from admin RPCs

---

## Key design decisions

- **`bumped_at = NULL`** means never bumped. No sentinel value needed.
- **Daily limit resets at midnight UTC** via `bumped_at >= CURRENT_DATE`.
- **Bumping the same listing twice in one day** is allowed (both consume a credit; each bump refreshes `bumped_at`).
- **`daily_bump_limit = 0`** (Free Shop) → blocked with `no_bump_credits`. No bumping on free tier.
- **`campaigns` table is not used for bumps** — it is for admin marketing offers (a different concept). Not touched in Phase 2F.
- **`search_listings` RETURNS TABLE signature unchanged** — adding `bumped_at` to results would have required a DROP + recreate. The sort behaviour alone is sufficient for frontend needs.

---

## What Phase 2F does NOT cover

- `campaigns` table RPCs (admin creates/reads marketing offers)
- Push notifications
- Bump history visible to admin (bump logs are only seller-readable)
- Report shop via the `owner_id` path (currently any authenticated user can report any shop)

These are candidates for future phases or post-screen work.
