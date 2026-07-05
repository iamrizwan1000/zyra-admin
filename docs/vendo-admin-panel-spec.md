# Vendo Admin Panel — Specification

## 1. Purpose

The admin panel is a **desktop web dashboard** for super admins, staff, and moderators to manage the Mobile Market marketplace. It is a separate Next.js project (this project, `vendo-admin`) that speaks to the same Supabase backend as the mobile app.

Do not build admin functionality into the React Native mobile app.

## 2. Stack

- **Framework:** Next.js 16 App Router
- **UI Library:** @shopify/polaris v13 (Frame, Navigation, TopBar, Page, Card, DataTable, Badge, Button, Banner, Modal, Toast, EmptyState, IndexTable, etc.)
- **Styling:** Tailwind CSS v4 (for custom layout/overrides alongside Polaris)
- **Supabase:** @supabase/supabase-js + @supabase/ssr (anon key for browser client, service role for server-side data fetching)
- **Auth:** Supabase email+password login (admin accounts only) using @supabase/ssr cookie-based sessions
- **Deployment:** Vercel or any Node.js host

## 3. Auth & Access Control

### 3.1 Login flow

```
/login page → Supabase signInWithPassword(email, password)
            → session stored in cookie via @supabase/ssr
            → redirect to /dashboard
```

### 3.2 Session guard

- `proxy.ts` (Next.js 16 — `middleware.ts` was renamed to `proxy.ts`) checks session cookie on every route under `/(dashboard)/*`
- If no session → redirect to `/login`
- If session exists but `is_admin(auth.uid())` is false → show 403 page

### 3.3 Admin check

- Every server action and client mutation calls `is_admin(auth.uid())` at the start
- The Supabase RPCs already enforce this (`SECURITY DEFINER` + `IF NOT public.is_admin(auth.uid()) THEN ...`)

## 4. Layout

### 4.1 Root layout (`app/layout.tsx`)

- Applied to all pages (login included)
- Sets fonts, global CSS, `<html>`/`<body>` tags
- Imports Polaris CSS: `@import '@shopify/polaris/build/esm/styles.css'`

### 4.2 Polaris AppProvider (`app/providers.tsx`)

- Client component wrapping children in `<AppProvider>` with Polaris theme
- Imported by root layout

### 4.3 Authenticated layout (`app/(dashboard)/layout.tsx`)

- Wraps content in Polaris `<Frame>` component
- `<Navigation>` for sidebar with all admin nav items
- `<TopBar>` for header (admin name, logout)
- Auth guard: checks session, redirects to `/login` if missing

### 4.4 Sidebar (Polaris Navigation)

Polaris `<Navigation>` items (with active state highlighting via `selected` prop):

| Label | Path | Icon |
|---|---|---|
| Dashboard | `/dashboard` | `HomeMajor` |
| Pending Listings | `/listings` | `ClipboardListMajor` |
| Pending Payments | `/payments` | `CashDollarMajor` |
| Shops | `/shops` | `StoreMajor` |
| Users | `/users` | `PeopleMajor` |
| Packages | `/packages` | `PackageMajor` |
| Offers/Campaigns | `/offers` | `MegaphoneMajor` |
| Categories | `/categories` | `CollectionsMajor` |
| Reports | `/reports` | `AlertMinor` |
| Notifications | `/notifications` | `NotificationMajor` |
| Banners | `/banners` | `ImageMajor` |
| Featured Credits | `/featured-credits` | `StarMajor` |
| Locations | `/locations` | `LocationMajor` |
| Settings | `/settings` | `SettingsMajor` |

### 4.5 Header (Polaris TopBar)

- Admin name (from `profiles.full_name`)
- Logout button/action
- Part of `<Frame>` component, toggles mobile navigation

## 5. Pages / Sections

### 5.1 Dashboard (`/dashboard`)

**Purpose:** At-a-glance overview of marketplace health.

**Data sources:**
- `get_pending_listings(limit=1, offset=0)` → count from `count(*)` estimate
- `get_pending_payments(limit=1, offset=0)` → count
- `get_pending_shops(limit=1, offset=0)` → count
- `get_pending_reports(limit=1, offset=0)` → count
- Direct `SELECT count(*) FROM profiles` (admin bypass via RLS)
- Direct `SELECT count(*) FROM listings WHERE status = 'active'`
- Direct `SELECT count(*) FROM shops WHERE status = 'active'`
- Direct `SELECT count(*) FROM subscriptions WHERE status = 'active'`

**Stat cards:**
- Total Users
- Total Listings (active)
- Total Shops (active)
- Active Packages/Subscriptions
- Pending Listings (link)
- Pending Payments (link)
- Pending Shops (link)
- Pending Reports (link)

**Lists:**
- Recent pending listings (last 5)
- Recent pending payments (last 5)
- Recent reports (last 5)

### 5.2 Pending Listings (`/listings`)

**Purpose:** Review and moderate listings submitted by sellers.

**Via:** `get_pending_listings(limit, offset)` — returns listings with `approval_status = 'pending'`

**Table columns:**
| Column | Source |
|---|---|
| Image | `cover_image_url` (thumbnail) |
| Title | `title` |
| Seller | `seller_name` |
| Shop | `shop_name` (nullable) |
| City/Area | `city_name`, `area_name` |
| Price | `price` |
| Created | `created_at` |
| Actions | approve / reject / request changes / mark suspicious |

**Row actions (inline buttons):**
- **View** → opens `/listings/[id]` detail page
- **Approve** → calls `approve_listing(listingId, reason?)` — optional reason field
- **Reject** → opens modal with reason textarea → calls `reject_listing(listingId, reason)`
- **Request Changes** → opens modal with reason textarea → calls `request_listing_changes(listingId, reason)`
- **Mark Suspicious** → opens modal with reason → calls `mark_listing_suspicious(listingId, reason)`

**States:**
- Loading: skeleton table rows
- Empty: "No pending listings"
- Error: inline error banner with retry

**Rejection/reason modal:**
- Textarea for admin's reason
- This reason appears in the user's Notification Detail screen (handled by the RPC)

### 5.3 Listing Detail (`/listings/[id]`)

**Via:** `get_admin_listing_detail(listingId)` — returns full JSON with images, field_values, owner info

**Display:**
- Image gallery (all listing images, clickable for lightbox)
- Title, price, description
- Dynamic field values (storage, RAM, condition, etc.)
- Seller info (name, phone, WhatsApp)
- Shop info if applicable
- City/Area/Market
- Created date, status history
- Action buttons: approve / reject / request changes / remove / mark suspicious

### 5.4 Pending Payments (`/payments`)

**Purpose:** Review payment proofs uploaded by sellers and activate their packages.

**Via:** `get_pending_payments(limit, offset)`

**Table columns:**
| Column | Source |
|---|---|
| Date | `created_at` |
| Seller | seller name |
| Package | package name + price |
| Shop | shop name (nullable) |
| Amount | `amount` |
| Proof | thumbnail link → opens lightbox |
| Status | `status` |
| Actions | view / approve / reject |

**Row actions:**
- **View** → `/payments/[id]` detail page
- **Approve** → calls `approve_payment(paymentId, note?)` — activates subscription automatically (RPC handles cancelling existing sub + creating new one + freezing limits_snapshot)
- **Reject** → modal with reason → `reject_payment(paymentId, reason)`

### 5.5 Payment Detail (`/payments/[id]`)

**Via:** `get_admin_payment_detail(paymentId)`

**Display:**
- Payment proof image (lightbox)
- Seller info (name, phone, email)
- Package selected (name, price, limits)
- Shop info if applicable
- Amount, date
- Approve / Reject buttons

### 5.6 Packages Management (`/packages`)

**Purpose:** CRUD for seller packages.

**Data source:** Direct `packages` table queries (admin RLS bypass)

**Table columns:**
| Column | Type |
|---|---|
| Name | text |
| Price | numeric |
| Currency | text |
| Duration days | integer |
| Active listing limit | integer |
| Featured listing limit | integer |
| Daily bump limit | integer |
| Verification eligible | boolean |
| Status | active/inactive |
| Actions | edit / toggle status |

**Features:**
- List all packages with search
- **New Package** button → `/packages/new` form
- **Edit** → `/packages/[id]/edit` form
- **Toggle active/inactive** → inline toggle button
- Delete (soft: set status inactive)

**Package form fields:**
- Name (text input)
- Price (number)
- Currency code (text, e.g. PKR, USD)
- Duration in days (number)
- Active listing limit (number)
- Featured listing limit (number)
- Daily bump limit (number)
- Verification eligible (checkbox)
- Active (checkbox)

### 5.7 Offers / Campaign Management (`/offers`)

**Purpose:** Create and manage seasonal campaigns/offers.

**Data source:** Direct `offers` / `campaigns` table queries

**Table columns:**
| Column | Source |
|---|---|
| Name | `campaign_name` |
| Type | `offer_type` |
| Value | discount/bonus value |
| Availability | `starts_at` → `ends_at` |
| Benefit duration | benefit days |
| Target package | `target_package_id` |
| Status | active/inactive |
| Actions | edit / delete |

**Fields for create/edit:**
- Campaign name
- Offer type (discount / bonus)
- Discount/bonus value
- Availability start date
- Availability end date
- Benefit duration (days)
- Target package (dropdown from packages)
- Active status

### 5.8 Categories Management (`/categories`)

**Purpose:** Manage product categories and their dynamic fields.

**Data source:** Direct `categories`, `category_fields`, `category_field_options` table queries

**Category table columns:**
| Column | Source |
|---|---|
| Name | `name` |
| Slug | `slug` |
| Icon | `icon` |
| Sort order | `sort_order` |
| Status | `status` |
| Actions | edit / fields / delete |

**Features:**
- List all categories
- **New Category** button → form
- **Edit** → form (name, slug, icon, sort_order, status)
- **Fields** → `/categories/[id]/fields` page to manage dynamic fields

#### Category Fields page (`/categories/[id]/fields`)

**Purpose:** Manage dynamic fields per category (e.g. Storage, RAM, Condition for Phones).

**Data source:** `category_fields` where `category_id = [id]`

**Table columns:**
| Column | Source |
|---|---|
| Field name | `field_name` |
| Field key | `field_key` |
| Field type | `field_type` (text, number, select, boolean, etc.) |
| Required | checkbox |
| Filterable | checkbox |
| Searchable | checkbox |
| Show on card | checkbox |
| Show on detail | checkbox |
| Sort order | number |
| Options | edit button (for select fields) |
| Actions | edit / delete |

**Field form:**
- Field name
- Field key (slug)
- Field type dropdown (text, number, select, boolean, date, etc.)
- Required checkbox
- Filterable checkbox
- Searchable checkbox
- Show on listing card checkbox
- Show on detail page checkbox
- Sort order number

**Field Options:** When field type is `select`, show an "Options" button that opens a modal/list to manage `category_field_options`:
- Option label
- Option value
- Sort order

### 5.9 Reports / Moderation Queue (`/reports`)

**Purpose:** Review user-reported listings, users, and shops.

**Via:** `get_pending_reports(limit, offset)`

**Table columns:**
| Column | Source |
|---|---|
| Date | `created_at` |
| Reporter | `reporter_name` |
| Listing | `listing_title` (nullable) |
| Reported user | `reported_user_name` (nullable) |
| Shop | `shop_name` (nullable) |
| Reason | `reason` |
| Severity | `severity` |
| Actions | view listing / resolve / dismiss |

**Row actions:**
- **View Listing** → opens `/listings/[id]` (if listing exists)
- **Resolve** → modal with optional note → `resolve_report(reportId, 'resolved', note?)`
- **Dismiss** → modal with optional note → `resolve_report(reportId, 'dismissed', note?)`

### 5.10 Notifications & Announcements (`/notifications`)

#### 5.10.1 Quick Send

A simple form for sending immediate notifications/announcements.

**Fields:**
| Field | Type | Notes |
|---|---|---|
| Title | text input | Required |
| Message | textarea | Required |
| Target audience | dropdown | See targeting options below |
| City filter | dropdown | Shown when target = city/all |
| Area filter | dropdown | Shown when area selected |
| Market filter | dropdown | Shown when market selected |
| Display type | dropdown | notification / announcement / both |
| Placement | dropdown | Shown when announcement or both |
| Template key | dropdown | Shown when announcement or both |
| Action button label | text input | Optional |
| Action deep link | text input | Optional |
| **Send Now** | button | Calls the creation logic |

**Target audience options:**
- All logged-in users
- Selected user (user search/select)
- Buyers only
- Individual sellers only
- Shop owners only
- Users with active package
- Users with expired package
- Users with pending payment
- Users in selected city
- Users in selected area/market

**Display type options:**
- `notification` — creates in-app notifications + attempts push
- `announcement` — creates banner placement record (mobile app renders it)
- `both` — does both

**Placement options (for announcement/both):**
- `home_top`
- `home_inline`
- `listing_feed_top`
- `city_deals`
- `seller_dashboard_top`
- `package_screen_top`
- `notification_center_top`

**Template key options (for announcement/both):**
- `info` — blue, info icon, general announcements
- `deal` — orange, deal tag, discount/deals
- `seller_package` — blue/green, package/boost icon, upgrades
- `warning` — yellow/red, clear action state, warnings

#### 5.10.2 Campaign List

List of all campaigns (draft, scheduled, sending, sent, failed, cancelled).

**Table columns:**
| Column | Source |
|---|---|
| Name | `campaign_name` |
| Title | `title` |
| Display type | `display_type` |
| Target | `target_type` |
| Scheduled | `scheduled_at` |
| Sent | `sent_at` |
| Status | `status` |
| Stats | target count / sent / failed / skipped |
| Actions | view / duplicate / cancel |

**Features:**
- Filter by status
- View campaign detail (full info + delivery stats)
- Cancel scheduled campaign

#### 5.10.3 Campaign Builder (`/notifications/new`)

Full campaign form for planned/promotional messages.

**Fields (in addition to Quick Send fields):**
- Campaign name
- Start date/time
- End date/time
- Send now vs schedule later toggle
- Priority (number)
- Status (draft by default)

### 5.11 Users Management (`/users`)

**Purpose:** View and manage marketplace users.

**Data source:** Direct `profiles` table + `individual_seller_profiles` + `shops` (admin RLS bypass)

**Table columns:**
| Column | Source |
|---|---|
| Name | `full_name` |
| Phone | `phone` |
| Email | auth.users.email (via join or edge function) |
| Seller type | individual / shop / both / none |
| Listings count | direct query |
| Status | `account_status` |
| Joined | `created_at` |
| Actions | view |

**Features:**
- Search by name, phone, email
- Filter by seller type
- **View** → `/users/[id]` detail page

#### User Detail (`/users/[id]`)

**Sections:**
1. **Profile info** — name, phone, email, avatar, joined date, default city
2. **Seller status** — individual profile status, shop status (if any)
3. **Subscriptions** — list of subscriptions (active/expired), package info
4. **Featured credits** — current effective limit, usage, adjustment history
5. **Listings** — list of user's listings with status
6. **Quick actions:**
   - **Activate subscription** → modal: select package, shop (if applicable), note → `activate_subscription(userId, packageId, shopId?, note?)`
   - **Adjust featured credits** → `/featured-credits?userId=[id]`
   - **View package usage** → `get_user_package_usage(userId)` → show usage card

### 5.12 Shops Management (`/shops`)

**Purpose:** View all shops, approve pending shops, manage shop status.

**Data source:** Direct `shops` table (with city/area/market joins)

**Table columns:**
| Column | Source |
|---|---|
| Name | `shop_name` |
| Owner | owner name (from profiles) |
| City/Area | city, area |
| Listings | count |
| Approval | `approval_status` |
| Status | `status` |
| Verified | `verified_at` |
| Actions | view / approve / suspend / reactivate |

**Features:**
- Filter by approval_status (all / pending / approved / rejected / blocked)
- Search by name or owner
- **View** → `/shops/[id]` detail

#### Pending Shops (`/shops/pending`)

Quick-access filtered view of `approval_status = 'pending'` shops.

**Actions:**
- **Approve** → `approve_shop(shopId, reason?)`
- **Reject** → modal with reason → `reject_shop(shopId, reason)`
- **Request Changes** → modal with reason → `request_shop_changes(shopId, reason)`
- **View** → `/shops/[id]`

#### Shop Detail (`/shops/[id]`)

**Via:** `get_admin_shop_detail(shopId)`

**Display:**
- Shop name, logo, cover image
- Owner info (name, phone, email link)
- City/Area/Market
- Description, contact, WhatsApp
- Opening hours
- Business proof document (link/view)
- Approval status, verification status
- Listings count (with link to filtered listings)
- Active subscription info
- **Actions:** approve / reject / suspend / reactivate / request changes

### 5.13 Featured Credits (`/featured-credits`)

**Purpose:** Manage featured listing credits for specific users or shops.

**Via:** `get_user_package_usage(userId)`, `adjust_featured_credits(input)`

**Form:**
| Field | Type | Notes |
|---|---|---|
| User | search/select | Find user by name/phone/email |
| Shop | dropdown | Optional, only if user owns shops |
| Adjustment type | radio/select | `extra_credits` / `limit_override` / `unlimited` |
| Extra credits | number | Shown when type = `extra_credits` |
| Limit override | number | Shown when type = `limit_override` |
| Unlimited toggle | checkbox | Shown when type = `unlimited` |
| Start date | date picker | Optional |
| End date | date picker | Optional (leave empty for no expiry) |
| Reason | text | |
| Admin note | textarea | Internal only |

**Current usage display (after selecting user):**
- Package name + limits
- Active featured listings count
- Current effective limit
- Active adjustments list

**Warning when limit < usage:**
> "This user currently has more active featured listings than the new limit. Existing featured listings will remain active until their expiry. The user will not be able to feature more listings until usage drops below the new limit."

### 5.14 Announcement Banners (`/banners`)

**Purpose:** Manage announcement banners (info, deal, package, warning types).

**Data source:** `notification_campaigns` table where `display_type IN ('announcement', 'both')` (banners are announcement-type campaigns)

**Active/upcoming banners table:**
| Column | Source |
|---|---|
| Title | `title` |
| Template | `template_key` |
| Placement | placement name |
| Target | city/area/all |
| Start | `starts_at` |
| End | `ends_at` |
| Status | active / scheduled / expired |
| Priority | `priority` |
| Actions | edit / deactivate |

**Create/Edit banner form:**
| Field | Type |
|---|---|
| Template | dropdown: info / deal / seller_package / warning |
| Title | text |
| Message | textarea |
| Placement | dropdown (see 5.10.1 placements) |
| Target audience | dropdown (all / city / area / market) |
| City | dropdown (if target = city) |
| Area | dropdown (if target = area) |
| Action button label | text (optional) |
| Action deep link | text (optional) |
| Priority | number |
| Start date | date picker |
| End date | date picker |
| Active | checkbox |

### 5.15 Locations (`/locations`)

**Purpose:** Manage cities, areas, and markets.

**Data source:** Direct `cities`, `areas`, `markets` tables

#### Cities
- Table: name, country_code, status, sort_order
- Actions: create, edit, delete (soft: status inactive)

#### Areas per City (`/locations/[cityId]/areas`)
- Table: name, status, sort_order
- Actions: create, edit, delete

#### Markets per Area (`/locations/[cityId]/areas/[areaId]/markets`)
- Table: name, status, sort_order
- Actions: create, edit, delete

### 5.16 Settings (`/settings`)

**Purpose:** Configure app-level content.

**Data source:** `app_settings` table

**Editable settings:**
- App display name
- Welcome headline
- Welcome subtitle
- Onboarding slide text
- Payment instructions
- Support contact info
- Terms URL
- Privacy URL
- Help/FAQ URL

**Form:**
- Key-value editor (key = setting name, value = text)
- Save button → upsert into `app_settings`

## 6. Database Tables Accessible to Admin

All tables have RLS policies that allow admin bypass via `is_admin(auth.uid())`. The admin panel can query these tables directly (for reads) and use the existing RPCs (for writes that need business logic).

### Admin-modifiable tables (direct CRUD):
- `cities`, `areas`, `markets`
- `categories`, `category_fields`, `category_field_options`
- `packages`
- `campaigns`
- `notification_campaigns`
- `app_settings`

### Admin-readable tables (read-only via direct query):
- `profiles`
- `individual_seller_profiles`
- `shops`
- `listings`, `listing_images`, `listing_field_values`
- `subscriptions`
- `payments`
- `reports`
- `moderation_logs`
- `notifications`
- `notification_campaigns`
- `saved_listings`
- `featured_credit_adjustments`

### Admin-writable tables (via RPCs only, not direct):
- Listings → `approve_listing`, `reject_listing`, `request_listing_changes`, `remove_listing`, `mark_listing_suspicious`
- Shops → `approve_shop`, `reject_shop`, `request_shop_changes`, `suspend_shop`, `reactivate_shop`
- Payments → `approve_payment`, `reject_payment`
- Subscriptions → `activate_subscription`, `cancel_subscription`
- Featured credits → `adjust_featured_credits`
- Reports → `resolve_report`
- Notifications → direct insert into `notifications` table (admin bypass)

## 7. Existing Admin RPCs Reference

### Listing Review (migration 024)

| RPC | Params | Returns |
|---|---|---|
| `get_pending_listings` | `p_limit`, `p_offset` | Table: 20 columns including images, seller, city |
| `get_admin_listing_detail` | `p_listing_id` | JSONB: full listing with images, fields, owner |
| `approve_listing` | `p_listing_id`, `p_reason?` | boolean |
| `reject_listing` | `p_listing_id`, `p_reason` | boolean |
| `request_listing_changes` | `p_listing_id`, `p_reason` | boolean |
| `remove_listing` | `p_listing_id`, `p_reason` | boolean |
| `mark_listing_suspicious` | `p_listing_id`, `p_reason` | boolean |

### Shop Review (migration 024)

| RPC | Params | Returns |
|---|---|---|
| `get_pending_shops` | `p_limit`, `p_offset` | Table: 15 columns |
| `get_admin_shop_detail` | `p_shop_id` | JSONB |
| `approve_shop` | `p_shop_id`, `p_reason?` | boolean |
| `reject_shop` | `p_shop_id`, `p_reason` | boolean |
| `request_shop_changes` | `p_shop_id`, `p_reason` | boolean |
| `suspend_shop` | `p_shop_id`, `p_reason` | boolean |
| `reactivate_shop` | `p_shop_id`, `p_reason?` | boolean |

### Payments & Subscriptions (migration 027)

| RPC | Params | Returns |
|---|---|---|
| `get_pending_payments` | `p_limit`, `p_offset` | Table: 14 columns |
| `get_admin_payment_detail` | `p_payment_id` | JSONB |
| `approve_payment` | `p_payment_id`, `p_note?` | boolean |
| `reject_payment` | `p_payment_id`, `p_reason` | boolean |
| `activate_subscription` | `p_user_id`, `p_package_id`, `p_shop_id?`, `p_note?` | boolean |
| `cancel_subscription` | `p_subscription_id`, `p_reason` | boolean |
| `adjust_featured_credits` | 10 params (see schema) | boolean |
| `get_user_package_usage` | `p_user_id` | JSONB |

### Reports (migration 032)

| RPC | Params | Returns |
|---|---|---|
| `get_pending_reports` | `p_limit`, `p_offset` | Table: 13 columns |
| `resolve_report` | `p_report_id`, `p_resolution`, `p_note?` | boolean |

### Auth

| Function | Params | Returns |
|---|---|---|
| `is_admin` | `check_user_id` | boolean |

## 8. Notification Triggers from Admin Actions

The following admin actions automatically create in-app notifications (handled by the RPCs, not the admin UI):

- `approve_listing` → notification: "Your listing has been approved"
- `reject_listing` → notification: "Your listing was rejected" + reason
- `request_listing_changes` → notification: "Changes requested" + reason
- `approve_shop` → notification: "Your shop has been approved"
- `reject_shop` → notification: "Your shop was rejected" + reason
- `approve_payment` → notification: "Payment approved, package activated"
- `reject_payment` → notification: "Payment was rejected" + reason
- `activate_subscription` → notification: "Package activated"

The admin UI does not need to create these notifications manually. The RPCs handle it. The Quick Send feature is for manual/ad-hoc notifications only.

## 9. Shared Components

Use existing Polaris components as much as possible. Build thin wrappers only where needed for project-specific patterns.

### Polaris components used directly (no wrapper needed)

| Polaris Component | Usage |
|---|---|
| `Frame` + `Navigation` + `TopBar` | Layout shell (sidebar + header) |
| `Page` | Page wrapper with title, actions, breadcrumbs |
| `Card` | Content containers |
| `Banner` | Inline errors, warnings, info |
| `Toast` (via `useToast`/`Frame`) | Success/error notifications |
| `Modal` | Confirmation dialogs, reason input modals |
| `Button` / `ButtonGroup` | Actions |
| `Badge` | Status pills |
| `TextField` | Text/textarea inputs |
| `Select` | Dropdowns |
| `DataTable` | Sortable data tables |
| `IndexTable` | Row-action tables with checkboxes |
| `Pagination` | Page navigation |
| `EmptyState` | Empty list state |
| `Spinner` | Loading state |
| `SkeletonPage` / `SkeletonBodyText` | Page/section skeleton loading |
| `Icon` | Icons |
| `Thumbnail` | Image thumbnails |
| `Tooltip` | Hover info |
| `Box` / `Grid` / `Stack` / `Inline` | Layout primitives |

### Custom thin wrappers (only where needed)

| Component | Purpose | Underlying Polaris |
|---|---|---|
| `ReasonModal` | Modal with textarea for rejection reason | `Modal` + `TextField` |
| `StatusBadge` | Auto-color badge from status string | `Badge` |
| `ConfirmAction` | Confirm-then-execute action button | `Modal` + `Button` |
| `StatCard` | Dashboard metric card with icon + link | `Card` + `Box` + `Text` |
| `PageHeader` (if needed) | Page title with action | `Page` |
| `Toast` | Success/error notifications | `Frame.toast` / `useToast` |

These wrappers should be thin — no custom CSS, just config-driven Polaris usage.
## 10. Data Fetching Pattern

### Server Components (RSC)

Use the Supabase server client for authenticated data fetching:

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createAdminClient() {
  const cookieStore = await cookies()
  // Uses service role key for server-side data access (admin bypass)
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
}

// For route handlers and server actions needing the user's session context
export async function createSessionClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
}
```

### Client Components

Use the Supabase browser client for mutations and interactive data:

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Server Actions

For mutations (approve, reject, create, update):

```typescript
'use server'
// Call the appropriate RPC via admin client
```

## 11. Error Handling

- **Loading states:** Show skeleton/spinner on every page while data loads
- **Empty states:** Show "No [items] found" with relevant icon
- **Error states:** Show inline error banner with "Try Again" button
- **Mutation errors:** Show toast notification with error message
- **Auth errors:** Redirect to `/login` if session expired

## 12. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=<project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>  // for server-side admin data fetching
```

## 13. Build Order

Recommended implementation order within this project:

1. **Setup** — Supabase clients, proxy (Next.js 16 middleware), auth guard, login page
2. **Layout** — Polaris Frame + Navigation + TopBar, Providers (AppProvider)
3. **Shared components** — ReasonModal, StatusBadge, StatCard wrappers (Polaris direct for everything else)
4. **Dashboard** — stat cards, recent activity lists
5. **Pending Listings + Listing Detail** — table + detail + action flow
6. **Pending Payments + Payment Detail** — table + detail + approval flow
7. **Shops + Pending Shops + Shop Detail** — management + approval flow
8. **Users + User Detail** — list + detail + subscription activation
9. **Packages** — CRUD
10. **Categories + Fields** — CRUD
11. **Reports** — moderation queue
12. **Notifications + Campaigns** — Quick Send + campaign builder + list
13. **Banners** — CRUD
14. **Featured Credits** — adjustment form + usage display
15. **Locations** — city/area/market CRUD
16. **Settings** — app settings editor

## 14. Relation to Existing Docs

This spec is built from and aligns with:
- `00-master-plan.md` — architecture, admin as web dashboard
- `01-product-and-business-rules.md` — packages, featured credits, offers, shop approval, notifications
- `02-admin-panel-and-configurable-settings.md` — all 8 admin screens, configurable settings, featured credit management, campaign builder, Quick Send, banners
- `03-supabase-database-rls-and-seeders.md` — table structures, RLS admin bypass
- `04-edge-functions-api-and-calculations.md` — where business logic lives
- `05-ui-ux-screens-data-sync-and-theme.md` — admin screen list, layout style
- `07-notifications-and-campaigns.md` — Quick Send, campaign builder, targeting, notification triggers from admin actions
- `08-module-build-order-status-and-locking.md` — module 37, 38, 39 (admin screens)
- `ai-handover.md` — working style, RPC usage rules, locking rules
- Mobile implementation: `src/api/admin.ts`, `src/api/payment-admin.ts`, `src/api/reports-admin.ts` — exact RPC signatures and parameter types
