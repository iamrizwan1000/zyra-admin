'use client'

import { useState } from 'react'
import { Modal, TextField } from '@shopify/polaris'

interface ReasonModalProps {
  open: boolean
  title: string
  onSubmit: (reason: string) => void
  onClose: () => void
  submitLabel?: string
}

export function ReasonModal({ open, title, onSubmit, onClose, submitLabel = 'Submit' }: ReasonModalProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit(reason)
    setSubmitting(false)
    setReason('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      primaryAction={{
        content: submitLabel,
        onAction: handleSubmit,
        disabled: !reason.trim() || submitting,
        loading: submitting,
      }}
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
    >
      <Modal.Section>
        <TextField
          label="Reason"
          value={reason}
          onChange={setReason}
          multiline={3}
          autoComplete="off"
          placeholder="Enter the reason..."
          autoFocus
        />
      </Modal.Section>
    </Modal>
  )
}
