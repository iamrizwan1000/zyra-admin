'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Page, Card, Text, Button, Select, SkeletonBodyText, Banner } from '@shopify/polaris'
import {
  getPendingPayments,
  approvePayment,
  rejectPayment,
} from '@/lib/api/admin'
import { openPrivateFile } from '@/lib/api/storage'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ReasonModal } from '@/components/admin/ReasonModal'
import type { PendingPayment } from '@/lib/api/admin'

export function Content() {
  const router = useRouter()
  const [payments, setPayments] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionTarget, setActionTarget] = useState<PendingPayment | null>(null)
  const [modalType, setModalType] = useState<'reject' | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')

  const methodOptions = useMemo(() => {
    const methods = [...new Set(payments.map(p => p.method).filter(Boolean))]
    return [{ label: 'All Methods', value: '' }, ...methods.map(m => ({ label: m, value: m }))]
  }, [payments])

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (statusFilter && p.status !== statusFilter) return false
      if (methodFilter && p.method !== methodFilter) return false
      return true
    })
  }, [payments, statusFilter, methodFilter])

  const loadPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      setPayments(await getPendingPayments())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await getPendingPayments()
        if (!cancelled) setPayments(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load payments')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleApprove = async (public_id: string) => {
    try {
      await approvePayment(public_id)
      await loadPayments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  const handleReject = async (reason: string) => {
    if (!actionTarget) return
    try {
      await rejectPayment(actionTarget.public_id, reason)
      await loadPayments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setActionTarget(null)
      setModalType(null)
    }
  }

  if (loading) {
    return (
      <Page title="Pending Payments">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page title="Pending Payments">
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
      <Card padding="0">
        <div className="p-3 border-b border-gray-200">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px]">
              <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
                { label: 'All', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ]} />
            </div>
            <div className="min-w-[140px]">
              <Select label="Method" value={methodFilter} onChange={setMethodFilter} options={methodOptions} />
            </div>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 text-xs font-medium text-gray-500">USER</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">PACKAGE</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">AMOUNT</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">METHOD</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">PROOF</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">STATUS</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">SUBMITTED</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">No payments match the selected filters.</td>
              </tr>
            )}
            {filteredPayments.map((p) => (
              <tr
                key={p.public_id}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/payments/${p.public_id}`)}
              >
                <td className="p-3"><Text variant="bodyMd" as="span">{p.user_name}</Text></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{p.package_name}</Text></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{p.currency_code} {p.amount}</Text></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{p.method}</Text></td>
                <td className="p-3">
                  {p.proof_url
                    ? <button type="button" onClick={(e) => { e.stopPropagation(); openPrivateFile(p.proof_url).catch(() => setError('Failed to open proof')) }} className="text-blue-600 hover:underline text-sm">View Proof</button>
                    : <Text variant="bodyMd" as="span">-</Text>}
                </td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{new Date(p.submitted_at).toLocaleDateString()}</Text></td>
                <td className="p-3">
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="slim" onClick={() => handleApprove(p.public_id)}>Approve</Button>
                    <Button size="slim" onClick={() => { setActionTarget(p); setModalType('reject') }}>Reject</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <ReasonModal
        open={modalType === 'reject'}
        title="Reject Payment"
        submitLabel="Reject"
        onSubmit={handleReject}
        onClose={() => { setActionTarget(null); setModalType(null) }}
      />
    </Page>
  )
}
