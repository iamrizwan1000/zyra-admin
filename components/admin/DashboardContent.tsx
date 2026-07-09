import { Page, Layout, Card, Text, Button, BlockStack } from '@shopify/polaris'
import { StatCard } from '@/components/admin/StatCard'
import type { DashboardStats, PendingCounts } from '@/lib/api/server'

export function DashboardContent({
  stats,
  pending,
}: {
  stats: DashboardStats
  pending: PendingCounts
}) {
  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Users" value={stats.totalUsers} />
              <StatCard label="Active Listings" value={stats.totalListings} tone="success" />
              <StatCard label="Active Shops" value={stats.totalShops} tone="success" />
              <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Pending Listings" value={pending.pendingListings} link="/listings" tone="caution" />
              <StatCard label="Pending Payments" value={pending.pendingPayments} link="/payments" tone="caution" />
              <StatCard label="Pending Shops" value={pending.pendingShops} link="/shops" tone="caution" />
              <StatCard label="Pending Reports" value={pending.pendingReports} link="/reports" tone="critical" />
            </div>
          </BlockStack>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <Text variant="headingMd" as="h2">Quick Actions</Text>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="primary" url="/listings">Review Pending Listings</Button>
              <Button variant="secondary" url="/payments">Review Pending Payments</Button>
              <Button variant="secondary" url="/shops">Review Shops</Button>
              <Button variant="secondary" url="/reports">Review Reports</Button>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
