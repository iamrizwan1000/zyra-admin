# 04 — API, Business Logic, and Calculations

## 1. Where business logic should live

Do not put important business rules only in the frontend.

Use:

- Supabase RPC functions (preferred — all current business logic uses SECURITY DEFINER RPCs)
- database constraints
- RLS policies
- Edge Functions (available but not currently used — all logic lives in RPCs)

Frontend should call safe APIs/actions.

## 2. Auth/login flow

After login:

1. Read profile
2. If profile missing, create profile
3. If default city/area missing, show city/area selection
4. For MVP, route to Buyer Home
5. Seller Dashboard is accessed from Sell tab/Profile

The app stores and resumes `last_active_mode` ('buyer'|'seller') on tab focus (setLastActiveMode in src/api/profile.ts). On login the app resumes to the stored tab if the user still has a seller/shop record. This was implemented 2026-07-03 (see master plan section 9).

## 3. Sell flow API logic

When user taps Sell:

```text
Check individual_seller_profiles
Check shops owned by user
```

If none exists:

```text
Show seller type selection:
- Sell as individual
- I own a mobile shop
```

If individual seller exists:

```text
Go Seller Dashboard
```

If shop exists:

```text
Go Seller Dashboard
Show shop approval/package status if needed
```

## 4. Create shop flow

Create shop profile through controlled action.

Rules:

- owner_id = authenticated user id
- approval_status = pending
- status = active or pending
- public visibility disabled until approved
- business proof optional for MVP

After creation:

```text
Shop Approval Pending Screen
```


## 5. Fast add listing API logic

The add listing API flow should support fast seller input and safe drafts.

Recommended actions/functions:

- create listing draft
- update listing draft
- upload/list/reorder/remove listing images
- duplicate listing as draft
- submit listing for approval
- validate listing limits before submit

Draft save behavior:

- Draft save can accept partial data.
- Submit for approval must validate required fields, required images, listing limits, seller/shop status, and package rules.
- Backend should return field-level validation errors where possible.
- Backend should never lose existing draft data because one field fails validation.

Image upload behavior:

- Mobile app may upload images while the seller fills details.
- Backend/storage rules should support retrying failed image uploads.
- Cover image and image order must be stored.
- If image upload fails, listing remains draft and seller can retry.

Duplicate listing behavior:

- Duplicating a listing creates a new draft.
- Copy reusable product/detail fields only.
- Do not copy status, approval status, featured status, sold status, reports, analytics, payment records, or notification history.
- The duplicated draft must be submitted for approval like a normal listing.

Limit behavior:

- Active listing/package limits are enforced at submit/publication time.
- If limit is exceeded, keep the listing as draft/pending-safe state and return a clear message.

## 6. Package purchase flow

Flow:

```text
select package
→ create pending payment record
→ show payment instructions
→ upload proof
→ payment pending approval
→ admin approves
→ activate subscription/package
```

Package activation should happen server-side after admin approval.

## 7. Package expiry logic

Scheduled function/RPC should:

- check expired subscriptions
- mark subscription expired
- pause listings beyond allowed limit if needed
- keep listings saved, not deleted
- notify/show seller package expired state

## 8. Listing limit validation

When seller adds listing:

- check seller type
- check shop/subscription if shop listing
- check active listing limit
- allow draft/pending where appropriate
- block active publication if limit exceeded

Do not trust frontend for limits.

## 9. Featured listing validation

Before making a listing featured, backend must calculate the effective featured listing limit.

Effective limit order:

1. Check active package featured limit.
2. Check active admin featured credit adjustments.
3. If an active unlimited override exists, allow featuring without numeric limit.
4. Otherwise calculate package limit plus active extra credits or active override limit.
5. Count current active featured listings.
6. Allow feature action only if current usage is below effective limit.

Backend must not trust frontend for featured limits.

When admin reduces or revokes featured credits:

- do not delete listings
- do not crash mobile app
- do not automatically remove featured status unless admin explicitly chooses that action
- prevent the user/shop from featuring more listings while usage is over the new limit
- show the over-limit state in seller dashboard/admin panel

Example rule:

```text
If current usage is 15 and new limit is 10, existing 15 remain featured until their expiry, but no new listing can be featured until usage is below 10.
```

When a listing is featured:

- set `is_featured = true`
- set `featured_until` based on package/admin rules
- include the listing in ranking fairly

## 10. Search/ranking logic

Search should consider:

- selected city/area/market
- keyword relevance
- dynamic filters
- price range
- seller type
- verified shop filter
- featured status
- listing freshness
- report penalty

Do not add distance sorting unless GPS is explicitly added in future.

## 11. Buyer location search

API should support manual city/area/market filter.

Priority:

1. Explicit selected search city/area/market
2. User default city/area/market
3. Global/all fallback if allowed

Default city should never lock buyer to one location.

## 12. Admin actions

Admin actions should be protected by role checks.

Admin can:

- approve/reject listings
- approve/reject shops
- approve/reject payments
- activate packages
- manage packages
- manage offers
- manage categories/fields
- moderate reports
- send notification campaigns

## 13. App content/settings API

Frontend can fetch app settings:

- app display name
- welcome text
- onboarding text
- support contact
- payment instructions
- banners/announcements
- package display copy

Static button labels and navigation labels should remain in app i18n/config unless admin control is explicitly required.


## 14. Notification creation logic

Important system events must create an in-app notification first, then attempt push notification.

General function pattern:

```text
create_notification(user_id, title, message, type, related_entity_type, related_entity_id, action_label, action_deep_link)
→ insert notifications row
→ fetch active user_devices
→ send push notification to eligible devices
→ write notification_deliveries rows
```

Push delivery failure should not roll back the original business action.

Example: listing approval should still complete even if the push notification fails.

## 15. System notification triggers

Create notifications when:

- listing is submitted
- listing is approved
- listing is rejected
- shop is submitted
- shop is approved
- shop is rejected
- payment proof is uploaded
- payment is moved under review
- payment is approved
- payment is rejected
- package is activated
- package is expiring soon
- package has expired

Rejected listings, shops, and payments should include the admin rejection reason in notification metadata/message.

## 16. Admin campaign send logic

Admin campaign flow:

```text
Admin creates campaign
→ backend resolves target users
→ creates notification rows for target users
→ sends push notification to eligible user devices
→ stores delivery stats
```

Target filters may include:

- all logged-in users
- selected user
- city/area/market
- buyer/seller/shop owner
- active package
- expired package

## 17. Mobile notification APIs

Mobile app needs APIs/actions for:

- register/update FCM token
- deactivate device token on logout if needed
- list notifications
- get unread notification count
- mark one notification as read
- mark all notifications as read
- open notification deep link

Notifications should be paginated.

## 18. Push permissions

The app should ask for notification permission at a suitable time, not too early.

Recommended moments:

- after login/signup
- after seller/shop onboarding
- after user submits first listing

If permission is denied, the app should still show in-app notifications.
