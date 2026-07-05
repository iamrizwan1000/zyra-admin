'use client'

import dynamic from 'next/dynamic'

const Placeholder = dynamic(
  () => import('@/components/admin/PagePlaceholder').then((m) => ({ default: m.PagePlaceholder })),
  { ssr: false }
) as React.ComponentType<{ title: string }>

export default function Page() {
  return <Placeholder title="Offers" />
}
