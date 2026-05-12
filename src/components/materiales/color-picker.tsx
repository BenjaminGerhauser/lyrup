'use client'

import React from 'react'

// ---------------------------------------------------------------------------
// Standard filament color palette
// ---------------------------------------------------------------------------

const PRESET_COLORS: { label: string; hex: string }[] = [
  { label: 'Blanco', hex: '#FFFFFF' },
  { label: 'Negro', hex: '#1A1A1A' },
  { label: 'Gris', hex: '#808080' },
  { label: 'Rojo', hex: '#E53E3E' },
  { label: 'Azul', hex: '#3182CE' },
  { label: 'Verde', hex: '#38A169' },
  { label: 'Amarillo', hex: '#D69E2E' },
  { label: 'Naranja', hex: '#DD6B20' },
  { label: 'Natural', hex: '#F5F0E8' },
]

// ---------------------------------------------------------------------------
// ColorPicker
// ---------------------------------------------------------------------------

interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2" data-testid="color-picker">
      {/* Preset color circles */}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Seleccioná un color">
        {PRESET_COLORS.map(({ label, hex }) => (
          <button
            key={hex}
            type="button"
            role="radio"
            aria-checked={value === hex}
            aria-label={label}
            title={label}
            onClick={() => onChange(hex)}
            className={`h-7 w-7 shrink-0 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              value === hex
                ? 'border-foreground ring-2 ring-ring/50 scale-110'
                : 'border-foreground/20 hover:scale-105'
            }`}
            style={{ background: hex }}
          />
        ))}
      </div>

      {/* Custom hex input */}
      <div className="flex items-center gap-2">
        {/* Preview swatch */}
        <span
          className="h-7 w-7 shrink-0 rounded-full border border-foreground/20"
          style={{ background: value || '#FFFFFF' }}
          aria-hidden
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          maxLength={7}
          aria-label="Color hexadecimal personalizado"
          data-testid="color-hex-input"
          className="h-8 w-28 rounded-lg border border-input bg-transparent px-3 font-mono text-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
        />
        <span className="text-xs text-muted-foreground">hex personalizado</span>
      </div>
    </div>
  )
}
