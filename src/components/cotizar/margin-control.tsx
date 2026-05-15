'use client'

import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface MarginControlProps {
  /** Margin percentage (0 = no markup, 100 = 2x cost, 200 = 3x cost, etc.). */
  value: number
  onChange: (percent: number) => void
}

type Mode = 'multiplier' | 'percent'

const MULT_MIN = 1
const MULT_MAX = 5
const MULT_STEP = 0.5
const MULTIPLIER_LABELS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

const percentToMultiplier = (p: number) => 1 + p / 100
const multiplierToPercent = (m: number) => Math.round((m - 1) * 100)

function clampMultiplier(m: number): number {
  if (m < MULT_MIN) return MULT_MIN
  if (m > MULT_MAX) return MULT_MAX
  return Math.round(m / MULT_STEP) * MULT_STEP
}

export function MarginControl({ value, onChange }: MarginControlProps) {
  const [mode, setMode] = useState<Mode>('multiplier')

  // The slider always reflects the current value snapped to the nearest 0.5×.
  const rawMultiplier = percentToMultiplier(value)
  const sliderMultiplier = clampMultiplier(rawMultiplier)

  // Human-readable description of what the current margin means in plain Spanish.
  const description = (() => {
    if (value === 0) return 'Sin margen — vendés al costo.'
    const m = rawMultiplier
    return `Multiplicás el costo por ${m.toFixed(m % 1 === 0 ? 0 : 2)} (${value}% de ganancia sobre el costo).`
  })()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Margen</span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={mode === 'multiplier' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setMode('multiplier')}
          >
            Multiplicador
          </Button>
          <Button
            type="button"
            variant={mode === 'percent' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setMode('percent')}
          >
            %
          </Button>
        </div>
      </div>

      {mode === 'multiplier' ? (
        <div className="flex items-center gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <Slider
              value={[sliderMultiplier]}
              min={MULT_MIN}
              max={MULT_MAX}
              step={MULT_STEP}
              onValueChange={(v: number | readonly number[]) => {
                const next = Array.isArray(v) ? v[0] : v
                if (typeof next === 'number' && Number.isFinite(next)) {
                  onChange(multiplierToPercent(next))
                }
              }}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
              {MULTIPLIER_LABELS.map((m) => (
                <span key={m}>X{m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}</span>
              ))}
            </div>
          </div>
          <span className="w-14 text-right text-sm font-medium tabular-nums">
            X{sliderMultiplier % 1 === 0 ? sliderMultiplier.toFixed(0) : sliderMultiplier.toFixed(1)}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            step={5}
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              onChange(Number.isFinite(v) && v >= 0 ? v : 0)
            }}
            className="w-28"
          />
          <span className="text-sm text-muted-foreground">% sobre el costo</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
