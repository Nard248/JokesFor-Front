import { useNavigate, Link } from 'react-router'
import { X, Check, HelpCircle, Globe, Smile, MessageSquare, Lightbulb, Moon, GraduationCap, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ui/progress-bar'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { cn } from '@/lib/utils'

const humorTypesDesktop = [
  {
    id: 'dad_jokes',
    icon: Smile,
    title: 'Dad Jokes',
    description: 'Puns so bad they are actually legendary. High eye-roll potential.',
  },
  {
    id: 'sarcasm',
    icon: MessageSquare,
    title: 'Sarcasm',
    description: "For the sharp-witted. Because being nice is just too easy, isn't it?",
  },
  {
    id: 'puns',
    icon: Sparkles,
    title: 'Puns',
    description: "A play on words that will leave your friends wishing they hadn't asked.",
  },
  {
    id: 'dark_humor',
    icon: Moon,
    title: 'Dark Humor',
    description: 'Like a cup of coffee, best enjoyed black. Not for the faint of heart.',
  },
  {
    id: 'intellectual',
    icon: GraduationCap,
    title: 'Intellectual',
    description: 'Nerd-tier jokes about physics, philosophy, and Oxford commas.',
  },
  {
    id: 'surreal',
    icon: Sparkles,
    title: 'Surreal',
    description: 'Absurdist humor that defies logic and often features talking fruit.',
  },
]

const humorTypesMobile = [
  {
    id: 'dad_jokes',
    icon: Smile,
    title: 'Dad Jokes',
    description: "Puns so bad they're good. Warning: Excessive groaning guaranteed.",
  },
  {
    id: 'sarcasm',
    icon: MessageSquare,
    title: 'Sarcasm',
    description: 'Oh, you really want this? How original. Intelligent wit for the cynical soul.',
  },
  {
    id: 'puns',
    icon: Lightbulb,
    title: 'Puns',
    description: 'Wordplay that hits different. A pun-derful choice for the clever.',
  },
  {
    id: 'geeky',
    icon: GraduationCap,
    title: 'Geeky',
    description: 'Math, coding, and science jokes. There are only 10 types of people...',
  },
  {
    id: 'wildcard',
    icon: Sparkles,
    title: 'The Wildcard',
    description: "Don't box me in. Give me a mix of everything—dark humor, wholesome memes, and bizarre observations.",
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { currentStep, totalSteps, selectedHumorTypes, toggleHumorType, nextStep, prevStep } = useOnboardingStore()

  const handleContinue = () => {
    if (currentStep < totalSteps) {
      nextStep()
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F6] relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 left-0 w-1/2 h-64 bg-gradient-purple opacity-10 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-1/3 h-48 bg-gradient-to-t from-[#CAFD00]/20 to-transparent blur-2xl" />

      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between px-8 py-5">
        <Link to="/">
          <img src="/Logos/compact_light.svg" alt="Jokes For" className="h-9" />
        </Link>
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} className="flex-1 max-w-lg mx-8" />
        <div />
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-4">
        <Link to="/">
          <img src="/Logos/compact_light.svg" alt="Jokes For" className="h-7" />
        </Link>
        <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
          Step {String(currentStep).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
        </span>
        <button onClick={() => navigate('/')} className="size-8 flex items-center justify-center rounded-full hover:bg-[#F2F0F0]">
          <X className="size-5 text-[#6B7280]" />
        </button>
      </header>

      {/* Mobile Progress Bar */}
      <div className="lg:hidden px-4 mb-6">
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 lg:px-8 pb-32 lg:pb-8">
        {/* Step Badge (Desktop) */}
        <div className="hidden lg:block mb-4">
          <Badge variant="lime" size="lg">Step {currentStep} of {totalSteps}</Badge>
        </div>

        {/* Heading */}
        <h1 className="font-display font-black text-3xl lg:text-5xl text-[#2E2F2F] mb-3 text-center lg:text-left">
          Pick your <span className="text-[#6A1CF6]">Flavor</span> of funny.
        </h1>
        <p className="text-[#6B7280] text-base lg:text-lg mb-8 max-w-xl text-center lg:text-left leading-relaxed">
          We'll tailor your daily dose of dopamine based on the kind of humor that actually makes you crack a smile.
        </p>

        {/* Desktop: 3x2 grid */}
        <div className="hidden lg:grid grid-cols-3 gap-4 mb-12">
          {humorTypesDesktop.map((type) => {
            const isSelected = selectedHumorTypes.includes(type.id)
            return (
              <button
                key={type.id}
                onClick={() => toggleHumorType(type.id)}
                className={cn(
                  'relative rounded-[32px] p-6 text-left transition-all',
                  isSelected
                    ? 'bg-[#CAFD00] border-2 border-[#CAFD00] shadow-lg'
                    : 'bg-[#FAFAFA] border-2 border-transparent hover:border-[#E9E8E7]'
                )}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 size-6 rounded-full bg-[#3A4A00] flex items-center justify-center">
                    <Check className="size-3 text-[#CAFD00]" />
                  </div>
                )}
                <div className={cn(
                  'size-10 rounded-full flex items-center justify-center mb-4',
                  isSelected ? 'bg-[#3A4A00]/10' : 'bg-[#F2F0F0]'
                )}>
                  <type.icon className={cn('size-5', isSelected ? 'text-[#3A4A00]' : 'text-[#6A1CF6]')} />
                </div>
                <h3 className={cn('font-display font-bold text-lg mb-1', isSelected ? 'text-[#1A2E05]' : 'text-[#2E2F2F]')}>
                  {type.title}
                </h3>
                <p className={cn('text-sm leading-relaxed', isSelected ? 'text-[#3A4A00]' : 'text-[#6B7280]')}>
                  {type.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Mobile: stacked cards */}
        <div className="lg:hidden space-y-3 mb-8">
          {humorTypesMobile.map((type) => {
            const isSelected = selectedHumorTypes.includes(type.id)
            return (
              <button
                key={type.id}
                onClick={() => toggleHumorType(type.id)}
                className={cn(
                  'w-full relative rounded-[32px] p-5 text-left transition-all',
                  isSelected
                    ? 'bg-[#CAFD00] border-2 border-[#CAFD00]'
                    : 'bg-[#FAFAFA] border-2 border-transparent'
                )}
              >
                {isSelected && (
                  <Badge variant="default" size="sm" className="absolute top-4 right-4 bg-[#3A4A00] gap-1">
                    <Check className="size-3" /> Selected
                  </Badge>
                )}
                <div className={cn(
                  'size-10 rounded-full flex items-center justify-center mb-3',
                  isSelected ? 'bg-[#3A4A00]/10' : 'bg-[#F2F0F0]'
                )}>
                  <type.icon className={cn('size-5', isSelected ? 'text-[#3A4A00]' : 'text-[#6A1CF6]')} />
                </div>
                <h3 className={cn('font-display font-bold text-lg mb-1', isSelected ? 'text-[#1A2E05]' : 'text-[#2E2F2F]')}>
                  {type.title}
                </h3>
                <p className={cn('text-sm leading-relaxed', isSelected ? 'text-[#3A4A00]' : 'text-[#6B7280]')}>
                  {type.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Mobile CTA */}
        <div className="lg:hidden space-y-3">
          <Button variant="pill" size="xl" className="w-full gap-2" onClick={handleContinue}>
            Continue to Feed →
          </Button>
          {currentStep > 1 && (
            <button onClick={prevStep} className="w-full text-center text-sm font-semibold text-[#6A1CF6]">
              Back to Personality
            </button>
          )}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button className="size-8 flex items-center justify-center rounded-full border border-[#E9E8E7]">
              <HelpCircle className="size-4 text-[#6B7280]" />
            </button>
            <button className="size-8 flex items-center justify-center rounded-full border border-[#E9E8E7]">
              <Globe className="size-4 text-[#6B7280]" />
            </button>
          </div>
        </div>
      </main>

      {/* Desktop Footer */}
      <footer className="hidden lg:flex items-center justify-between px-8 py-6 border-t border-[#E9E8E7] bg-white/50 fixed bottom-0 left-0 right-0">
        <button onClick={prevStep} className="text-sm font-semibold text-[#6A1CF6]">
          Back
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#6B7280]">You can change this later</span>
          <Button variant="pill" size="xl" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </footer>

      {/* Desktop Help Button */}
      <button className="hidden lg:flex fixed bottom-20 right-8 size-10 rounded-full border border-[#E9E8E7] bg-white items-center justify-center shadow-sm hover:shadow-md transition-shadow">
        <HelpCircle className="size-5 text-[#6B7280]" />
      </button>
    </div>
  )
}
