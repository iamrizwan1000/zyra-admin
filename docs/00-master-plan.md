# 00 — Master Plan

## 1. Product summary

Mobile Market is a global city-based mobile phone marketplace.

The first version focuses on mobiles only, but the architecture should support future categories through dynamic category fields.

The MVP should support:

- Buyer browsing
- Mobile listings
- Individual sellers
- Shop owners/shopkeepers
- Shop profiles
- Seller packages
- Featured listings
- Manual payment proof upload
- Admin approval/moderation
- Desktop web admin dashboard
- Notifications and admin announcements
- Predefined in-app announcement banners

## 2. Global positioning

The app should not be tied to one country.

Use global wording:

- city
- area
- market
- verified shop
- seller
- listing
- package
- promotion

Avoid:

- country-specific flags
- local-only cultural references
- one-country-only language
- hardcoded local currency in business logic

## 3. Location model

This app is city/area/market based.

It is **not GPS-based**.

Do not build:

- maps
- GPS permissions
- near me buttons
- nearby sorting
- distance labels
- live location
- automatic geolocation

Users manually select city, area, or market.

## 4. Buyer city/area search rule

A buyer’s default city is only a preference, not a restriction.

Example:

```text
Default city: Lahore
Buyer can still search: Islamabad, Karachi, Rawalpindi, Dubai, or any other available city.
```

Rules:

1. User can choose default city/area/market during onboarding.
2. Home screen initially uses the default location.
3. User can change city/area/market anytime from Home, Search, Filters, or City Selection.
4. Search city/area affects current browsing results.
5. Default city should not lock the buyer.
6. Do not automatically change default city every time buyer searches another city.
7. Add “Save as my default location” only if needed.

## 5. User/account model

Every user is a buyer by default.

A user can later become:

- individual seller
- shop owner/shopkeeper
- both buyer and seller/shop owner

One login account can have multiple capabilities.

Correct model:

```text
One user account
→ buyer access by default
→ optional individual seller profile
→ optional shop profile
```

Do not create separate login accounts for buyer and seller.

## 6. Signup/login flow

Recommended MVP flow:

```text
Signup/Login
→ City/Area selection if missing
→ Buyer Home
```

Do not ask “Buyer or Seller?” as a permanent account choice during signup.

Seller/shop onboarding should happen when user taps Sell.

## 7. Sell flow

When user taps Sell:

```text
If user has seller/shop setup:
  → Seller Dashboard

If user has no seller/shop setup:
  → Choose seller type
     - Sell as individual
     - I own a mobile shop
```

## 8. Shop owner onboarding flow

If user selects “I own a mobile shop”:

```text
Create Shop Profile
→ Shop Approval Pending
→ Seller Dashboard
```

Shop profile fields:

- shop name
- logo
- cover image
- city
- area/market
- description
- contact number
- WhatsApp number
- opening hours
- optional business proof

Admin approval controls public visibility.

## 9. Login return behavior

For MVP:

```text
After login → Buyer Home
```

Even if user is a shop owner, Buyer Home is safe and universal.

Show Seller Dashboard access from:

- Sell tab
- Profile
- Home shortcut if needed

Implemented (2026-07-03): the app stores and resumes from `last_active_mode = buyer | seller`, falling back to Buyer Home if the stored mode is 'seller' but no seller record (individual profile or shop) actually exists.

## 10. App architecture

Mobile app:

- React Native CLI
- TypeScript
- NativeWind
- React Navigation
- Supabase JS
- TanStack Query
- React Hook Form + Zod
- Zustand where needed

Backend:

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- RLS policies
- RPC functions
- Edge Functions where needed

Admin:

- Desktop web dashboard
- Can be built later in Next.js, React, Vue, or Laravel
- Must not be designed as mobile app screens

## 11. MVP scope

Included:

- Auth
- Buyer browsing
- City/area/market selection
- Search and filters
- Mobile listings
- Listing detail
- Saved listings
- Report listing
- Individual seller setup
- Shop owner onboarding
- Shop approval pending
- Seller dashboard
- Add/edit listings
- Packages
- Payment proof upload
- Admin web dashboard references

Not included:

- GPS
- maps
- delivery
- riders
- escrow
- wallet
- in-app chat
- complex AI features
