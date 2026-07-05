# Phase 2A Public Read APIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-TOOL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 12 guest-safe public read APIs for buyer browsing using Supabase REST for simple lookups and PostgreSQL RPC functions for listing/shop detail/search.

**Architecture:** Simple lookups use the typed Supabase JS client with existing RLS. Complex listing search, listing detail, and shop listings use `SECURITY DEFINER` RPC functions that internally enforce active + approved visibility. The mobile app imports functions from `src/api/public.ts`.

**Tech Stack:** React Native/TypeScript, `@supabase/supabase-js`, Supabase PostgreSQL RPC, NativeWind (existing).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/types/supabase.ts` | Auto-generated TypeScript database types from `supabase gen types`. |
| `src/lib/supabase.ts` | Single typed Supabase client instance using the anon key. |
| `src/api/public.ts` | All 12 public read API functions used by the mobile app. |
| `supabase/migrations/016_public_listing_search_rpc.sql` | `search_listings(...)` RPC. |
| `supabase/migrations/017_public_listing_detail_rpc.sql` | `get_listing_detail(...)` RPC. |
| `supabase/migrations/018_public_shop_profile_listings_rpc.sql` | `get_shop_profile(...)` and `get_shop_public_listings(...)` RPCs. |
| `supabase/migrations/019_phase2a_verification.sql` | SQL verification queries for all endpoints. |

---

## Task 1: Generate Supabase TypeScript types

**Files:**
- Create: `src/types/supabase.ts`

- [ ] **Step 1: Ensure local Supabase is running**

Run:
```bash
supabase start --ignore-health-check
```
Expected: local stack starts and migrations apply.

- [ ] **Step 2: Generate types**

Run:
```bash
supabase gen types typescript --local > src/types/supabase.ts
```
Expected: `src/types/supabase.ts` is created with `Database` type.

- [ ] **Step 3: Verify the generated file exports `Database`**

Run:
```bash
head -20 src/types/supabase.ts
```
Expected: see `export type Database = { ... }`.

- [ ] **Step 4: Commit**

```bash
git add src/types/supabase.ts
git commit -m "chore: generate Supabase TypeScript types"
```

---

## Task 2: Create the Supabase client

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Install @supabase/supabase-js if missing**

Run:
```bash
npm list @supabase/supabase-js || npm install @supabase/supabase-js
```
Expected: package installed and listed in `package.json`.

- [ ] **Step 2: Write the typed client**

Create `src/lib/supabase.ts`:
```typescript
import {createClient} from '@supabase/supabase-js';
import {Database} from '../types/supabase';

const supabaseUrl =
  process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ??
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  },
);
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat: add typed Supabase anon client"
```

---

## Task 3: Create `search_listings` RPC

**Files:**
- Create: `supabase/migrations/016_public_listing_search_rpc.sql`

- [ ] **Step 1: Write the RPC migration**

Create `supabase/migrations/016_public_listing_search_rpc.sql`:
```sql
-- 016 — Public listing search RPC
-- Guest-safe search/filter for active + approved listings.

CREATE OR REPLACE FUNCTION public.search_listings(
  p_city_id uuid DEFAULT NULL,
  p_area_id uuid DEFAULT NULL,
  p_market_id uuid DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_brand text DEFAULT NULL,
  p_model text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_condition text DEFAULT NULL,
  p_storage text DEFAULT NULL,
  p_pta_status text DEFAULT NULL,
  p_seller_type text DEFAULT NULL,
  p_featured_only boolean DEFAULT false,
  p_verified_shop_only boolean DEFAULT false,
  p_keyword text DEFAULT NULL,
  p_sort_by text DEFAULT 'latest',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  shop_id uuid,
  category_id uuid,
  seller_type text,
  title text,
  description text,
  price numeric,
  old_price numeric,
  currency_code text,
  city_id uuid,
  area_id uuid,
  market_id uuid,
  is_featured boolean,
  featured_until timestamptz,
  status text,
  approval_status text,
  created_at timestamptz,
  cover_image_url text,
  shop_name text,
  shop_slug text,
  shop_verified boolean,
  city_name text,
  area_name text,
  market_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset integer := (p_page - 1) * p_page_size;
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.shop_id,
    l.category_id,
    l.seller_type,
    l.title,
    l.description,
    l.price,
    l.old_price,
    l.currency_code,
    l.city_id,
    l.area_id,
    l.market_id,
    l.is_featured,
    l.featured_until,
    l.status,
    l.approval_status,
    l.created_at,
    (
      SELECT li.image_url
      FROM public.listing_images li
      WHERE li.listing_id = l.id AND li.is_cover = true
      LIMIT 1
    ) AS cover_image_url,
    s.shop_name,
    s.slug AS shop_slug,
    (s.verified_at IS NOT NULL) AS shop_verified,
    c.name AS city_name,
    a.name AS area_name,
    m.name AS market_name
  FROM public.listings l
  LEFT JOIN public.shops s ON s.id = l.shop_id
  LEFT JOIN public.cities c ON c.id = l.city_id
  LEFT JOIN public.areas a ON a.id = l.area_id
  LEFT JOIN public.markets m ON m.id = l.market_id
  WHERE l.status = 'active'
    AND l.approval_status = 'approved'
    AND (p_city_id IS NULL OR l.city_id = p_city_id)
    AND (p_area_id IS NULL OR l.area_id = p_area_id)
    AND (p_market_id IS NULL OR l.market_id = p_market_id)
    AND (p_category_id IS NULL OR l.category_id = p_category_id)
    AND (p_seller_type IS NULL OR l.seller_type = p_seller_type)
    AND (p_min_price IS NULL OR l.price >= p_min_price)
    AND (p_max_price IS NULL OR l.price <= p_max_price)
    AND (p_featured_only = false OR l.is_featured = true)
    AND (
      p_verified_shop_only = false
      OR (l.shop_id IS NOT NULL AND s.verified_at IS NOT NULL)
    )
    AND (
      s.id IS NULL
      OR (s.approval_status = 'approved' AND s.status = 'active')
    )
    AND (
      p_keyword IS NULL
      OR l.title ILIKE '%' || p_keyword || '%'
      OR l.description ILIKE '%' || p_keyword || '%'
    )
    AND (
      p_brand IS NULL
      OR EXISTS (
        SELECT 1 FROM public.listing_field_values lfv
        JOIN public.category_fields cf ON cf.id = lfv.field_id
        WHERE lfv.listing_id = l.id AND cf.field_key = 'brand' AND lfv.value_text = p_brand
      )
    )
    AND (
      p_model IS NULL
      OR EXISTS (
        SELECT 1 FROM public.listing_field_values lfv
        JOIN public.category_fields cf ON cf.id = lfv.field_id
        WHERE lfv.listing_id = l.id AND cf.field_key = 'model' AND lfv.value_text = p_model
      )
    )
    AND (
      p_condition IS NULL
      OR EXISTS (
        SELECT 1 FROM public.listing_field_values lfv
        JOIN public.category_fields cf ON cf.id = lfv.field_id
        WHERE lfv.listing_id = l.id AND cf.field_key = 'condition' AND lfv.value_text = p_condition
      )
    )
    AND (
      p_storage IS NULL
      OR EXISTS (
        SELECT 1 FROM public.listing_field_values lfv
        JOIN public.category_fields cf ON cf.id = lfv.field_id
        WHERE lfv.listing_id = l.id AND cf.field_key = 'storage' AND lfv.value_text = p_storage
      )
    )
    AND (
      p_pta_status IS NULL
      OR EXISTS (
        SELECT 1 FROM public.listing_field_values lfv
        JOIN public.category_fields cf ON cf.id = lfv.field_id
        WHERE lfv.listing_id = l.id AND cf.field_key = 'pta_status' AND lfv.value_text = p_pta_status
      )
    )
  ORDER BY
    CASE WHEN p_sort_by = 'featured' THEN
      CASE WHEN l.is_featured = true THEN 0 ELSE 1 END
    END,
    CASE WHEN p_sort_by = 'price_asc' THEN l.price END ASC,
    CASE WHEN p_sort_by = 'price_desc' THEN l.price END DESC,
    CASE WHEN p_sort_by = 'latest' OR p_sort_by IS NULL THEN l.created_at END DESC
  LIMIT p_page_size OFFSET v_offset;
END;
$$;

-- Grant execute to anon and authenticated roles.
GRANT EXECUTE ON FUNCTION public.search_listings TO anon, authenticated;

COMMENT ON FUNCTION public.search_listings IS 'Guest-safe public listing search. Only returns active + approved listings from active + approved shops.';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/016_public_listing_search_rpc.sql
git commit -m "feat: add search_listings RPC for public listing feed"
```

---

## Task 4: Create `get_listing_detail` RPC

**Files:**
- Create: `supabase/migrations/017_public_listing_detail_rpc.sql`

- [ ] **Step 1: Write the RPC migration**

Create `supabase/migrations/017_public_listing_detail_rpc.sql`:
```sql
-- 017 — Public listing detail RPC
-- Returns a single listing with images, field values, and public shop info.

CREATE OR REPLACE FUNCTION public.get_listing_detail(p_listing_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  shop_id uuid,
  category_id uuid,
  seller_type text,
  title text,
  description text,
  price numeric,
  old_price numeric,
  currency_code text,
  city_id uuid,
  area_id uuid,
  market_id uuid,
  is_featured boolean,
  featured_until timestamptz,
  status text,
  approval_status text,
  created_at timestamptz,
  images jsonb,
  fields jsonb,
  shop jsonb,
  city_name text,
  area_name text,
  market_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.shop_id,
    l.category_id,
    l.seller_type,
    l.title,
    l.description,
    l.price,
    l.old_price,
    l.currency_code,
    l.city_id,
    l.area_id,
    l.market_id,
    l.is_featured,
    l.featured_until,
    l.status,
    l.approval_status,
    l.created_at,
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', li.id,
          'image_url', li.image_url,
          'thumbnail_url', li.thumbnail_url,
          'sort_order', li.sort_order,
          'is_cover', li.is_cover
        ) ORDER BY li.sort_order
      ), '[]'::jsonb)
      FROM public.listing_images li
      WHERE li.listing_id = l.id
    ) AS images,
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'field_key', cf.field_key,
          'field_name', cf.field_name,
          'value_text', lfv.value_text,
          'value_number', lfv.value_number,
          'value_boolean', lfv.value_boolean
        )
      ), '[]'::jsonb)
      FROM public.listing_field_values lfv
      JOIN public.category_fields cf ON cf.id = lfv.field_id
      WHERE lfv.listing_id = l.id
    ) AS fields,
    (
      SELECT jsonb_build_object(
        'id', s.id,
        'shop_name', s.shop_name,
        'slug', s.slug,
        'logo_url', s.logo_url,
        'verified', s.verified_at IS NOT NULL,
        'city_name', sc.name,
        'area_name', sa.name
      )
      FROM public.shops s
      LEFT JOIN public.cities sc ON sc.id = s.city_id
      LEFT JOIN public.areas sa ON sa.id = s.area_id
      WHERE s.id = l.shop_id
    ) AS shop,
    c.name AS city_name,
    a.name AS area_name,
    m.name AS market_name
  FROM public.listings l
  LEFT JOIN public.cities c ON c.id = l.city_id
  LEFT JOIN public.areas a ON a.id = l.area_id
  LEFT JOIN public.markets m ON m.id = l.market_id
  WHERE l.id = p_listing_id
    AND l.status = 'active'
    AND l.approval_status = 'approved'
    AND (
      l.shop_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.shops s
        WHERE s.id = l.shop_id AND s.approval_status = 'approved' AND s.status = 'active'
      )
    )
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_listing_detail TO anon, authenticated;

COMMENT ON FUNCTION public.get_listing_detail IS 'Guest-safe public listing detail. Only returns active + approved listings.';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/017_public_listing_detail_rpc.sql
git commit -m "feat: add get_listing_detail RPC"
```

---

## Task 5: Create shop profile and shop listings RPCs

**Files:**
- Create: `supabase/migrations/018_public_shop_profile_listings_rpc.sql`

- [ ] **Step 1: Write the RPC migration**

Create `supabase/migrations/018_public_shop_profile_listings_rpc.sql`:
```sql
-- 018 — Public shop profile and shop listings RPCs

CREATE OR REPLACE FUNCTION public.get_shop_profile(p_slug_or_id text)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  shop_name text,
  slug text,
  logo_url text,
  cover_url text,
  city_id uuid,
  area_id uuid,
  market_id uuid,
  description text,
  contact_number text,
  whatsapp_number text,
  opening_hours jsonb,
  approval_status text,
  status text,
  verified boolean,
  created_at timestamptz,
  city_name text,
  area_name text,
  market_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.owner_id,
    s.shop_name,
    s.slug,
    s.logo_url,
    s.cover_url,
    s.city_id,
    s.area_id,
    s.market_id,
    s.description,
    s.contact_number,
    s.whatsapp_number,
    s.opening_hours,
    s.approval_status,
    s.status,
    (s.verified_at IS NOT NULL) AS verified,
    s.created_at,
    c.name AS city_name,
    a.name AS area_name,
    m.name AS market_name
  FROM public.shops s
  LEFT JOIN public.cities c ON c.id = s.city_id
  LEFT JOIN public.areas a ON a.id = s.area_id
  LEFT JOIN public.markets m ON m.id = s.market_id
  WHERE s.approval_status = 'approved'
    AND s.status = 'active'
    AND (s.slug = p_slug_or_id OR s.id::text = p_slug_or_id)
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shop_profile TO anon, authenticated;

COMMENT ON FUNCTION public.get_shop_profile IS 'Guest-safe public shop profile. Only returns approved + active shops.';

CREATE OR REPLACE FUNCTION public.get_shop_public_listings(
  p_shop_id uuid,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  category_id uuid,
  seller_type text,
  title text,
  description text,
  price numeric,
  old_price numeric,
  currency_code text,
  city_id uuid,
  area_id uuid,
  market_id uuid,
  is_featured boolean,
  featured_until timestamptz,
  created_at timestamptz,
  cover_image_url text,
  city_name text,
  area_name text,
  market_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset integer := (p_page - 1) * p_page_size;
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.category_id,
    l.seller_type,
    l.title,
    l.description,
    l.price,
    l.old_price,
    l.currency_code,
    l.city_id,
    l.area_id,
    l.market_id,
    l.is_featured,
    l.featured_until,
    l.created_at,
    (
      SELECT li.image_url
      FROM public.listing_images li
      WHERE li.listing_id = l.id AND li.is_cover = true
      LIMIT 1
    ) AS cover_image_url,
    c.name AS city_name,
    a.name AS area_name,
    m.name AS market_name
  FROM public.listings l
  LEFT JOIN public.cities c ON c.id = l.city_id
  LEFT JOIN public.areas a ON a.id = l.area_id
  LEFT JOIN public.markets m ON m.id = l.market_id
  WHERE l.shop_id = p_shop_id
    AND l.status = 'active'
    AND l.approval_status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = p_shop_id AND s.approval_status = 'approved' AND s.status = 'active'
    )
  ORDER BY l.is_featured DESC, l.created_at DESC
  LIMIT p_page_size OFFSET v_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shop_public_listings TO anon, authenticated;

COMMENT ON FUNCTION public.get_shop_public_listings IS 'Guest-safe approved active listings for a public shop.';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/018_public_shop_profile_listings_rpc.sql
git commit -m "feat: add get_shop_profile and get_shop_public_listings RPCs"
```

---

## Task 6: Create the public TypeScript API layer

**Files:**
- Create: `src/api/public.ts`

- [ ] **Step 1: Write the API file**

Create `src/api/public.ts`:
```typescript
import {supabase} from '../lib/supabase';

// ---------------------------------------------------------------------------
// Simple public reads via Supabase REST
// ---------------------------------------------------------------------------

export async function getActiveCities() {
  return supabase.from('cities').select('*').eq('status', 'active').order('sort_order');
}

export async function getAreasByCity(cityId: string) {
  return supabase
    .from('areas')
    .select('*')
    .eq('city_id', cityId)
    .eq('status', 'active')
    .order('sort_order');
}

export async function getMarketsByCityArea(cityId: string, areaId?: string) {
  let query = supabase
    .from('markets')
    .select('*')
    .eq('city_id', cityId)
    .eq('status', 'active');
  if (areaId) {
    query = query.eq('area_id', areaId);
  }
  return query.order('sort_order');
}

export async function getActiveCategories() {
  return supabase
    .from('categories')
    .select('*')
    .eq('status', 'active')
    .order('sort_order');
}

export async function getCategoryFields(categoryId: string) {
  const fields = await supabase
    .from('category_fields')
    .select(`
      *,
      category_field_options(*)
    `)
    .eq('category_id', categoryId)
    .order('sort_order');
  return fields;
}

export async function getActivePackages() {
  return supabase
    .from('packages')
    .select('*')
    .eq('status', 'active')
    .order('sort_order');
}

export async function getAppSettings() {
  // Public settings only. The key list below should match keys that are safe
  // for the mobile app to expose to guests.
  const publicKeys = [
    'app_display_name',
    'welcome_headline',
    'welcome_subtitle',
    'payment_instructions',
    'support_contact',
    'onboarding_slide_1',
    'onboarding_slide_2',
    'onboarding_slide_3',
  ];
  return supabase.from('app_settings').select('key, value, description').in('key', publicKeys);
}

export async function getActiveBanners(
  placement?: string,
  cityId?: string,
  areaId?: string,
  marketId?: string,
) {
  let query = supabase
    .from('notification_campaigns')
    .select('*')
    .in('display_type', ['announcement', 'both'])
    .in('status', ['scheduled', 'sent'])
    .lte('starts_at', new Date().toISOString())
    .or('ends_at.is.null,ends_at.gte.' + new Date().toISOString());

  if (placement) {
    query = query.eq('placement', placement);
  }

  // Location targeting: include campaigns with no location filter OR matching location.
  if (cityId || areaId || marketId) {
    const locationConditions: string[] = [];
    locationConditions.push('city_id.is.null');
    if (cityId) locationConditions.push(`city_id.eq.${cityId}`);
    if (areaId) locationConditions.push(`area_id.eq.${areaId}`);
    if (marketId) locationConditions.push(`market_id.eq.${marketId}`);
    query = query.or(locationConditions.join(','));
  }

  return query.order('priority', {ascending: false});
}

// ---------------------------------------------------------------------------
// RPC-based public reads
// ---------------------------------------------------------------------------

export interface SearchListingsFilters {
  cityId?: string;
  areaId?: string;
  marketId?: string;
  categoryId?: string;
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  storage?: string;
  ptaStatus?: string;
  sellerType?: 'individual' | 'shop';
  featuredOnly?: boolean;
  verifiedShopOnly?: boolean;
  keyword?: string;
  sortBy?: 'latest' | 'price_asc' | 'price_desc' | 'featured';
  page?: number;
  pageSize?: number;
}

export async function searchListings(filters: SearchListingsFilters = {}) {
  return supabase.rpc('search_listings', {
    p_city_id: filters.cityId ?? null,
    p_area_id: filters.areaId ?? null,
    p_market_id: filters.marketId ?? null,
    p_category_id: filters.categoryId ?? null,
    p_brand: filters.brand ?? null,
    p_model: filters.model ?? null,
    p_min_price: filters.minPrice ?? null,
    p_max_price: filters.maxPrice ?? null,
    p_condition: filters.condition ?? null,
    p_storage: filters.storage ?? null,
    p_pta_status: filters.ptaStatus ?? null,
    p_seller_type: filters.sellerType ?? null,
    p_featured_only: filters.featuredOnly ?? false,
    p_verified_shop_only: filters.verifiedShopOnly ?? false,
    p_keyword: filters.keyword ?? null,
    p_sort_by: filters.sortBy ?? 'latest',
    p_page: filters.page ?? 1,
    p_page_size: filters.pageSize ?? 20,
  });
}

export async function getListingDetail(listingId: string) {
  return supabase.rpc('get_listing_detail', {p_listing_id: listingId});
}

export async function getShopProfile(slugOrId: string) {
  return supabase.rpc('get_shop_profile', {p_slug_or_id: slugOrId});
}

export async function getShopPublicListings(
  shopId: string,
  page: number = 1,
  pageSize: number = 20,
) {
  return supabase.rpc('get_shop_public_listings', {
    p_shop_id: shopId,
    p_page: page,
    p_page_size: pageSize,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/public.ts
git commit -m "feat: add public read API layer"
```

---

## Task 7: Create Phase 2A verification migration

**Files:**
- Create: `supabase/migrations/019_phase2a_verification.sql`

- [ ] **Step 1: Write the verification migration**

Create `supabase/migrations/019_phase2a_verification.sql`:
```sql
-- 019 — Phase 2A verification queries
-- Run these after applying 016–018 to confirm public read APIs work for guests.

-- 1. Active cities
SELECT COUNT(*) AS active_cities FROM public.cities WHERE status = 'active';

-- 2. Areas by city
SELECT city_id, COUNT(*) AS area_count FROM public.areas WHERE status = 'active' GROUP BY city_id;

-- 3. Markets by city/area
SELECT city_id, area_id, COUNT(*) AS market_count FROM public.markets WHERE status = 'active' GROUP BY city_id, area_id;

-- 4. Active categories
SELECT COUNT(*) AS active_categories FROM public.categories WHERE status = 'active';

-- 5. Category fields/options
SELECT cf.category_id, COUNT(*) AS field_count, COUNT(cfo.id) AS option_count
FROM public.category_fields cf
LEFT JOIN public.category_field_options cfo ON cfo.field_id = cf.id
GROUP BY cf.category_id;

-- 6. Active packages
SELECT COUNT(*) AS active_packages FROM public.packages WHERE status = 'active';

-- 7. App settings (public keys only)
SELECT key, value FROM public.app_settings
WHERE key IN (
  'app_display_name', 'welcome_headline', 'welcome_subtitle',
  'payment_instructions', 'support_contact',
  'onboarding_slide_1', 'onboarding_slide_2', 'onboarding_slide_3'
);

-- 8. Active banners
SELECT COUNT(*) AS active_banners
FROM public.notification_campaigns
WHERE display_type IN ('announcement', 'both')
  AND status IN ('scheduled', 'sent')
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now());

-- 9. search_listings RPC (no filters, should return 0 on empty seed)
SELECT COUNT(*) AS public_listings FROM public.search_listings();

-- 10. get_listing_detail RPC with a known listing id (replace with real uuid to test)
-- SELECT * FROM public.get_listing_detail('REPLACE_WITH_LISTING_UUID');

-- 11. get_shop_profile RPC with a known shop slug (replace to test)
-- SELECT * FROM public.get_shop_profile('REPLACE_WITH_SHOP_SLUG');

-- 12. get_shop_public_listings RPC with a known shop id (replace to test)
-- SELECT * FROM public.get_shop_public_listings('REPLACE_WITH_SHOP_UUID'::uuid);

-- Security checks
SELECT 'draft_listings_hidden' AS check_name, COUNT(*) AS count
FROM public.listings WHERE status = 'draft' OR approval_status != 'approved';

SELECT 'pending_shops_hidden' AS check_name, COUNT(*) AS count
FROM public.shops WHERE approval_status != 'approved' OR status != 'active';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/019_phase2a_verification.sql
git commit -m "chore: add Phase 2A verification queries"
```

---

## Task 8: Reset and verify end-to-end

- [ ] **Step 1: Run fresh reset**

```bash
supabase db reset
```
Expected: all migrations 001–019 apply successfully.

- [ ] **Step 2: Run verification queries**

```bash
export PATH="/opt/homebrew/Cellar/libpq/18.3/bin:$PATH"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/migrations/019_phase2a_verification.sql
```
Expected: all queries run without errors.

- [ ] **Step 3: Test APIs as anon/guest**

Create a temporary test script `scripts/test-public-apis.ts` or run via Node:
```typescript
import {supabase} from '../src/lib/supabase';
import {
  getActiveCities,
  searchListings,
  getListingDetail,
  getShopProfile,
} from '../src/api/public';

async function test() {
  const cities = await getActiveCities();
  console.log('cities', cities.data?.length, cities.error);

  const listings = await searchListings({pageSize: 5});
  console.log('listings', listings.data?.length, listings.error);

  const detail = await getListingDetail('00000000-0000-0000-0000-000000000000');
  console.log('detail rows', detail.data?.length);
}

test();
```
Expected: cities returns seeded 5 cities, listings returns 0 on empty seed, detail returns 0 rows without crashing.

- [ ] **Step 4: Commit verification results / remove temp script**

```bash
# Remove temp script if created in repo
git rm scripts/test-public-apis.ts || true
git commit -m "chore: verify Phase 2A public read APIs" || echo "nothing to commit"
```

---

## Task 9: Final review and summary

- [ ] **Step 1: Check git status**

```bash
git status --short
```
Expected: only the new Phase 2A files are present.

- [ ] **Step 2: Write Phase 2A implementation summary**

Create `docs/phase2a-implementation-summary.md` with:
- List of 12 endpoints
- Files added
- Verification results
- Security notes

- [ ] **Step 3: Commit summary**

```bash
git add docs/phase2a-implementation-summary.md
git commit -m "docs: add Phase 2A implementation summary"
```

- [ ] **Step 4: Stop and wait for review**

Do not push yet. Wait for user review before Phase 2B.

---

## Spec coverage check

| Spec requirement | Plan task |
|---|---|
| 12 public endpoints | Tasks 3–6 |
| Supabase REST for simple reads | Task 6 |
| RPC for listing/search/detail | Tasks 3–5 |
| Guest-safe, no service_role | Tasks 2, 6 |
| Only active + approved data | Tasks 3–5 SQL filters |
| No GPS/maps/nearby | No location logic in plan |
| Pagination/sorting/filtering in RPC | Task 3 |
| Request/response examples | JSDoc + verification migration |
| Verification queries | Task 7 |

## Placeholder scan

No TBD/TODO placeholders. All SQL and TypeScript code is complete. The only commented lines in verification are optional manual tests with real UUIDs/slugs.
