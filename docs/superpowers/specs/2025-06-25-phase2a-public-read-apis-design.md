# Phase 2A — Public Read APIs Design

**Date:** 2025-06-25  
**Status:** Approved  
**Branch:** `phase2/public-read-apis`  
**Depends on:** Phase 1 (`phase1/supabase-database-structure`)

## Goal

Provide public, guest-safe read APIs for buyer browsing. No authentication required. No seller/admin write operations. No private data exposed.

## Scope

12 public read endpoints:

### Simple Supabase REST/client queries (8)

1. `getActiveCities()`
2. `getAreasByCity(cityId)`
3. `getMarketsByCityArea(cityId, areaId?)`
4. `getActiveCategories()`
5. `getCategoryFields(categoryId)`
6. `getActivePackages()`
7. `getAppSettings()`
8. `getActiveBanners(placement?, cityId?, areaId?, marketId?)`

### PostgreSQL RPC functions (4)

9. `search_listings(...)` — public listing feed/search/filter
10. `get_listing_detail(listingId)` — public listing detail
11. `get_shop_profile(slugOrId)` — public shop profile
12. `get_shop_public_listings(shopId, ...)` — approved active listings of a public shop

## Security rules

- All endpoints work for guest/anon users.
- Use the anon Supabase client in the mobile app. No `service_role`.
- RLS policies remain the primary security layer.
- RPC functions use `SECURITY DEFINER` and internally enforce:
  - `listings.status = 'active' AND listings.approval_status = 'approved'`
  - `shops.approval_status = 'approved' AND shops.status = 'active'`
  - No draft, pending, rejected, paused, removed, expired, or private records.
- No GPS, maps, nearby, distance, or location permission logic.

## Architecture

- `src/lib/supabase.ts` — typed Supabase JS client using anon key.
- `src/types/supabase.ts` — generated database types.
- `src/api/public.ts` — all 12 public read functions.
- `supabase/migrations/016–019` — RPC functions and verification queries.

## Filters for `search_listings`

- `city_id` (uuid)
- `area_id` (uuid, optional)
- `market_id` (uuid, optional)
- `category_id` (uuid)
- `brand` (text, matches dynamic field)
- `model` (text, matches dynamic field)
- `min_price` / `max_price` (numeric)
- `condition` (text)
- `storage` (text)
- `pta_status` (text)
- `seller_type` ('individual' | 'shop')
- `featured_only` (boolean)
- `verified_shop_only` (boolean)
- `keyword` (text, searches title/description)
- `sort_by` ('latest' | 'price_asc' | 'price_desc' | 'featured')
- `page` (integer, default 1)
- `page_size` (integer, default 20)

## Output shape

- `search_listings` returns paginated listings with cover image, price, location, seller type, featured flag, and public shop info.
- `get_listing_detail` returns listing + images + field values + public shop/card info.
- `get_shop_profile` returns shop profile only if approved/active.
- `get_shop_public_listings` returns paginated approved active listings for that shop.

## Verification

Run `supabase/migrations/019_phase2a_verification.sql` after reset. It will:
- Call each RPC as anon.
- Confirm no private/draft/pending/rejected/paused/removed data leaks.
- Confirm RLS allows public reads.

## Out of scope

- Edge Functions.
- Admin APIs.
- Seller create/update APIs.
- Payment APIs.
- Notification sending APIs.
- Private stats.
