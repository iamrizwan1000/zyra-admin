import { createAdminClient } from './server'

export async function getDashboardStats() {
  const supabase = await createAdminClient()

  const [
    { count: totalUsers },
    { count: totalListings },
    { count: totalShops },
    { count: activeSubscriptions },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  return {
    totalUsers: totalUsers ?? 0,
    totalListings: totalListings ?? 0,
    totalShops: totalShops ?? 0,
    activeSubscriptions: activeSubscriptions ?? 0,
  }
}

export async function getPendingCounts() {
  const supabase = await createAdminClient()

  const { count: pendingListings } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('approval_status', 'pending')

  const { count: pendingPayments } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: pendingShops } = await supabase
    .from('shops')
    .select('*', { count: 'exact', head: true })
    .eq('approval_status', 'pending')

  const { count: pendingReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return {
    pendingListings: pendingListings ?? 0,
    pendingPayments: pendingPayments ?? 0,
    pendingShops: pendingShops ?? 0,
    pendingReports: pendingReports ?? 0,
  }
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>
export type PendingCounts = Awaited<ReturnType<typeof getPendingCounts>>
