'use client'

import dynamic from 'next/dynamic'
import type { DashboardStats, PendingCounts } from '@/lib/api/server'

const DashboardUI = dynamic(
  () => import('./DashboardContent').then((m) => ({ default: m.DashboardContent })),
  { ssr: false }
) as React.ComponentType<{ stats: DashboardStats; pending: PendingCounts }>

export function DashboardClient({
  stats,
  pending,
}: {
  stats: DashboardStats
  pending: PendingCounts
}) {
  return <DashboardUI stats={stats} pending={pending} />
}
