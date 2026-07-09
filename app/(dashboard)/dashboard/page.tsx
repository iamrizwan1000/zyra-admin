import { getAdminOverview } from '@/lib/api/server'
import { DashboardClient } from '@/components/admin/DashboardClient'

export default async function DashboardPage() {
  const overview = await getAdminOverview().catch(() => null)

  if (!overview) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
          Failed to load dashboard data. Check your API connection and make sure you are logged in as an admin.
        </div>
      </div>
    )
  }

  return <DashboardClient stats={overview.stats} pending={overview.pending} />
}
