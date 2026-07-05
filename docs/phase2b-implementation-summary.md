# Phase 2B Implementation Summary

## Scope
Auth, Profile, Seller Setup, and Draft Listing APIs.

## Status
- **Completed:** Yes
- **Verified remotely:** Yes
- **Locked:** Yes

## Verification
- `npx tsc --noEmit` passes with no errors.
- Remote Supabase development project verification completed: **50 tests passed, 0 failed**.
- Migrations `001–023` applied via `supabase db push --linked` from the user's machine.
- Verified with `SUPABASE_URL` and `SUPABASE_ANON_KEY` only; no `service_role` key used.
- Confirmed Phase 2A public APIs, guest blocking, authenticated profile/seller/shop/draft/listing flows, image handling, duplicate, submit, and ownership rules.
- Draft and pending listings are not visible in Phase 2A public APIs.
- Shop creation remains pending approval; submitted listings move to pending only.
- No notifications sent in Phase 2B.
- No destructive commands were run.
- Phase 1 files `001–015` and Phase 2A files `016–019` were not modified.

## Files added

| File | Purpose |
|------|---------|
| `src/api/profile.ts` | `getCurrentUserProfile`, `updateProfile`, `saveDefaultLocation` |
| `src/api/seller.ts` | `upsertIndividualSellerProfile`, `createShopProfile`, `updateShopProfile`, `getMyShopProfile` |
| `src/api/listing.ts` | 12 listing/draft/image/duplicate/submit functions |
| `supabase/migrations/020_duplicate_listing_rpc.sql` | `duplicate_listing_as_draft(p_listing_id uuid)` |
| `supabase/migrations/021_submit_listing_rpc.sql` | `submit_listing_for_approval(p_listing_id uuid)` |
| `supabase/migrations/022_reorder_images_rpc.sql` | `reorder_listing_images(p_listing_id uuid, p_image_orders jsonb)` |
| `supabase/migrations/023_phase2b_verification.sql` | Development verification for RPCs and RLS policies |

## Files changed
| File | Change |
|------|--------|
| `src/types/supabase.ts` | Added TypeScript signatures for the three new RPC functions |

## API functions (19)

### Profile (`src/api/profile.ts`)
1. `getCurrentUserProfile()` — direct Supabase client
2. `updateProfile(input)` — direct Supabase client
3. `saveDefaultLocation({cityId, areaId})` — direct Supabase client

### Seller (`src/api/seller.ts`)
4. `upsertIndividualSellerProfile(input)` — direct Supabase client
5. `createShopProfile(input)` — direct Supabase client
6. `updateShopProfile(shopId, input)` — direct Supabase client
7. `getMyShopProfile()` — direct Supabase client

### Listing (`src/api/listing.ts`)
8. `createListingDraft(input)` — direct Supabase client
9. `updateListingDraft(listingId, input)` — direct Supabase client
10. `autosaveListingDraft(listingId, input)` — direct Supabase client
11. `uploadListingImageMetadata(listingId, input)` — direct Supabase client
12. `reorderListingImages(listingId, imageOrders)` — RPC
13. `setCoverImage(listingId, imageId)` — direct Supabase client
14. `deleteListingImage(imageId)` — direct Supabase client
15. `duplicateListingAsDraft(listingId)` — RPC
16. `submitListingForApproval(listingId)` — RPC
17. `getMyListings(filters)` — direct Supabase client
18. `getMyListingDetail(listingId)` — direct Supabase client
19. `deleteDraftListing(listingId)` — direct Supabase client

## Permission / RLS approach
- All APIs rely on existing RLS policies from Phase 1.
- `auth.uid()` ownership checks are performed either by RLS or explicitly in RPC functions.
- RPC functions use `SECURITY DEFINER` with `search_path = public` and verify ownership before mutating data.
- Admin-only fields are excluded from TypeScript inputs and never written by owner endpoints.

## Safety rules implemented
- Default location: only `city_id` and `area_id`; `market_id` is not supported because the `profiles` table does not have a `default_market_id` column.
- Shop creation always inserts `approval_status = 'pending'` and `status = 'active'`.
- `updateShopProfile` strips `approval_status`, `verified_at`, `status`, and any package/subscription/featured/admin fields from the payload.
- Draft create/update/autosave keep `status = 'draft'` and `approval_status = 'draft'`.
- `deleteDraftListing` refuses to delete non-draft listings.
- `duplicate_listing_as_draft` does not copy status, featured state, sold state, images, reports, payments, or counters.
- `submit_listing_for_approval` validates required fields, images, category, city, and seller/shop readiness; on failure returns field-level errors and keeps the listing as draft. On success it sets `status = 'pending'` and `approval_status = 'pending'` only.
- `setCoverImage` unsets the previous cover image first.
- `reorderListingImages` validates all image IDs belong to the listing in a single atomic UPDATE.
- `deleteListingImage` does not force a replacement cover; submit validation will catch a missing cover.

## Verification
- `npx tsc --noEmit` passes with no errors.
- Remote Supabase development project verification completed: **50 tests passed, 0 failed**.
- Migrations `001–023` applied via `supabase db push --linked` from the user's machine.
- Verified with `SUPABASE_URL` and `SUPABASE_ANON_KEY` only; no `service_role` key used.
- Confirmed Phase 2A public APIs, guest blocking, authenticated profile/seller/shop/draft/listing flows, image handling, duplicate, submit, and ownership rules.
- Draft and pending listings are not visible in Phase 2A public APIs.
- Shop creation remains pending approval; submitted listings move to pending only.
- No notifications sent in Phase 2B.

## Locked files not modified
- Phase 1 migrations `001–015` were not changed.
- Phase 2A migrations `016–019` were not changed.
