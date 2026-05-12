'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateConfig, type ConfigActionResult } from '@/app/actions/configuracion'
import type { RefElectricityRate } from '@/types/domain'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConfigFormValues {
  business_name: string
  phone: string
  business_phone: string
  logo_url: string
  labor_rate_hour: number
  default_margin_percent: number
  default_labor_factor: number
  province: string
  electricity_rate_kwh: number
}

interface ConfiguracionFormProps {
  initialValues?: ConfigFormValues
  electricityRates: RefElectricityRate[]
}

const defaultValues: ConfigFormValues = {
  business_name: '',
  phone: '',
  business_phone: '',
  logo_url: '',
  labor_rate_hour: 1500,
  default_margin_percent: 100,
  default_labor_factor: 0.20,
  province: '',
  electricity_rate_kwh: 0,
}

const initialActionState: ConfigActionResult | null = null

// ---------------------------------------------------------------------------
// ConfiguracionForm
// ---------------------------------------------------------------------------

export function ConfiguracionForm({ initialValues, electricityRates }: ConfiguracionFormProps) {
  const values = initialValues ?? defaultValues

  // All inputs are controlled to avoid Base UI's "default value changed after init"
  // warning when revalidatePath causes a server re-render with fresh initialValues.
  const [businessName, setBusinessName] = useState(values.business_name)
  const [phone, setPhone] = useState(values.phone)
  const [businessPhone, setBusinessPhone] = useState(values.business_phone)
  const [logoUrl, setLogoUrl] = useState(values.logo_url)
  const [laborRateHour, setLaborRateHour] = useState(String(values.labor_rate_hour))
  const [defaultMarginPercent, setDefaultMarginPercent] = useState(String(values.default_margin_percent))
  const [defaultLaborFactor, setDefaultLaborFactor] = useState(String(values.default_labor_factor))
  const [selectedProvince, setSelectedProvince] = useState<string>(values.province)
  const [electricityRate, setElectricityRate] = useState<string>(
    values.electricity_rate_kwh ? String(values.electricity_rate_kwh) : ''
  )
  const [provinceChanged, setProvinceChanged] = useState(false)

  // Sync local state with `values` when initialValues changes after revalidatePath.
  // Safe because in single-tab usage, post-save values match what the user just typed.
  useEffect(() => {
    setBusinessName(values.business_name)
    setPhone(values.phone)
    setBusinessPhone(values.business_phone)
    setLogoUrl(values.logo_url)
    setLaborRateHour(String(values.labor_rate_hour))
    setDefaultMarginPercent(String(values.default_margin_percent))
    setDefaultLaborFactor(String(values.default_labor_factor))
    setSelectedProvince(values.province)
    setElectricityRate(values.electricity_rate_kwh ? String(values.electricity_rate_kwh) : '')
  }, [
    values.business_name,
    values.phone,
    values.business_phone,
    values.logo_url,
    values.labor_rate_hour,
    values.default_margin_percent,
    values.default_labor_factor,
    values.province,
    values.electricity_rate_kwh,
  ])

  // useActionState for form submission
  const [state, dispatch, isPending] = useActionState(
    async (_prev: ConfigActionResult | null, formData: FormData) => {
      // Inject controlled values that aren't native form fields
      formData.set('province', selectedProvince)
      formData.set('electricity_rate_kwh', electricityRate)
      const result = await updateConfig(formData)
      if (result.success) {
        setProvinceChanged(false)
      }
      return result
    },
    initialActionState
  )

  // Derive unique provinces for the selector
  const provinces = Array.from(new Set(electricityRates.map((r) => r.province))).sort()

  // Find rate for a province
  function getRateForProvince(province: string): RefElectricityRate | null {
    return electricityRates.find((r) => r.province === province) ?? null
  }

  function handleProvinceChange(val: string | null) {
    const province = val ?? ''
    setSelectedProvince(province)

    if (province) {
      const rateRow = getRateForProvince(province)
      if (rateRow) {
        setElectricityRate(String(rateRow.rate_kwh_ars))
        setProvinceChanged(true)
      }
    }
  }

  const selectedRate = getRateForProvince(selectedProvince)

  return (
    <form action={dispatch} className="flex flex-col gap-8 max-w-2xl" noValidate>

      {/* ------------------------------------------------------------------ */}
      {/* BUSINESS DATA                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Datos del negocio
        </h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="business_name" className="text-sm font-medium">
            Nombre del negocio <span className="text-destructive">*</span>
          </label>
          <Input
            id="business_name"
            name="business_name"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Ej: Impresiones 3D Córdoba"
            aria-required="true"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium">
            WhatsApp{' '}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: +54 9 351 000 0000"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="business_phone" className="text-sm font-medium">
            Teléfono fijo{' '}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            id="business_phone"
            name="business_phone"
            type="tel"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            placeholder="Ej: 0351 000-0000"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="logo_url" className="text-sm font-medium">
            URL del logo{' '}
            <span className="text-muted-foreground font-normal">(opcional — subir logo en Sprint 2)</span>
          </label>
          <Input
            id="logo_url"
            name="logo_url"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full"
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* COST DEFAULTS                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Valores predeterminados de costos
        </h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="labor_rate_hour" className="text-sm font-medium">
            Tarifa de mano de obra (ARS/h) <span className="text-destructive">*</span>
          </label>
          <Input
            id="labor_rate_hour"
            name="labor_rate_hour"
            type="number"
            min="1"
            step="1"
            value={laborRateHour}
            onChange={(e) => setLaborRateHour(e.target.value)}
            placeholder="1500"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="default_margin_percent" className="text-sm font-medium">
            Margen de ganancia (%) <span className="text-destructive">*</span>
          </label>
          <Input
            id="default_margin_percent"
            name="default_margin_percent"
            type="number"
            min="0"
            max="500"
            step="1"
            value={defaultMarginPercent}
            onChange={(e) => setDefaultMarginPercent(e.target.value)}
            placeholder="100"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            100% = precio sugerido = 2× el costo
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="default_labor_factor" className="text-sm font-medium">
            Factor de mano de obra{' '}
            <span className="text-muted-foreground font-normal">(0.05 – 0.40)</span>{' '}
            <span className="text-destructive">*</span>
          </label>
          <Input
            id="default_labor_factor"
            name="default_labor_factor"
            type="number"
            min="0.05"
            max="0.40"
            step="0.01"
            value={defaultLaborFactor}
            onChange={(e) => setDefaultLaborFactor(e.target.value)}
            placeholder="0.20"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Fracción del tiempo de impresión que asignás como costo de operación manual
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* PROVINCE + ELECTRICITY                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Tarifa eléctrica
        </h2>

        {/* Province select */}
        <div className="flex flex-col gap-1">
          <label htmlFor="province-select" className="text-sm font-medium">
            Provincia{' '}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>

          {/* ⚠️ Base-UI Select controlled gotcha:
                - value MUST be string (never undefined)
                - onValueChange signature is (val: string | null) => void
                - SelectValue children MUST be a render function
          */}
          <Select
            value={selectedProvince}
            onValueChange={handleProvinceChange}
          >
            <SelectTrigger
              id="province-select"
              className="w-full"
              aria-label="Seleccioná tu provincia"
              data-testid="province-select"
            >
              <SelectValue placeholder="Seleccioná tu provincia">
                {(val: string) => val || null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Argentina</SelectLabel>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Distributor info */}
          {selectedRate && (
            <p className="text-xs text-muted-foreground">
              Distribuidor: <span className="font-medium">{selectedRate.tier}</span>{' '}
              — tarifa actual:{' '}
              <span className="font-medium text-foreground">
                ${selectedRate.rate_kwh_ars.toFixed(3)} ARS/kWh
              </span>
            </p>
          )}
        </div>

        {/* Electricity rate (auto-filled, overridable) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="electricity_rate_kwh" className="text-sm font-medium">
            Tarifa eléctrica (ARS/kWh)
          </label>
          <Input
            id="electricity_rate_kwh"
            name="electricity_rate_kwh"
            type="number"
            min="0"
            step="0.001"
            value={electricityRate}
            onChange={(e) => {
              setElectricityRate(e.target.value)
              setProvinceChanged(false)
            }}
            placeholder="88.400"
            className="w-full"
          />
          {provinceChanged && (
            <p
              role="status"
              aria-live="polite"
              className="text-xs text-muted-foreground"
            >
              Tarifa actualizada al cambiar de provincia
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* ERROR / SUCCESS                                                       */}
      {/* ------------------------------------------------------------------ */}
      {state && !state.success && (
        <div
          aria-live="polite"
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          data-testid="form-error"
        >
          {state.error}
        </div>
      )}

      {state?.success && (
        <div
          aria-live="polite"
          role="status"
          className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
          data-testid="form-success"
        >
          Configuración guardada exitosamente
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SUBMIT                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar configuración'}
        </Button>
      </div>
    </form>
  )
}
