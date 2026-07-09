import { cookies } from 'next/headers'
import { TOKEN_COOKIE } from './client'

export interface DashboardStats {
  totalUsers: number
  totalListings: number
  totalShops: number
  activeSubscriptions: number
}

export interface PendingCounts {
  pendingListings: number
  pendingPayments: number
  pendingShops: number
  pendingReports: number
}

// Tolerate naming variations in the overview payload (flat keys or a nested "pending" object)
function pick(data: Record<string, unknown>, ...keys: string[]): number {
  const pending = (data.pending ?? {}) as Record<string, unknown>
  for (const key of keys) {
    const value = data[key] ?? pending[key.replace(/^pending_/, '')]
    if (typeof value === 'number') return value
    if (typeof value === 'string' && value !== '' && !Number.isNaN(Number(value))) return Number(value)
  }
  return 0
}

export async function getAdminOverview(): Promise<{ stats: DashboardStats; pending: PendingCounts } | null> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value
  if (!token) return null

  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set')

  const res = await fetch(`${base}/admin/analytics/overview`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null

  const { data } = (await res.json()) as { data: Record<string, unknown> | null }
  if (!data) return null

  return {
    stats: {
      totalUsers: pick(data, 'total_users', 'users'),
      totalListings: pick(data, 'active_listings', 'total_listings', 'listings'),
      totalShops: pick(data, 'active_shops', 'total_shops', 'shops'),
      activeSubscriptions: pick(data, 'active_subscriptions', 'subscriptions'),
    },
    pending: {
      pendingListings: pick(data, 'pending_listings'),
      pendingPayments: pick(data, 'pending_payments'),
      pendingShops: pick(data, 'pending_shops'),
      pendingReports: pick(data, 'pending_reports'),
    },
  }
}
