import { getDashboardStats, getPendingCounts } from '@/lib/supabase/queries'
import { DashboardClient } from '@/components/admin/DashboardClient'

export default async function DashboardPage() {
  const [stats, pending] = await Promise.all([
    getDashboardStats().catch(() => null),
    getPendingCounts().catch(() => null),
  ])

  if (!stats || !pending) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
          Failed to load dashboard data. Check your Supabase connection and make sure you are logged in as an admin.
        </div>
      </div>
    )
  }

  return <DashboardClient stats={stats} pending={pending} />
}
