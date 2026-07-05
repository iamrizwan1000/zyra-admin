# 03 — Supabase Database, RLS, and Seeders

## 1. Core database principle

Use Supabase Auth for login, but app-specific data should be stored in public tables with RLS.

A user account is not only buyer or seller.

Every authenticated user is buyer by default.

Seller/shop capability is represented by related records.

## 2. Recommended tables

### profiles

Stores user profile.

Fields:

- id uuid primary key references auth.users(id)
- full_name
- phone
- avatar_url
- default_city_id nullable
- default_area_id nullable
- last_active_mode text default 'buyer', CHECK (last_active_mode IN ('buyer','seller')) — column added in migration 003, CHECK constraint added in migration 047
- account_status text
- created_at
- updated_at

Notes:

- Buyer access exists by default.
- `last_active_mode` is set automatically on tab focus (`setLastActiveMode` in `src/api/profile.ts`) and used on login to resume into Seller Dashboard instead of Buyer Home, provided the user still has a seller record.

### individual_seller_profiles

Stores optional individual seller capability.

Fields:

- id uuid primary key
- user_id references profiles(id)
- status text
- created_at
- updated_at

### shops

Stores shop profiles.

Fields:

- id uuid primary key
- owner_id references profiles(id)
- shop_name
- slug
- logo_url
- cover_url
- city_id
- area_id
- market_id nullable
- description
- contact_number
- whatsapp_number
- opening_hours
- business_proof_url nullable
- approval_status text
- status text
- verified_at nullable
- created_at
- updated_at

Approval statuses:

- pending
- approved
- rejected
- blocked

### cities

- id
- name
- country_code nullable
- status
- sort_order

### areas

- id
- city_id
- name
- status
- sort_order

### markets

Optional if areas and markets are separate.

- id
- city_id
- area_id nullable
- name
- status
- sort_order

### categories

- id
- parent_id nullable
- name
- slug
- status
- sort_order

### category_fields

- id
- category_id
- field_name
- field_key
- field_type
- is_required
- is_filterable
- is_searchable
- show_on_card
- show_on_detail
- sort_order

### category_field_options

- id
- field_id
- label
- value
- sort_order

### listings

Fields:

- id uuid primary key
- user_id references profiles(id)
- shop_id nullable references shops(id)
- category_id references categories(id)
- seller_type text -- individual/shop
- title
- description
- price
- old_price nullable
- currency_code nullable
- city_id
- area_id nullable
- market_id nullable
- status text -- draft/pending/active/paused/sold/removed
- approval_status text -- draft/pending/approved/rejected
- is_featured boolean
- featured_until nullable
- sold_at nullable
- created_at
- updated_at
- submitted_at nullable
- last_autosaved_at nullable
- duplicated_from_listing_id nullable references listings(id)

Rules:

- `draft` listings are private and not public.
- `pending` listings are submitted for admin approval.
- `approved` listings can become public/active when package/shop rules allow.
- Individual listings have `shop_id = null`
- Shop listings have `shop_id`
- Listings store city/area/market directly for search performance

### listing_field_values

- id
- listing_id
- field_id
- value_text nullable
- value_number nullable
- value_boolean nullable
- value_json nullable

### listing_images

- id
- listing_id
- image_url
- storage_path nullable
- thumbnail_url nullable
- sort_order
- is_cover boolean default false
- upload_status text -- pending/uploaded/failed
- created_at

### packages

- id
- name
- price
- currency_code nullable
- duration_days
- active_listing_limit
- featured_listing_limit
- daily_bump_limit
- verification_eligibility
- status
- sort_order

### subscriptions

- id
- shop_id nullable
- user_id
- package_id
- status
- starts_at
- expires_at
- limits_snapshot jsonb

### featured_credit_adjustments

This table stores admin-controlled featured listing overrides/bonus credits for a user or shop.

- id
- user_id nullable
- shop_id nullable
- adjustment_type: extra_credits / limit_override / unlimited
- extra_credits nullable
- limit_override nullable
- is_unlimited boolean default false
- starts_at nullable
- expires_at nullable
- status: active / paused / revoked / expired
- reason nullable
- admin_note nullable
- created_by
- created_at
- updated_at
- revoked_at nullable

Rules:

- `user_id` or `shop_id` must be present.
- `expires_at` can be null for lifetime adjustments.
- `is_unlimited = true` means no numeric featured limit while the adjustment is active.
- Revoking an adjustment should only affect future feature actions. It should not delete listings.

### payments

- id
- user_id
- shop_id nullable
- package_id
- amount
- currency_code nullable
- method
- proof_url
- reference_number nullable
- status
- rejection_reason nullable
- submitted_at
- approved_at nullable

### campaigns

- id
- name
- offer_type
- value
- availability_starts_at
- availability_ends_at
- benefit_duration_days
- target_package_id nullable
- status

### saved_listings

- id
- user_id
- listing_id

### reports

- id
- reporter_id
- listing_id nullable
- reported_user_id nullable
- shop_id nullable
- reason
- message nullable
- severity
- status
- created_at



### notifications

Stores all in-app notifications. This table is the source of truth for user notifications.

Fields:

- id uuid primary key
- user_id references profiles(id)
- campaign_id nullable references notification_campaigns(id)
- title
- message
- type text
- channel text default 'in_app'
- related_entity_type nullable
- related_entity_id nullable
- action_label nullable
- action_deep_link nullable
- metadata jsonb nullable
- read_at nullable
- created_at

Notification types can include:

- listing_submitted
- listing_approved
- listing_rejected
- shop_submitted
- shop_approved
- shop_rejected
- payment_under_review
- payment_approved
- payment_rejected
- package_active
- package_expiring
- package_expired
- admin_campaign
- discount_offer

### user_devices

Stores mobile push notification tokens.

Fields:

- id uuid primary key
- user_id references profiles(id)
- fcm_token
- platform text -- ios/android
- device_id nullable
- device_name nullable
- app_version nullable
- notification_permission_status nullable
- is_active boolean default true
- last_seen_at
- created_at
- updated_at

### notification_campaigns

Stores admin-created notifications, campaigns, and announcement banners.

This table powers both Quick Send and planned campaigns.

Fields:

- id uuid primary key
- created_by references profiles(id)
- campaign_name nullable
- title
- message
- type text
- display_type text -- notification / announcement / both
- target_type text
- city_id nullable
- area_id nullable
- market_id nullable
- user_type nullable
- package_status nullable
- placement nullable -- home_top / listing_feed_top / seller_dashboard_top etc.
- template_key nullable -- info / deal / seller_package / warning
- priority integer default 0
- action_label nullable
- action_deep_link nullable
- starts_at nullable
- ends_at nullable
- scheduled_at nullable
- sent_at nullable
- status text
- stats jsonb nullable
- created_at
- updated_at

### notification_deliveries

Optional but recommended for tracking push delivery attempts.

Fields:

- id uuid primary key
- notification_id references notifications(id)
- user_device_id nullable references user_devices(id)
- channel text -- push
- status text -- pending/sent/failed/skipped_no_token/skipped_permission_denied
- provider_message_id nullable
- error_message nullable
- attempted_at nullable
- created_at

## 3. RLS principles

- Users can read public approved listings.
- Users can read approved shops.
- Users can create their own listings.
- Users can update their own listings only within allowed states.
- Shop owners can manage their own shop profile.
- Shop public visibility depends on approval status.
- Admin/staff can manage all records through admin role.
- Payment proof files should be private to owner/admin unless explicitly needed.

## 4. Fast listing/draft database rules

The database must support quick listing creation without losing seller progress.

Rules:

- Listing creation may start as `draft`.
- Draft listings should store partial data safely.
- Draft listings are visible only to the owner/shop owner and admin.
- Image records may be created while the listing is still draft.
- Image upload status should be trackable so failed uploads can be retried.
- A duplicated listing should reference `duplicated_from_listing_id` when useful for audit/debugging.
- Duplicated listings must start as draft and must not inherit approval/public/featured/sold/report/analytics state.
- Required field validation should happen before submit for approval, not necessarily before saving a draft.

Draft-safe statuses:

- `draft` means not submitted and not public.
- `pending` means submitted and waiting for admin approval.
- `active` means approved/public when all rules allow it.
- `paused` means hidden because of package/shop/admin rules.
- `sold` means seller marked as sold.
- `removed` means removed by owner/admin.

## 5. Search query rule

Listing search should accept:

- city_id
- area_id
- market_id
- category_id
- keyword
- dynamic filters
- price range
- seller type
- verified shop only
- featured filter
- sort

Default city is only fallback when no city is selected manually.

## 6. Seeders

Seed:

- mobile category
- common mobile fields
- package defaults
- sample cities/areas/markets
- app settings
- payment instruction placeholders
- admin role/user if needed

## 7. Status fields

Use explicit status fields.

Examples:

Listing approval:

- pending
- approved
- rejected

Listing status:

- active
- paused
- sold
- removed

Shop approval:

- pending
- approved
- rejected
- blocked

Payment status:

- pending
- approved
- rejected


## 8. Notification RLS rules

Users can read only their own notifications.

Users can update only their own notification read state.

Users cannot create system/admin notifications directly. Notification creation should happen through trusted backend actions, RPC functions, or Edge Functions.

Admin/staff can create notification campaigns and can read delivery stats according to admin permissions.

Device tokens belong to the authenticated user only. Users can insert/update/delete their own device tokens, but cannot access other users' device tokens.
