'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Page, Card, Text, Button, Modal, FormLayout, TextField,
  SkeletonBodyText, Banner, BlockStack, InlineStack, EmptyState,
} from '@shopify/polaris'
import { getSettings, upsertSetting } from '@/lib/supabase/admin-queries'

interface SettingRecord { key: string; value: string; updated_at?: string; created_at?: string }

export function Content() {
  const [settings, setSettings] = useState<SettingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editingSaving, setEditingSaving] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        setSettings(await getSettings())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const startEdit = useCallback((key: string, value: string) => {
    setEditingKey(key)
    setEditValue(value)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingKey(null)
    setEditValue('')
  }, [])

  const handleEditSave = async (key: string) => {
    setEditingSaving(true)
    setError(null)
    try {
      await upsertSetting(key, editValue)
      setEditingKey(null)
      setSuccess(`Setting "${key}" updated`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting')
    } finally {
      setEditingSaving(false)
    }
    try {
      setSettings(await getSettings())
    } catch {
      // Best-effort reload
    }
  }

  const handleAddSave = async () => {
    if (!newKey.trim()) return
    setSaving(true)
    setError(null)
    try {
      await upsertSetting(newKey.trim(), newValue)
      setModalOpen(false)
      setNewKey('')
      setNewValue('')
      setSuccess(`Setting "${newKey}" created`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create setting')
    } finally {
      setSaving(false)
    }
    try {
      setSettings(await getSettings())
    } catch {
      // Best-effort reload
    }
  }

  if (loading) {
    return (
      <Page title="Settings">
        <Card><SkeletonBodyText lines={5} /></Card>
      </Page>
    )
  }

  return (
    <Page
      title="Settings"
      primaryAction={{ content: 'Add Setting', onAction: () => setModalOpen(true) }}
    >
      {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
      {success && <Banner tone="success" onDismiss={() => setSuccess(null)}>{success}</Banner>}

      {settings.length === 0 && !loading && (
        <Card>
          <EmptyState heading="No settings" action={{ content: 'Add Setting', onAction: () => setModalOpen(true) }} image="">
            <Text variant="bodyMd" as="p">Add your first setting to get started.</Text>
          </EmptyState>
        </Card>
      )}

      <BlockStack gap="200">
        {settings.map((s) => (
          <Card key={s.key} padding="300">
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <Text variant="headingSm" as="h3">{s.key}</Text>
                {editingKey === s.key ? (
                  <InlineStack gap="200">
                    <Button size="slim" onClick={() => handleEditSave(s.key)} loading={editingSaving}>Save</Button>
                    <Button size="slim" onClick={cancelEdit}>Cancel</Button>
                  </InlineStack>
                ) : (
                  <Button size="slim" onClick={() => startEdit(s.key, s.value)}>Edit</Button>
                )}
              </InlineStack>
              {editingKey === s.key ? (
                <TextField
                  label="Value"
                  value={editValue}
                  onChange={setEditValue}
                  autoComplete="off"
                  multiline={editValue.length > 60 ? 2 : 1}
                />
              ) : (
                <Text variant="bodyMd" as="p" breakWord>{s.value}</Text>
              )}
            </BlockStack>
          </Card>
        ))}
      </BlockStack>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Setting"
        primaryAction={{
          content: 'Create',
          onAction: handleAddSave,
          loading: saving,
          disabled: !newKey.trim() || saving,
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField label="Key" value={newKey} onChange={setNewKey} autoComplete="off" autoFocus />
            <TextField label="Value" value={newValue} onChange={setNewValue} autoComplete="off" multiline={3} />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  )
}
