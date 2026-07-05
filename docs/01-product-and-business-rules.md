# 01 — Product and Business Rules

## 1. Core product rule

Mobile Market is a marketplace, not an ecommerce delivery app.

The app connects buyers with sellers/shops.

Buyers contact sellers through Call or WhatsApp.

## 2. User capability rules

Every account is a buyer by default.

A user can:

- browse listings
- save listings
- contact sellers
- report listings
- sell as individual
- own/manage a shop
- switch between buyer area and seller area

Do not force a user to choose only one permanent role at signup.

## 3. Buyer flow

Recommended buyer flow:

```text
Open app
→ Select city/area/market if missing
→ Buyer Home
→ Browse/search/filter listings
→ Login/signup only when user performs protected actions such as save, report, sell, profile, or seller dashboard
→ Browse/search/filter listings
→ View listing detail
→ Call/WhatsApp seller
```

## 4. Buyer can search other cities

Default city/area/market is only the starting point.

Buyer can search any city, area, or market available in the system.

Search/filter options should include:

- city
- area/market
- brand
- model
- price range
- condition
- storage
- approval/network status
- seller type
- verified shops only
- featured listings
- latest listings

## 5. Individual seller flow

When user taps Sell and chooses “Sell as individual”:

```text
Create individual seller capability
→ Seller Dashboard
→ Add Listing
→ Pending Approval
→ Active after admin approval
```

Individual sellers require an active subscription to submit listings. There is no implicit free tier (Phase 2E decision).


## 6. Fast listing creation rule

Adding a mobile listing must be fast and simple.

Target experience:

```text
A normal seller should be able to submit a phone listing in about 60–90 seconds.
A shopkeeper should be able to create repeated/similar listings faster by duplicating an existing listing.
```

The app should avoid long forms and unnecessary typing.

Recommended add listing flow:

```text
Add Listing
→ Upload Photos
→ Basic Phone Details
→ Price and Condition
→ Location and Contact
→ Preview and Submit
```

Fast listing rules:

- Photos should be selected first.
- Seller can select multiple photos at once.
- App should allow cover photo selection, image reorder, and image removal.
- Images should be compressed/resized before upload where possible.
- Image upload can continue in the background while seller fills details.
- Brand and model should use searchable dropdowns, not free text only.
- Common fields such as storage, RAM, condition, PTA/network status, warranty, and box availability should use chips/dropdowns.
- Seller phone, WhatsApp, city, area, and market should be prefilled from profile/shop/default location.
- Seller can edit prefilled values if needed.
- Listing form should autosave as draft.
- Seller can continue an incomplete draft later.
- Shopkeepers should have a Duplicate Listing action.

Duplicate listing rules:

- Duplicate Listing should copy safe reusable details such as brand, model, category, dynamic field values, city/area/market, description, and contact defaults.
- It should not copy approval status, sold status, reports, featured status, payment status, views, saves, or analytics.
- Duplicated listing should start as draft.
- Seller should be required to review photos, price, condition, and submit again for approval.

Draft rules:

- Draft listings are private to the owner/shop/admin.
- Draft listings should not appear publicly.
- Draft listings should not count as active approved listings unless the backend rules explicitly decide otherwise.
- Drafts can be deleted by the owner.
- If app closes during listing creation, the latest draft data should be recoverable.

Edge cases:

- If image upload fails, keep the draft and show retry/remove image options.
- If network is slow, do not block the whole form; show upload progress.
- If seller submits before all images finish uploading, backend should either wait for required uploads or return a clear validation error.
- If a required field is missing, highlight only that field and keep all other entered data.
- If seller exceeds package/listing limits at submit time, keep the draft and show a clear package/limit message.
- If shop approval is pending, allow draft preparation but do not publish listing publicly until required approvals are complete.

Deferred for later:

- AI-based auto-fill from images
- Bulk CSV/Excel upload
- Barcode/IMEI automation
- Inventory import from shop systems

## 7. Shop owner flow

When user taps Sell and chooses “I own a mobile shop”:

```text
Create Shop Profile
→ Shop Approval Pending
→ Seller Dashboard
→ Add Listings
→ Buy Package if needed
```

Shop owner can still browse as buyer.

## 8. Shop approval rule

A shop profile should have approval status:

- pending
- approved
- rejected
- blocked

Public shop visibility depends on approval status.

For MVP:

- Pending shops may prepare listings
- Listings can stay pending/limited until approval
- Approved shops can appear publicly
- Rejected/blocked shops cannot appear publicly

## 9. Seller packages

Recommended package model:

### Free Shop

- 0 price
- Currency is admin-configurable
- 5 active listings
- 0 featured listings
- 0 daily bumps

### Starter Shop

- 5 price units / 30 days
- Currency is admin-configurable
- 25 active listings
- 1 featured listing
- 1 daily bump

### Pro Shop

- 15 price units / 30 days
- Currency is admin-configurable
- 100 active listings
- 5 featured listings
- 5 daily bumps
- verification eligibility

### Seasonal Seller Boost

- 8 price units / 30 days
- Currency is admin-configurable
- 50 active listings
- 3 featured listings
- 3 daily bumps

These are seed/default values only. Admin should be able to change them.

Currency rule:

- Package prices must not be hardcoded to one country or one currency.
- Admin should configure package price and currency.
- UI should display the configured currency from the package/payment settings.
- Backend calculations should use stored `price` and `currency_code`, not fixed currency symbols.


## 10. Featured listing credits and admin overrides

Featured listings are part of packages, but admin must also have full manual control.

Plain rule:

- Package gives the default featured listing limit.
- Admin can give extra featured listing credits to a specific user or shop.
- Admin can make the extra limit valid for one month, a custom date range, or lifetime.
- Admin can also mark a user/shop as unlimited for featured listings.
- Admin can change, pause, or revoke these extra credits at any time.
- Changing credits should never crash the app or delete listings automatically.

Effective featured listing limit:

```text
Package featured limit + active admin bonus credits
```

If admin sets an unlimited override, the user/shop can feature listings without a numeric featured limit while that override is active.

### When limit is reduced after listings are already featured

If a user/shop had unlimited featured listings and already featured 15 listings, then admin later changes the limit to 10:

- The app must not crash.
- The existing 15 featured listings should not be deleted.
- Existing featured listings should remain featured until their current featured expiry date.
- The user/shop should not be allowed to feature more listings until active featured usage becomes lower than the new limit.
- Admin can manually unfeature selected listings if immediate enforcement is required.
- Seller dashboard should show an over-limit state such as `15 / 10 featured listings used`.

This keeps the app safe and avoids unexpected listing changes.

## 11. Package expiry

When package expires:

- Listings beyond free/current limits may be paused
- Seller should see Package Expired / Paused Listings screen
- Seller can renew package
- App should not delete listings automatically

## 12. Payment proof flow

For MVP, payment can be manual.

Flow:

```text
Package Selection
→ Payment Instructions
→ Upload Payment Proof
→ Payment Pending Approval
→ Admin Approves/Rejects
→ Package Activated
```

## 13. Campaign/offer rule

Offers have two time concepts:

1. Offer availability period — when users can purchase the offer
2. Benefit duration — how long the discounted/boosted benefit lasts after purchase

Example:

```text
Seasonal Boost available June 1–10
Benefit lasts 30 days after purchase
```

Users who miss the offer window see normal pricing.

## 14. Promotion rule

Paid promotion increases visibility but does not guarantee permanent top position.

Ranking should consider:

- search relevance
- selected city/area/market
- listing quality
- freshness
- verified shop status
- featured/promotion status
- report penalties

Promoted listings should rotate fairly.

## 15. Listing discount rule

Shop owners/sellers may set discounts on their own listings if supported.

Admin controls package/campaign discounts.

## 16. Reports/moderation

Users can report fake/suspicious listings.

Admin can:

- dismiss report
- remove listing
- block user/shop
- request more info


## 17. Notifications business rule

The app should support notifications for important system events and admin announcements.

System notifications should be created for:

- listing submitted / approved / rejected
- shop submitted / approved / rejected
- payment proof uploaded
- payment under review
- payment approved / rejected
- package activated / expiring / expired

Admin can also send notification campaigns such as:

- discount of the day
- discount available in selected city/area
- featured phone deals
- package offers for shop owners
- seasonal seller boost promotions

Every notification must be saved as an in-app notification. Push notification should be sent when possible, but push delivery failure must not remove the in-app notification.

Guest users should not receive personal account notifications. Public announcements can be shown to guests as home banners or announcement cards.
