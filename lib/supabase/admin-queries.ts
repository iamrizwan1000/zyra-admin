import { supabase } from './client'

// ─── Listings ───

export interface PendingListing {
  id: string
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

export async function getPendingListings(p_limit = 20, p_offset = 0) {
  const { data, error } = await supabase.rpc('get_pending_listings', { p_limit, p_offset })
  if (error) throw error
  return data as PendingListing[]
}

export async function getAdminListingDetail(p_listing_id: string) {
  const { data, error } = await supabase.rpc('get_admin_listing_detail', { p_listing_id })
  if (error) throw error
  return data
}

export async function approveListing(p_listing_id: string, p_reason?: string) {
  const { data, error } = await supabase.rpc('approve_listing', { p_listing_id, p_reason })
  if (error) throw error
  return data
}

export async function rejectListing(p_listing_id: string, p_reason: string) {
  const { data, error } = await supabase.rpc('reject_listing', { p_listing_id, p_reason })
  if (error) throw error
  return data
}

export async function requestListingChanges(p_listing_id: string, p_reason: string) {
  const { data, error } = await supabase.rpc('request_listing_changes', { p_listing_id, p_reason })
  if (error) throw error
  return data
}

export async function removeListing(p_listing_id: string, p_reason: string) {
  const { data, error } = await supabase.rpc('remove_listing', { p_listing_id, p_reason })
  if (error) throw error
  return data
}

export async function markListingSuspicious(p_listing_id: string, p_reason: string) {
  const { data, error } = await supabase.rpc('mark_listing_suspicious', { p_listing_id, p_reason })
  if (error) throw error
  return data
}

// ─── Shops ───

export interface PendingShop {
  id: string
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

export async function getPendingShops(p_limit = 20, p_offset = 0) {
  const { data, error } = await supabase.rpc('get_pending_shops', { p_limit, p_offset })
  if (error) throw error
  return data as PendingShop[]
}

export async function getAdminShopDetail(p_shop_id: string) {
  const { data, error } = await supabase.rpc('get_admin_shop_detail', { p_shop_id })
  if (error) throw error
  return data
}

export async function approveShop(p_shop_id: string, p_reason?: string) {
  const { data, error } = await supabase.rpc('approve_shop', { p_shop_id, p_reason })
  if (error) throw error
  return data
}

export async function rejectShop(p_shop_id: string, p_reason: string) {
  const { data, error } = await supabase.rpc('reject_shop', { p_shop_id, p_reason })
  if (error) throw error
  return data
}

export async function requestShopChanges(p_shop_id: string, p_reason: string) {
  const { data, error } = await supabase.rpc('request_shop_changes', { p_shop_id, p_reason })
  if (error) throw error
  return data
}

export async function suspendShop(p_shop_id: string, p_reason: string) {
  const { data, error } = await supabase.rpc('suspend_shop', { p_shop_id, p_reason })
  if (error) throw error
  return data
}

export async function reactivateShop(p_shop_id: string, p_reason?: string) {
  const { data, error } = await supabase.rpc('reactivate_shop', { p_shop_id, p_reason })
  if (error) throw error
  return data
}

// ─── Payments ───

export interface PendingPayment {
  id: string
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

export async function getPendingPayments(p_limit = 20, p_offset = 0) {
  const { data, error } = await supabase.rpc('get_pending_payments', { p_limit, p_offset })
  if (error) throw error
  return data as PendingPayment[]
}

export async function getAdminPaymentDetail(p_payment_id: string) {
  const { data, error } = await supabase.rpc('get_admin_payment_detail', { p_payment_id })
  if (error) throw error
  return data
}

export async function approvePayment(p_payment_id: string, p_note?: string) {
  const { data, error } = await supabase.rpc('approve_payment', { p_payment_id, p_note })
  if (error) throw error
  return data
}

export async function rejectPayment(p_payment_id: string, p_reason: string) {
  const { data, error } = await supabase.rpc('reject_payment', { p_payment_id, p_reason })
  if (error) throw error
  return data
}

export async function activateSubscription(p_user_id: string, p_package_id: string, p_shop_id?: string, p_note?: string) {
  const { data, error } = await supabase.rpc('activate_subscription', { p_user_id, p_package_id, p_shop_id, p_note })
  if (error) throw error
  return data
}

export async function cancelSubscription(p_subscription_id: string, p_reason: string) {
  const { data, error } = await supabase.rpc('cancel_subscription', { p_subscription_id, p_reason })
  if (error) throw error
  return data
}

// ─── Reports ───

export interface PendingReport {
  id: string
  reporter_name: string
  listing_title: string
  reason: string
  message: string
  severity: string
  status: string
  created_at: string
}

export async function getPendingReports(p_limit = 20, p_offset = 0) {
  const { data, error } = await supabase.rpc('get_pending_reports', { p_limit, p_offset })
  if (error) throw error
  return data as PendingReport[]
}

export async function resolveReport(p_report_id: string, p_resolution: string, p_note?: string) {
  const { data, error } = await supabase.rpc('resolve_report', { p_report_id, p_resolution, p_note })
  if (error) throw error
  return data
}

// ─── Featured Credits ───

export async function getUserPackageUsage(p_user_id: string) {
  const { data, error } = await supabase.rpc('get_user_package_usage', { p_user_id })
  if (error) throw error
  return data
}

export async function adjustFeaturedCredits(params: {
  p_user_id: string
  p_shop_id?: string
  p_adjustment_type: string
  p_extra_credits?: number
  p_limit_override?: number
  p_is_unlimited?: boolean
  p_starts_at?: string
  p_expires_at?: string
  p_reason?: string
  p_admin_note?: string
}) {
  const { data, error } = await supabase.rpc('adjust_featured_credits', params)
  if (error) throw error
  return data
}

// ─── Users ───

export interface AdminUser {
  id: string
  full_name: string
  phone: string
  email: string
  account_status: string
  is_admin: boolean
  created_at: string
  shop_count: number
  listing_count: number
}

export async function getUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, listings(count), shops(count)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, listings(*), shops(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ─── Packages ───

export interface Package {
  id: string
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
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data as Package[]
}

export async function createPackage(pkg: Omit<Package, 'id'>) {
  const { data, error } = await supabase.from('packages').insert(pkg).select().single()
  if (error) throw error
  return data as Package
}

export async function updatePackage(id: string, pkg: Partial<Package>) {
  const { data, error } = await supabase.from('packages').update(pkg).eq('id', id).select().single()
  if (error) throw error
  return data as Package
}

export async function deletePackage(id: string) {
  const { error } = await supabase.from('packages').delete().eq('id', id)
  if (error) throw error
}

// ─── Categories ───

export interface Category {
  id: string
  parent_id: string | null
  name: string
  slug: string
  status: string
  sort_order: number
}

export async function getCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data as Category[]
}

export async function createCategory(cat: Omit<Category, 'id'>) {
  const { data, error } = await supabase.from('categories').insert(cat).select().single()
  if (error) throw error
  return data as Category
}

export async function updateCategory(id: string, cat: Partial<Category>) {
  const { data, error } = await supabase.from('categories').update(cat).eq('id', id).select().single()
  if (error) throw error
  return data as Category
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function getCategoryFields(category_id: string) {
  const { data, error } = await supabase
    .from('category_fields')
    .select('*, category_field_options(*)')
    .eq('category_id', category_id)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

// ─── Cities / Areas / Markets ───

export async function getCities() {
  const { data, error } = await supabase.from('cities').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function createCity(city: { name: string; country_code: string; sort_order?: number }) {
  const { data, error } = await supabase.from('cities').insert(city).select().single()
  if (error) throw error
  return data
}

export async function updateCity(id: string, city: Partial<{ name: string; country_code: string; sort_order: number; status: string }>) {
  const { data, error } = await supabase.from('cities').update(city).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function getAreas(city_id: string) {
  const { data, error } = await supabase.from('areas').select('*').eq('city_id', city_id).order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function createArea(area: { city_id: string; name: string; sort_order?: number }) {
  const { data, error } = await supabase.from('areas').insert(area).select().single()
  if (error) throw error
  return data
}

export async function updateArea(id: string, area: Partial<{ name: string; sort_order: number; status: string }>) {
  const { data, error } = await supabase.from('areas').update(area).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function getMarkets(area_id: string) {
  const { data, error } = await supabase.from('markets').select('*').eq('area_id', area_id).order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function createMarket(market: { area_id: string; city_id: string; name: string; sort_order?: number }) {
  const { data, error } = await supabase.from('markets').insert(market).select().single()
  if (error) throw error
  return data
}

export async function updateMarket(id: string, market: Partial<{ name: string; sort_order: number; status: string }>) {
  const { data, error } = await supabase.from('markets').update(market).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ─── Settings ───

export async function getSettings() {
  const { data, error } = await supabase.from('app_settings').select('*').order('key', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertSetting(key: string, value: string) {
  const { data, error } = await supabase.from('app_settings').upsert({ key, value }).select().single()
  if (error) throw error
  return data
}

// ─── Notification Campaigns ───

export async function getNotificationCampaigns() {
  const { data, error } = await supabase.from('notification_campaigns').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createNotificationCampaign(campaign: Record<string, unknown>) {
  const { data, error } = await supabase.from('notification_campaigns').insert(campaign).select().single()
  if (error) throw error
  return data
}

// ─── Shops (direct table) ───

export async function getAllShops() {
  const { data, error } = await supabase
    .from('shops')
    .select('*, profiles(full_name, phone)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ─── Campaigns / Offers ───

export interface Campaign {
  id: string
  name: string
  offer_type: string
  value: number
  availability_starts_at: string | null
  availability_ends_at: string | null
  benefit_duration_days: number
  target_package_id: string | null
  status: string
}

export async function getCampaigns() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, packages!target_package_id(name)')
    .order('name', { ascending: true })
  if (error) throw error
  return data as (Campaign & { packages: { name: string } | null })[]
}

export async function createCampaign(campaign: Omit<Campaign, 'id'>) {
  const { data, error } = await supabase.from('campaigns').insert(campaign).select().single()
  if (error) throw error
  return data as Campaign
}

export async function updateCampaign(id: string, campaign: Partial<Campaign>) {
  const { data, error } = await supabase.from('campaigns').update(campaign).eq('id', id).select().single()
  if (error) throw error
  return data as Campaign
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) throw error
}

// ─── Subscriptions ───

export async function getSubscriptions() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, packages(name), profiles(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
