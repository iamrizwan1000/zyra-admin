# Phase 2H Implementation Summary — Storage Buckets, Contact Info, Payment Method & Edit Listing

**Branch:** (no dedicated branch — built incrementally after Phase 2G)
**Migrations:** 041–048 (locked)
**Remote verification:** Not independently verified (tested as part of app flow)
**Status:** Completed

---

## What was built

### Migration 041 — Shop Media & Document Storage Buckets

Two new Supabase Storage buckets for shop profiles:

| Bucket | Public? | File size limit | Allowed types | Purpose |
|---|---|---|---|---|
| `shop-media` | Yes (public) | 10 MB | png, jpeg, webp | Shop logos and cover images visible to buyers |
| `shop-documents` | No (private) | 10 MB | png, jpeg, webp, pdf | Business proof uploads (owner + admin only) |

Both buckets use `{user_id}/{filename}` path convention so ownership is derivable from the path. RLS policies enforce owner-write and appropriate read access.

### Migration 042 — Listing Media Storage Bucket

| Bucket | Public? | File size limit | Allowed types |
|---|---|---|---|
| `listing-media` | Yes (public) | 10 MB | png, jpeg, webp |

Files stored under `{user_id}/{listing_id}/{filename}`. Publicly readable, owner-only write.

### Migration 043 — Listing Detail Contact Info

Extended `get_listing_detail` RPC (originally from migration 017) to return seller contact info so buyers can reach sellers directly via Call/WhatsApp.

New OUT columns added to the return type:
- `seller_name text` — from `profiles.full_name`
- `seller_phone text` — from `profiles.phone`

The DROP + recreate approach was required because `CREATE OR REPLACE` cannot change the return type of a TABLE-returning function.

### Migration 044 — Avatar Storage Bucket

| Bucket | Public? | File size limit | Allowed types |
|---|---|---|---|
| `avatars` | Yes (public) | 5 MB | png, jpeg, webp |

Files stored under `{user_id}/{filename}`. Publicly readable, owner-only write.

### Migration 045 — Payment Method Validation

Added a CHECK constraint on `payments.method` to restrict values to `'jazzcash'` or `'easypaisa'`. Applied `NOT VALID` because two historical rows predate the constraint (both already approved/rejected).

Updated `create_manual_payment_request` (originally from migration 026) to accept and validate the payment method parameter.

### Migration 046 — Payment Proof Storage Bucket

| Bucket | Public? | File size limit | Allowed types |
|---|---|---|---|
| `payment-proofs` | No (private) | 10 MB | png, jpeg, webp |

Private bucket for JazzCash/EasyPaisa screenshots. Owner + admin read access. Owner write only.

### Migration 047 — last_active_mode CHECK Constraint

Added `CHECK (last_active_mode IN ('buyer', 'seller'))` to `profiles` table. The column itself was created in migration 003 (Phase 1) as a free-text column; this migration validates it retroactively.

### Migration 048 — Edit Active Listing RPC

Created `update_and_resubmit_listing` RPC — the first edit path for already-submitted listings (pending, active, or paused). Previously `updateListingDraft` only allowed editing draft listings.

Behavior:
- Validates ownership and that the listing is not draft, sold, or removed
- Validates required fields (title, description, price, category, city, images, required dynamic fields)
- Resets status to `'pending'` and approval_status to `'pending'` for full admin re-review
- Creates an in-app notification confirming resubmission
- Returns `{success, listing_id}` on success or `{success: false, errors: [...]}` on validation failure

### TypeScript API wrappers

| File | Change |
|---|---|
| `src/api/listing.ts` | Added `updateAndResubmitListing` input type and function calling `update_and_resubmit_listing` RPC |

---

## Key design decisions

- **Storage path convention**: All buckets use `{user_id}/` prefix for ownership derivation. Listing media adds `{listing_id}/` for logical grouping.
- **Payment method constraint**: Applied `NOT VALID` to avoid failing on pre-existing rows with `method='manual'`.
- **`get_listing_detail` changed via DROP + CREATE**: `CREATE OR REPLACE` cannot change the return type of a TABLE-returning function in PostgreSQL, so the old function was dropped first.
- **`update_and_resubmit_listing` validates dynamic fields**: Required category fields are checked server-side; field values must be saved via `listing_field_values` before calling this RPC.
- **No push notifications**: In-app notification only for listing resubmission confirmation.

---

## Locked file protection

- Phase 1 migrations 001–015 were not modified.
- Phase 2A migrations 016–019 were not modified.
- Phase 2B migrations 020–023 were not modified.
- Phase 2C migrations 024–025 were not modified.
- Phase 2D migrations 026–029 were not modified.
- Phase 2E migrations 030–033 were not modified.
- Phase 2F migrations 034–037 were not modified.
- Phase 2G migrations 038–040 were not modified.
