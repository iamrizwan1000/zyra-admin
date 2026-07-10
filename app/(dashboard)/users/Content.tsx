'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Page, Card, Text, Select, TextField, SkeletonBodyText, Banner } from '@shopify/polaris'
import { getUsers } from '@/lib/api/admin'
import { StatusBadge } from '@/components/admin/StatusBadge'
import type { AdminUser } from '@/lib/api/admin'

export function Content() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [adminFilter, setAdminFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (statusFilter && u.account_status !== statusFilter) return false
      if (adminFilter === 'admin' && !u.is_admin) return false
      if (adminFilter === 'user' && u.is_admin) return false
      return true
    })
  }, [users, statusFilter, adminFilter])

  useEffect(() => {
    let cancelled = false
    // Search is server-side now; debounce so we don't fire a request per keystroke
    const timer = setTimeout(async () => {
      setError(null)
      try {
        const { data } = await getUsers(searchQuery || undefined)
        if (!cancelled) setUsers(data ?? [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load users')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, searchQuery ? 400 : 0)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [searchQuery])

  if (loading) {
    return (
      <Page title="Users">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page title="Users">
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
      <Card padding="0">
        <div className="p-3 border-b border-gray-200">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px]">
              <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
                { label: 'All', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Banned', value: 'banned' },
              ]} />
            </div>
            <div className="min-w-[140px]">
              <Select label="Role" value={adminFilter} onChange={setAdminFilter} options={[
                { label: 'All', value: '' },
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' },
              ]} />
            </div>
            <div className="min-w-[200px]">
              <TextField label="Search" value={searchQuery} onChange={setSearchQuery} placeholder="Name, phone, or email..." autoComplete="off" />
            </div>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 text-xs font-medium text-gray-500">NAME</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">PHONE</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">EMAIL</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">STATUS</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">ROLE</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">LISTINGS</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">SHOPS</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">JOINED</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">No users match the selected filters.</td>
              </tr>
            )}
            {filteredUsers.map((u) => {
              const listingCount = u.listing_count ?? 0
              const shopCount = u.shop_count ?? 0
              return (
                <tr
                  key={u.public_id}
                  className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/users/${u.public_id}`)}
                >
                  <td className="p-3"><Text variant="bodyMd" as="span" fontWeight="semibold">{u.full_name || 'Unnamed'}</Text></td>
                  <td className="p-3"><Text variant="bodyMd" as="span">{u.phone || '-'}</Text></td>
                  <td className="p-3"><Text variant="bodyMd" as="span">{u.email || '-'}</Text></td>
                  <td className="p-3"><StatusBadge status={u.account_status} /></td>
                  <td className="p-3"><Text variant="bodyMd" as="span">{u.is_admin ? 'Yes' : 'No'}</Text></td>
                  <td className="p-3"><Text variant="bodyMd" as="span">{listingCount}</Text></td>
                  <td className="p-3"><Text variant="bodyMd" as="span">{shopCount}</Text></td>
                  <td className="p-3"><Text variant="bodyMd" as="span">{new Date(u.created_at).toLocaleDateString()}</Text></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </Page>
  )
}
