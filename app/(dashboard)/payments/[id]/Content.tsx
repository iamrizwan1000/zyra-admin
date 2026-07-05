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
  getAdminPaymentDetail,
  approvePayment,
  rejectPayment,
} from '@/lib/supabase/admin-queries'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ReasonModal } from '@/components/admin/ReasonModal'

export function Content() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [payment, setPayment] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null)

  const reloadPayment = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      setPayment(await getAdminPaymentDetail(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment')
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
        const result = await getAdminPaymentDetail(id)
        if (!cancelled) setPayment(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load payment')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [params?.id])

  const handleApprove = async (note?: string) => {
    if (!params?.id) return
    try {
      await approvePayment(params.id, note)
      await reloadPayment(params.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setModalType(null)
    }
  }

  const handleReject = async (reason: string) => {
    if (!params?.id) return
    try {
      await rejectPayment(params.id, reason)
      await reloadPayment(params.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setModalType(null)
    }
  }

  if (loading) {
    return (
      <Page title="" backAction={{ content: 'Back', onAction: () => router.push('/payments') }}>
        <Card><SkeletonBodyText lines={8} /></Card>
      </Page>
    )
  }

  if (error && !payment) {
    return (
      <Page title="Payment Not Found" backAction={{ content: 'Back', onAction: () => router.push('/payments') }}>
        <Banner tone="critical">{error}</Banner>
      </Page>
    )
  }

  const data = payment as Record<string, unknown> | null
  const p = (data?.payment as Record<string, unknown> | undefined) ?? data

  const renderVal = (v: unknown) => v != null ? String(v) : ''

  return (
    <Page
      title={`Payment ${params?.id ? renderVal(params.id).slice(0, 8) + '...' : ''}`}
      backAction={{ content: 'Back', onAction: () => router.push('/payments') }}
    >
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}

      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setModalType('approve')}>Approve</Button>
                <Button onClick={() => setModalType('reject')}>Reject</Button>
              </div>
            </Card>

            {!!p?.proof_url && (
              <Card>
                <Text variant="headingSm" as="h2">Payment Proof</Text>
                <Image
                  src={renderVal(p.proof_url)}
                  alt="Payment proof"
                  width={800}
                  height={500}
                  className="max-w-full h-auto rounded border border-gray-200 mt-3"
                  style={{ maxHeight: 500 }}
                  unoptimized
                />
              </Card>
            )}

            <Card>
              <Text variant="headingSm" as="h2">Payment Information</Text>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">User</Text>
                  <Text variant="bodyMd" as="p">{renderVal(p?.user_name)}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Phone</Text>
                  <Text variant="bodyMd" as="p">{renderVal(p?.user_phone)}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Package</Text>
                  <Text variant="bodyMd" as="p">{renderVal(p?.package_name)}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Amount</Text>
                  <Text variant="bodyMd" as="p">{renderVal(p?.currency_code)} {renderVal(p?.amount)}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Method</Text>
                  <Text variant="bodyMd" as="p">{renderVal(p?.method)}</Text>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Status</Text>
                  <div><StatusBadge status={renderVal(p?.status)} /></div>
                </div>
                <div>
                  <Text variant="bodySm" as="span" fontWeight="semibold">Submitted</Text>
                  <Text variant="bodyMd" as="p">{p?.submitted_at ? new Date(renderVal(p.submitted_at)).toLocaleString() : '-'}</Text>
                </div>
              </div>
            </Card>
          </BlockStack>
        </Layout.Section>

      </Layout>

      <ReasonModal
        open={modalType === 'approve'}
        title="Approve Payment"
        submitLabel="Approve"
        onSubmit={handleApprove}
        onClose={() => setModalType(null)}
      />
      <ReasonModal
        open={modalType === 'reject'}
        title="Reject Payment"
        submitLabel="Reject"
        onSubmit={handleReject}
        onClose={() => setModalType(null)}
      />
    </Page>
  )
}
