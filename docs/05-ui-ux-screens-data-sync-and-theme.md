# 05 — UI/UX Screens, Data Sync, and Theme

## 1. Platform split

Mobile app:

- Buyer screens
- Seller/shopkeeper screens

Desktop web admin:

- Admin dashboard screens

Do not design admin as mobile app screens.

## 2. Visual direction

Use a clean, premium, practical marketplace style.

Theme:

- Primary: #2563EB
- Primary Dark: #1D4ED8
- Background: #F8FAFC
- Card/Surface: #FFFFFF
- Muted Surface: #F1F5F9
- Text Primary: #0F172A
- Text Secondary: #475569
- Muted Text: #94A3B8
- Border: #E2E8F0
- Success: #16A34A
- Warning: #F59E0B
- Danger: #DC2626
- Featured/Deal: #F97316
- Verified: #2563EB

Typography:

- Inter or similar
- clear headings
- readable body
- bold price
- small muted metadata

## 3. Location wording

Use:

- selected city
- selected area
- selected market
- city/area/market
- in your city

Do not use:

- nearby
- near me
- around you
- GPS
- live location
- maps
- distance
- closest

## 4. Buyer mobile screens

Recommended buyer screens:

1. Splash Screen
2. Welcome Screen
3. Onboarding — Compare Prices
4. Onboarding — Contact Sellers
5. Onboarding — Seller Packages
6. Login / Signup Screen
7. City Selection Screen
8. Area / Market Selection Screen
9. Home Screen
10. Mobile Listing Feed Screen
11. Search Results Screen
12. Filter Bottom Sheet
13. Listing Detail Screen
14. Shop Profile Screen
15. Saved Listings Screen
16. Saved Listings Empty State
17. Report Listing Screen
18. Empty State — No Listings Found
19. Notifications Screen
20. Notification Detail Screen

## 5. Additional account/seller onboarding screens

These screens should be added because seller/shop capability is not forced at signup.

1. Seller Type Selection Screen
2. Create Shop Profile Screen
3. Shop Approval Pending Screen

Seller Type Selection appears when user taps Sell for the first time.

Options:

- Sell as individual
- I own a mobile shop

Buyer access already exists by default.

## 6. Seller/shopkeeper mobile screens

Recommended seller/shopkeeper screens:

1. Seller Dashboard
2. My Listings
3. Add Listing — Select Category
4. Add Listing — Mobile Details Form
5. Add Listing — Upload Images
6. Add Listing — Preview and Submit
7. Edit Listing
8. Package Selection
9. Payment Instructions
10. Upload Payment Proof
11. Payment Pending Approval
12. Shop Profile Management
13. Package Expired / Paused Listings


## 7. Fast add listing UX

The Add Listing flow must be fast and seller-friendly.

Goal:

```text
Seller can submit a normal mobile listing in about 60–90 seconds.
Shopkeeper can create similar listings faster by duplicating existing listings.
```

Recommended screen flow:

1. Upload Photos
2. Basic Phone Details
3. Price and Condition
4. Location and Contact
5. Preview and Submit

UX rules:

- Photos first.
- Multiple image selection.
- Image reorder.
- Cover photo selection.
- Image remove/retry.
- Show image upload progress.
- Continue form while images upload where possible.
- Searchable brand dropdown.
- Searchable model dropdown filtered by brand.
- Chips/dropdowns for storage, RAM, condition, PTA/network status, warranty, box availability, and seller type.
- Price should be a simple numeric input with configured currency display.
- City/area/market and contact should prefill from profile/shop/default selection.
- Autosave draft quietly.
- Show Continue Draft if user returns later.
- Show Duplicate Listing action for shopkeepers and sellers with existing listings.

Preview screen should show:

- buyer-facing card preview
- image gallery preview
- important specs
- price
- city/area/market
- seller/shop contact card
- Submit for Approval
- Save as Draft
- Edit Details

Edge states:

- missing required field
- no image uploaded
- image upload failed
- slow network
- package/listing limit reached
- shop approval pending
- draft saved
- submit success
- submit failed but draft preserved

Do not use one huge form screen for all fields. Keep the listing flow short, progressive, and easy to complete.

## 8. Admin desktop web screens

Admin screens are desktop web dashboard screens:

1. Admin Dashboard
2. Pending Listings
3. Pending Payments
4. Packages Management
5. Offers / Campaign Management
6. Category Fields Management
7. Reports / Moderation Queue
8. Notifications / Campaigns

Admin UI should use:

- sidebar
- top header
- stat cards
- tables
- filters
- status badges
- action buttons

## 9. Buyer home UX

Home should show:

- selected city/area/market
- search bar
- banner/announcement
- quick filter chips
- featured phones
- latest listings
- verified shops
- categories
- bottom navigation

Selected city/area should be clickable/changeable.

## 10. Search UX

Buyer can search any city/area/market.

Search/filter UI should allow:

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

Changing city in search should not permanently change user default unless user saves it.

## 11. Listing card UX

Listing cards should show:

- image
- title
- price
- city/area/market
- storage
- condition
- approval/network status
- seller type
- featured badge
- verified shop badge

## 12. Listing detail UX

Listing detail should show:

- image gallery
- title
- price
- old price/discount if available
- specs
- seller/shop card
- Call button
- WhatsApp button
- Report button
- similar listings

## 13. Seller dashboard UX

Seller dashboard should show:

- package name
- package expiry
- active listings used
- featured listings used
- daily bumps used
- listing status summary
- quick actions
- recent listings
- package warning if expiring/expired

Featured listing display rules:

- Show featured usage as `used / limit`.
- If featured listing access is unlimited, show `Unlimited featured listings`.
- If current usage is higher than the new limit after admin adjustment, show an over-limit warning but keep the app usable.
- Do not hide or crash existing featured listings.
- Show a message such as: `You are currently over your featured listing limit. Existing featured listings will stay active until expiry, but you cannot feature more listings yet.`

## 14. Shop onboarding UX

Create Shop Profile should include:

- shop name
- shop logo
- cover image
- city
- area/market
- shop description
- contact number
- WhatsApp number
- opening hours
- optional business proof

After submit, show Shop Approval Pending.

## 15. Mode switching UX

Do not create separate buyer/seller accounts.

Use one account with access areas.

For MVP:

- Login opens Buyer Home
- Sell tab opens Seller Dashboard if seller/shop exists
- Sell tab opens seller onboarding if not exists
- Seller area has Back to Buyer / Switch to Buyer action



## 16. Notifications UX

The mobile app should include a Notifications area for logged-in users.

Recommended access points:

- notification bell icon in Home header
- unread count badge
- Profile screen
- Settings screen

Notifications Screen should show:

- unread/read state
- title
- short message
- notification type icon/badge
- date/time
- related action button if available

Notification Detail Screen should show:

- full title
- full message
- reason/details if listing/shop/payment was rejected
- related listing/shop/payment/package card if available
- action button such as View Listing, Edit Listing, View Shop, View Payment, View Package, or Browse Deals

Push notification tap should open the related screen when possible. If the related screen cannot be opened, open Notification Detail.

Guest users should not have a personal notification inbox. Guests can still see public announcement banners/cards on app screens if configured by admin.

## 17. Announcement banner UX

Announcement banners are controlled by admin content, but rendered by predefined mobile app templates.

Rule:

```text
Admin controls content.
App controls design.
```

The app should include reusable banner components for:

1. Info Announcement Banner
2. Deal / Discount Banner
3. Seller Package Banner
4. Warning / Action Required Banner

Banner placements:

- Home top
- Home inline
- Listing feed top
- City deals section
- Seller dashboard top
- Package screen top
- Notification center top

Each banner template should support:

- title
- message
- icon/illustration from template
- optional button
- optional dismiss action if allowed
- start/end date from backend
- priority sorting

Design rules:

- use existing theme tokens
- do not let admin choose random colors/fonts/layouts
- keep banner height controlled by app
- use rounded corners and clear spacing
- keep content short and readable
- show only relevant banners for the selected city/area/market or user type

## 18. Admin notifications UX

Admin web dashboard should include a Notifications & Announcements screen.

Admin can:

- use Quick Send form
- create notification campaign
- select display type: notification, announcement, or both
- select target audience
- choose city/area/market targeting
- write title and message
- select predefined banner template if announcement is used
- select placement if announcement is used
- add optional action button/deep link
- send now or schedule later
- view sent/failed/skipped counts

Quick Send should be simple:

```text
Title input
Message textarea
Target dropdown
Display type dropdown
Optional placement/template
Send button
```

Admin action screens such as Pending Listings, Pending Payments, and Shop Approval should automatically trigger notification creation after approve/reject actions.

## 19. React Native CLI install direction

Mobile app should use React Native CLI, not Expo.

Suggested stack:

- React Native CLI
- TypeScript
- NativeWind
- React Navigation
- Supabase JS
- TanStack Query
- React Hook Form
- Zod
- Zustand
- lucide-react-native
- react-native-svg
- react-native-image-picker
- react-native-keychain
- @react-native-community/netinfo
- @gorhom/bottom-sheet

Install starting point:

```bash
mkdir -p mobile-marketplace/apps
cd mobile-marketplace/apps
npx @react-native-community/cli@latest init mobile --version latest
cd mobile
```

Common packages:

```bash
npm install @supabase/supabase-js
npm install @tanstack/react-query
npm install react-hook-form zod zustand
npm install lucide-react-native react-native-svg
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated
npm install react-native-image-picker react-native-keychain
npm install @react-native-community/netinfo react-native-device-info
npm install @gorhom/bottom-sheet
```

iOS:

```bash
cd ios
pod install
cd ..
```

## 20. Screen asset naming

Recommended design export folders:

```text
designs/mobile-market/01-buyer/
designs/mobile-market/02-seller/
designs/mobile-market/03-admin/
```

Buyer:

```text
01-buyer/01-splash-screen.png
01-buyer/02-welcome-screen.png
01-buyer/03-onboarding-compare-prices.png
01-buyer/04-onboarding-contact-sellers.png
01-buyer/05-onboarding-seller-packages.png
01-buyer/06-login-signup-screen.png
01-buyer/07-city-selection-screen.png
01-buyer/08-area-market-selection-screen.png
01-buyer/09-home-screen.png
01-buyer/10-mobile-listing-feed-screen.png
01-buyer/11-search-results-screen.png
01-buyer/12-filter-bottom-sheet.png
01-buyer/13-listing-detail-screen.png
01-buyer/14-shop-profile-screen.png
01-buyer/15-saved-listings-screen.png
01-buyer/16-saved-listings-empty-state.png
01-buyer/17-report-listing-screen.png
01-buyer/18-empty-state-no-listings-found.png
```

Seller:

```text
02-seller/01-seller-dashboard-screen.png
02-seller/02-my-listings-screen.png
02-seller/03-add-listing-select-category-screen.png
02-seller/04-add-listing-mobile-details-screen.png
02-seller/05-add-listing-upload-images-screen.png
02-seller/06-add-listing-preview-submit-screen.png
02-seller/07-edit-listing-screen.png
02-seller/08-package-selection-screen.png
02-seller/09-payment-instructions-screen.png
02-seller/10-upload-payment-proof-screen.png
02-seller/11-payment-pending-approval-screen.png
02-seller/12-shop-profile-management-screen.png
02-seller/13-package-expired-paused-listings-screen.png
```

Additional onboarding:

```text
02-seller/14-seller-type-selection-screen.png
02-seller/15-create-shop-profile-screen.png
02-seller/16-shop-approval-pending-screen.png
```

Admin:

```text
03-admin/01-admin-dashboard-web.png
03-admin/02-pending-listings-web.png
03-admin/03-pending-payments-web.png
03-admin/04-packages-management-web.png
03-admin/05-offers-campaign-management-web.png
03-admin/06-category-fields-management-web.png
03-admin/07-reports-moderation-queue-web.png
```

## 21. App text ownership

Admin-manageable:

- app display name shown inside app
- welcome headline/subtitle
- onboarding slide copy
- announcements
- support contact
- payment instructions
- package/offer display copy
- terms/privacy/help content

App/i18n/config:

- button labels
- navigation labels
- generic error messages
- standard empty states
- validation labels
