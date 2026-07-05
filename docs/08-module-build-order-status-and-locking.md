# 08 — Module Build Order, Completion Status, Locking, and QA Rules

## 1. Purpose

This file is the main implementation control document for coding agents.

The goal is to make sure the project is built in a safe order, each module has a clear scope, completed work can be marked and protected, and later modules do not accidentally break earlier working modules.

Coding agents must read this file before starting any implementation work.

## 2. Main build rule

Build the project module by module.

Do not build random screens or backend tables out of order unless the user explicitly asks.

Do not change a completed/locked module while working on another module.

If a later module needs a change in a locked module, stop and ask for approval before changing it.

## 3. Module status meanings

Use these statuses exactly:

```text
Not Started
In Progress
Needs Review
Completed
Locked
Blocked
Deferred
```

Meaning:

- `Not Started` means no implementation has started.
- `In Progress` means implementation is currently being done.
- `Needs Review` means implementation is done but not confirmed.
- `Completed` means the module is working and accepted.
- `Locked` means the module is accepted and should not be changed without explicit approval.
- `Blocked` means the module cannot continue until a dependency/question is resolved.
- `Deferred` means the module is intentionally left for a later phase.

## 4. Module lock rule

When a module is marked `Locked`:

- Do not refactor it.
- Do not rename its files.
- Do not change its UI layout.
- Do not change its business logic.
- Do not change its database schema.
- Do not change its API response shape.
- Do not improve it automatically.
- Do not replace it with another pattern.

A locked module can only be changed if the user explicitly says to unlock or modify it.

## 5. Required module tracking format

Every module should be tracked using this format:

```text
Module name:
Status:
Locked:
Owner area: mobile / admin / backend / shared
Depends on:
Files/screens/tables involved:
Acceptance checklist:
Known edge cases:
Last verified date:
Notes:
```

This format helps a new AI understand what is done, what is pending, and what must not be touched.

## 6. Correct build order

Build in this order unless the user changes the plan:

1. Project repository structure
2. Documentation and AGENTS rules
3. Theme tokens and design system
4. Shared UI components
5. Supabase project setup
6. Database schema foundation
7. RLS foundation
8. Authentication and profile foundation
9. City/area/market seed data and selectors
10. App onboarding and location preference flow
11. Buyer home screen
12. Listing feed screen
13. Search and filters
14. Listing detail screen
15. Saved listings
16. Report listing
17. Seller type selection
18. Individual seller setup
19. Shop profile creation
20. Shop approval pending flow
21. Seller dashboard foundation
22. Fast add listing flow, drafts, image upload, and duplicate listing
23. Edit listing flow
24. Listing approval/rejection from admin
25. Package management database and admin rules
26. Package selection screen
27. Manual payment proof upload
28. Payment approval/rejection from admin
29. Featured listing limit calculation
30. Featured credit admin adjustments
31. Package expiry and paused listings logic
32. Notifications database and mobile inbox
33. System notification triggers
34. Push notification setup
35. Admin Quick Send notifications
36. Announcement/banner templates
37. Admin dashboard screens
38. Admin user/shop/listing management
39. Admin payments/packages/campaigns management
40. QA, RLS hardening, and regression testing

## 7. Module dependency rules

Do not build a module before its dependencies exist.

Examples:

- Listing feed depends on listings table, city/area/market data, and listing images.
- Fast add listing depends on categories, category fields, seller/shop capability, image upload/storage, draft save, duplicate listing rules, and listing limits.
- Package purchase depends on packages, subscriptions, payments, and manual proof upload.
- Featured listings depend on packages, subscriptions, featured credit calculation, and listing status.
- Notifications depend on profiles, user devices, notification tables, and push setup.
- Announcement banners depend on campaign tables and predefined mobile templates.

## 8. Definition of Done for every module

A module is not completed until all relevant items below are true:

- UI matches the approved design direction.
- UI uses theme tokens, not hardcoded random colors.
- Empty state is handled.
- Loading state is handled.
- Error state is handled.
- Permission/RLS behavior is handled.
- Offline or slow network behavior does not crash the app.
- Database writes validate limits and statuses.
- Admin actions create correct system notifications where required.
- User-facing text is clear and consistent.
- No GPS/map/near-me behavior is introduced.
- Existing locked modules still work.
- Module status table is updated.

## 9. Cross-verification checklist

After completing any module, verify:

1. It works for guest user if guest access is allowed.
2. It works for logged-in buyer.
3. It works for individual seller if seller access is relevant.
4. It works for approved shop owner if shop access is relevant.
5. It works for pending/rejected/blocked shop states if shop access is relevant.
6. It respects city/area/market filters.
7. It respects package, active listing, draft, image upload, duplicate listing, and featured listing limits if relevant.
8. It respects RLS and does not expose private data.
9. It creates notifications if a status/action requires notification.
10. It does not break completed modules.

## 10. Required edge-case style

Every important rule must document edge cases in plain language.

Do not write only a short rule like:

```text
Admin can change featured limits.
```

Write the full behavior:

```text
Admin can change featured limits. If the user already has more active featured listings than the new limit, existing featured listings remain active until expiry. The user cannot feature new listings until usage drops below the new limit. Admin can manually unfeature listings if immediate enforcement is required.
```

## 11. No partial feature rule

Do not leave a feature half-defined.

Each feature section should include:

- who can use it
- where it appears
- what data it needs
- admin responsibility
- mobile app responsibility
- backend responsibility
- statuses
- edge cases
- notifications if needed
- completion checklist

## 12. Admin vs mobile vs backend responsibility rule

Every complex feature should clearly separate responsibilities.

Example:

Mobile app:

- Shows user-facing screen.
- Shows loading/error/empty states.
- Calls backend/API functions.
- Does not decide protected business rules locally.

Admin panel:

- Provides approval/rejection controls.
- Provides management screens.
- Shows history and audit information.
- Does not directly bypass backend validation.

Backend/Supabase:

- Stores source of truth.
- Enforces RLS.
- Validates limits.
- Creates notifications.
- Keeps audit/status history where needed.

## 13. Change safety rule

When modifying an existing module:

1. Check whether the module is locked.
2. Check what other modules depend on it.
3. Update only the needed part.
4. Do not rename public APIs unless required.
5. Do not remove fields without migration plan.
6. Retest dependent flows.
7. Update documentation and module status.

## 14. Regression protection rule

Before marking a module completed, run through its regression checklist.

Minimum regression checklist:

- App opens without crash.
- Navigation still works.
- Auth state still works.
- Buyer Home still opens.
- City/area/market selection still works.
- Listing feed still loads.
- No locked screen changed unexpectedly.
- No new GPS/map/near-me behavior appears.

## 15. Module status table (updated 2026-07-05)

| Order | Module | Area | Status | Locked | Backend | Mobile UI | Notes |
|---:|---|---|---|---|---|---|---|
| 1 | Project repository structure | shared | Done | Yes | — | — | Git, RN CLI, TypeScript |
| 2 | Documentation / AGENTS rules | shared | Done | No | — | — | Keep updated when product rules change |
| 3 | Theme tokens & design system | mobile | Done | No | — | src/theme/ | colors, sizes, typography, ThemeContext |
| 4 | Shared UI components | mobile | Done | No | — | src/components/ui/ | 21 reusable components |
| 5 | Supabase project setup | backend | Done | No | lib/supabase.ts | — | Typed anon client |
| 6 | Database schema foundation | backend | Done | Yes | migrations 001–015 | — | 25 tables, 52 FKs, 119 indexes |
| 7 | RLS foundation | backend | Done | Yes | migration 013 | — | RLS on all tables |
| 8 | Auth/profile foundation | mobile/backend | Done | No | src/api/profile.ts | SignIn/SignUp/OTP screens | One account, buyer by default |
| 9 | City/area/market seed & selectors | mobile/backend | Done | No | seed data (014) | CitySelectionScreen | Manual only, no GPS |
| 10 | App onboarding & location flow | mobile | Done | No | — | Splash/Onboarding/Slides | City selection after onboarding |
| 11 | Buyer home screen | mobile | Done | No | — | HomeScreen | Featured, latest, shops sections |
| 12 | Listing feed / browsing | mobile/backend | Done | No | search_listings RPC | HomeScreen + SearchScreen | Buyer browsing entry point |
| 13 | Search & filters | mobile/backend | Done | No | search_listings RPC | SearchScreen, FilterBottomSheet | City/area/price/dynamic filters |
| 14 | Listing detail screen | mobile/backend | Done | No | get_listing_detail RPC | ListingDetailScreen | Call/WhatsApp/save/report actions |
| 15 | Saved listings | mobile/backend | Done | No | 4 saved-listing RPCs | SavedScreen | save/unsave/isSaved/getMySavedListings |
| 16 | Report listing | mobile/backend | Done | No | report_listing RPC | ListingDetailScreen | Report button + reason selection |
| 17 | Seller type selection | mobile | Done | No | — | SellerTypeSelectionScreen | Individual vs shop choice |
| 18 | Individual seller setup | mobile/backend | Done | No | upsertIndividualSellerProfile | SellGatewayScreen | One-click activation |
| 19 | Shop profile creation | mobile/backend | Done | No | createShopProfile | ShopCreationFormScreen | Full shop form |
| 20 | Shop approval pending flow | mobile/backend | Done | No | — | SellGatewayScreen (pending state) | Shows pending message |
| 21 | Seller dashboard foundation | mobile/backend | Done | No | getMyPackageUsage | SellerDashboardScreen | Usage, listings, quick actions |
| 22 | Fast add listing/drafts/images/duplicate | mobile/backend | Done | No | 9 listing RPCs | CreateListingScreen | Photos-first, draft autosave, image upload |
| 23 | Edit listing flow | mobile/backend | Done | No | update_and_resubmit_listing (048) | EditListingScreen | Resets to pending for re-review |
| 24 | Listing approval/rejection (admin) | backend | Done | No | 7 admin RPCs (024) | — | Admin web UI not built |
| 25 | Package management DB & admin rules | backend | Done | No | packages table, 8 admin RPCs | — | Admin web UI not built |
| 26 | Package selection screen | mobile | Done | No | — | PackageSelectionScreen | Lists available packages |
| 27 | Manual payment proof upload | mobile/backend | Done | No | create_manual_payment_request | UploadPaymentProofScreen | JazzCash/EasyPaisa flow |
| 28 | Payment approval/rejection (admin) | backend | Done | No | 8 admin payment RPCs (027) | — | Admin web UI not built |
| 29 | Featured listing limit calc | backend | Done | No | compute_featured_credit_info | — | Used by feature_listing RPC |
| 30 | Featured credit admin adjustments | backend | Done | No | adjust_featured_credits | — | Admin web UI not built |
| 31 | Package expiry & paused listings | shared | Not Started | No | — | — | Read-time check only; no cron/seller toggle |
| 32 | Notifications DB & mobile inbox | mobile/backend | Done | No | 4 notification RPCs (038) | NotificationsScreen | Paginated, unread filter, mark read |
| 33 | System notification triggers | backend | Done | No | Inline in admin/payment RPCs | — | Notifications created on approve/reject/submit |
| 34 | Push notification setup | shared | Not Started | No | — | — | user_devices table exists; no FCM code |
| 35 | Admin Quick Send | admin | Not Started | No | — | — | notification_campaigns table exists |
| 36 | Announcement/banner templates | mobile/backend | Done | No | getActiveBanners | HomeScreen (4 templates) | Seller dashboard banner not rendered yet |
| 37 | Admin dashboard screens | admin | Not Started | No | — | — | Desktop web dashboard not built |
| 38 | Admin user/shop/listing mgmt | admin | Not Started | No | — | — | RPCs exist; no admin UI |
| 39 | Admin payments/packages/campaigns | admin | Not Started | No | — | — | RPCs exist; no admin UI |
| 40 | QA/RLS hardening | shared | Partial | No | Per-phase verification SQL | — | No comprehensive regression suite |


## 16. Fast add listing module checklist

The Fast Add Listing module is not complete until all of these are working:

- Seller can create a draft listing.
- Seller can upload multiple images.
- Seller can select cover image and reorder images.
- Seller can retry failed image uploads.
- Seller can use searchable brand/model fields.
- Seller can use chips/dropdowns for common mobile specs.
- Seller location/contact defaults are prefilled.
- Draft autosave works and can be continued later.
- Submit for approval validates required fields and images.
- Submit for approval respects package/listing/shop approval limits.
- Duplicate listing creates a new draft and does not copy public/approval/featured/sold/report/analytics state.
- Failed submit keeps draft data.
- Slow network and upload failures do not crash the app.
- Admin approval flow receives submitted listings correctly.

## 17. Completion log format

When a module is completed, add a log entry like this:

```text
Completed module: Listing Detail
Date:
Changed files:
Verified flows:
Known remaining issues:
Locked: yes/no
```

## 18. Future deferred modules

These are intentionally not required in MVP:

- GPS/maps/nearby
- delivery/riders
- escrow/wallet
- in-app chat
- automated online payment gateway
- complex AI features
- saved search alerts
- anonymous guest push notifications

Do not implement deferred modules unless the user explicitly asks.
