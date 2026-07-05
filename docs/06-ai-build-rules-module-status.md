# 06 — AI Build Rules and Module Status

## 1. Purpose

This file prevents AI tools from breaking completed work.

AI/coding agents must check this file before modifying code.

## 2. Current product decisions

- Product is global city-based mobile marketplace.
- App is not GPS-based.
- Every user is buyer by default.
- User can later become individual seller or shop owner.
- Do not force buyer/seller permanent choice at signup.
- MVP login opens Buyer Home.
- Seller Dashboard is accessed through Sell/Profile.
- Shop owner must create shop profile before full shop features.
- Shop approval controls public shop visibility.
- Buyer can search any city/area/market.
- Admin panel is desktop web dashboard.
- Mobile app uses React Native CLI, not Expo.
- Notifications must be saved in-app first, with push notification as an additional delivery channel.

## 3. Module status table (updated 2026-07-05)

| Module | Status | Locked | Notes |
|---|---|---|---|
| Product plan docs | Updated | No | Includes buyer/seller/shop/admin flows |
| Buyer screens & flows | Done | No | 41 screen components across 11 screen groups |
| Seller/shopkeeper screens & flows | Done | No | Seller dashboard, add/edit listing, shop management, package/payment screens |
| Shop onboarding | Done | No | Seller type selection, shop creation form, approval pending, shop edit |
| Admin web dashboard | Not Started | No | 3 backend module groups (Quick Send, dashboard screens, management screens) not yet built |
| Supabase schema | Done | Yes | 25 tables, 52 FKs, 119 indexes across migrations 001–015 |
| RLS policies | Done | Yes | Migration 013 — RLS on all tables, strict ownership and admin rules |
| React Native CLI setup | Done | Yes | Project scaffolded, TypeScript, React Navigation, Supabase client |
| Theme/components | Done | No | `src/theme/` with colors/sizes/typography, 21 UI components in `src/components/ui/` |
| Search/filter logic | Done | No | `search_listings` RPC, SearchScreen with FilterBottomSheet, city/area/market/price/dynamic filters |
| Package/payment logic | Done | No | 8 seller RPCs + 8 admin RPCs, manual proof upload, admin approval/rejection, featured credits |
| Store buckets | Done | No | 5 storage buckets: shop-media, shop-documents, listing-media, avatars, payment-proofs |
| Notifications (in-app) | Done | No | NotificationsScreen, 4 notification RPCs, system triggers in admin/payment RPCs |
| Push notifications | Not Started | No | `user_devices` table exists. No FCM registration, no push Edge Function built yet |
| Announcement banners (mobile) | Done | No | HomeScreen renders 4 banner templates. `getActiveBanners` API works |
| Package expiry / paused listings | Not Started | No | Read-time expiry check only. No background job, no seller-facing pause toggle |
| Admin Quick Send | Not Started | No | `notification_campaigns` table exists. No admin web UI built |
| Listing lifecycle (sold/remove) | Done | No | `mark_listing_sold`, `seller_remove_listing` RPCs — Phase 2G |
| Edit submitted listing | Done | No | `update_and_resubmit_listing` RPC — migration 048 |
| Listing contact info | Done | No | `get_listing_detail` includes seller_name, seller_phone — migration 043 |

## 4. Locked module rule

If a module becomes completed and locked, update the table.

Example:

```text
| ListingCard component | Completed | Yes | Do not modify without explicit request |
```

When locked:

- Do not refactor
- Do not rename
- Do not change layout
- Do not change behavior
- Do not “improve” automatically

## 5. Build order recommendation

1. Project setup
2. Theme tokens
3. Shared UI components
4. Auth/profile foundation
5. City/area/market selection
6. Buyer home/listings/search
7. Listing detail/report/saved
8. Seller type selection
9. Individual seller/shop onboarding
10. Seller dashboard
11. Fast add/edit listings, drafts, image upload, and duplicate listing
12. Packages/payment proof
13. Notifications and push setup
14. Announcement banner templates
15. Admin web dashboard
16. RLS hardening
17. QA and polishing

## 6. AI implementation rules

Before implementing a screen:

1. Check matching design image.
2. Check theme tokens.
3. Reuse existing components.
4. Do not invent new colors/styles unless needed.
5. Do not add unplanned features.
6. Update module status after completion.

## 7. User mode rules

Do not implement buyer/seller as separate accounts.

Implement:

```text
profiles = person/login
individual_seller_profiles = optional seller capability
shops = optional shop ownership
```

For MVP login routing:

```text
Login → Buyer Home
```

Sell tab behavior:

```text
If seller/shop exists → Seller Dashboard
Else → Seller Type Selection
```

## 8. Location rules

Never implement:

- GPS permission
- map view
- distance sorting
- near me
- nearby
- automatic geolocation

Implement:

- city selector
- area selector
- market selector
- search filter by city/area/market
- default location as fallback only

## 9. Admin rule

Admin is web dashboard.

Do not build admin in React Native mobile app.

Admin can be built as:

- Next.js
- React
- Vue
- Laravel admin

The admin design should be desktop dashboard style.


## 10. Featured credit adjustment module

Status: Required for admin control.

Build this as an admin-side control, not as a hardcoded package change.

Rules:

- Packages provide default featured listing limits.
- Admin can add user/shop-specific featured credits.
- Admin can set credits for a month, custom date range, lifetime, or unlimited.
- Admin can change/revoke credits anytime.
- Existing featured listings should remain safe if limits are reduced.
- If usage is above the new limit, block only new featured actions until usage drops.
- No frontend screen should crash because of limit changes.


## 11. Module completion and locking source of truth

`docs/08-module-build-order-status-and-locking.md` is the detailed source of truth for:

- build order
- module status meanings
- locked module rules
- definition of done
- cross-verification checklist
- regression protection
- completion log format

When implementation starts, maintain the module status table in that file.

## 12. Do not create partial modules

A module should not be marked completed only because the screen looks finished.

A module is complete only when:

- the UI is implemented
- required backend/database work is implemented
- RLS/permission behavior is handled
- loading, empty, and error states are handled
- relevant admin actions are connected
- required notifications are created
- edge cases are handled
- existing locked modules still work

## 13. Sorting order rule

When adding new modules, insert them in the correct build order instead of adding random notes at the bottom.

Use this order:

1. shared foundation
2. database/RLS foundation
3. auth/profile
4. location
5. buyer browsing
6. seller/shop onboarding
7. listings
8. admin approval
9. packages/payments
10. featured controls
11. notifications/campaigns
12. announcement banners
13. admin dashboard
14. QA/locking


## 14. Fast listing rule

The Add Listing module must follow the documented fast listing flow. Do not build one large form and call it complete.

Required behavior:

- photos first
- multiple image upload
- image reorder and cover image
- draft autosave
- searchable brand/model
- chips/dropdowns for common specs
- prefilled location/contact
- duplicate listing as draft
- safe submit-for-approval validation
- failed upload/submit must keep draft data

Bulk upload and AI autofill are deferred unless the user explicitly asks.
