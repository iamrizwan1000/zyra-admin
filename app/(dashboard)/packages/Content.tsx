'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Page, Card, Text, Button, Modal, FormLayout, TextField, Checkbox, Select,
  SkeletonBodyText, Banner, BlockStack, InlineStack, Badge,
} from '@shopify/polaris'
import {
  getPackages, createPackage, updatePackage, deletePackage,
} from '@/lib/supabase/admin-queries'
import { StatusBadge } from '@/components/admin/StatusBadge'
import type { Package } from '@/lib/supabase/admin-queries'

interface PackageFormData {
  name: string
  price: string
  currency_code: string
  duration_days: string
  active_listing_limit: string
  featured_listing_limit: string
  daily_bump_limit: string
  verification_eligibility: boolean
  status: string
  sort_order: string
}

const EMPTY_FORM: PackageFormData = {
  name: '',
  price: '0',
  currency_code: 'PKR',
  duration_days: '30',
  active_listing_limit: '10',
  featured_listing_limit: '5',
  daily_bump_limit: '3',
  verification_eligibility: false,
  status: 'active',
  sort_order: '0',
}

function formFromPackage(pkg: Package): PackageFormData {
  return {
    name: pkg.name,
    price: String(pkg.price),
    currency_code: pkg.currency_code,
    duration_days: String(pkg.duration_days),
    active_listing_limit: String(pkg.active_listing_limit),
    featured_listing_limit: String(pkg.featured_listing_limit),
    daily_bump_limit: String(pkg.daily_bump_limit),
    verification_eligibility: pkg.verification_eligibility,
    status: pkg.status,
    sort_order: String(pkg.sort_order),
  }
}

interface StatRowProps {
  label: string
  value: string
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <Text variant="bodySm" as="span" tone="subdued">{label}</Text>
      <Text variant="bodyMd" as="span" fontWeight="semibold">{value}</Text>
    </div>
  )
}

export function Content() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PackageFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        setPackages(await getPackages())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load packages')
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

  const openEdit = useCallback((pkg: Package) => {
    setEditingId(pkg.id)
    setForm(formFromPackage(pkg))
    setModalOpen(true)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const data = {
        name: form.name,
        price: Number(form.price),
        currency_code: form.currency_code,
        duration_days: Number(form.duration_days),
        active_listing_limit: Number(form.active_listing_limit),
        featured_listing_limit: Number(form.featured_listing_limit),
        daily_bump_limit: Number(form.daily_bump_limit),
        verification_eligibility: form.verification_eligibility,
        status: form.status,
        sort_order: Number(form.sort_order),
      }
      if (editingId) {
        await updatePackage(editingId, data)
      } else {
        await createPackage(data)
      }
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
    try {
      setPackages(await getPackages())
    } catch {
      // Best-effort reload
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePackage(id)
      setDeleteConfirmId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
    try {
      setPackages(await getPackages())
    } catch {
      // Best-effort reload
    }
  }

  const set = useCallback((field: keyof PackageFormData) => (value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  if (loading) {
    return (
      <Page title="Packages">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page
      title="Packages"
      primaryAction={{ content: 'Add Package', onAction: openCreate }}
    >
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}

      {packages.length === 0 && !loading && (
        <Card>
          <BlockStack gap="200">
            <Text variant="bodyMd" as="p">No packages found. Create your first package to get started.</Text>
            <Button onClick={openCreate}>Add Package</Button>
          </BlockStack>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`rounded-xl border ${pkg.status === 'active' ? 'border-gray-200' : 'border-dashed border-gray-300'} bg-white overflow-hidden`}>
            <div className={`px-5 py-4 ${pkg.status === 'active' ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="flex items-start justify-between mb-3">
                <Text variant="headingLg" as="h2">{pkg.name}</Text>
                <StatusBadge status={pkg.status} />
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <Text variant="heading2xl" as="span" fontWeight="bold">
                  {pkg.currency_code} {pkg.price}
                </Text>
                <Text variant="bodySm" as="span" tone="subdued">/ {pkg.duration_days} days</Text>
              </div>
            </div>

            <div className="px-5 py-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Listing Limits</div>
              <StatRow label="Active Listings" value={String(pkg.active_listing_limit)} />
              <StatRow label="Featured Listings" value={String(pkg.featured_listing_limit)} />
              <StatRow label="Daily Bumps" value={String(pkg.daily_bump_limit)} />

              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">Features</div>
              <StatRow label="Verification" value={pkg.verification_eligibility ? 'Yes' : 'No'} />
              <StatRow label="Sort Order" value={String(pkg.sort_order)} />
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-2">
              <Button size="slim" onClick={() => openEdit(pkg)}>Edit</Button>
              <Button size="slim" tone="critical" onClick={() => setDeleteConfirmId(pkg.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Package' : 'Add Package'}
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
            <TextField label="Name" value={form.name} onChange={set('name')} autoComplete="off" autoFocus />
            <TextField label="Price" value={form.price} onChange={set('price')} type="number" autoComplete="off" />
            <Select label="Currency" value={form.currency_code} onChange={set('currency_code')} options={['PKR', 'USD']} />
            <TextField label="Duration (days)" value={form.duration_days} onChange={set('duration_days')} type="number" autoComplete="off" />
            <TextField label="Active Listing Limit" value={form.active_listing_limit} onChange={set('active_listing_limit')} type="number" autoComplete="off" />
            <TextField label="Featured Listing Limit" value={form.featured_listing_limit} onChange={set('featured_listing_limit')} type="number" autoComplete="off" />
            <TextField label="Daily Bump Limit" value={form.daily_bump_limit} onChange={set('daily_bump_limit')} type="number" autoComplete="off" />
            <Checkbox label="Verification Eligibility" checked={form.verification_eligibility} onChange={set('verification_eligibility')} />
            <Select label="Status" value={form.status} onChange={set('status')} options={['active', 'inactive']} />
            <TextField label="Sort Order" value={form.sort_order} onChange={set('sort_order')} type="number" autoComplete="off" />
          </FormLayout>
        </Modal.Section>
      </Modal>

      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Package"
        primaryAction={{
          content: 'Delete',
          destructive: true,
          onAction: () => deleteConfirmId && handleDelete(deleteConfirmId),
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setDeleteConfirmId(null) }]}
      >
        <Modal.Section>
          <Text variant="bodyMd" as="p">Are you sure you want to delete this package? This action cannot be undone.</Text>
        </Modal.Section>
      </Modal>
    </Page>
  )
}
