import { useEffect, useState } from 'react'
import { readConsent, writeConsent, subscribeConsent, type ConsentRecord } from './storage'
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

  useEffect(() => subscribeConsent(() => setConsent(readConsent())), [])

  const decided = consent !== null

  function accept() {
    const record = writeConsent(true)
    setConsent(record)
    // Only init analytics if the current user is a verified adult
    const user = useAuthStore.getState().user
    if (isAdult(user?.date_of_birth)) {
      initAnalytics().catch(() => { /* analytics is best-effort */ })
    }
  }

  function reject() {
    const record = writeConsent(false)
    setConsent(record)
    // Never touch analytics on reject
  }

  return { consent, decided, accept, reject }
}
