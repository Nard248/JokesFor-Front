import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  currentStep: number
  totalSteps: number
  selectedHumorTypes: string[]
  isComplete: boolean
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  toggleHumorType: (type: string) => void
  complete: () => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      totalSteps: 3,
      selectedHumorTypes: [],
      isComplete: false,

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, state.totalSteps) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

      toggleHumorType: (type) =>
        set((state) => ({
          selectedHumorTypes: state.selectedHumorTypes.includes(type)
            ? state.selectedHumorTypes.filter((t) => t !== type)
            : [...state.selectedHumorTypes, type],
        })),

      complete: () => set({ isComplete: true }),
      reset: () => set({ currentStep: 1, selectedHumorTypes: [], isComplete: false }),
    }),
    {
      name: 'jokesfor-onboarding',
    }
  )
)
