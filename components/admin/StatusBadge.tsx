import { Badge } from '@shopify/polaris'

const STATUS_TONE_MAP: Record<string, 'success' | 'critical' | 'warning' | 'info' | 'attention' | 'new'> = {
  approved: 'success',
  active: 'success',
  pending: 'warning',
  rejected: 'critical',
  blocked: 'critical',
  suspended: 'critical',
  draft: 'info',
  paused: 'attention',
  removed: 'critical',
  expired: 'critical',
  sold: 'info',
  resolved: 'success',
  dismissed: 'info',
  cancelled: 'critical',
  failed: 'critical',
  sending: 'attention',
  sent: 'success',
  scheduled: 'info',
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = STATUS_TONE_MAP[status.toLowerCase()] ?? 'info'
  return <Badge tone={tone}>{status}</Badge>
}
