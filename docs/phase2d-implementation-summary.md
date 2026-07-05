# Phase 2D Implementation Summary — Packages, Payments & Featured Credits

**Branch:** `phase2d-packages-payments`
**Migrations:** 026–029 (locked)
**Remote verification:** 47 passed / 0 failed
**Status:** Completed and locked

---

## What was built

### Seller RPCs — `026_seller_package_rpcs.sql`

| RPC | Auth | Notes |
|---|---|---|
| `get_available_packages()` | None (public) | Returns only active packages |
| `get_my_active_subscription()` | Required | Returns subscription jsonb or null |
| `get_my_package_usage()` | Required | Listing and featured credit counts vs limits |
| `get_my_featured_credit_balance()` | Required | Effective limit, used, available, is_unlimited |
| `create_manual_payment_request(...)` | Required | Guards duplicate pending payment per user+package |
| `get_my_payments(limit, offset)` | Required | Only caller's own rows (RLS via ownership filter) |
| `feature_listing(listing_id, duration_days?)` | Required | Validates ownership, active+approved status, credit limit |
| `unfeature_listing(listing_id)` | Required | Sets is_featured=false, featured_until=NULL |

Internal helper: `compute_featured_credit_info(user_id, shop_id)` — private, used by usage and feature/unfeature checks.

### Admin RPCs — `027_admin_payment_rpcs.sql`

| RPC | Notes |
|---|---|
| `get_pending_payments(limit, offset)` | Joined with seller email from auth.users and shop name |
| `get_admin_payment_detail(payment_id)` | Full jsonb with seller, package, shop |
| `approve_payment(payment_id, note?)` | Cancels old subscription → creates new with limits_snapshot → logs → notifies |
| `reject_payment(payment_id, reason)` | Validates not already approved/rejected → logs → notifies |
| `activate_subscription(user_id, package_id, shop_id?, note?)` | Manual activation, no payment row required |
| `cancel_subscription(subscription_id, reason)` | Does not touch listing rows |
| `adjust_featured_credits(...)` | adjustment_type in ('extra_credits','limit_override','unlimited') |
| `get_user_package_usage(user_id)` | Admin view of any user's usage |

Internal helper: `cancel_active_subscriptions_for_user(user_id)` — cancels all active subscriptions before creating a new one.

### TypeScript API wrappers

| File | Exports |
|---|---|
| `src/api/packages.ts` | `getAvailablePackages`, `getMyActiveSubscription`, `getMyPackageUsage`, `getMyFeaturedCreditBalance`, `featureListing`, `unfeatureListing` |
| `src/api/payments.ts` | `createManualPaymentRequest`, `getMyPayments` |
| `src/api/payment-admin.ts` | `getPendingPayments`, `getAdminPaymentDetail`, `approvePayment`, `rejectPayment`, `activateSubscription`, `cancelSubscription`, `adjustFeaturedCredits`, `getUserPackageUsage` |

`src/types/supabase.ts` was updated with all 16 new RPC signatures.

---

## Verification

### Local (028_phase2d_verification.sql)
84 DO $ ASSERT checks across 11 groups:
- Function existence (18 checks)
- Locked functions still intact (9 checks)
- Table columns present (16 checks)
- RLS enabled on target tables (7 checks)
- SECURITY DEFINER on all public RPCs (16 checks)
- `compute_featured_credit_info` logic: unlimited / limit_override / base+extra priority (6 checks)
- `approve_payment` pre-conditions (2 checks)
- `reject_payment` guards (2 checks)
- `cancel_subscription` does not affect listings (3 checks)
- Duplicate payment prevention (1 check)
- Feature/unfeature transitions (4 checks)

All test data uses `RAISE EXCEPTION 'rollback_test_data'` caught by `WHEN OTHERS` for clean rollback.

### Remote user-level (phase2d_remote_tests.mjs)
47 checks across 13 test groups run against the live Supabase project using real JWT tokens:
- Anon public access
- Anon blocked from seller RPCs
- Anon blocked from admin RPCs
- Seller with no subscription — correct state returned
- Seller blocked from all admin RPCs (8 functions)
- Admin can access package and payment lists
- Full flow: payment submission → admin approval → active subscription
- Duplicate payment prevention
- Full flow: payment submission → admin rejection
- Admin manual activate/cancel subscription
- `adjust_featured_credits` — extra_credits, unlimited, invalid type rejection
- Featured credit balance reflects adjustments
- RLS isolation between sellers and admins

---

## Bug found during remote verification

**`get_pending_payments` type mismatch (fixed in migration 029)**

PostgREST raised error `42804: Returned type character varying(255) does not match expected type text in column 7` because `auth.users.email` is stored as `varchar(255)` but the function's RETURNS TABLE declared `seller_email text`.

Fix: added explicit `u.email::text` cast in the SELECT. Also added `::text` casts to `currency_code`, `method`, and `status` columns (which come from varchar/enum types) as a precaution.

---

## Key design decisions

**Payment flow:**
- Seller submits proof → `payments` row inserted with `status = 'pending'`
- Admin approves → `payments.status = 'approved'`, new `subscriptions` row created, old active subscription cancelled, moderation_log written, in-app notification sent to seller
- Admin rejects → `payments.status = 'rejected'`, `rejection_reason` set, no subscription created, log + notification

**Subscription expiry:**
- Evaluated at read time: `status = 'active' AND expires_at > now()`
- No background job or cron needed for Phase 2D

**Featured credit priority (in `compute_featured_credit_info`):**
1. Any non-revoked, in-range `is_unlimited = true` adjustment → unlimited
2. Any non-revoked, in-range `limit_override` adjustment → `MAX(limit_override)`
3. Fallback → `base_limit` (from `limits_snapshot`) + `SUM(extra_credits)` from active adjustments

**`limits_snapshot`:**
- jsonb frozen from the live package row at activation time
- Contains `active_listing_limit` and `featured_listing_limit`
- Not updated if the package changes later — subscription keeps its frozen limits until renewal

**Notifications:**
- Written directly inside each SECURITY DEFINER RPC
- `channel = 'in_app'` only — no push in Phase 2D
- Use `related_entity_type = 'payment'` or `'subscription'`

---

## What Phase 2D does NOT cover

- Listing limit enforcement inside `submit_listing_for_approval` (migration 021 untouched — deferred)
- Push notifications
- Payment gateway / online payment
- Subscription auto-renewal
- Campaign / bump features

These are candidates for Phase 2E or later phases.
