import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { ArrowLeft, ArrowRight, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUpdatePreferences } from '@/features/preferences'

/**
 * Flow — onboarding journey.
 *
 * 4 steps:
 *   0. Welcome (brand moment)
 *   1. Tone preferences (multi-select)
 *   2. Age rating (single-select)
 *   3. Languages (multi-select)
 *
 * Skippable. Saves on finish via useUpdatePreferences (mock-only today).
 * Lands on /flow-canvas at completion.
 *
 * Iteration 1: built without seeing the original Flow.html design. Visual
 * specifics will likely change; structure and the 4-step sequence should hold.
 *
 * TODO when API hooks land:
 *   - Replace hardcoded TONES / AGE_RATINGS / LANGUAGES with calls to
 *     /tones/, /age-ratings/, /languages/ (lookup tables in backend handoff).
 *   - Wire useUpdatePreferences to a real adapter once preferences API is wired.
 */
export function FlowPage() {
  const navigate = useNavigate()
  const updatePreferences = useUpdatePreferences()

  const [step, setStep] = useState(0)
  const [selectedTones, setSelectedTones] = useState<string[]>([])
  const [selectedAgeRating, setSelectedAgeRating] = useState<string | null>(null)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['english'])

  const totalSteps = 4

  const goNext = () => setStep((s) => Math.min(s + 1, totalSteps - 1))
  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  const finish = () => {
    updatePreferences.mutate(
      {
        tones: selectedTones,
        ageRating: selectedAgeRating ?? undefined,
        languages: selectedLanguages,
      },
      {
        onSettled: () => navigate('/flow-canvas', { replace: true }),
      },
    )
  }

  const skip = () => navigate('/flow-canvas', { replace: true })

  const toggleTone = (slug: string) =>
    setSelectedTones((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug],
    )

  const toggleLanguage = (slug: string) =>
    setSelectedLanguages((prev) =>
      prev.includes(slug) ? prev.filter((l) => l !== slug) : [...prev, slug],
    )

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: 'linear-gradient(180deg, #F7F0FF 0%, #F8F6F6 60%, #F8F6F6 100%)',
      }}
    >
      {/* Top bar — logo + skip */}
      <header className="px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link to="/" aria-label="Jokes For — home">
          <img src="/Logos/compact_light.svg" alt="Jokes For" className="h-9" />
        </Link>
        {step < totalSteps - 1 && (
          <button
            type="button"
            onClick={skip}
            className="text-sm text-[#6B7280] hover:text-[#2E2F2F] transition-colors"
          >
            Skip for now
          </button>
        )}
      </header>

      {/* Step indicator */}
      <div className="max-w-xl mx-auto w-full px-6 mb-8">
        <StepIndicator current={step} total={totalSteps} />
      </div>

      {/* Step body */}
      <main className="flex-1 flex items-start justify-center px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <div
            key={step}
            className="bg-white rounded-[48px] shadow-card border border-[#E9E8E7] p-8 lg:p-12 animate-fade-in-up"
          >
            {step === 0 && <WelcomeStep onNext={goNext} />}
            {step === 1 && (
              <TonesStep
                selected={selectedTones}
                onToggle={toggleTone}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {step === 2 && (
              <AgeRatingStep
                selected={selectedAgeRating}
                onSelect={setSelectedAgeRating}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {step === 3 && (
              <LanguagesStep
                selected={selectedLanguages}
                onToggle={toggleLanguage}
                onFinish={finish}
                onBack={goBack}
                isPending={updatePreferences.isPending}
              />
            )}
          </div>

          <p className="text-center text-xs text-[#6B7280] mt-4">
            You can change any of these later in Settings.
          </p>
        </div>
      </main>

      <div className="h-12" aria-hidden />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Step indicator
// ──────────────────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total} aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current
        const isComplete = i < current
        return (
          <div
            key={i}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: isActive ? 32 : 8,
              backgroundColor: isComplete
                ? '#6A1CF6'
                : isActive
                ? '#CAFD00'
                : '#E9E8E7',
            }}
          />
        )
      })}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Step 0 — Welcome
// ──────────────────────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F7F0FF] mb-6">
        <Sparkles className="w-7 h-7 text-[#6A1CF6]" />
      </div>
      <h1 className="font-display text-3xl lg:text-4xl text-[#2E2F2F] tracking-tight">
        Welcome to Jokes For
      </h1>
      <p className="mt-3 text-[#52525B]">
        We help you find the right joke for any moment. Let's set up a few
        preferences so we can serve you better — should take about a minute.
      </p>
      <Button
        type="button"
        variant="pill-lime"
        size="xl"
        className="mt-8 w-full"
        onClick={onNext}
      >
        Let's go
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Step 1 — Tone preferences
// ──────────────────────────────────────────────────────────────────────────

function TonesStep({
  selected,
  onToggle,
  onNext,
  onBack,
}: {
  selected: string[]
  onToggle: (slug: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <>
      <h2 className="font-display text-2xl lg:text-3xl text-[#2E2F2F]">
        What tones land for you?
      </h2>
      <p className="mt-2 text-[#52525B]">Pick as many as you like.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TONES.map((tone) => {
          const isSelected = selected.includes(tone.slug)
          return (
            <button
              key={tone.slug}
              type="button"
              onClick={() => onToggle(tone.slug)}
              aria-pressed={isSelected}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                isSelected
                  ? 'bg-[#6A1CF6] text-white border-[#6A1CF6]'
                  : 'bg-white text-[#2E2F2F] border-[#E9E8E7] hover:border-[#AC8EFF] hover:bg-[#F7F0FF]'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 mr-1 inline -mt-0.5" />}
              {tone.label}
            </button>
          )
        })}
      </div>

      <StepFooter onBack={onBack}>
        <Button type="button" variant="pill" size="xl" onClick={onNext}>
          Continue
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </StepFooter>
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Step 2 — Age rating
// ──────────────────────────────────────────────────────────────────────────

function AgeRatingStep({
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  selected: string | null
  onSelect: (slug: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <>
      <h2 className="font-display text-2xl lg:text-3xl text-[#2E2F2F]">
        How spicy do you like it?
      </h2>
      <p className="mt-2 text-[#52525B]">
        Sets the default content filter. You can override per search.
      </p>

      <div className="mt-6 space-y-3">
        {AGE_RATINGS.map((rating) => {
          const isSelected = selected === rating.slug
          return (
            <button
              key={rating.slug}
              type="button"
              onClick={() => onSelect(rating.slug)}
              aria-pressed={isSelected}
              className={`w-full text-left rounded-[24px] p-5 border transition-all ${
                isSelected
                  ? 'border-[#6A1CF6] bg-[#F7F0FF] shadow-cta'
                  : 'border-[#E9E8E7] bg-white hover:border-[#AC8EFF]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${
                    isSelected ? 'bg-[#6A1CF6] text-white' : 'bg-[#F2F0F0] text-[#52525B]'
                  }`}
                >
                  {rating.label}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-[#2E2F2F]">{rating.title}</p>
                  <p className="text-sm text-[#6B7280]">{rating.description}</p>
                </div>
                {isSelected && <Check className="w-5 h-5 text-[#6A1CF6] shrink-0" />}
              </div>
            </button>
          )
        })}
      </div>

      <StepFooter onBack={onBack}>
        <Button
          type="button"
          variant="pill"
          size="xl"
          onClick={onNext}
          disabled={!selected}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </StepFooter>
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Step 3 — Languages
// ──────────────────────────────────────────────────────────────────────────

function LanguagesStep({
  selected,
  onToggle,
  onFinish,
  onBack,
  isPending,
}: {
  selected: string[]
  onToggle: (slug: string) => void
  onFinish: () => void
  onBack: () => void
  isPending: boolean
}) {
  return (
    <>
      <h2 className="font-display text-2xl lg:text-3xl text-[#2E2F2F]">
        Which languages do you read?
      </h2>
      <p className="mt-2 text-[#52525B]">We'll prioritize jokes in these.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => {
          const isSelected = selected.includes(lang.slug)
          return (
            <button
              key={lang.slug}
              type="button"
              onClick={() => onToggle(lang.slug)}
              aria-pressed={isSelected}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                isSelected
                  ? 'bg-[#6A1CF6] text-white border-[#6A1CF6]'
                  : 'bg-white text-[#2E2F2F] border-[#E9E8E7] hover:border-[#AC8EFF] hover:bg-[#F7F0FF]'
              }`}
            >
              <span className="mr-1.5">{lang.flag}</span>
              {lang.label}
            </button>
          )
        })}
      </div>

      <StepFooter onBack={onBack}>
        <Button
          type="button"
          variant="pill-lime"
          size="xl"
          onClick={onFinish}
          disabled={selected.length === 0 || isPending}
        >
          {isPending ? 'Saving…' : 'Finish setup'}
          {!isPending && <ArrowRight className="w-4 h-4 ml-1" />}
        </Button>
      </StepFooter>
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Step footer (Back + primary action)
// ──────────────────────────────────────────────────────────────────────────

function StepFooter({ onBack, children }: { onBack?: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[#6B7280] hover:text-[#2E2F2F] transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      ) : (
        <span />
      )}
      {children}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Static lookup data — replace with /tones/, /age-ratings/, /languages/
// when those endpoints get React-Query hook coverage.
// ──────────────────────────────────────────────────────────────────────────

const TONES = [
  { slug: 'witty', label: 'Witty' },
  { slug: 'wholesome', label: 'Wholesome' },
  { slug: 'dry', label: 'Dry' },
  { slug: 'dark', label: 'Dark' },
  { slug: 'goofy', label: 'Goofy' },
  { slug: 'clever', label: 'Clever' },
  { slug: 'surreal', label: 'Surreal' },
  { slug: 'heartwarming', label: 'Heartwarming' },
  { slug: 'observational', label: 'Observational' },
  { slug: 'absurd', label: 'Absurd' },
]

const AGE_RATINGS = [
  {
    slug: 'g',
    label: 'G',
    title: 'All ages',
    description: 'Safe for any room.',
  },
  {
    slug: 'pg',
    label: 'PG',
    title: 'Mostly safe',
    description: 'Tame but with a touch of edge.',
  },
  {
    slug: 'pg-13',
    label: '13+',
    title: 'Light spice',
    description: 'Mild adult humor, occasional bite.',
  },
  {
    slug: 'r',
    label: 'R',
    title: 'Full spice',
    description: 'Adult themes, language, dark humor.',
  },
]

const LANGUAGES = [
  { slug: 'english', label: 'English', flag: '🇬🇧' },
  { slug: 'spanish', label: 'Spanish', flag: '🇪🇸' },
  { slug: 'french', label: 'French', flag: '🇫🇷' },
  { slug: 'german', label: 'German', flag: '🇩🇪' },
  { slug: 'russian', label: 'Russian', flag: '🇷🇺' },
  { slug: 'armenian', label: 'Armenian', flag: '🇦🇲' },
]
