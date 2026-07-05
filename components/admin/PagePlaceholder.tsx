'use client'

import { Page, Card, Text } from '@shopify/polaris'

export function PagePlaceholder({ title }: { title: string }) {
  return (
    <Page title={title}>
      <Card>
        <Text variant="bodyMd" as="p">{title} page coming soon.</Text>
      </Card>
    </Page>
  )
}
