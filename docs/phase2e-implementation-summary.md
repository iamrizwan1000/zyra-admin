# Phase 2E Implementation Summary — Listing Limits, Saved Listings & Reports

**Branch:** `phase2e-listing-limits-saved-reports`
**Migrations:** 030–033 (locked)
**Remote verification:** 35 passed / 0 failed
**Status:** Completed and locked

---

## What was built

### Migration 030 — Listing Limit Enforcement

Replaced `submit_listing_for_approval` (originally in migration 021) via `CREATE OR REPLACE` — the migration 021 file is untouched.

New logic appended after the existing seller/shop readiness check:
1. Query for an active subscription: `status = 'active' AND expires_at > now()`
2. If none → error key `no_active_subscription` added to the errors array
3. If found → read `active_listing_limit` from `limits_snapshot`, count listings in `status IN ('pending', 'active')`, error key `active_listing_limit_reached` if at capacity

Listings counted toward the limit: `status IN ('pending', 'active')` — drafts, rejected, and removed do not consume a slot.

No active subscription = cannot submit. There is no implicit free tier for unsubscribed users.

Error response shape is unchanged: `{success: false, errors: [...]}`.

### Migration 031 — Saved Listings RPCs

| RPC | Auth | Notes |
|---|---|---|
| `save_listing(p_listing_id)` | Required | Only active+approved listings. ON CONFLICT DO NOTHING (idempotent). |
| `unsave_listing(p_listing_id)` | Required | Idempotent — DELETE silently if not saved. |
| `is_listing_saved(p_listing_id)` | Required | Returns boolean. |
| `get_my_saved_listings(p_limit, p_offset)` | Required | JOIN filters out listings removed since saving. Returns saved_at, title, price, currency_code, city/area name, primary image, shop/seller name, is_featured. |

Cascade delete already defined in migration 009: when a listing is hard-deleted, saved rows are removed automatically.

### Migration 032 — Reports RPCs

**User-facing:**

| RPC | Notes |
|---|---|
| `report_listing(listing_id, reason, message?)` | Validates listing exists. Guards duplicate pending reports (same reporter + listing). |
| `report_user(reported_user_id, reason, message?)` | Cannot report yourself. Guards duplicate pending. |
| `get_my_reports(limit, offset)` | Reporter's own reports, joined with listing title. |

**Admin-facing:**

| RPC | Notes |
|---|---|
| `get_pending_reports(limit, offset)` | All pending reports joined with reporter name, listing title, reported user name, shop name. |
| `resolve_report(report_id, resolution, note?)` | `resolution` must be `'resolved'` or `'dismissed'`. Updates report status, writes to `moderation_logs` with `entity_type='report'`. |

### TypeScript API wrappers

| File | Exports |
|---|---|
| `src/api/saved-listings.ts` | `saveListing`, `unsaveListing`, `isListingSaved`, `getMySavedListings` |
| `src/api/reports.ts` | `reportListing`, `reportUser`, `getMyReports` |
| `src/api/reports-admin.ts` | `getPendingReports`, `resolveReport` |

`src/types/supabase.ts` updated with 9 new RPC signatures.

---

## Verification

### Local (033_phase2e_verification.sql)

12 groups of DO $ checks:
1. All 10 Phase 2E functions exist
2. All RPCs are SECURITY DEFINER
3. `submit_listing_for_approval` body contains `no_active_subscription`, `active_listing_limit_reached`, and `limits_snapshot` references
4. Locked functions from prior phases still present
5. RLS enabled on `saved_listings` and `reports`
6. `saved_listings` unique constraint exists; `listing_images.image_url` column confirmed
7. `reports` table has required columns
8. Save/unsave round-trip and stale-listing exclusion (runs if existing active listings found; SKIP otherwise)
9. Report insertion, status default, resolution update (runs if existing profiles found)
10. Admin guard in `get_pending_reports` and `resolve_report`
11. Invalid resolution value guard in `resolve_report`
12. No service_role references in Phase 2E functions

### Remote user-level (phase2e_remote_tests.mjs)

35 checks across 8 test groups:
- Listing submit blocked without subscription, unblocked after activation
- Anon blocked from all 9 Phase 2E RPCs
- Seller blocked from 2 admin RPCs
- Saved listings round-trip (save, isSaved, get, idempotent duplicate, unsave, isSaved again) — SKIP when no public listings exist in DB
- Full report flow: submit → duplicate blocked → visible in seller list → visible in admin pending → admin resolves → no longer pending → double-resolve blocked
- Invalid resolution value blocked
- Self-report blocked
- report_listing fails for non-existent listing
- unsave idempotent on non-saved listing
- RLS: get_my_saved_listings returns own rows only

---

## Key design decisions

- **No implicit free tier.** Submission requires an active subscription. `get_my_package_usage()` (Phase 2D) is the frontend pre-check to show correct limits.
- **Listing count uses `status IN ('pending', 'active')`** — submitted-but-not-yet-approved listings still occupy a slot.
- **save_listing requires active+approved** — buyers cannot save draft or pending listings.
- **get_my_saved_listings silently excludes removed listings** via an INNER JOIN with status/approval_status filter.
- **Reports do not have `resolved_by` / `resolved_at` columns** — resolution details go into `moderation_logs.metadata`.
- **No notification to reporter on resolution** — deferred to a future phase.
- **`resolve_report` accepts `'resolved'` or `'dismissed'` only** — any other value raises an exception.

---

## What Phase 2E does NOT cover

- Listing bump / campaign features (`campaigns` table, `daily_bump_limit`)
- Push notifications for report resolution
- Notification to reporter when their report is actioned
- Shop-level reports (reports.shop_id column exists but no `report_shop` RPC)

These are candidates for Phase 2F or later.
