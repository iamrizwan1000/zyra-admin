'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Page, Card, Text, Button, Modal, FormLayout, TextField, Select,
  SkeletonBodyText, Banner,
} from '@shopify/polaris'
import {
  getPendingReports, resolveReport,
} from '@/lib/supabase/admin-queries'
import { StatusBadge } from '@/components/admin/StatusBadge'
import type { PendingReport } from '@/lib/supabase/admin-queries'

const RESOLUTION_OPTIONS = [
  { label: 'Dismissed', value: 'dismissed' },
  { label: 'Warning Issued', value: 'warning_issued' },
  { label: 'Listing Removed', value: 'listing_removed' },
  { label: 'User Banned', value: 'user_banned' },
]

export function Content() {
  const [reports, setReports] = useState<PendingReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false
      if (severityFilter && r.severity !== severityFilter) return false
      return true
    })
  }, [reports, statusFilter, severityFilter])

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<PendingReport | null>(null)
  const [resolution, setResolution] = useState('dismissed')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        setReports(await getPendingReports(20, 0))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reports')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const openResolve = useCallback((report: PendingReport) => {
    setSelectedReport(report)
    setResolution('dismissed')
    setNote('')
    setModalOpen(true)
  }, [])

  const handleResolve = async () => {
    if (!selectedReport) return
    setSaving(true)
    setError(null)
    try {
      await resolveReport(selectedReport.id, resolution, note || undefined)
      setModalOpen(false)
      setSelectedReport(null)
      setReports(await getPendingReports(20, 0))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve report')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Page title="Reports">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page title="Reports">
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}

      <Card padding="0">
        <div className="p-3 border-b border-gray-200">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px]">
              <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
                { label: 'All', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'Resolved', value: 'resolved' },
                { label: 'Dismissed', value: 'dismissed' },
              ]} />
            </div>
            <div className="min-w-[140px]">
              <Select label="Severity" value={severityFilter} onChange={setSeverityFilter} options={[
                { label: 'All', value: '' },
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' },
              ]} />
            </div>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 text-xs font-medium text-gray-500">REPORTER</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">LISTING</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">REASON</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">MESSAGE</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">SEVERITY</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">STATUS</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">DATE</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">No reports match the selected filters.</td>
              </tr>
            )}
            {filteredReports.map((r) => (
              <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3"><Text variant="bodyMd" as="span">{r.reporter_name}</Text></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{r.listing_title}</Text></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{r.reason}</Text></td>
                <td className="p-3 max-w-xs">
                  <Text variant="bodyMd" as="span" truncate>{r.message}</Text>
                </td>
                <td className="p-3"><StatusBadge status={r.severity} /></td>
                <td className="p-3"><StatusBadge status={r.status} /></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{new Date(r.created_at).toLocaleDateString()}</Text></td>
                <td className="p-3">
                  <Button size="slim" onClick={() => openResolve(r)}>Resolve</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedReport ? `Resolve Report — ${selectedReport.listing_title}` : 'Resolve Report'}
        primaryAction={{
          content: 'Resolve',
          onAction: handleResolve,
          loading: saving,
          disabled: saving,
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Resolution"
              value={resolution}
              onChange={setResolution}
              options={RESOLUTION_OPTIONS}
            />
            <TextField
              label="Note (optional)"
              value={note}
              onChange={setNote}
              multiline={3}
              autoComplete="off"
              placeholder="Add a note about this resolution..."
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  )
}
