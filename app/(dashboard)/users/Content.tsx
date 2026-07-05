'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Page, Card, Text, Select, TextField, SkeletonBodyText, Banner } from '@shopify/polaris'
import { getUsers } from '@/lib/supabase/admin-queries'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface UserRow {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  account_status: string
  is_admin: boolean
  created_at: string
  listings: { count: number }[]
  shops: { count: number }[]
}

export function Content() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
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
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const name = (u.full_name || '').toLowerCase()
        const phone = (u.phone || '').toLowerCase()
        const email = (u.email || '').toLowerCase()
        if (!name.includes(q) && !phone.includes(q) && !email.includes(q)) return false
      }
      return true
    })
  }, [users, statusFilter, adminFilter, searchQuery])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await getUsers()
        if (!cancelled) setUsers((result ?? []) as UserRow[])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load users')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

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
              const listingCount = u.listings?.[0]?.count ?? 0
              const shopCount = u.shops?.[0]?.count ?? 0
              return (
                <tr
                  key={u.id}
                  className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/users/${u.id}`)}
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
