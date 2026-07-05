# AI Handover Note — Mobile Market Project

Read this file at the start of every new session before writing any code or making any plan.

---

## Project Overview

**App name:** Mobile Market
**Type:** React Native CLI + Supabase mobile marketplace for buying and selling mobile phones
**Backend:** Supabase (PostgreSQL + RLS + SECURITY DEFINER RPCs)
**Platform:** iOS + Android

Buyers contact sellers through Call or WhatsApp. No in-app chat or delivery. Listings go through admin approval before becoming public.

---

## Working Style Rules

These rules are non-negotiable across every session:

- Do not rush into coding. Read the plan, confirm understanding, wait for approval.
- For every new phase: create the branch first, then provide a plan, then wait for approval.
- After coding: run type checks and verification queries locally.
- Apply migrations to remote Supabase only after explicit approval.
- Run remote verification with real anon/auth/admin test users before locking.
- Do not commit or push until the user approves.
- After remote verification passes: update docs, mark phase locked, then commit and push.
- Never use service_role key. All RPCs use `auth.uid()` inside SECURITY DEFINER.
- Never commit `.env` or credentials.
- Never run destructive commands: `db reset`, `drop`, `truncate`, `delete-all`, `migration repair` — unless explicitly approved.
- Protect all locked migrations. If a later phase needs a change to a locked migration, stop and ask.

---

## Repository Layout

```
supabase/migrations/     48 SQL migration files (001–048, locked after verification)
src/api/                 TypeScript frontend API wrappers (call Supabase RPCs)
src/types/supabase.ts    Generated + hand-extended Supabase type definitions
docs/                    Phase summaries, spec docs, and this handover file
```

Key source files:
- `src/api/notifications.ts` — getMyNotifications, getMyUnreadNotificationCount, markNotificationRead, markAllNotificationsRead (Phase 2G)
- `src/api/bumps.ts` — bumpListing, getMyBumpUsage (Phase 2F)
- `src/api/saved-listings.ts` — save, unsave, isSaved, getMySavedListings (Phase 2E)
- `src/api/reports.ts` — reportListing, reportUser, reportShop, getMyReports (Phase 2E + 2F)
- `src/api/reports-admin.ts` — getPendingReports, resolveReport (Phase 2E)
- `src/api/packages.ts` — seller: packages, subscription, usage, feature/unfeature (Phase 2D)
- `src/api/payments.ts` — seller: create payment request, payment history (Phase 2D)
- `src/api/payment-admin.ts` — admin: review, approve/reject, activate/cancel, adjust credits (Phase 2D)
- `src/api/admin.ts` — admin listing/shop review APIs (Phase 2C)
- `src/api/listing.ts` — listing draft/submit/image APIs + markListingSold, sellerRemoveListing, **updateAndResubmitListing** (Phase 2B + 2G + 2H)
- `src/api/seller.ts` — individual seller and shop creation APIs + **getMySellerStatus** (Phase 2B)
- `src/api/profile.ts` — profile read/update APIs, setLastActiveMode (Phase 2B)
- `src/api/public.ts` — public search, listing detail, shop profile APIs + **getShopActiveListingCount** (Phase 2A)
- `src/types/supabase.ts` — Supabase type signatures, updated after every phase

---

## Completed Phases

### Phase 1 — Database Structure
**Branch:** `phase1/supabase-database-structure`
**Status:** Completed, verified, locked
**Locked migrations:** 001–015

Tables created: profiles, individual_seller_profiles, cities, areas, markets, categories, category_fields, category_field_options, shops, listings, listing_field_values, listing_images, packages, subscriptions, payments, campaigns, featured_credit_adjustments, saved_listings, reports, user_devices, notification_campaigns, notifications, notification_deliveries, moderation_logs, app_settings. Includes indexes, triggers, RLS policies, seed data.

Do not modify migrations 001–015.

---

### Phase 2A — Public Read APIs
**Branch:** `phase2/public-read-apis`
**Status:** Completed, verified, locked
**Locked migrations:** 016–019

Includes: public listing search RPC, listing detail RPC, shop profile RPC, shop public listings RPC, public APIs for cities, areas, markets, categories, packages, app settings, banners.

Do not modify migrations 016–019.

---

### Phase 2B — Auth / Profile / Seller / Draft Listing APIs
**Branch:** `phase2b-auth-profile-seller-drafts`
**Commit:** `9f69e23`
**Status:** Completed, remotely verified (50 passed / 0 failed), locked, committed, pushed
**Locked migrations:** 020–023

Includes: profile APIs, individual seller setup, shop creation/update, listing draft APIs, image metadata APIs, duplicate listing as draft, submit listing for approval, ownership/RLS verification.

Important: `021_submit_listing_for_approval.sql` has a placeholder comment where package/listing limit enforcement will eventually go. It was left intentionally incomplete for Phase 2B. Do not modify it without explicit approval.

Do not modify migrations 020–023.

---

### Phase 2C — Admin Approval APIs
**Branch:** `phase2c-admin-approval-apis`
**Commit:** `7f29fcc`
**Status:** Completed, remotely verified (73 passed / 0 failed), locked, committed, pushed
**Locked migrations:** 024–025

Includes: admin listing approval/rejection/request changes/remove/mark suspicious, admin shop approval/rejection/request changes/suspend/reactivate, moderation logs for every admin action, owner notifications for every admin action.

Do not modify migrations 024–025.

---

### Phase 2G — Notifications & Seller Listing Lifecycle
**Branch:** `phase2g-notifications-listing-lifecycle`
**Status:** Completed, remotely verified (28 passed / 0 failed), locked
**Locked migrations:** 038–040

See `docs/phase2g-implementation-summary.md` for full detail.

Includes: `get_my_notifications` (paginated, unread filter), `get_my_unread_notification_count` (badge count), `mark_notification_read`, `mark_all_notifications_read`, `mark_listing_sold` (active+approved only, sets `sold_at`), `seller_remove_listing` (non-draft soft-remove, idempotent).

**Key decisions (do not revisit without explicit user approval):**
- `seller_remove_listing` named distinctly from admin `remove_listing` (migration 024) to avoid overload ambiguity.
- Draft listings excluded from `seller_remove_listing` — use direct table DELETE (RLS allows owner delete on drafts).
- `mark_listing_sold` requires `approval_status='approved'` — pending listings cannot be marked sold.
- `seller_remove_listing` is idempotent: already-removed listings return `true` immediately.
- Notifications are in-app only (`channel='in_app'`); admin writes them via direct table insert.

Do not modify migrations 038–040.

---

### Phase 2H — Storage Buckets, Contact Info, Payment Method & Edit Listing
**Branch:** (no dedicated branch — built incrementally)
**Status:** Completed
**Locked migrations:** 041–048

See `docs/phase2h-implementation-summary.md` for full detail.

Includes:
- **Migrations 041–042**: Shop and listing media storage buckets (shop-media, listing-media)
- **Migration 043**: `get_listing_detail` extended with seller_name and seller_phone for Call/WhatsApp
- **Migration 044**: Avatar storage bucket
- **Migration 045**: Payment method CHECK constraint (jazzcash/easypaisa), `create_manual_payment_request` updated
- **Migration 046**: Payment proof storage bucket (payment-proofs)
- **Migration 047**: `last_active_mode` CHECK constraint on profiles table
- **Migration 048**: `update_and_resubmit_listing` RPC — edit pending/active/paused listings and resubmit for re-review

New/updated API functions:
- `updateAndResubmitListing` in `src/api/listing.ts` — calls `update_and_resubmit_listing` RPC
- `getMySellerStatus` in `src/api/seller.ts` — checks both individual seller profile and shop to route Sell tab
- `getShopActiveListingCount` in `src/api/public.ts` — counts active+approved listings for a shop

Do not modify migrations 041–048.

---

### Phase 2F — Listing Bumps & Shop Reports
**Branch:** `phase2f-bumps-shop-reports`
**Status:** Completed, remotely verified (17 passed / 0 failed), locked
**Locked migrations:** 034–037

See `docs/phase2f-implementation-summary.md` for full detail.

Includes: `listings.bumped_at` column, `listing_bump_logs` table, `search_listings` updated with `'bumped'` sort option, `bump_listing` and `get_my_bump_usage` seller RPCs, `report_shop` RPC (uses existing `reports.shop_id` column; `get_pending_reports` and `resolve_report` from Phase 2E handle admin side automatically).

**Key decisions (do not revisit without explicit user approval):**
- `bumped_at = NULL` means never bumped. Daily limit resets at midnight UTC (`bumped_at >= CURRENT_DATE`).
- `daily_bump_limit = 0` (Free Shop) blocks bumping with `no_bump_credits`.
- `search_listings` RETURNS TABLE signature unchanged — only ORDER BY updated.
- `campaigns` table is for admin marketing offers, not listing bumps — not touched.

Do not modify migrations 034–037.

---

### Phase 2E — Listing Limits, Saved Listings & Reports
**Branch:** `phase2e-listing-limits-saved-reports`
**Status:** Completed, remotely verified (35 passed / 0 failed), locked
**Locked migrations:** 030–033

See `docs/phase2e-implementation-summary.md` for full detail.

Includes: listing limit enforcement in `submit_listing_for_approval` (subscription + `active_listing_limit` from `limits_snapshot`), save/unsave/isSaved/list saved listings, user reporting (listing + user), admin report review and resolution (resolved/dismissed), moderation_logs for all admin resolutions.

**Key decisions (do not revisit without explicit user approval):**
- Submission blocked without an active subscription — no implicit free tier.
- Listing limit counts `status IN ('pending', 'active')` — submitted drafts occupy a slot.
- `save_listing` requires `status='active' AND approval_status='approved'`.
- `get_my_saved_listings` INNER JOINs on status/approval — silently excludes removed listings.
- `resolve_report` accepts `'resolved'` or `'dismissed'` only; writes to `moderation_logs`.
- No reporter notification on resolution (deferred).
- `submit_listing_for_approval` is replaced via `CREATE OR REPLACE` in migration 030; migration 021 file is untouched.

Do not modify migrations 030–033.

---

### Phase 2D — Packages, Payments & Featured Credits
**Branch:** `phase2d-packages-payments`
**Status:** Completed, remotely verified (47 passed / 0 failed), locked
**Locked migrations:** 026–029

See `docs/phase2d-implementation-summary.md` for full detail.

Includes: seller package/subscription/usage RPCs, manual payment proof submission, admin payment approval/rejection, subscription activation (payment-triggered and manual), subscription cancellation, featured credit adjustments (extra_credits / limit_override / unlimited), feature/unfeature listing, in-app notifications for all events, moderation_logs for all admin actions.

**Key decisions (do not revisit without explicit user approval):**
- Payment status: `pending → approved` or `pending → rejected` only. No `under_review`.
- Active subscription = `status = 'active' AND expires_at > now()` — evaluated at read time, no background job.
- One active subscription per user/shop; `approve_payment` and `activate_subscription` cancel any existing active subscription first.
- Cancelling a subscription does not touch listing rows.
- Unlimited featured credits use `featured_credit_adjustments.is_unlimited = true`, not a -1 sentinel.
- Featured credit priority: unlimited adj → limit_override adj → base + extra_credits.
- `feature_listing()` always sets a real `featured_until` timestamp; `NULL` is not counted as featured.
- `limits_snapshot` jsonb is frozen from the live package at subscription activation time.
- `submit_listing_for_approval` (migration 021) was not modified; `get_my_package_usage()` is the frontend pre-check.
- All admin actions log to `moderation_logs` (the only admin audit table; `admin_logs` does not exist).
- Notifications: in-app only (`channel = 'in_app'`). No push in Phase 2D.

**Bug found and fixed during remote verification:**
- `get_pending_payments` had a type mismatch: `auth.users.email` is `varchar(255)` but the RETURNS TABLE declared `seller_email text`. PostgREST rejects this at runtime. Fixed in migration 029 with an explicit `u.email::text` cast.

Do not modify migrations 026–029.

---

## Schema Quick Reference

All tables are in the `public` schema with RLS enabled. Key admin helper: `public.is_admin(uuid) → boolean` (checks `profiles.is_admin`).

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | `id, is_admin, account_status` | One per auth user |
| `packages` | `active_listing_limit, featured_listing_limit, duration_days, status` | No unlimited flag; use adjustments |
| `subscriptions` | `user_id, shop_id, package_id, status, starts_at, expires_at, limits_snapshot` | limits_snapshot frozen at activation |
| `payments` | `user_id, package_id, status, proof_url, rejection_reason, approved_at` | status: pending/approved/rejected |
| `featured_credit_adjustments` | `adjustment_type, extra_credits, limit_override, is_unlimited, revoked_at` | Admin-only write |
| `listings` | `status, approval_status, is_featured, featured_until` | Public = status=active AND approval_status=approved |
| `notifications` | `user_id, type, channel, related_entity_type, related_entity_id, metadata` | channel=in_app for Phase 2D |
| `moderation_logs` | `admin_id, action, entity_type, entity_id, reason, metadata` | Append-only |

---

## What to Do When Starting a New Session

1. Read this file.
2. Run `git status` and `git branch --show-current` to confirm which branch you are on.
3. Check `git log --oneline -5` to confirm the last commit.
4. Read the relevant phase summary doc in `docs/` if continuing an in-progress phase.
5. For a new phase: create the branch first, produce a plan, wait for user approval before writing any code.
6. Never apply migrations to remote without user approval.
7. Never commit without user approval.
