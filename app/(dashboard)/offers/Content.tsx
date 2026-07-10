'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Page, Card, Text, Button, Modal, FormLayout, TextField, Select,
  SkeletonBodyText, Banner, EmptyState,
} from '@shopify/polaris'
import {
  getCampaigns, createCampaign, updateCampaign, deleteCampaign, getPackages,
} from '@/lib/api/admin'
import { StatusBadge } from '@/components/admin/StatusBadge'
import type { Campaign, Package } from '@/lib/api/admin'

interface CampaignRow extends Campaign {
}

interface CampaignFormData {
  name: string
  offer_type: string
  value: string
  availability_starts_at: string
  availability_ends_at: string
  benefit_duration_days: string
  target_package_id: string
  status: string
}

const EMPTY_FORM: CampaignFormData = {
  name: '',
  offer_type: 'discount',
  value: '0',
  availability_starts_at: '',
  availability_ends_at: '',
  benefit_duration_days: '30',
  target_package_id: '',
  status: 'active',
}

export function Content() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CampaignFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [c, p] = await Promise.all([getCampaigns(), getPackages()])
        setCampaigns(c as CampaignRow[])
        setPackages(p)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((c: CampaignRow) => {
    setEditingId(c.public_id)
    setForm({
      name: c.name,
      offer_type: c.offer_type,
      value: String(c.value),
      availability_starts_at: c.availability_starts_at ?? '',
      availability_ends_at: c.availability_ends_at ?? '',
      benefit_duration_days: String(c.benefit_duration_days),
      target_package_id: String(c.target_package_id ?? ''),
      status: c.status,
    })
    setModalOpen(true)
  }, [])

  const reload = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([getCampaigns(), getPackages()])
      setCampaigns(c as CampaignRow[])
      setPackages(p)
    } catch {
      // best-effort reload
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const data = {
        name: form.name,
        offer_type: form.offer_type,
        value: Number(form.value),
        availability_starts_at: form.availability_starts_at || null,
        availability_ends_at: form.availability_ends_at || null,
        benefit_duration_days: Number(form.benefit_duration_days),
        target_package_id: form.target_package_id ? Number(form.target_package_id) : null,
        status: form.status,
      }
      if (editingId) {
        await updateCampaign(editingId, data)
      } else {
        await createCampaign(data as Omit<Campaign, 'id' | 'public_id'>)
      }
      setModalOpen(false)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (public_id: string) => {
    try {
      await deleteCampaign(public_id)
      setDeleteConfirmId(null)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const set = useCallback((field: keyof CampaignFormData) => (value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  if (loading) {
    return (
      <Page title="Offers / Campaigns">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page
      title="Offers / Campaigns"
      primaryAction={{ content: 'Create Offer', onAction: openCreate }}
    >
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}

      {campaigns.length === 0 && !loading && (
        <Card>
          <EmptyState heading="No offers" action={{ content: 'Create Offer', onAction: openCreate }} image="">
            <Text variant="bodyMd" as="p">Create your first seasonal offer or campaign to get started.</Text>
          </EmptyState>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((c) => (
          <div key={c.public_id} className={`rounded-xl border ${c.status === 'active' ? 'border-gray-200' : 'border-dashed border-gray-300'} bg-white overflow-hidden`}>
            <div className={`px-5 py-4 ${c.status === 'active' ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <Text variant="headingLg" as="h2" truncate>{c.name}</Text>
                  {c.target_package_id && (
                    <Text variant="bodySm" as="p" tone="subdued">Target package: {c.target_package_id}</Text>
                  )}
                </div>
                <StatusBadge status={c.status} />
              </div>
            </div>

            <div className="px-5 py-3 space-y-2">
              <div className="flex justify-between items-center">
                <Text variant="bodySm" as="span" tone="subdued">Type</Text>
                <Text variant="bodyMd" as="span" fontWeight="semibold">{c.offer_type}</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text variant="bodySm" as="span" tone="subdued">Value</Text>
                <Text variant="bodyMd" as="span" fontWeight="semibold">{c.value}</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text variant="bodySm" as="span" tone="subdued">Benefit Duration</Text>
                <Text variant="bodyMd" as="span" fontWeight="semibold">{c.benefit_duration_days} days</Text>
              </div>
              {c.availability_starts_at && (
                <div className="flex justify-between items-center">
                  <Text variant="bodySm" as="span" tone="subdued">Starts</Text>
                  <Text variant="bodyMd" as="span" fontWeight="semibold">{new Date(c.availability_starts_at).toLocaleDateString()}</Text>
                </div>
              )}
              {c.availability_ends_at && (
                <div className="flex justify-between items-center">
                  <Text variant="bodySm" as="span" tone="subdued">Ends</Text>
                  <Text variant="bodyMd" as="span" fontWeight="semibold">{new Date(c.availability_ends_at).toLocaleDateString()}</Text>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-2">
              <Button size="slim" onClick={() => openEdit(c)}>Edit</Button>
              <Button size="slim" tone="critical" onClick={() => setDeleteConfirmId(c.public_id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Offer' : 'Create Offer'}
        primaryAction={{
          content: editingId ? 'Save' : 'Create',
          onAction: handleSave,
          loading: saving,
          disabled: !form.name.trim() || saving,
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField label="Campaign Name" value={form.name} onChange={set('name')} autoComplete="off" autoFocus />
            <Select label="Offer Type" value={form.offer_type} onChange={set('offer_type')} options={[
              { label: 'Discount Percentage', value: 'discount_percentage' },
              { label: 'Discount Fixed', value: 'discount_fixed' },
              { label: 'Free Days', value: 'free_days' },
            ]} />
            <TextField label="Value" value={form.value} onChange={set('value')} type="number" autoComplete="off" helpText="Discount percentage or bonus amount" />
            <TextField label="Availability Start" value={form.availability_starts_at} onChange={set('availability_starts_at')} placeholder="ISO date" autoComplete="off" />
            <TextField label="Availability End" value={form.availability_ends_at} onChange={set('availability_ends_at')} placeholder="ISO date" autoComplete="off" />
            <TextField label="Benefit Duration (days)" value={form.benefit_duration_days} onChange={set('benefit_duration_days')} type="number" autoComplete="off" />
            <Select label="Target Package" value={form.target_package_id} onChange={set('target_package_id')} options={[
              { label: 'None', value: '' },
              ...packages.map(p => ({ label: p.name, value: String(p.id) })),
            ]} />
            <Select label="Status" value={form.status} onChange={set('status')} options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Expired', value: 'expired' },
            ]} />
          </FormLayout>
        </Modal.Section>
      </Modal>

      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Offer"
        primaryAction={{
          content: 'Delete',
          destructive: true,
          onAction: () => deleteConfirmId && handleDelete(deleteConfirmId),
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setDeleteConfirmId(null) }]}
      >
        <Modal.Section>
          <Text variant="bodyMd" as="p">Are you sure you want to delete this offer? This action cannot be undone.</Text>
        </Modal.Section>
      </Modal>
    </Page>
  )
}
