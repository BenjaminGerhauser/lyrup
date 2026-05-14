'use client'

import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateQuoteStatus } from '@/app/actions/quotes'
import type { QuoteStatus } from '@/types/domain'

const LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
}

interface StatusToggleProps {
  quoteId: string
  currentStatus: QuoteStatus
}

export function StatusToggle({ quoteId, currentStatus }: StatusToggleProps) {
  const [isPending, startTransition] = useTransition()

  const onChange = (value: string | null) => {
    if (!value || value === currentStatus) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', quoteId)
      fd.set('status', value)
      await updateQuoteStatus(fd)
    })
  }

  return (
    <Select value={currentStatus} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger>
        <SelectValue>
          {(val: string) => LABELS[val as QuoteStatus] ?? val}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LABELS) as QuoteStatus[]).map((s) => (
          <SelectItem key={s} value={s}>
            {LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
