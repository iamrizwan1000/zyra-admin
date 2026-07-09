'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Page,
  Card,
  Layout,
  Text,
  Button,
  Banner,
  BlockStack,
  SkeletonBodyText,
} from '@shopify/polaris'
import {
  getAdminShopDetail,
  approveShop,
  rejectShop,
  requestShopChanges,
  suspendShop,
  reactivateShop,
} from '@/lib/api/admin'
import { openPrivateFile } from '@/lib/api/storage'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ReasonModal } from '@/components/admin/ReasonModal'

interface ShopDetailFields {
  shop_name: string
  cover_url: string | null
  logo_url: string | null
  description: string | null
  approval_status: string
  status: string
  city_name: string
  area_name: string | null
  market_name: string | null
  contact_number: string
  created_at: string
  owner_name: string
  owner_phone: string
  business_proof_url: string | null
}

type ShopQueryResult = ShopDetailFields | { shop: ShopDetailFields }

export function Content() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [shop, setShop] = useState<ShopQueryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalType, setModalType] = useState<string | null>(null)
  const [modalTitle, setModalTitle] = useState('')

  useEffect(() => {
    let cancelled = false
    if (params?.id) {
      ;(async () => {
        setLoading(true)
        setError(null)
        try {
          const result = await getAdminShopDetail(params.id)
          if (!cancelled) setShop(result as ShopQueryResult)
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load shop')
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }
    return () => { cancelled = true }
  }, [params?.id])

  const handleAction = async (action: string, reason?: string) => {
    if (!params?.id) return
    try {
      switch (action) {
        case 'approve':
          await approveShop(params.id)
          break
        case 'reject':
          await rejectShop(params.id, reason!)
          break
        case 'request-changes':
          await requestShopChanges(params.id, reason!)
          break
        case 'suspend':
          await suspendShop(params.id, reason!)
          break
        case 'reactivate':
          await reactivateShop(params.id)
          break
      }
      const result = await getAdminShopDetail(params.id)
      setShop(result as ShopQueryResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setModalType(null)
    }
  }

  const openModal = (action: string, title: string) => {
    setModalType(action)
    setModalTitle(title)
  }

  if (loading) {
    return (
      <Page title="" backAction={{ content: 'Back', onAction: () => router.push('/shops') }}>
        <Card><SkeletonBodyText lines={8} /></Card>
      </Page>
    )
  }

  if (error && !shop) {
    return (
      <Page title="Shop Not Found" backAction={{ content: 'Back', onAction: () => router.push('/shops') }}>
        <Banner tone="critical">{error}</Banner>
      </Page>
    )
  }

  const s = shop && 'shop' in shop ? shop.shop : shop

  return (
    <Page
      title={s?.shop_name || 'Shop Detail'}
      backAction={{ content: 'Back', onAction: () => router.push('/shops') }}
    >
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}

      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <div className="flex justify-end gap-2">
                {s?.approval_status !== 'approved' && (
                  <Button onClick={() => handleAction('approve')}>Approve</Button>
                )}
                {s?.approval_status !== 'rejected' && (
                  <Button onClick={() => openModal('reject', 'Reject Shop')}>Reject</Button>
                )}
                <Button onClick={() => openModal('request-changes', 'Request Changes')}>Request Changes</Button>
                {s?.status !== 'suspended' && (
                  <Button onClick={() => openModal('suspend', 'Suspend Shop')}>Suspend</Button>
                )}
                {s?.status === 'suspended' && (
                  <Button onClick={() => handleAction('reactivate')}>Reactivate</Button>
                )}
              </div>
            </Card>

            {s?.cover_url && (
              <Card>
                <div className="relative w-full h-48">
                  <Image
                    src={s.cover_url}
                    alt="Cover"
                    fill
                    className="object-cover rounded border border-gray-200"
                    unoptimized
                  />
                </div>
              </Card>
            )}

            <Card>
              <div className="flex items-center gap-4 mb-4">
                {s?.logo_url
                  ? <Image src={s.logo_url} alt="" width={64} height={64} className="w-16 h-16 object-cover rounded-full border border-gray-200" unoptimized />
                  : <div className="w-16 h-16 bg-gray-100 rounded-full" />}
                <div>
                  <Text variant="headingLg" as="h1">{s?.shop_name}</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">{s?.description}</Text>
                </div>
              </div>
            </Card>

            <Card>
              <Text variant="headingSm" as="h2">Shop Information</Text>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Approval Status</Text>
                  <div><StatusBadge status={s?.approval_status ?? ''} /></div>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Status</Text>
                  <div><StatusBadge status={s?.status ?? ''} /></div>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">City</Text>
                  <Text variant="bodyMd" as="p">{s?.city_name || '-'}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Area</Text>
                  <Text variant="bodyMd" as="p">{s?.area_name || '-'}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Market</Text>
                  <Text variant="bodyMd" as="p">{s?.market_name || '-'}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Contact</Text>
                  <Text variant="bodyMd" as="p">{s?.contact_number || '-'}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Created</Text>
                  <Text variant="bodyMd" as="p">{s?.created_at ? new Date(s.created_at).toLocaleString() : '-'}</Text>
                </div>
              </div>
            </Card>

            <Card>
              <Text variant="headingSm" as="h2">Owner Information</Text>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Name</Text>
                  <Text variant="bodyMd" as="p">{s?.owner_name || '-'}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Phone</Text>
                  <Text variant="bodyMd" as="p">{s?.owner_phone || '-'}</Text>
                </div>
              </div>
            </Card>

            {s?.business_proof_url && (
              <Card>
                <Text variant="headingSm" as="h2">Business Proof</Text>
                <button
                  type="button"
                  onClick={() => openPrivateFile(s.business_proof_url!).catch(() => setError('Failed to open business proof'))}
                  className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                >
                  View Business Proof
                </button>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>

      </Layout>

      <ReasonModal
        open={!!modalType}
        title={modalTitle}
        submitLabel={modalType === 'reject' ? 'Reject' : modalType === 'request-changes' ? 'Request Changes' : modalType === 'suspend' ? 'Suspend' : 'Submit'}
        onSubmit={(reason) => handleAction(modalType!, reason)}
        onClose={() => setModalType(null)}
      />
    </Page>
  )
}
