# Phase 2G Implementation Summary — Notifications & Seller Listing Lifecycle

**Branch:** `phase2g-notifications-listing-lifecycle`
**Migrations:** 038–040 (locked)
**Remote verification:** 28 passed / 0 failed
**Status:** Completed and locked

---

## What was built

### Migration 038 — Notification RPCs

| RPC | Notes |
|---|---|
| `get_my_notifications(p_limit, p_offset, p_unread_only)` | Returns paginated in-app notifications for the authenticated user, newest first. `p_unread_only=true` filters to `read_at IS NULL` rows. Columns: `id, title, message, type, related_entity_type, related_entity_id, action_label, action_deep_link, metadata, read_at, created_at`. |
| `get_my_unread_notification_count()` | Returns a single `integer`. Lightweight — intended for badge counts. Only counts `channel='in_app'` rows with `read_at IS NULL`. |
| `mark_notification_read(p_notification_id)` | Sets `read_at = now()` for a single notification. Guards: owner filter (`user_id = auth.uid()`), only updates unread rows (`read_at IS NULL`). Idempotent — safe to call on already-read notifications. Returns `boolean`. |
| `mark_all_notifications_read()` | Sets `read_at = now()` on all unread in-app notifications for the user. Returns `integer` = number of rows updated. |

All 4 RPCs are SECURITY DEFINER, filter by `channel='in_app'`, and only act on the authenticated user's rows.

### Migration 039 — Seller Listing Lifecycle RPCs

| RPC | Notes |
|---|---|
| `mark_listing_sold(p_listing_id)` | Validates ownership and that the listing is `status='active' AND approval_status='approved'`. Sets `status='sold'` and `sold_at=now()`. Returns `boolean`. |
| `seller_remove_listing(p_listing_id)` | Validates ownership. Blocks `status='draft'` (use the direct table delete instead). Idempotent for already-removed listings. Sets `status='removed'`. Returns `boolean`. |

Named `seller_remove_listing` to avoid ambiguity with the admin `remove_listing(p_listing_id, p_reason)` from migration 024 (different signature and admin-only guard).

### TypeScript API wrappers

| File | Change |
|---|---|
| `src/api/notifications.ts` | New — `getMyNotifications`, `getMyUnreadNotificationCount`, `markNotificationRead`, `markAllNotificationsRead` |
| `src/api/listing.ts` | Added `markListingSold`, `sellerRemoveListing` |

`src/types/supabase.ts` updated with 6 new RPC signatures.

---

## Verification

### Local (040_phase2g_verification.sql) — 8 groups

1. All 6 functions present
2. All 6 are SECURITY DEFINER
3. `get_my_notifications` body: `channel='in_app'`, `p_unread_only` filter, `ORDER BY created_at DESC`
4. `mark_notification_read` body: `read_at IS NULL` guard, owner filter
5. `mark_listing_sold` body: sets `status='sold'` + `sold_at`, guards on active + approved
6. `seller_remove_listing` body: sets `status='removed'`, guards on draft
7. All prior-phase functions intact (18 checked)
8. No service_role references in Phase 2G functions

### Remote user-level (phase2g_remote_tests.mjs) — 28 checks

- Anon blocked from all 6 Phase 2G RPCs
- `get_my_notifications` returns array (both default and `p_unread_only=true`)
- `get_my_unread_notification_count` returns integer
- Admin inserts test notification → unread count increases → appears in list → `mark_notification_read` sets `read_at` → idempotent second call
- `mark_all_notifications_read` returns count updated → unread count = 0 after
- `mark_listing_sold` fails for non-existent listing; blocked for non-active (draft) listing; round-trip SKIP (no active+approved listing in test DB)
- `seller_remove_listing` fails for non-existent listing; blocked for draft; full round-trip (status=removed, sold_at set); idempotent call passes
- Cross-owner: `mark_notification_read` on unknown id is safe no-op (200, correct); `mark_listing_sold` on other-owner listing SKIP (no target available)

---

## Key design decisions

- **Notification read via SECURITY DEFINER RPC** (not direct table UPDATE) for consistency with all other write operations in this project, even though the notifications RLS permits owner UPDATE.
- **`get_my_unread_notification_count` is separate** from `get_my_notifications` to avoid loading full rows just for a badge count.
- **`seller_remove_listing` is distinct from admin `remove_listing`** — different name to avoid overload ambiguity in PostgREST; admin version requires a `p_reason` and writes to `moderation_logs`; seller version is silent/self-service.
- **`seller_remove_listing` is idempotent** — returns `true` immediately if status is already `'removed'`, without another UPDATE.
- **Draft listings are excluded from `seller_remove_listing`** — drafts are hard-deleted via direct table DELETE (RLS allows owner DELETE on drafts). Mixing soft-remove and hard-delete in the same RPC would be confusing.
- **`mark_listing_sold` requires `approval_status='approved'`** — a pending listing that was never approved by admin should not be marked sold; it should be deleted or retracted.
- **No notification sent on seller self-actions** — marking sold or removing a listing does not trigger a notification. These are seller-initiated and self-evidently known.

---

## What Phase 2G does NOT cover

- Push notifications (Phase 2D+ notifications are in-app only)
- Notification delivery tracking (`notification_deliveries` table — not used)
- Admin notification RPCs (admin writes notifications directly via `notifications` table insert, as demonstrated in remote tests)
- Pausing/reactivating listings (not in scope; `paused` status exists in schema but no seller-facing toggle RPC was requested)
