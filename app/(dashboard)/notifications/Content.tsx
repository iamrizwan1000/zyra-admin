'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Page, Card, Text, Modal, FormLayout, TextField, Select,
  SkeletonBodyText, Banner, BlockStack, InlineStack, EmptyState,
} from '@shopify/polaris'
import { getNotificationCampaigns, createNotificationCampaign } from '@/lib/api/admin'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface CampaignRecord {
  id: number
  public_id: string
  campaign_name: string
  title: string
  message: string
  display_type: string
  target_type: string
  status: string
  priority: number
  starts_at: string | null
  ends_at: string | null
  scheduled_at: string | null
  created_at: string
}

interface NotificationFormData {
  campaign_name: string
  title: string
  message: string
  display_type: string
  target_type: string
  status: string
  priority: string
  starts_at: string
  ends_at: string
}

const EMPTY_FORM: NotificationFormData = {
  campaign_name: '',
  title: '',
  message: '',
  display_type: 'notification',
  target_type: 'all_logged_in',
  status: 'draft',
  priority: '0',
  starts_at: '',
  ends_at: '',
}

export function Content() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const filteredCampaigns = useMemo(() => {
    if (!statusFilter) return campaigns
    return campaigns.filter(c => c.status === statusFilter)
  }, [campaigns, statusFilter])

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<NotificationFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        setCampaigns(await getNotificationCampaigns())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaigns')
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
        display_type: form.display_type,
        target_type: form.target_type,
        status: form.status,
        priority: Number(form.priority),
      }
      if (form.starts_at) data.starts_at = form.starts_at
      if (form.ends_at) data.ends_at = form.ends_at
      await createNotificationCampaign(data)
      setModalOpen(false)
      setSuccess('Campaign created successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setSaving(false)
    }
  }

  const set = useCallback((field: keyof NotificationFormData) => (value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  if (loading) {
    return (
      <Page title="Notifications">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page
      title="Notifications"
      primaryAction={{ content: 'Create Campaign', onAction: openCreate }}
    >
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
      {success && <Banner tone="success" onDismiss={() => setSuccess(null)}>{success}</Banner>}

      <Card padding="0">
        <div className="p-3">
          <div className="min-w-[140px]">
            <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
              { label: 'All', value: '' },
              { label: 'Draft', value: 'draft' },
              { label: 'Scheduled', value: 'scheduled' },
              { label: 'Sent', value: 'sent' },
            ]} />
          </div>
        </div>
      </Card>

      {filteredCampaigns.length === 0 && !loading && (
        <Card>
          <EmptyState heading="No campaigns" action={{ content: 'Create Campaign', onAction: openCreate }} image="">
            <Text variant="bodyMd" as="p">Create your first notification campaign to get started.</Text>
          </EmptyState>
        </Card>
      )}

      <BlockStack gap="400">
        {filteredCampaigns.map((c) => (
          <Card key={c.public_id}>
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <Text variant="headingMd" as="h2">{c.campaign_name}</Text>
                <StatusBadge status={c.status} />
              </InlineStack>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Title:</strong> {c.title}</p>
                <p><strong>Display Type:</strong> {c.display_type}</p>
                <p><strong>Target:</strong> {c.target_type}</p>
                  <p><strong>Priority:</strong> {String(c.priority)}</p>
                  {c.scheduled_at && <p><strong>Scheduled:</strong> {new Date(c.scheduled_at).toLocaleString()}</p>}
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
        title="Create Campaign"
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
            <TextField label="Message" value={form.message} onChange={set('message')} multiline={4} autoComplete="off" />
            <Select label="Display Type" value={form.display_type} onChange={set('display_type')} options={[{ label: 'Notification', value: 'notification' }, { label: 'Banner', value: 'banner' }, { label: 'Both', value: 'both' }]} />
            <Select label="Target Type" value={form.target_type} onChange={set('target_type')} options={[{ label: 'All Logged In', value: 'all_logged_in' }, { label: 'User', value: 'user' }, { label: 'City', value: 'city' }, { label: 'User Type', value: 'user_type' }, { label: 'Package Status', value: 'package_status' }]} />
            <Select label="Status" value={form.status} onChange={set('status')} options={[{ label: 'Draft', value: 'draft' }, { label: 'Scheduled', value: 'scheduled' }, { label: 'Sent', value: 'sent' }]} />
            <Select label="Priority" value={form.priority} onChange={set('priority')} options={[{ label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '5', value: '5' }]} />
            <TextField label="Starts At" value={form.starts_at} onChange={set('starts_at')} placeholder="ISO date" autoComplete="off" />
            <TextField label="Ends At" value={form.ends_at} onChange={set('ends_at')} placeholder="ISO date" autoComplete="off" />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  )
}
