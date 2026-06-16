import { useState } from 'react'
import { readConsent, writeConsent, type ConsentRecord } from './storage'
import { isAdult } from './age'
import { initAnalytics } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'

interface ConsentState {
  consent: ConsentRecord | null
  decided: boolean
  accept: () => void
  reject: () => void
}

export function useConsent(): ConsentState {
  const [consent, setConsent] = useState<ConsentRecord | null>(() => readConsent())

  const decided = consent !== null

  function accept() {
    writeConsent(true)
    const record = readConsent()!
    setConsent(record)
    // Only init analytics if the current user is a verified adult
    const user = useAuthStore.getState().user
    if (isAdult(user?.date_of_birth)) {
      initAnalytics()
    }
  }

  function reject() {
    writeConsent(false)
    const record = readConsent()!
    setConsent(record)
    // Never touch analytics on reject
  }

  return { consent, decided, accept, reject }
}
