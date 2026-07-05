'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Page, Card, Text, Button, Modal, FormLayout, TextField, Select,
  SkeletonBodyText, Banner, BlockStack, InlineStack, EmptyState,
} from '@shopify/polaris'
import {
  getCities, createCity, updateCity,
  getAreas, createArea, updateArea,
  getMarkets, createMarket, updateMarket,
} from '@/lib/supabase/admin-queries'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface CityRecord { id: string; name: string; country_code: string; sort_order: number; status: string }
interface AreaRecord { id: string; name: string; city_id: string; sort_order: number; status: string }
interface MarketRecord { id: string; name: string; area_id: string; city_id: string; sort_order: number }

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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Cities
  const [cities, setCities] = useState<CityRecord[]>([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)

  // Areas
  const [areas, setAreas] = useState<AreaRecord[]>([])
  const [areasLoading, setAreasLoading] = useState(false)

  // Markets
  const [markets, setMarkets] = useState<MarketRecord[]>([])
  const [marketsLoading, setMarketsLoading] = useState(false)
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalLevel, setModalLevel] = useState<'city' | 'area' | 'market'>('city')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      setCitiesLoading(true)
      try {
        setCities(await getCities())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cities')
      } finally {
        setCitiesLoading(false)
      }
    })()
  }, [])

  const fetchCities = async () => {
    setCitiesLoading(true)
    try {
      setCities(await getCities())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cities')
    } finally {
      setCitiesLoading(false)
    }
  }

  const fetchAreas = useCallback(async (cityId: string) => {
    setAreasLoading(true)
    setSelectedAreaId(null)
    setMarkets([])
    try {
      setAreas(await getAreas(cityId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load areas')
    } finally {
      setAreasLoading(false)
    }
  }, [])

  const fetchMarkets = useCallback(async (areaId: string) => {
    setMarketsLoading(true)
    try {
      setMarkets(await getMarkets(areaId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load markets')
    } finally {
      setMarketsLoading(false)
    }
  }, [])

  const handleCityClick = useCallback((cityId: string) => {
    if (selectedCityId === cityId) {
      setSelectedCityId(null)
      setAreas([])
      setMarkets([])
      setSelectedAreaId(null)
    } else {
      setSelectedCityId(cityId)
      fetchAreas(cityId)
    }
  }, [selectedCityId, fetchAreas])

  const handleAreaClick = useCallback((areaId: string) => {
    if (selectedAreaId === areaId) {
      setSelectedAreaId(null)
      setMarkets([])
    } else {
      setSelectedAreaId(areaId)
      fetchMarkets(areaId)
    }
  }, [selectedAreaId, fetchMarkets])

  const openCreate = useCallback((level: 'city' | 'area' | 'market') => {
    setEditingId(null)
    setModalLevel(level)
    const defaults: Record<string, string> = { name: '', sort_order: '0', status: 'active' }
    if (level === 'city') { defaults.country_code = 'PK'; defaults.name = ''; defaults.sort_order = '0' }
    setForm(defaults)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((level: 'city' | 'area' | 'market', item: CityRecord | AreaRecord | MarketRecord) => {
    setEditingId(item.id)
    setModalLevel(level)
    const f: Record<string, string> = {
      name: item.name,
      sort_order: String(item.sort_order ?? 0),
    }
    if (level === 'city' && 'country_code' in item) f.country_code = item.country_code ?? ''
    if ((level === 'city' || level === 'area') && 'status' in item) f.status = item.status ?? 'active'
    setForm(f)
    setModalOpen(true)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      if (modalLevel === 'city') {
        if (editingId) {
          await updateCity(editingId, { name: form.name, sort_order: Number(form.sort_order), country_code: form.country_code, status: form.status })
        } else {
          await createCity({ name: form.name, sort_order: Number(form.sort_order), country_code: form.country_code || 'PK' })
        }
        await fetchCities()
      } else if (modalLevel === 'area') {
        if (editingId) {
          await updateArea(editingId, { name: form.name, sort_order: Number(form.sort_order), status: form.status })
        } else {
          await createArea({ name: form.name, sort_order: Number(form.sort_order), city_id: selectedCityId! })
        }
        if (selectedCityId) await fetchAreas(selectedCityId)
      } else if (modalLevel === 'market') {
        if (editingId) {
          await updateMarket(editingId, { name: form.name, sort_order: Number(form.sort_order) })
        } else {
          await createMarket({ name: form.name, sort_order: Number(form.sort_order), area_id: selectedAreaId!, city_id: selectedCityId! })
        }
        if (selectedAreaId) await fetchMarkets(selectedAreaId)
      }
      setModalOpen(false)
      setSuccess(`${modalLevel} saved successfully`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const set = useCallback((field: string) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  if (citiesLoading) {
    return (
      <Page title="Locations">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page title="Locations">
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
      {success && <Banner tone="success" onDismiss={() => setSuccess(null)}>{success}</Banner>}

      {cities.length === 0 && (
        <Card>
          <EmptyState heading="No cities" action={{ content: 'Add City', onAction: () => openCreate('city') }} image="">
            <Text variant="bodyMd" as="p">Add your first city to get started.</Text>
          </EmptyState>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((city) => (
          <div key={city.id} className={`rounded-xl border ${city.status === 'active' ? 'border-gray-200' : 'border-dashed border-gray-300'} bg-white overflow-hidden`}>
            <div
              className={`px-5 py-4 cursor-pointer ${city.status === 'active' ? 'bg-white' : 'bg-gray-50'} ${selectedCityId === city.id ? 'border-b border-gray-100' : ''}`}
              onClick={() => handleCityClick(city.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Text variant="headingLg" as="h2">{city.name}</Text>
                  {selectedCityId === city.id && (
                    <span className="text-xs text-blue-600 font-medium">▼</span>
                  )}
                </div>
                <StatusBadge status={city.status ?? 'active'} />
              </div>
            </div>

            <div className="px-5 py-3">
              <StatRow label="Country" value={city.country_code} />
              <StatRow label="Sort Order" value={String(city.sort_order)} />
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-2">
              <Button size="slim" onClick={() => openEdit('city', city)}>Edit</Button>
            </div>

            {selectedCityId === city.id && (
              <div className="border-t border-gray-200">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <Text variant="bodySm" as="span" fontWeight="semibold" tone="subdued">Areas</Text>
                  <Button size="slim" onClick={() => openCreate('area')}>Add Area</Button>
                </div>

                {areasLoading ? (
                  <div className="p-5 text-center text-gray-500 text-sm">Loading areas...</div>
                ) : areas.length === 0 ? (
                  <div className="p-5 text-center text-gray-500 text-sm">No areas yet.</div>
                ) : (
                  areas.map((area) => (
                    <div key={area.id} className="border-b border-gray-100 last:border-b-0">
                      <div
                        className={`px-5 py-3 cursor-pointer hover:bg-gray-50 ${selectedAreaId === area.id ? 'bg-blue-50' : ''}`}
                        onClick={() => handleAreaClick(area.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Text variant="headingSm" as="h3">{area.name}</Text>
                            {selectedAreaId === area.id && (
                              <span className="text-xs text-blue-600 font-medium">▼</span>
                            )}
                          </div>
                          <StatusBadge status={area.status ?? 'active'} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Sort: {area.sort_order}</span>
                        </div>
                      </div>

                      <div className="flex gap-1 px-5 pb-2">
                        <Button size="slim" onClick={() => openEdit('area', area)}>Edit</Button>
                      </div>

                      {selectedAreaId === area.id && (
                        <div className="ml-4 border-l-2 border-blue-200 bg-blue-50/30">
                          <div className="px-4 py-2 flex items-center justify-between">
                            <Text variant="bodySm" as="span" fontWeight="semibold" tone="subdued">Markets</Text>
                            <Button size="slim" onClick={() => openCreate('market')}>Add Market</Button>
                          </div>

                          {marketsLoading ? (
                            <div className="p-3 text-center text-gray-500 text-sm">Loading markets...</div>
                          ) : markets.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm">No markets yet.</div>
                          ) : (
                            markets.map((market) => (
                              <div key={market.id} className="px-4 py-2 border-b border-blue-100 last:border-b-0 flex items-center justify-between">
                                <div>
                  <span className="text-sm font-medium">{market.name}</span>
                  <span className="text-xs text-gray-500 ml-2">Sort: {market.sort_order}</span>
                                </div>
                                <Button size="slim" onClick={() => openEdit('market', market)}>Edit</Button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? `Edit ${modalLevel}` : `Add ${modalLevel}`}
        primaryAction={{
          content: editingId ? 'Save' : 'Create',
          onAction: handleSave,
          loading: saving,
          disabled: !form.name?.trim() || saving,
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField label="Name" value={form.name ?? ''} onChange={set('name')} autoComplete="off" autoFocus />
            {modalLevel === 'city' && (
              <TextField label="Country Code" value={form.country_code ?? ''} onChange={set('country_code')} autoComplete="off" />
            )}
            {(modalLevel === 'city' || modalLevel === 'area') && (
              <Select label="Status" value={form.status ?? 'active'} onChange={set('status')} options={['active', 'inactive']} />
            )}
            <TextField label="Sort Order" value={form.sort_order ?? '0'} onChange={set('sort_order')} type="number" autoComplete="off" />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  )
}
