'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Page, Card, Text, Select, TextField, SkeletonBodyText, Banner } from '@shopify/polaris'
import { getAllShops } from '@/lib/supabase/admin-queries'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface ShopRow {
  id: string
  shop_name: string
  logo_url: string | null
  profiles: { full_name: string } | null
  city_name: string
  approval_status: string
  status: string
  created_at: string
}

export function Content() {
  const router = useRouter()
  const [shops, setShops] = useState<ShopRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approvalFilter, setApprovalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const cityOptions = useMemo(() => {
    const cities = [...new Set(shops.map(s => s.city_name).filter(Boolean))]
    return [{ label: 'All Cities', value: '' }, ...cities.map(c => ({ label: c, value: c }))]
  }, [shops])

  const filteredShops = useMemo(() => {
    return shops.filter(s => {
      if (approvalFilter && s.approval_status !== approvalFilter) return false
      if (statusFilter && s.status !== statusFilter) return false
      if (cityFilter && s.city_name !== cityFilter) return false
      if (searchQuery && !s.shop_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [shops, approvalFilter, statusFilter, cityFilter, searchQuery])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await getAllShops()
        if (!cancelled) setShops((result ?? []) as ShopRow[])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load shops')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <Page title="Shops">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page title="Shops">
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
      <Card padding="0">
        <div className="p-3 border-b border-gray-200">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px]">
              <Select label="Approval" value={approvalFilter} onChange={setApprovalFilter} options={[
                { label: 'All', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ]} />
            </div>
            <div className="min-w-[140px]">
              <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
                { label: 'All', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Inactive', value: 'inactive' },
              ]} />
            </div>
            <div className="min-w-[140px]">
              <Select label="City" value={cityFilter} onChange={setCityFilter} options={cityOptions} />
            </div>
            <div className="min-w-[200px]">
              <TextField label="Search" value={searchQuery} onChange={setSearchQuery} placeholder="Search by name..." autoComplete="off" />
            </div>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 text-xs font-medium text-gray-500">LOGO</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">SHOP NAME</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">OWNER</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">CITY</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">APPROVAL</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">STATUS</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">CREATED</th>
            </tr>
          </thead>
          <tbody>
            {filteredShops.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">No shops match the selected filters.</td>
              </tr>
            )}
            {filteredShops.map((s) => (
              <tr
                key={s.id}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/shops/${s.id}`)}
              >
                <td className="p-3">
                  {s.logo_url
                    ? <Image src={s.logo_url} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" unoptimized />
                    : <div className="w-10 h-10 bg-gray-100 rounded" />}
                </td>
                <td className="p-3"><Text variant="bodyMd" as="span" fontWeight="semibold">{s.shop_name}</Text></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{s.profiles?.full_name || '-'}</Text></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{s.city_name}</Text></td>
                <td className="p-3"><StatusBadge status={s.approval_status} /></td>
                <td className="p-3"><StatusBadge status={s.status} /></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{new Date(s.created_at).toLocaleDateString()}</Text></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Page>
  )
}
