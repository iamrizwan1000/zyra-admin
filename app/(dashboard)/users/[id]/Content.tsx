'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Page,
  Card,
  Layout,
  Text,
  Banner,
  BlockStack,
  SkeletonBodyText,
} from '@shopify/polaris'
import { getUserById } from '@/lib/api/admin'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface UserShop {
  id: string
  shop_name: string
  city_name: string
  approval_status: string
  status: string
}

interface UserListing {
  id: string
  title: string
  currency_code: string
  price: number
  city_name: string
  approval_status: string
  status: string
}

interface UserDetail {
  full_name: string
  phone: string | null
  email: string | null
  account_status: string
  is_admin: boolean
  created_at: string
  shops: UserShop[]
  listings: UserListing[]
}

export function Content() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (params?.id) {
      ;(async () => {
        setLoading(true)
        setError(null)
        try {
          const result = await getUserById(params.id)
          if (!cancelled) setUser(result as UserDetail)
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load user')
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }
    return () => { cancelled = true }
  }, [params?.id])

  if (loading) {
    return (
      <Page title="" backAction={{ content: 'Back', onAction: () => router.push('/users') }}>
        <Card><SkeletonBodyText lines={8} /></Card>
      </Page>
    )
  }

  if (error && !user) {
    return (
      <Page title="User Not Found" backAction={{ content: 'Back', onAction: () => router.push('/users') }}>
        <Banner tone="critical">{error}</Banner>
      </Page>
    )
  }

  const u = user

  return (
    <Page
      title={u?.full_name || 'User Detail'}
      backAction={{ content: 'Back', onAction: () => router.push('/users') }}
    >
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}

      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <Text variant="headingSm" as="h2">Profile Information</Text>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Full Name</Text>
                  <Text variant="bodyMd" as="p">{u?.full_name || '-'}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Phone</Text>
                  <Text variant="bodyMd" as="p">{u?.phone || '-'}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Email</Text>
                  <Text variant="bodyMd" as="p">{u?.email || '-'}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Account Status</Text>
                  <div><StatusBadge status={u?.account_status ?? ''} /></div>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Admin</Text>
                  <Text variant="bodyMd" as="p">{u?.is_admin ? 'Yes' : 'No'}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Joined</Text>
                  <Text variant="bodyMd" as="p">{u?.created_at ? new Date(u.created_at).toLocaleString() : '-'}</Text>
                </div>
              </div>
            </Card>

            {u?.shops && u.shops.length > 0 && (
              <Card padding="0">
                <div className="p-3 border-b border-gray-200">
                  <Text variant="headingSm" as="h2">Shops ({u.shops.length})</Text>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 text-xs font-medium text-gray-500">NAME</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">CITY</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">APPROVAL</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.shops.map((shop) => (
                      <tr
                        key={shop.id}
                        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/shops/${shop.id}`)}
                      >
                        <td className="p-3"><Text variant="bodyMd" as="span" fontWeight="semibold">{shop.shop_name}</Text></td>
                        <td className="p-3"><Text variant="bodyMd" as="span">{shop.city_name}</Text></td>
                        <td className="p-3"><StatusBadge status={shop.approval_status} /></td>
                        <td className="p-3"><StatusBadge status={shop.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {u?.listings && u.listings.length > 0 && (
              <Card padding="0">
                <div className="p-3 border-b border-gray-200">
                  <Text variant="headingSm" as="h2">Listings ({u.listings.length})</Text>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 text-xs font-medium text-gray-500">TITLE</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">PRICE</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">CITY</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">APPROVAL</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.listings.map((listing) => (
                      <tr
                        key={listing.id}
                        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/listings/${listing.id}`)}
                      >
                        <td className="p-3"><Text variant="bodyMd" as="span" fontWeight="semibold">{listing.title}</Text></td>
                        <td className="p-3"><Text variant="bodyMd" as="span">{listing.currency_code} {listing.price}</Text></td>
                        <td className="p-3"><Text variant="bodyMd" as="span">{listing.city_name}</Text></td>
                        <td className="p-3"><StatusBadge status={listing.approval_status} /></td>
                        <td className="p-3"><StatusBadge status={listing.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
