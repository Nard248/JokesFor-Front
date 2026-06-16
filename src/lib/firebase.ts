import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Module-level memos — nothing runs at import time.
let appMemo: FirebaseApp | undefined
let analyticsMemo: Promise<Analytics | null> | undefined

/** Lazily initialise the Firebase app (at most once). */
function getFirebaseApp(): FirebaseApp {
  if (!appMemo) {
    appMemo = initializeApp(firebaseConfig)
  }
  return appMemo
}

/**
 * Idempotent analytics init — call after the user gives consent (and only
 * then). Returns the Analytics instance or null if unsupported / no
 * measurementId. Subsequent calls return the same in-flight/resolved promise.
 */
export function initAnalytics(): Promise<Analytics | null> {
  if (analyticsMemo !== undefined) return analyticsMemo

  if (!firebaseConfig.measurementId) {
    analyticsMemo = Promise.resolve(null)
    return analyticsMemo
  }

  analyticsMemo = isSupported().then((supported) =>
    supported ? getAnalytics(getFirebaseApp()) : null,
  )
  return analyticsMemo
}

/** True once initAnalytics() has been called (regardless of outcome). */
export function isAnalyticsInitialized(): boolean {
  return analyticsMemo !== undefined
}
