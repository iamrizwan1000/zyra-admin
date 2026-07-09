'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Page, Card, Text, Button, Modal, FormLayout, TextField, Select,
  SkeletonBodyText, Banner, BlockStack, InlineStack,
} from '@shopify/polaris'
import {
  getCategories, createCategory, updateCategory, deleteCategory,
} from '@/lib/api/admin'
import { StatusBadge } from '@/components/admin/StatusBadge'
import type { Category } from '@/lib/api/admin'

interface CategoryFormData {
  name: string
  slug: string
  status: string
  sort_order: string
  parent_id: string
}

const EMPTY_FORM: CategoryFormData = {
  name: '',
  slug: '',
  status: 'active',
  sort_order: '0',
  parent_id: '',
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
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        setCategories(await getCategories())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      setCategories(await getCategories())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((cat: Category) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug,
      status: cat.status,
      sort_order: String(cat.sort_order),
      parent_id: cat.parent_id ?? '',
    })
    setModalOpen(true)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const data = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        status: form.status,
        sort_order: Number(form.sort_order),
        parent_id: form.parent_id || null,
      }
      if (editingId) {
        await updateCategory(editingId, data)
      } else {
        await createCategory(data)
      }
      setModalOpen(false)
      await fetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id)
      setDeleteConfirmId(null)
      await fetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const set = useCallback((field: keyof CategoryFormData) => (value: unknown) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'name' && !prev.slug) {
        next.slug = String(value).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }
      return next
    })
  }, [])

  const parentOptions = categories
    .filter((c) => c.id !== editingId)
    .map((c) => ({ label: c.name, value: c.id }))

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '—'
    const parent = categories.find((c) => c.id === parentId)
    return parent?.name ?? 'Unknown'
  }

  const rootCategories = categories.filter((c) => !c.parent_id)
  const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId)

  if (loading) {
    return (
      <Page title="Categories">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page
      title="Categories"
      primaryAction={{ content: 'Add Category', onAction: openCreate }}
    >
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}

      {categories.length === 0 && (
        <Card>
          <BlockStack gap="200">
            <Text variant="bodyMd" as="p">No categories found. Create your first category to get started.</Text>
            <Button onClick={openCreate}>Add Category</Button>
          </BlockStack>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rootCategories.map((cat) => {
          const children = getChildren(cat.id)
          return (
            <CategoryCard
              key={cat.id}
              cat={cat}
              children={children}
              onEdit={openEdit}
              onDelete={setDeleteConfirmId}
              onManageFields={(id) => router.push(`/categories/${id}/fields`)}
            />
          )
        })}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Category' : 'Add Category'}
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
            <TextField label="Slug" value={form.slug} onChange={set('slug')} autoComplete="off" placeholder="Auto-generated from name" />
            <Select label="Status" value={form.status} onChange={set('status')} options={['active', 'inactive']} />
            <TextField label="Sort Order" value={form.sort_order} onChange={set('sort_order')} type="number" autoComplete="off" />
            <Select
              label="Parent Category"
              value={form.parent_id}
              onChange={set('parent_id')}
              options={[{ label: 'None', value: '' }, ...parentOptions]}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Category"
        primaryAction={{
          content: 'Delete',
          destructive: true,
          onAction: () => deleteConfirmId && handleDelete(deleteConfirmId),
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setDeleteConfirmId(null) }]}
      >
        <Modal.Section>
          <Text variant="bodyMd" as="p">Are you sure you want to delete this category? This action cannot be undone.</Text>
        </Modal.Section>
      </Modal>
    </Page>
  )
}

function CategoryCard({
  cat,
  children,
  onEdit,
  onDelete,
  onManageFields,
}: {
  cat: Category
  children: Category[]
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
  onManageFields: (id: string) => void
}) {
  return (
    <div className={`rounded-xl border ${cat.status === 'active' ? 'border-gray-200' : 'border-dashed border-gray-300'} bg-white overflow-hidden`}>
      <div className={`px-5 py-4 ${cat.status === 'active' ? 'bg-white' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-3">
          <Text variant="headingLg" as="h2">{cat.name}</Text>
          <StatusBadge status={cat.status} />
        </div>
      </div>

      <div className="px-5 py-3">
        <StatRow label="Slug" value={cat.slug} />
        <StatRow label="Parent" value={cat.parent_id ? '—' : 'Root'} />
        <StatRow label="Sort Order" value={String(cat.sort_order)} />
        <StatRow label="Subcategories" value={String(children.length)} />
      </div>

      {children.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <Text variant="bodySm" as="span" tone="subdued" fontWeight="semibold">Subcategories</Text>
          <div className="mt-2 space-y-1">
            {children.map((child) => (
              <div key={child.id} className="flex items-center justify-between py-1">
                <Text variant="bodyMd" as="span">{child.name}</Text>
                <StatusBadge status={child.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-2">
        <Button size="slim" onClick={() => onEdit(cat)}>Edit</Button>
        <Button size="slim" onClick={() => onManageFields(cat.id)}>Fields</Button>
        <Button size="slim" tone="critical" onClick={() => onDelete(cat.id)}>Delete</Button>
      </div>
    </div>
  )
}
