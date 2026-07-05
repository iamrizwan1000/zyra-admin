# 07 — Notifications, Campaigns, and Announcement Banners

## 1. Purpose

Mobile Market must support a clean notification system that works for both the mobile app and the admin panel.

The system has three related parts:

1. **In-app notifications** — saved records that users can read inside the app.
2. **Push notifications** — phone push alerts sent through Firebase Cloud Messaging or equivalent.
3. **Announcement banners/cards** — visible promotional/info banners shown inside app screens.

The important rule is:

```text
In-app notification record is the source of truth.
Push notification and announcement display are delivery/display methods.
```

This means important messages are not lost if push fails, user is offline, or notification permission is disabled.

## 2. Core rules

1. Every system/admin notification must be saved in the database first.
2. Push notification is attempted only after the database record is created.
3. Push failure must not block the business action.
4. Logged-in users must have a Notifications area in the mobile app.
5. Guests do not have a personal notification inbox.
6. Public announcements can be shown to guests as app banners/cards.
7. Admin controls notification/banner content and targeting.
8. Mobile app controls banner design through predefined templates.
9. Admin should not manually design banner UI from scratch.

## 3. Notification vs announcement

These are similar, but not exactly the same.

### Notification

A notification is a message saved for a user.

It appears in:

- push notification on phone, if eligible
- app notification bell/unread count
- Notifications screen
- Notification Detail screen

Examples:

- Your listing has been approved.
- Your shop was rejected. Please update the details.
- Your payment proof is under review.
- Today’s phone deals are live in your selected city.

### Announcement

An announcement is a message shown visually inside the app as a banner or card.

It can appear in:

- Home screen top banner
- Listing feed banner
- City deals banner
- Seller dashboard banner
- Package screen promo banner

Examples:

- Today’s mobile deals are live.
- New verified shops added in your city.
- Upgrade to Pro and get more featured listings.

### Same system, different display

Use the same admin campaign system for both.

Campaign display options:

```text
display_type:
- notification
- announcement
- both
```

If `notification`, create in-app notifications and attempt push.

If `announcement`, show an in-app banner/card based on placement and template.

If `both`, do both.

## 4. Admin Quick Send

Admin must have a simple **Quick Send** composer in the desktop web admin panel.

This is for simple manual messages without creating a complicated campaign.

Quick Send fields:

- Title input
- Message textarea
- Target audience selector
- Optional city/area/market filters
- Display type selector: notification, announcement, or both
- Optional banner placement selector
- Optional action button text
- Optional action/deep link
- Send button

Recommended simple UI:

```text
Notifications & Announcements

[Title]
[Message textarea]

Target:
[All users / Selected user / Buyers / Sellers / Shop owners / City / Area / Market]

Display as:
[Notification only / Announcement only / Both]

Button:
[Button Text] [Action]

[Send Now]
```

Quick Send should still save data properly in the database. It is only a simpler admin interface.

## 5. Admin campaign builder

For more planned/promotional notifications, admin should use campaign builder.

Campaign builder fields:

- campaign name
- title
- message/body
- display type: notification, announcement, or both
- target audience
- city/area/market targeting
- buyer/seller/shop owner targeting
- package status targeting
- optional related entity
- optional action button label
- optional deep link/action
- banner placement if announcement is used
- banner template if announcement is used
- priority
- start date
- end date
- send now or schedule later
- status: draft, scheduled, sending, sent, failed, cancelled

Admin campaign examples:

- Discount of the day
- Discount available in selected city
- Featured phone deals are live
- New verified shops added
- Package offer for shop owners
- Seasonal seller boost promotion

## 6. Admin targeting options

Admin should be able to target:

- all logged-in users
- selected user
- selected city
- selected area/market
- buyers
- individual sellers
- shop owners
- users with active package
- users with expired package
- users with pending payment
- users with rejected listings if needed

For guests, admin campaigns can only appear as public announcements/banners. Guests cannot receive personal push notifications unless the app later supports anonymous device tokens, which is not required for MVP.

## 7. Announcement banner design rule

Admin should not design banner layout manually.

Correct rule:

```text
Admin controls content.
Mobile app controls design.
```

The mobile app should include predefined banner templates. Admin selects the template/type and writes the content.

This keeps the app consistent and prevents messy custom banners.

## 8. Recommended banner templates

For MVP, create only these templates:

### 1. Info Announcement Banner

Purpose:

- General app announcements
- New verified shops
- Important app messages

Visual direction:

- blue accent
- simple info icon
- title/message
- optional button

### 2. Deal / Discount Banner

Purpose:

- discount of the day
- city deals
- featured mobile deals

Visual direction:

- orange accent
- small deal tag/icon
- title/message
- optional “View Deals” button

### 3. Seller Package Banner

Purpose:

- package upgrades
- featured listing offers
- shop owner promotions

Visual direction:

- blue/green accent
- package/boost icon
- title/message
- optional “Upgrade” button

### 4. Warning / Action Required Banner

Purpose:

- payment rejected
- package expired
- listing paused
- action required

Visual direction:

- yellow/red accent
- clear action state
- optional “Fix Now” button

## 9. Banner placements

Supported placements should be predefined.

Recommended placement values:

```text
home_top
home_inline
listing_feed_top
city_deals
seller_dashboard_top
package_screen_top
notification_center_top
```

Admin should select placement from dropdown.

The mobile app decides exact spacing, height, corner radius, icon position, button style, and responsive behavior.

## 10. Banner images/icons

For MVP, avoid fully custom banner image design from admin.

Allowed options:

1. Use default template icon/illustration.
2. Choose from pre-made illustration assets.
3. Later, allow optional uploaded image with strict size rules.

Recommended MVP rule:

```text
No free-form banner image upload in MVP.
Use predefined banner templates and icons.
```

If custom images are added later, enforce:

- fixed aspect ratio
- file size limit
- safe crop area
- admin preview before publish
- fallback template if image fails

## 11. System notification types

These notifications should be included in MVP.

### Listing notifications

- Listing submitted for review
- Listing approved
- Listing rejected
- Listing removed by admin
- Listing paused because package expired or limit exceeded

### Shop notifications

- Shop submitted for review
- Shop approved
- Shop rejected
- Shop blocked/suspended

### Payment/package notifications

- Payment proof uploaded
- Payment under review
- Payment approved
- Payment rejected
- Package activated
- Package expiring soon
- Package expired

### Report/moderation notifications

- Report received
- Admin requested more information
- Report resolved if needed

## 12. Admin action triggers

The following admin actions must automatically create notifications:

- approve listing
- reject listing
- approve shop
- reject shop
- approve payment
- reject payment
- activate package
- expire/pause package
- block/suspend shop or user if needed

For rejection events, admin must be able to enter a reason.

That reason must appear in the user’s Notification Detail screen.

## 13. User mobile notification area

Logged-in users should have a Notifications area in the mobile app.

Recommended access points:

- notification bell icon in Home header
- Profile screen
- Settings screen
- unread badge in bottom/profile area if needed

Notifications Screen should show:

- title
- short message
- type icon/badge
- read/unread state
- date/time
- optional action button

Notification Detail Screen should show:

- full title
- full message
- rejection reason/details if available
- related listing/shop/payment/package card if available
- action button such as View Listing, Edit Listing, View Shop, View Payment, View Package, or Browse Deals

Push notification tap behavior:

```text
If deep link target exists → open related screen
Else → open Notification Detail
```

## 14. Push notification rules

Push notifications should be sent using Firebase Cloud Messaging or equivalent.

Push can be sent only when:

- user is logged in
- device token exists
- token is active
- notification permission is granted or not known as denied

If push cannot be sent:

- keep the in-app notification
- mark delivery as skipped/failed
- do not fail the main business action

## 15. Database direction

Required tables:

- notifications
- user_devices
- notification_campaigns
- notification_deliveries

Recommended campaign fields:

- id
- created_by
- title
- message
- campaign_name nullable
- display_type: notification, announcement, both
- target_type
- city_id nullable
- area_id nullable
- market_id nullable
- user_type nullable
- package_status nullable
- placement nullable
- template_key nullable
- priority integer default 0
- action_label nullable
- action_deep_link nullable
- starts_at nullable
- ends_at nullable
- scheduled_at nullable
- sent_at nullable
- status
- stats jsonb nullable
- created_at
- updated_at

Recommended notification fields:

- id
- user_id
- campaign_id nullable
- title
- message
- type
- related_entity_type nullable
- related_entity_id nullable
- action_label nullable
- action_deep_link nullable
- metadata jsonb nullable
- read_at nullable
- created_at

Recommended delivery fields:

- id
- notification_id
- user_device_id nullable
- channel: push
- status: pending, sent, failed, skipped_no_token, skipped_permission_denied
- provider_message_id nullable
- error_message nullable
- attempted_at nullable
- created_at

## 16. Delivery stats for admin

Admin should be able to see basic stats after sending a campaign:

- target users count
- in-app notifications created
- push sent count
- push failed count
- skipped because no device token
- skipped because permission denied
- announcement active/inactive status

## 17. MVP vs later

### MVP should include

- in-app notifications
- push notification setup for logged-in users
- notification bell and Notifications screen
- notification detail screen
- system notifications for approvals/rejections/payments/packages
- admin Quick Send
- admin campaign list/history
- predefined announcement banner templates
- home banner placement
- seller dashboard banner placement
- delivery stats basics

### Later phase

- saved search alerts
- price drop alerts
- advanced segmentation
- A/B testing
- custom uploaded banner images
- recurring scheduled campaigns
- rich media push notifications

## 18. Responsibility split

### Mobile app is responsible for

- registering device token
- showing notification permission request at the right time
- showing notification bell/unread count
- showing Notifications screen
- showing Notification Detail screen
- rendering predefined banner templates
- opening deep links from push/in-app notifications

### Backend/Supabase is responsible for

- saving notification records
- selecting target users for campaigns
- creating notification records for target users
- sending push notifications through Edge Function/provider
- tracking push delivery attempts
- enforcing RLS and permissions

### Admin panel is responsible for

- Quick Send form
- campaign builder
- target audience selection
- selecting display type
- selecting banner template/placement
- viewing sent history and delivery stats
- triggering system notifications through approve/reject/payment actions

## 19. Build order

Recommended implementation order:

1. Create notification database tables.
2. Add RLS rules.
3. Add user device token registration.
4. Add in-app Notifications screen.
5. Add system notifications for listing/shop/payment/package events.
6. Add push sending Edge Function.
7. Add admin Quick Send screen.
8. Add notification campaign list/history.
9. Add predefined announcement banner templates in mobile app.
10. Add campaign placement rendering on Home/Seller Dashboard.

