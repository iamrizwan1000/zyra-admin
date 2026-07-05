import { Card, Text, Box } from '@shopify/polaris'
import Link from 'next/link'

interface StatCardProps {
  label: string
  value: number | string
  link?: string
  tone?: 'base' | 'success' | 'critical' | 'caution' | 'subdued'
}

export function StatCard({ label, value, link, tone }: StatCardProps) {
  const content = (
    <Card padding="400" roundedAbove="sm">
      <Box>
        <Text variant="headingXl" as="p" tone={tone}>
          {value}
        </Text>
        <Text variant="bodyMd" as="p" tone="subdued">
          {label}
        </Text>
      </Box>
    </Card>
  )

  if (link) {
    return <Link href={link}>{content}</Link>
  }

  return content
}
