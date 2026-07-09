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
  getAdminListingDetail,
  approveListing,
  rejectListing,
  requestListingChanges,
  removeListing,
  markListingSuspicious,
} from '@/lib/api/admin'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ReasonModal } from '@/components/admin/ReasonModal'

export function Content() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [listing, setListing] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalType, setModalType] = useState<string | null>(null)
  const [modalTitle, setModalTitle] = useState('')

  const reloadListing = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      setListing(await getAdminListingDetail(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const id = params?.id
      if (!id || cancelled) return
      setLoading(true)
      setError(null)
      try {
        const result = await getAdminListingDetail(id)
        if (!cancelled) setListing(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load listing')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [params?.id])

  const handleAction = async (action: string, reason?: string) => {
    if (!params?.id) return
    try {
      switch (action) {
        case 'approve':
          await approveListing(params.id, reason)
          break
        case 'reject':
          await rejectListing(params.id, reason!)
          break
        case 'request-changes':
          await requestListingChanges(params.id, reason!)
          break
        case 'remove':
          await removeListing(params.id, reason!)
          break
        case 'mark-suspicious':
          await markListingSuspicious(params.id, reason!)
          break
      }
      await reloadListing(params.id)
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
      <Page title="" backAction={{ content: 'Back', onAction: () => router.push('/listings') }}>
        <Card><SkeletonBodyText lines={8} /></Card>
      </Page>
    )
  }

  if (error && !listing) {
    return (
      <Page title="Listing Not Found" backAction={{ content: 'Back', onAction: () => router.push('/listings') }}>
        <Banner tone="critical">{error}</Banner>
      </Page>
    )
  }

  const data = listing as Record<string, unknown> | null
  const l = (data?.listing as Record<string, unknown> | undefined) ?? data

  const renderVal = (v: unknown) => v != null ? String(v) : ''

  return (
    <Page
      title={renderVal(l?.title) || 'Listing Detail'}
      backAction={{ content: 'Back', onAction: () => router.push('/listings') }}
    >
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}

      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <div className="flex justify-end gap-2">
                <Button onClick={() => handleAction('approve')}>Approve</Button>
                <Button onClick={() => openModal('reject', 'Reject Listing')}>Reject</Button>
                <Button onClick={() => openModal('request-changes', 'Request Changes')}>Request Changes</Button>
                <Button onClick={() => openModal('remove', 'Remove Listing')}>Remove</Button>
                <Button onClick={() => openModal('mark-suspicious', 'Mark Suspicious')}>Mark Suspicious</Button>
              </div>
            </Card>

            {l && (l?.listing_images as Array<Record<string, string>> | undefined)?.length ? (
              <Card>
                <Text variant="headingSm" as="h2">Images</Text>
                <div className="flex gap-2 overflow-x-auto mt-3">
                  {(l.listing_images as Array<Record<string, string>>).map((img, i) => (
                    <Image key={i} src={img.image_url || img.thumbnail_url} alt="" width={160} height={160} className="w-40 h-40 object-cover rounded border border-gray-200" unoptimized />
                  ))}
                </div>
              </Card>
            ) : null}

            <Card>
              <Text variant="headingSm" as="h2">Listing Information</Text>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Title</Text>
                  <Text variant="bodyMd" as="p">{renderVal(l?.title)}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Status</Text>
                  <div><StatusBadge status={renderVal(l?.approval_status || l?.status)} /></div>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Price</Text>
                  <Text variant="bodyMd" as="p">{renderVal(l?.currency_code)} {renderVal(l?.price)}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Category</Text>
                  <Text variant="bodyMd" as="p">{renderVal(l?.category_name)}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">City</Text>
                  <Text variant="bodyMd" as="p">{renderVal(l?.city_name)}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Submitted</Text>
                  <Text variant="bodyMd" as="p">{l?.submitted_at ? new Date(renderVal(l.submitted_at)).toLocaleString() : '-'}</Text>
                </div>
                {!!l?.description && (
                  <div className="col-span-2">
                    <Text variant="bodySm" as="span" fontWeight="semibold">Description</Text>
                    <Text variant="bodyMd" as="p">{renderVal(l.description)}</Text>
                  </div>
                )}
              </div>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Text variant="headingSm" as="h2">Seller Information</Text>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <Text variant="bodySm" as="span" fontWeight="semibold">Name</Text>
                <Text variant="bodyMd" as="p">{renderVal(l?.seller_name)}</Text>
              </div>
              <div>
                <Text variant="bodySm" as="span" fontWeight="semibold">Phone</Text>
                <Text variant="bodyMd" as="p">{renderVal(l?.seller_phone)}</Text>
              </div>
            </div>
          </Card>
        </Layout.Section>

      </Layout>

      <ReasonModal
        open={!!modalType && modalType !== 'approve'}
        title={modalTitle}
        submitLabel={modalType === 'reject' ? 'Reject' : modalType === 'request-changes' ? 'Request Changes' : modalType === 'remove' ? 'Remove' : 'Submit'}
        onSubmit={(reason) => handleAction(modalType!, reason)}
        onClose={() => setModalType(null)}
      />
    </Page>
  )
}
