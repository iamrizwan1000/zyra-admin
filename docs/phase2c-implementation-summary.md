# Phase 2C Implementation Summary

## Scope
Admin approval/rejection APIs for listings and shops, moderation logs, and owner notifications.

## Status
- **Implementation:** complete
- **Remote verification:** passed
- **Locked:** yes

## Files added

| File | Purpose |
|------|---------|
| `src/api/admin.ts` | 14 admin review API functions |
| `supabase/migrations/024_admin_review_rpc.sql` | 14 admin review RPCs with inline moderation logs and notifications |
| `supabase/migrations/025_phase2c_verification.sql` | Verification assertions for Phase 2C RPCs |
| `docs/phase2c-implementation-summary.md` | This file |

## Files changed

| File | Change |
|------|--------|
| `src/types/supabase.ts` | Added TypeScript signatures for 14 new admin RPCs |

## API functions (14)

### Listing review
1. `getPendingListings(filters?)`
2. `getAdminListingDetail(listingId)`
3. `approveListing(listingId, reason?)`
4. `rejectListing(listingId, reason)`
5. `requestListingChanges(listingId, reason)`
6. `removeListing(listingId, reason)`
7. `markListingSuspicious(listingId, reason)`

### Shop review
8. `getPendingShops(filters?)`
9. `getAdminShopDetail(shopId)`
10. `approveShop(shopId, reason?)`
11. `rejectShop(shopId, reason)`
12. `requestShopChanges(shopId, reason)`
13. `suspendShop(shopId, reason)`
14. `reactivateShop(shopId, reason?)`

## Status transition rules

### Listings
| Action | status | approval_status |
|---|---|---|
| approve | `active` | `approved` |
| reject | `paused` | `rejected` |
| request changes | `draft` | `draft` |
| remove | `removed` | unchanged |
| mark suspicious | `paused` | unchanged |

### Shops
| Action | status | approval_status |
|---|---|---|
| approve | `active` | `approved` |
| reject | `inactive` | `rejected` |
| request changes | `inactive` | `rejected` |
| suspend | `inactive` | unchanged |
| reactivate | `active` | unchanged, guard: `approval_status = 'approved'` |

## Security
- All RPCs use `SECURITY DEFINER` with `search_path = public`.
- Every RPC checks `public.is_admin(auth.uid())` first.
- Anon and authenticated non-admin users are rejected.
- No `service_role` key is used.

## Moderation logs
Every admin action inserts into `public.moderation_logs` with:
- `admin_id`
- `action`
- `entity_type` (`listing` or `shop`)
- `entity_id`
- `reason`
- `metadata` jsonb containing old/new `status` and `approval_status`
- `created_at` timestamp

## Notifications
Approval, rejection, and change-request actions create in-app `notifications` rows for the owner.
No push notifications are implemented in this phase.

## Locked file protection
- Phase 1 migrations `001–015` were not modified.
- Phase 2A migrations `016–019` were not modified.
- Phase 2B migrations `020–023` were not modified.

## Verification
- Remote Supabase development project verification completed: **73 tests passed, 0 failed**.
- All 14 admin RPCs exist.
- Anon and authenticated non-admin users are blocked from all admin RPCs.
- Admin user can approve, reject, request changes, remove, and mark suspicious listings.
- Admin user can approve, reject, request changes, suspend, and reactivate shops.
- `reactivate_shop` correctly fails for rejected/pending/blocked shops.
- Every admin action creates a `moderation_logs` row.
- Approval, rejection, and change-request actions create `notifications` rows for owners.
- Approved active listings and shops appear in Phase 2A public APIs.
- Draft, pending, rejected, paused, and removed listings do not appear publicly.
- Pending, rejected, suspended, inactive, and blocked shops do not appear publicly.
- No `service_role` key used.
- No destructive commands run.
- Phase 1 files `001–015`, Phase 2A files `016–019`, and Phase 2B files `020–023` were not modified.
