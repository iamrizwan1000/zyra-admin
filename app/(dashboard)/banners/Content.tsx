'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Page, Card, Text, Modal, FormLayout, TextField, Select,
  SkeletonBodyText, Banner, BlockStack, InlineStack, EmptyState,
} from '@shopify/polaris'
import { getNotificationCampaigns, createNotificationCampaign } from '@/lib/supabase/admin-queries'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface CampaignRecord {
  id: string
  campaign_name: string
  title: string
  message: string
  type: string
  display_type: string
  target_type: string
  status: string
  priority: string
  placement?: string
  starts_at: string | null
  ends_at: string | null
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
}

interface BannerFormData {
  campaign_name: string
  title: string
  message: string
  target_type: string
  placement: string
  priority: string
  status: string
  starts_at: string
  ends_at: string
}

const EMPTY_FORM: BannerFormData = {
  campaign_name: '',
  title: '',
  message: '',
  target_type: 'all',
  placement: '',
  priority: 'normal',
  status: 'draft',
  starts_at: '',
  ends_at: '',
}

export function Content() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const filteredBanners = useMemo(() => {
    let result = campaigns.filter(c => c.type === 'in_app' && c.display_type === 'announcement')
    if (statusFilter) result = result.filter(c => c.status === statusFilter)
    return result
  }, [campaigns, statusFilter])

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<BannerFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const all = await getNotificationCampaigns()
        setCampaigns(all)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load banners')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const openCreate = useCallback(() => {
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const data: Record<string, unknown> = {
        campaign_name: form.campaign_name,
        title: form.title,
        message: form.message,
        type: 'in_app',
        display_type: 'announcement',
        target_type: form.target_type,
        placement: form.placement,
        priority: form.priority,
        status: form.status,
      }
      if (form.starts_at) data.starts_at = form.starts_at
      if (form.ends_at) data.ends_at = form.ends_at
      await createNotificationCampaign(data)
      setModalOpen(false)
      setSuccess('Banner created successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create banner')
    } finally {
      setSaving(false)
    }
  }

  const set = useCallback((field: keyof BannerFormData) => (value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  if (loading) {
    return (
      <Page title="Banners">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page
      title="Banners"
      primaryAction={{ content: 'Add Banner', onAction: openCreate }}
    >
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
      {success && <Banner tone="success" onDismiss={() => setSuccess(null)}>{success}</Banner>}

      <Card padding="0">
        <div className="p-3">
          <div className="min-w-[140px]">
            <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
              { label: 'All', value: '' },
              { label: 'Draft', value: 'draft' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]} />
          </div>
        </div>
      </Card>

      {filteredBanners.length === 0 && !loading && (
        <Card>
          <EmptyState heading="No banners" action={{ content: 'Add Banner', onAction: openCreate }} image="">
            <Text variant="bodyMd" as="p">Create your first announcement banner to get started.</Text>
          </EmptyState>
        </Card>
      )}

      <BlockStack gap="400">
        {filteredBanners.map((c) => (
          <Card key={c.id}>
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <Text variant="headingMd" as="h2">{c.campaign_name}</Text>
                <StatusBadge status={c.status} />
              </InlineStack>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Title:</strong> {c.title}</p>
                <p><strong>Message:</strong> {c.message}</p>
                {c.placement && <p><strong>Placement:</strong> {c.placement}</p>}
                <p><strong>Priority:</strong> {c.priority}</p>
                <p><strong>Target:</strong> {c.target_type}</p>
                {c.starts_at && <p><strong>Starts:</strong> {new Date(c.starts_at).toLocaleString()}</p>}
                {c.ends_at && <p><strong>Ends:</strong> {new Date(c.ends_at).toLocaleString()}</p>}
              </div>
            </BlockStack>
          </Card>
        ))}
      </BlockStack>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Banner"
        primaryAction={{
          content: 'Create',
          onAction: handleSave,
          loading: saving,
          disabled: !form.campaign_name.trim() || !form.title.trim() || saving,
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField label="Campaign Name" value={form.campaign_name} onChange={set('campaign_name')} autoComplete="off" autoFocus />
            <TextField label="Title" value={form.title} onChange={set('title')} autoComplete="off" />
            <TextField label="Message" value={form.message} onChange={set('message')} multiline={3} autoComplete="off" />
            <Select label="Target Type" value={form.target_type} onChange={set('target_type')} options={[{ label: 'All', value: 'all' }, { label: 'City', value: 'city' }, { label: 'Area', value: 'area' }, { label: 'Market', value: 'market' }]} />
            <TextField label="Placement" value={form.placement} onChange={set('placement')} autoComplete="off" />
            <Select label="Priority" value={form.priority} onChange={set('priority')} options={[{ label: 'Low', value: 'low' }, { label: 'Normal', value: 'normal' }, { label: 'High', value: 'high' }]} />
            <Select label="Status" value={form.status} onChange={set('status')} options={[{ label: 'Draft', value: 'draft' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} />
            <TextField label="Starts At" value={form.starts_at} onChange={set('starts_at')} placeholder="ISO date" autoComplete="off" />
            <TextField label="Ends At" value={form.ends_at} onChange={set('ends_at')} placeholder="ISO date" autoComplete="off" />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  )
}
