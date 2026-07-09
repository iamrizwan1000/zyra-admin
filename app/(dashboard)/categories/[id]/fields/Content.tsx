'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Page, Card, Text, SkeletonBodyText, Banner,
} from '@shopify/polaris'
import { getCategoryFields, getCategories } from '@/lib/api/admin'
import { Badge } from '@shopify/polaris'
import type { Category } from '@/lib/api/admin'

interface CategoryFieldOption {
  id: string
  field_id: string
  label: string
  value: string
  sort_order: number
}

interface CategoryField {
  id: string
  category_id: string
  field_name: string
  field_key: string
  field_type: string
  is_required: boolean
  is_filterable: boolean
  is_searchable: boolean
  show_on_card: boolean
  show_on_detail: boolean
  sort_order: number
  options: CategoryFieldOption[]
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

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text Input',
  number: 'Number',
  select: 'Dropdown Select',
  textarea: 'Text Area',
  date: 'Date Picker',
  boolean: 'Yes / No',
}

export function Content() {
  const params = useParams()
  const router = useRouter()
  const [fields, setFields] = useState<CategoryField[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const resolvedParams = await params
        const categoryId = resolvedParams.id as string
        const [fieldsData, categoriesData] = await Promise.all([
          getCategoryFields(categoryId),
          getCategories(),
        ])
        setFields(fieldsData as unknown as CategoryField[])
        setCategory(categoriesData.find((c: Category) => String(c.id) === categoryId) ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fields')
      } finally {
        setLoading(false)
      }
    })()
  }, [params])

  if (loading) {
    return (
      <Page title="Category Fields">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page
      title={category ? `Fields — ${category.name}` : 'Category Fields'}
      backAction={{ content: 'Categories', onAction: () => router.push('/categories') }}
    >
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}

      {fields.length === 0 && (
        <Card>
          <Text variant="bodyMd" as="p">No fields defined for this category.</Text>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Text variant="headingLg" as="h2">{field.field_name}</Text>
                  <Text variant="bodySm" as="p" tone="subdued">{field.field_key}</Text>
                </div>
                <Badge>{FIELD_TYPE_LABELS[field.field_type] || field.field_type}</Badge>
              </div>
            </div>

            <div className="px-5 py-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Visibility</div>
              <StatRow label="Show on Card" value={field.show_on_card ? 'Yes' : 'No'} />
              <StatRow label="Show on Detail" value={field.show_on_detail ? 'Yes' : 'No'} />

              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">Behavior</div>
              <StatRow label="Required" value={field.is_required ? 'Yes' : 'No'} />
              <StatRow label="Filterable" value={field.is_filterable ? 'Yes' : 'No'} />
              <StatRow label="Searchable" value={field.is_searchable ? 'Yes' : 'No'} />

              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">Ordering</div>
              <StatRow label="Sort Order" value={String(field.sort_order)} />
            </div>

            {field.field_type === 'select' && field.options.length > 0 && (
              <div className="border-t border-gray-100">
                <div className="px-5 py-3 bg-gray-50">
                  <Text variant="bodySm" as="span" fontWeight="semibold" tone="subdued">
                    Options ({field.options.length})
                  </Text>
                </div>
                <div className="divide-y divide-gray-100">
                  {field.options.map((opt) => (
                    <div key={opt.id} className="px-5 py-2 flex items-center justify-between">
                      <Text variant="bodyMd" as="span">{opt.label}</Text>
                      <Text variant="bodySm" as="span" tone="subdued">{opt.value}</Text>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Page>
  )
}
