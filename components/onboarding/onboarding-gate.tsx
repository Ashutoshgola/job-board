'use client'

import { OnboardingDialog } from '@/components/onboarding/onboarding-dialog'

export function OnboardingGate({ hasResume }: { hasResume: boolean }) {
  if (hasResume) return null
  return <OnboardingDialog />
}
