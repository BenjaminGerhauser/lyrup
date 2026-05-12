'use client'

import { useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { OnboardingDraft } from '@/types/domain'
import { completeOnboarding } from '@/app/actions/onboarding'
import Step1Business from '@/components/onboarding/step-1-business'
import Step2Printer from '@/components/onboarding/step-2-printer'
import Step3Material from '@/components/onboarding/step-3-material'
import Step4Province from '@/components/onboarding/step-4-province'

const TOTAL_STEPS = 4

const EMPTY_DRAFT: OnboardingDraft = {
  business_name: '',
  phone: '',
  printer_model_id: '',
  printer_name: '',
  filament_id: '',
  filament_name: '',
  province: '',
  electricity_rate_kwh: 0,
}

export default function OnboardingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Step is URL-driven so browser back/forward works.
  // Defaults to 1 if the param is absent or out of range.
  const rawStep = Number(searchParams.get('step') ?? '1')
  const currentStep = rawStep >= 1 && rawStep <= TOTAL_STEPS ? rawStep : 1

  // Form data lives in memory — lost on full reload (documented limitation).
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT)
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const [isPending, startTransition] = useTransition()

  function advanceStep(partial: Partial<OnboardingDraft>) {
    setDraft((prev) => ({ ...prev, ...partial }))
    router.replace(`?step=${currentStep + 1}`)
  }

  function handleFinalSubmit(partial: Partial<OnboardingDraft>) {
    const final = { ...draft, ...partial }
    setDraft(final)
    setSubmitError(undefined)

    startTransition(async () => {
      const result = await completeOnboarding(final)
      // If redirect() was called, this branch is unreachable.
      // Only reached when the action returns { error }.
      if (result && 'error' in result) {
        setSubmitError(result.error)
      }
    })
  }

  return (
    <div className="w-full max-w-md">
      {/* Progress indicator */}
      <div className="mb-8">
        <p className="text-lyrup-text-secondary text-sm mb-2 text-center">
          Paso {currentStep} de {TOTAL_STEPS}
        </p>
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i + 1 <= currentStep ? 'bg-lyrup-cyan' : 'bg-lyrup-border'
              }`}
            />
          ))}
        </div>
      </div>

      {currentStep === 1 && (
        <Step1Business
          initialValues={{ business_name: draft.business_name, phone: draft.phone }}
          onNext={advanceStep}
        />
      )}

      {currentStep === 2 && (
        <Step2Printer
          initialValue={draft.printer_model_id}
          onNext={advanceStep}
        />
      )}

      {currentStep === 3 && (
        <Step3Material
          initialValue={draft.filament_id}
          onNext={advanceStep}
        />
      )}

      {currentStep === 4 && (
        <Step4Province
          draft={draft}
          onSubmit={handleFinalSubmit}
          isPending={isPending}
          error={submitError}
        />
      )}
    </div>
  )
}
