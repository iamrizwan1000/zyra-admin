# 02 — Admin Panel and Configurable Settings

## 1. Admin panel type

The admin panel is a **desktop web dashboard**, not a mobile app screen.

It should be designed for super admin, staff, and moderators using a laptop/desktop browser.

Admin layout should include:

- left sidebar navigation
- top header
- search
- filters
- stat cards
- tables
- status badges
- action buttons

## 2. Admin responsibilities

Admin can manage:

- users
- shops
- listings
- pending listings
- pending payments
- packages
- offers/campaigns
- categories
- category fields
- reports/moderation
- banners
- notifications
- notification campaigns
- app settings
- support/contact info
- terms/privacy/help content

## 3. Configurable by admin

Admin should be able to configure:

- package names
- package prices
- package listing limits
- featured listing limits
- daily bump limits
- package duration
- package active/inactive status
- seasonal campaigns
- campaign start/end dates
- campaign benefit duration
- banner/announcement text
- notification campaign title/message
- notification targeting rules
- notification action buttons/deep links
- app display name inside app
- welcome headline/subtitle
- onboarding slide text
- payment instructions
- support contact info
- terms/privacy/help/FAQ
- categories
- dynamic fields
- field options
- filters
- city/area/market lists

## 4. Not directly admin configurable

These should stay in code/RPC/Edge Functions:

- ranking algorithm calculation
- package expiry enforcement logic
- promotion rotation logic
- payment approval activation logic
- RLS security rules
- search query logic
- listing status transitions
- permission checks
- fraud/report penalty logic

Admin can configure values, but logic should live in application/backend code.

## 5. Admin screens

Required desktop web admin reference screens:

1. Admin Dashboard
2. Pending Listings
3. Pending Payments
4. Packages Management
5. Offers / Campaign Management
6. Category Fields Management
7. Reports / Moderation Queue
8. Notifications / Campaigns

## 6. Admin dashboard

Should show:

- total users
- total shops
- total listings
- pending listings
- pending payments
- active packages
- revenue summary
- reports/moderation count
- recent activity
- quick actions

## 7. Pending listings

Admin can:

- view listing
- approve listing
- reject listing
- edit minor issues if allowed
- mark suspicious

## 8. Pending payments

Admin can:

- view payment proof
- approve payment
- reject payment
- activate package after approval
- add rejection reason

## 9. Packages management

Admin can manage:

- Free Shop
- Starter Shop
- Pro Shop
- Seasonal Seller Boost
- future packages

Each package should have:

- price
- duration
- active listing limit
- featured listing limit
- daily bump limit
- verification eligibility
- active/inactive status

## 10. Featured listing credit management

Admin must have a dedicated way to manage featured listing credits for a specific user or shop without changing the base package.

Admin should be able to:

- view current package featured limit
- view active featured listings used
- add extra featured listing credits
- set extra credits for a specific month
- set extra credits for a custom start/end date
- set extra credits as lifetime/no expiry
- mark a user/shop as unlimited featured listings
- change the extra credit amount anytime
- revoke or pause extra credits anytime
- add internal admin notes/reason
- see who made the adjustment and when

Admin should not need to edit the package itself for one user. Package limits remain global. User/shop adjustments are separate.

If admin reduces the limit below current usage, the admin panel should show a warning before saving:

```text
This shop currently has more active featured listings than the new limit. Existing featured listings will remain active until their expiry. The shop will not be able to feature more listings until usage drops below the new limit.
```

Admin may optionally choose to manually unfeature selected listings, but the system should not remove featured status automatically without clear admin action.

## 11. Offers/campaign management

Admin can define:

- campaign name
- offer type
- discount/bonus value
- availability start date
- availability end date
- benefit duration
- target package
- status

## 12. Category fields management

Admin can manage dynamic fields per category.

Fields include:

- field name
- field key
- field type
- required yes/no
- filterable yes/no
- searchable yes/no
- show on listing card yes/no
- show on detail page yes/no
- sort order
- options

## 13. Reports/moderation

Admin can review:

- reported listings
- suspicious users
- fake listing reports
- abusive content
- blocked shops/users


## 14. Notifications & Announcements admin module

Admin should have one desktop web module called:

```text
Notifications & Announcements
```

This module should handle both normal notifications and announcement banners.

Do not create two confusing admin systems unless needed later. Use one campaign system with different display types.

### Admin can create

- quick notification
- scheduled notification campaign
- home announcement banner
- deal/discount banner
- seller package promotion banner
- action-required banner

### Display type options

```text
notification
announcement
both
```

- `notification` creates in-app notifications and attempts push delivery.
- `announcement` shows a banner/card in the mobile app.
- `both` creates notifications, attempts push, and shows a banner/card.

## 15. Quick Send notification form

Admin should have a very simple Quick Send form for fast messages.

Fields:

- title input
- message textarea
- target audience dropdown
- optional city/area/market filter
- display type: notification, announcement, both
- optional placement if announcement/both is selected
- optional action button label
- optional deep link/action
- Send Now button

Example:

```text
Title: Today's phone deals
Message: Verified shops have added discounted phones in your selected city.
Target: Buyers in selected city
Display: Both
Placement: Home top banner
Button: View Deals
```

Behind the scenes, Quick Send should still create proper campaign/notification records.

## 16. Campaign builder

Admin should also have a more complete campaign builder for planned messages.

Campaign fields:

- campaign name
- title
- message
- display type
- target audience
- city/area/market filters
- user type filters
- package status filters
- banner template if announcement is used
- banner placement if announcement is used
- optional action button label
- optional deep link/action
- priority
- start date
- end date
- send now or schedule later
- status: draft, scheduled, sending, sent, failed, cancelled

## 17. Targeting options

Admin can target:

- all logged-in users
- selected user
- users in selected city
- users in selected area/market
- buyers
- individual sellers
- shop owners
- users with active package
- users with expired package
- users with pending payment

Guest users cannot receive personal push notifications. They can see public announcement banners when a banner campaign is active for their selected city/area/market.

## 18. Announcement banner design rule

Admin should not design banners from scratch.

Correct rule:

```text
Admin controls content.
Mobile app controls design.
```

The mobile app should have predefined banner templates. Admin only selects the type/template and enters content.

This prevents inconsistent banner designs and keeps the app professional.

## 19. Banner templates

MVP banner templates:

1. Info Announcement Banner
2. Deal / Discount Banner
3. Seller Package Banner
4. Warning / Action Required Banner

Each template should be implemented in the mobile app using theme tokens.

Admin-selectable fields:

- template/type
- title
- message
- optional button text
- optional action/deep link
- placement
- target audience
- start/end date
- priority

Admin should not choose random colors, layouts, fonts, or spacing.

## 20. Banner placements

Supported placements:

- home top
- home inline
- listing feed top
- city deals section
- seller dashboard top
- package screen top
- notification center top

The app decides exact UI layout, height, border radius, icons, colors, and responsive behavior.

## 21. Notification triggers from admin actions

The following admin actions should automatically create in-app notifications and attempt push notifications:

- approve listing
- reject listing
- approve shop
- reject shop
- approve payment
- reject payment
- activate package
- expire/pause package
- block/suspend shop or user if needed

Admin should be able to add a rejection reason for rejected listings, shops, and payments. That reason should appear inside the user's Notification Detail screen.

## 22. Delivery stats and history

Admin should be able to view:

- sent campaigns
- draft campaigns
- scheduled campaigns
- target users count
- in-app notifications created
- push sent count
- push failed count
- skipped because no device token
- skipped because permission denied
- active announcement banners
- expired announcement banners

