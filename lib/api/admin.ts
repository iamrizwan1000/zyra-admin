import { api, apiFetch, PageMeta } from './client'

// ─── Listings ───

export interface PendingListing {
  id: number
  public_id: string
  title: string
  price: number
  currency_code: string
  seller_name: string
  seller_phone: string
  category_name: string
  city_name: string
  status: string
  approval_status: string
  submitted_at: string
  listing_images: { thumbnail_url: string }[]
}

export async function getPendingListings(page = 1) {
  return api<PendingListing[]>('/admin/listings/pending', { query: { page } })
}

export async function getAdminListingDetail(id: string | number) {
  return api<unknown>(`/admin/listings/${id}`)
}

export async function approveListing(id: string | number, note?: string) {
  return api(`/admin/listings/${id}/approve`, { method: 'POST', body: { note } })
}

export async function rejectListing(id: string | number, reason: string) {
  return api(`/admin/listings/${id}/reject`, { method: 'POST', body: { reason } })
}

export async function requestListingChanges(id: string | number, reason: string) {
  return api(`/admin/listings/${id}/request-changes`, { method: 'POST', body: { reason } })
}

export async function removeListing(id: string | number, reason: string) {
  return api(`/admin/listings/${id}/remove`, { method: 'POST', body: { reason } })
}

export async function markListingSuspicious(id: string | number, reason: string) {
  return api(`/admin/listings/${id}/mark-suspicious`, { method: 'POST', body: { reason } })
}

// ─── Shops ───

export interface PendingShop {
  id: number
  public_id: string
  shop_name: string
  owner_name: string
  owner_phone: string
  city_name: string
  area_name: string
  approval_status: string
  status: string
  created_at: string
  logo_url: string
  description: string
  contact_number: string
  business_proof_url: string
}

export async function getPendingShops(page = 1) {
  return api<PendingShop[]>('/admin/shops/pending', { query: { page } })
}

export async function getAdminShopDetail(id: string | number) {
  return api<unknown>(`/admin/shops/${id}`)
}

export async function approveShop(id: string | number) {
  return api(`/admin/shops/${id}/approve`, { method: 'POST' })
}

export async function rejectShop(id: string | number, reason: string) {
  return api(`/admin/shops/${id}/reject`, { method: 'POST', body: { reason } })
}

export async function requestShopChanges(id: string | number, reason: string) {
  return api(`/admin/shops/${id}/request-changes`, { method: 'POST', body: { reason } })
}

export async function suspendShop(id: string | number, reason: string) {
  return api(`/admin/shops/${id}/suspend`, { method: 'POST', body: { reason } })
}

export async function reactivateShop(id: string | number) {
  return api(`/admin/shops/${id}/reactivate`, { method: 'POST' })
}

// ─── Payments ───

export interface PendingPayment {
  id: number
  public_id: string
  user_name: string
  user_phone: string
  package_name: string
  amount: number
  currency_code: string
  method: string
  proof_url: string
  status: string
  submitted_at: string
}

export async function getPendingPayments(page = 1) {
  return api<PendingPayment[]>('/admin/payments/pending', { query: { page } })
}

export async function getAdminPaymentDetail(id: string | number) {
  return api<unknown>(`/admin/payments/${id}`)
}

export async function approvePayment(id: string | number) {
  return api(`/admin/payments/${id}/approve`, { method: 'POST' })
}

export async function rejectPayment(id: string | number, reason: string) {
  return api(`/admin/payments/${id}/reject`, { method: 'POST', body: { reason } })
}

// ─── Subscriptions ───

export async function activateSubscription(user_id: string, package_id: string, shop_id?: string, note?: string) {
  return api<{ success: boolean; id: string }>('/admin/subscriptions/activate', {
    method: 'POST',
    body: { user_id, package_id, shop_id: shop_id ?? null, note: note ?? null },
  })
}

export async function cancelSubscription(id: string | number, reason: string) {
  return api(`/admin/subscriptions/${id}/cancel`, { method: 'POST', body: { reason } })
}

// ─── Reports ───

export interface PendingReport {
  id: number
  public_id: string
  reporter_name: string
  listing_title: string
  reason: string
  message: string
  severity: string
  status: string
  created_at: string
}

export async function getPendingReports(page = 1) {
  return api<PendingReport[]>('/admin/reports/pending', { query: { page } })
}

export async function resolveReport(id: string | number, resolution: 'resolved' | 'dismissed', note?: string) {
  return api(`/admin/reports/${id}/resolve`, { method: 'POST', body: { resolution, note } })
}

// ─── Featured Credits ───

export async function getUserPackageUsage(userId: string | number) {
  return api<unknown>(`/admin/users/${userId}/package-usage`)
}

export interface FeaturedCreditAdjustment {
  user_id?: string
  shop_id?: string
  adjustment_type: 'extra_credits' | 'limit_override' | 'unlimited'
  extra_credits?: number
  limit_override?: number
  is_unlimited?: boolean
  starts_at?: string
  expires_at?: string
  reason?: string
  admin_note?: string
}

export async function adjustFeaturedCredits(adjustment: FeaturedCreditAdjustment) {
  return api('/admin/featured-credits', { method: 'POST', body: adjustment })
}

// ─── Users ───

export interface AdminUser {
  id: number
  public_id: string
  full_name: string
  phone: string | null
  email: string | null
  account_status: string
  is_admin: boolean
  created_at: string
  shop_count: number
  listing_count: number
}

export async function getUsers(search?: string, page = 1) {
  return apiFetch<AdminUser[]>('/admin/users', { query: { search, page } })
}

export async function getUserById(id: string | number) {
  return api<unknown>(`/admin/users/${id}`)
}

export async function suspendUser(id: string | number) {
  return api(`/admin/users/${id}/suspend`, { method: 'POST' })
}

export async function activateUser(id: string | number) {
  return api(`/admin/users/${id}/activate`, { method: 'POST' })
}

// ─── Packages ───

export interface Package {
  id: number
  public_id: string
  name: string
  price: number
  currency_code: string
  duration_days: number
  active_listing_limit: number
  featured_listing_limit: number
  daily_bump_limit: number
  verification_eligibility: boolean
  status: string
  sort_order: number
}

export async function getPackages() {
  return api<Package[]>('/admin/packages')
}

export async function createPackage(pkg: Omit<Package, 'id' | 'public_id'>) {
  return api<Package>('/admin/packages', { method: 'POST', body: pkg })
}

export async function updatePackage(id: string | number, pkg: Partial<Omit<Package, 'id' | 'public_id'>>) {
  return api<Package>(`/admin/packages/${id}`, { method: 'PUT', body: pkg })
}

export async function deletePackage(id: string | number) {
  await api(`/admin/packages/${id}`, { method: 'DELETE' })
}

// ─── Categories ───

export interface Category {
  id: number
  public_id: string
  parent_id: number | null
  name: string
  slug: string
  status: string
  sort_order: number
}

export async function getCategories() {
  return api<Category[]>('/admin/categories')
}

export async function createCategory(cat: Omit<Category, 'id' | 'public_id'>) {
  return api<Category>('/admin/categories', { method: 'POST', body: cat })
}

export async function updateCategory(id: string | number, cat: Partial<Omit<Category, 'id' | 'public_id'>>) {
  return api<Category>(`/admin/categories/${id}`, { method: 'PUT', body: cat })
}

export async function deleteCategory(id: string | number) {
  await api(`/admin/categories/${id}`, { method: 'DELETE' })
}

export interface CategoryFieldOption {
  id: string
  label: string
  value: string
  sort_order: number
}

export interface CategoryField {
  id: string
  category_id: string
  field_key: string
  field_name: string
  field_type: string
  is_required: boolean
  is_filterable: boolean
  is_searchable: boolean
  show_on_card: boolean
  show_on_detail: boolean
  sort_order: number
  options: CategoryFieldOption[]
}

// Fields are read from the category detail endpoint (there is no GET /admin/category-fields)
export async function getCategoryFields(categoryId: string) {
  const category = await api<Record<string, unknown>>(`/admin/categories/${categoryId}`)
  const rawFields = (category.fields ?? category.category_fields ?? []) as Record<string, unknown>[]
  return rawFields.map((field) => ({
    ...field,
    options: (field.options ?? field.field_options ?? field.category_field_options ?? []) as CategoryFieldOption[],
  })) as unknown as CategoryField[]
}

// ─── Cities / Areas / Markets ───

export interface City {
  id: number
  public_id: string
  name: string
  country_code: string
  sort_order: number
  status: string
}

export interface Area {
  id: number
  public_id: string
  city_id: number
  name: string
  sort_order: number
  status: string
}

export interface Market {
  id: number
  public_id: string
  city_id: number
  area_id: number | null
  name: string
  sort_order: number
  status: string
}

export async function getCities() {
  return api<City[]>('/admin/cities')
}

export async function createCity(city: { name: string; country_code: string; sort_order?: number; status?: string }) {
  return api<City>('/admin/cities', { method: 'POST', body: city })
}

export async function updateCity(id: string | number, city: Partial<Omit<City, 'id' | 'public_id'>>) {
  return api<City>(`/admin/cities/${id}`, { method: 'PUT', body: city })
}

export async function getAreas(cityId: number) {
  const areas = await api<Area[]>('/admin/areas', { query: { city_id: cityId } })
  return areas.filter((a) => a.city_id === cityId)
}

export async function createArea(area: { city_id: number; name: string; sort_order?: number }) {
  return api<Area>('/admin/areas', { method: 'POST', body: area })
}

export async function updateArea(id: number, area: Partial<Omit<Area, 'id' | 'public_id' | 'city_id'>>) {
  return api<Area>(`/admin/areas/${id}`, { method: 'PUT', body: area })
}

export async function getMarkets(areaId: number) {
  const markets = await api<Market[]>('/admin/markets', { query: { area_id: areaId } })
  return markets.filter((m) => m.area_id === areaId)
}

export async function createMarket(market: { area_id: number | null; city_id: number; name: string; sort_order?: number }) {
  return api<Market>('/admin/markets', { method: 'POST', body: market })
}

export async function updateMarket(id: number, market: Partial<Omit<Market, 'id' | 'public_id' | 'city_id' | 'area_id'>>) {
  return api<Market>(`/admin/markets/${id}`, { method: 'PUT', body: market })
}

// ─── Settings ───

export interface SettingRecord {
  key: string
  value: string
}

export async function getSettings(): Promise<SettingRecord[]> {
  const data = await api<unknown>('/admin/settings')
  if (Array.isArray(data)) return data as SettingRecord[]
  return Object.entries(data as Record<string, unknown>)
    .map(([key, value]) => ({ key, value: typeof value === 'string' ? value : JSON.stringify(value) }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

export async function upsertSetting(key: string, value: string) {
  return api('/admin/settings', { method: 'PUT', body: { settings: { [key]: value } } })
}

// ─── Notification campaigns / banners (one model: /admin/banners) ───

export interface NotificationCampaign {
  id: number
  public_id: string
  campaign_name: string
  title: string
  message: string
  display_type: 'notification' | 'banner' | 'both'
  target_type: string
  target_user_id: string | null
  city_id: string | null
  user_type: string | null
  package_status: string | null
  placement: string | null
  priority: number
  action_label: string | null
  action_deep_link: string | null
  starts_at: string | null
  ends_at: string | null
  scheduled_at: string | null
  status: string
  created_at: string
}

export async function getNotificationCampaigns() {
  return api<NotificationCampaign[]>('/admin/banners')
}

export async function createNotificationCampaign(campaign: Record<string, unknown>) {
  return api<NotificationCampaign>('/admin/banners', { method: 'POST', body: campaign })
}

export async function sendNotificationCampaign(id: string | number) {
  return api<{ campaign_id: string; status: string; recipients: number; dispatched_at: string }>(
    `/admin/banners/${id}/send`,
    { method: 'POST' },
  )
}

// ─── Promotional campaigns / offers ───

export interface Campaign {
  id: number
  public_id: string
  name: string
  offer_type: string
  value: number
  availability_starts_at: string | null
  availability_ends_at: string | null
  benefit_duration_days: number | null
  target_package_id: number | null
  status: string
}

export async function getCampaigns() {
  return api<Campaign[]>('/admin/campaigns')
}

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'public_id'>) {
  return api<Campaign>('/admin/campaigns', { method: 'POST', body: campaign })
}

export async function updateCampaign(id: string | number, campaign: Partial<Omit<Campaign, 'id' | 'public_id'>>) {
  return api<Campaign>(`/admin/campaigns/${id}`, { method: 'PUT', body: campaign })
}

export async function deleteCampaign(id: string | number) {
  await api(`/admin/campaigns/${id}`, { method: 'DELETE' })
}

export type { PageMeta }
