'use client'

import dynamic from 'next/dynamic'

const Content = dynamic(
  () => import('./Content').then((m) => ({ default: m.Content })),
  { ssr: false }
) as React.ComponentType

export default function Page() {
  return <Content />
}
