'use client'

import { useState, useCallback } from 'react'
import {
  Page, Card, Text, Button, TextField, Select, Checkbox,
  Banner, BlockStack, FormLayout, InlineStack,
} from '@shopify/polaris'
import { getUserPackageUsage, adjustFeaturedCredits } from '@/lib/supabase/admin-queries'

export function Content() {
  const [userId, setUserId] = useState('')
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [adjustmentType, setAdjustmentType] = useState('extra_credits')
  const [extraCredits, setExtraCredits] = useState('')
  const [limitOverride, setLimitOverride] = useState('')
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [startsAt, setStartsAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [reason, setReason] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleLookup = useCallback(async () => {
    if (!userId.trim()) return
    setLookupLoading(true)
    setError(null)
    setUsage(null)
    try {
      const data = await getUserPackageUsage(userId.trim())
      setUsage(data as Record<string, unknown>)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to look up user')
    } finally {
      setLookupLoading(false)
    }
  }, [userId])

  const handleAdjust = useCallback(async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await adjustFeaturedCredits({
        p_user_id: userId.trim(),
        p_adjustment_type: adjustmentType,
        ...(adjustmentType === 'extra_credits' && { p_extra_credits: Number(extraCredits) }),
        ...(adjustmentType === 'limit_override' && { p_limit_override: Number(limitOverride) }),
        ...(adjustmentType === 'unlimited' && { p_is_unlimited: isUnlimited }),
        ...(startsAt && { p_starts_at: startsAt }),
        ...(expiresAt && { p_expires_at: expiresAt }),
        ...(reason && { p_reason: reason }),
        ...(adminNote && { p_admin_note: adminNote }),
      })
      setSuccess('Featured credits adjusted successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust credits')
    } finally {
      setSaving(false)
    }
  }, [userId, adjustmentType, extraCredits, limitOverride, isUnlimited, startsAt, expiresAt, reason, adminNote])

  const showField = (field: string) => {
    if (field === 'extra_credits') return adjustmentType === 'extra_credits'
    if (field === 'limit_override') return adjustmentType === 'limit_override'
    if (field === 'unlimited') return adjustmentType === 'unlimited'
    return true
  }

  return (
    <Page title="Featured Credits">
      <BlockStack gap="400">
        {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
        {success && <Banner tone="success" onDismiss={() => setSuccess(null)}>{success}</Banner>}

        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Find User</Text>
            <InlineStack gap="200" align="start" blockAlign="end">
              <div className="flex-1">
                <TextField
                  label="User ID"
                  value={userId}
                  onChange={setUserId}
                  autoComplete="off"
                  placeholder="Enter the user ID"
                />
              </div>
              <Button variant="primary" onClick={handleLookup} loading={lookupLoading} disabled={!userId.trim()}>
                Look Up
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {usage && (
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">Current Usage</Text>
              <div className="space-y-1 text-sm text-gray-600">
                {Object.entries(usage).map(([key, val]) => (
                  <p key={key}><strong>{key}:</strong> {String(val)}</p>
                ))}
              </div>
            </BlockStack>
          </Card>
        )}

        {usage && (
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">Adjust Credits</Text>
              <FormLayout>
                <Select
                  label="Adjustment Type"
                  value={adjustmentType}
                  onChange={setAdjustmentType}
                  options={[
                    { label: 'Extra Credits', value: 'extra_credits' },
                    { label: 'Limit Override', value: 'limit_override' },
                    { label: 'Unlimited', value: 'unlimited' },
                  ]}
                />
                {showField('extra_credits') && (
                  <TextField
                    label="Extra Credits"
                    value={extraCredits}
                    onChange={setExtraCredits}
                    type="number"
                    autoComplete="off"
                  />
                )}
                {showField('limit_override') && (
                  <TextField
                    label="Limit Override"
                    value={limitOverride}
                    onChange={setLimitOverride}
                    type="number"
                    autoComplete="off"
                  />
                )}
                {showField('unlimited') && (
                  <Checkbox
                    label="Is Unlimited"
                    checked={isUnlimited}
                    onChange={setIsUnlimited}
                  />
                )}
                <TextField label="Starts At" value={startsAt} onChange={setStartsAt} placeholder="ISO date" autoComplete="off" />
                <TextField label="Expires At" value={expiresAt} onChange={setExpiresAt} placeholder="ISO date" autoComplete="off" />
                <TextField label="Reason" value={reason} onChange={setReason} autoComplete="off" />
                <TextField label="Admin Note" value={adminNote} onChange={setAdminNote} autoComplete="off" />
              </FormLayout>
              <Button variant="primary" onClick={handleAdjust} loading={saving} disabled={saving}>
                Submit Adjustment
              </Button>
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  )
}
