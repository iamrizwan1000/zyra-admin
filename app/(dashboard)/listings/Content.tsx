'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Page, Card, Text, Button, Select, TextField, SkeletonBodyText, Banner } from '@shopify/polaris'
import {
  getPendingListings,
  approveListing,
  rejectListing,
  requestListingChanges,
} from '@/lib/api/admin'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ReasonModal } from '@/components/admin/ReasonModal'
import type { PendingListing } from '@/lib/api/admin'

export function Content() {
  const router = useRouter()
  const [listings, setListings] = useState<PendingListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionTarget, setActionTarget] = useState<PendingListing | null>(null)
  const [modalType, setModalType] = useState<'reject' | 'request-changes' | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const cityOptions = useMemo(() => {
    const cities = [...new Set(listings.map(l => l.city_name).filter(Boolean))]
    return [{ label: 'All Cities', value: '' }, ...cities.map(c => ({ label: c, value: c }))]
  }, [listings])

  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      if (statusFilter && l.approval_status !== statusFilter) return false
      if (cityFilter && l.city_name !== cityFilter) return false
      if (searchQuery && !l.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [listings, statusFilter, cityFilter, searchQuery])

  const loadListings = async () => {
    setLoading(true)
    setError(null)
    try {
      setListings(await getPendingListings())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await getPendingListings()
        if (!cancelled) setListings(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load listings')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleApprove = async (public_id: string) => {
    try { await approveListing(public_id); await loadListings() }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
  }

  const handleReject = async (reason: string) => {
    if (!actionTarget) return
    try { await rejectListing(actionTarget.public_id, reason); await loadListings() }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setActionTarget(null); setModalType(null) }
  }

  const handleRequestChanges = async (reason: string) => {
    if (!actionTarget) return
    try { await requestListingChanges(actionTarget.public_id, reason); await loadListings() }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setActionTarget(null); setModalType(null) }
  }

  if (loading) {
    return (
      <Page title="Pending Listings">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page title="Pending Listings">
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
      <Card padding="0">
        <div className="p-3 border-b border-gray-200">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px]">
              <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
                { label: 'All', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Removed', value: 'removed' },
              ]} />
            </div>
            <div className="min-w-[140px]">
              <Select label="City" value={cityFilter} onChange={setCityFilter} options={cityOptions} />
            </div>
            <div className="min-w-[200px]">
              <TextField label="Search" value={searchQuery} onChange={setSearchQuery} placeholder="Search by title..." autoComplete="off" />
            </div>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 text-xs font-medium text-gray-500">THUMBNAIL</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">TITLE</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">SELLER</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">PRICE</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">CITY</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">STATUS</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">SUBMITTED</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredListings.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">No listings match the selected filters.</td>
              </tr>
            )}
            {filteredListings.map((l) => (
              <tr
                key={l.public_id}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/listings/${l.public_id}`)}
              >
                <td className="p-3">
                  {l.listing_images?.[0]?.thumbnail_url
                    ? <Image src={l.listing_images[0].thumbnail_url} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" unoptimized />
                    : <div className="w-10 h-10 bg-gray-100 rounded" />}
                </td>
                <td className="p-3"><Text variant="bodyMd" as="span" fontWeight="semibold">{l.title}</Text></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{l.seller_name}</Text></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{l.currency_code} {l.price}</Text></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{l.city_name}</Text></td>
                <td className="p-3"><StatusBadge status={l.approval_status} /></td>
                <td className="p-3"><Text variant="bodyMd" as="span">{new Date(l.submitted_at).toLocaleDateString()}</Text></td>
                <td className="p-3">
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="slim" onClick={() => handleApprove(l.public_id)}>Approve</Button>
                    <Button size="slim" onClick={() => { setActionTarget(l); setModalType('reject') }}>Reject</Button>
                    <Button size="slim" onClick={() => { setActionTarget(l); setModalType('request-changes') }}>Changes</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <ReasonModal
        open={modalType === 'reject'}
        title="Reject Listing"
        submitLabel="Reject"
        onSubmit={handleReject}
        onClose={() => { setActionTarget(null); setModalType(null) }}
      />
      <ReasonModal
        open={modalType === 'request-changes'}
        title="Request Changes"
        submitLabel="Request Changes"
        onSubmit={handleRequestChanges}
        onClose={() => { setActionTarget(null); setModalType(null) }}
      />
    </Page>
  )
}
