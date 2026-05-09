import { useState } from 'react'
import { Link } from 'react-router'
import { Sparkles, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { JokeCard } from '@/components/JokeCard'
import type { Joke } from '@/lib/api'
import { cn } from '@/lib/utils'

const formats = ['One-Liner', 'Setup & Punchline', 'Short Story']
const humorTypes = ['Dad Joke', 'Pun', 'Sarcastic', 'Dark', 'Geeky', 'Clean', 'Absurdist', 'Observational']
const ageRatings = ['Kid Safe (6-12)', 'Teen (13-17)', 'Adult (18+)', 'Family Friendly']
const contextTags = ['Work', 'School', 'Wedding', 'Social Media', 'Icebreaker', 'Holiday', 'Birthday']

export function SubmitJokePageLegacy() {
  const [format, setFormat] = useState('Setup & Punchline')
  const [setup, setSetup] = useState('')
  const [punchline, setPunchline] = useState('')
  const [text, setText] = useState('')
  const [selectedHumor, setSelectedHumor] = useState<string[]>([])
  const [selectedAge, setSelectedAge] = useState('')
  const [selectedContextTags, setSelectedContextTags] = useState<string[]>([])
  const [source, setSource] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const toggleHumor = (h: string) =>
    setSelectedHumor((prev) => prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h])
  const toggleContext = (c: string) =>
    setSelectedContextTags((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])

  const previewJoke: Joke = {
    id: 0,
    text: format === 'One-Liner' ? text : `${setup} ${punchline}`,
    setup: format !== 'One-Liner' ? (setup || 'Your setup goes here...') : null,
    punchline: format !== 'One-Liner' ? (punchline || '...and the punchline here!') : null,
    format: { id: 1, name: format, slug: format.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_') },
    age_rating: { id: 1, name: selectedAge || 'Family Friendly', slug: 'family_friendly', min_age: 0 },
    tones: selectedHumor.map((h, i) => ({ id: i, name: h, slug: h.toLowerCase().replace(/ /g, '_') })),
    context_tags: selectedContextTags.map((c, i) => ({ id: i, name: c, slug: c.toLowerCase().replace(/ /g, '_') })),
    culture_tags: [],
    language: { id: 1, name: 'English', code: 'en' },
    source: source || 'original',
    share_image_url: null,
    created_at: new Date().toISOString(),
  }

  const canSubmit = format === 'One-Liner' ? text.trim().length > 0 : (setup.trim().length > 0 && punchline.trim().length > 0)

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F6F6] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <span className="text-6xl block mb-6">🎉</span>
          <h1 className="font-display font-black text-3xl text-[#2E2F2F] mb-3">Joke Submitted!</h1>
          <p className="text-[#6B7280] mb-8">
            Your joke has been submitted for review. Our team will check it out and publish it if it passes the vibe check.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="pill" size="xl" onClick={() => { setSubmitted(false); setSetup(''); setPunchline(''); setText(''); setSelectedHumor([]); }}>
              Submit Another
            </Button>
            <Button variant="pill-outline" size="xl" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F6F6]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass shadow-[var(--shadow-header)] h-16 flex items-center justify-between px-6">
        <Link to="/">
          <img src="/Logos/compact_light.svg" alt="Jokes For" className="h-9" />
        </Link>
        <Button variant="pill" size="sm" disabled={!canSubmit} onClick={() => setSubmitted(true)}>
          <Sparkles className="size-4 mr-1.5" /> Submit for Review
        </Button>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display font-black text-3xl lg:text-4xl text-[#2E2F2F] mb-2">
            Submit a Joke
          </h1>
          <p className="text-[#6B7280]">Share your humor with the world. Every great punchline starts here.</p>
        </div>

        <div className="lg:grid lg:grid-cols-5 lg:gap-8">
          {/* Form — 3 cols */}
          <div className="lg:col-span-3 space-y-6">
            {/* Format */}
            <div>
              <label className="block text-sm font-semibold text-[#2E2F2F] mb-3">Format</label>
              <div className="flex gap-2">
                {formats.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      'px-4 py-2.5 rounded-full text-sm font-medium transition-all border-2',
                      format === f
                        ? 'bg-[#6A1CF6] text-white border-[#6A1CF6]'
                        : 'border-[#E9E8E7] text-[#52525B] hover:border-[#AC8EFF]'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Joke Input */}
            {format === 'One-Liner' ? (
              <div>
                <label className="block text-sm font-semibold text-[#2E2F2F] mb-2">Your Joke</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your one-liner here..."
                  className="w-full h-32 rounded-[24px] border border-[#E9E8E7] bg-white p-5 text-base outline-none focus:border-[#6A1CF6] focus:ring-2 focus:ring-[#6A1CF6]/20 resize-none"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-[#2E2F2F] mb-2">Setup</label>
                  <textarea
                    value={setup}
                    onChange={(e) => setSetup(e.target.value)}
                    placeholder="Set the scene... (e.g., 'Why did the chicken cross the road?')"
                    className="w-full h-24 rounded-[24px] border border-[#E9E8E7] bg-white p-5 text-base outline-none focus:border-[#6A1CF6] focus:ring-2 focus:ring-[#6A1CF6]/20 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2E2F2F] mb-2">Punchline</label>
                  <textarea
                    value={punchline}
                    onChange={(e) => setPunchline(e.target.value)}
                    placeholder="Drop the punchline..."
                    className="w-full h-24 rounded-[24px] border border-[#E9E8E7] bg-white p-5 text-base outline-none focus:border-[#6A1CF6] focus:ring-2 focus:ring-[#6A1CF6]/20 resize-none"
                  />
                </div>
              </>
            )}

            {/* Humor Type */}
            <div>
              <label className="block text-sm font-semibold text-[#2E2F2F] mb-3">Humor Type</label>
              <div className="flex flex-wrap gap-2">
                {humorTypes.map((h) => (
                  <Chip key={h} selected={selectedHumor.includes(h)} onClick={() => toggleHumor(h)}>{h}</Chip>
                ))}
              </div>
            </div>

            {/* Age Rating */}
            <div>
              <label className="block text-sm font-semibold text-[#2E2F2F] mb-3">Age Rating</label>
              <div className="flex flex-wrap gap-2">
                {ageRatings.map((a) => (
                  <button
                    key={a}
                    onClick={() => setSelectedAge(a)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium border-2 transition-all',
                      selectedAge === a
                        ? 'bg-[#CAFD00]/20 border-[#CAFD00] text-[#3A4A00]'
                        : 'border-[#E9E8E7] text-[#52525B] hover:border-[#AC8EFF]'
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Context Tags */}
            <div>
              <label className="block text-sm font-semibold text-[#2E2F2F] mb-3">Context Tags <span className="font-normal text-[#6B7280]">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                {contextTags.map((c) => (
                  <Chip key={c} selected={selectedContextTags.includes(c)} onClick={() => toggleContext(c)}>{c}</Chip>
                ))}
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-semibold text-[#2E2F2F] mb-2">Source <span className="font-normal text-[#6B7280]">(optional)</span></label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Credit the original author if not your own"
                className="w-full h-10 rounded-full border border-[#E9E8E7] bg-white px-5 text-sm outline-none focus:border-[#6A1CF6]"
              />
            </div>

            {/* Submit (mobile) */}
            <div className="lg:hidden pt-2">
              <Button variant="pill" size="xl" className="w-full gap-2" disabled={!canSubmit} onClick={() => setSubmitted(true)}>
                <Sparkles className="size-5" /> Submit for Review
              </Button>
            </div>

            {/* Guidelines */}
            <Card radius="md" className="p-5 bg-[#F7F0FF] lg:hidden">
              <h3 className="font-semibold text-sm text-[#6A1CF6] mb-2">Submission Guidelines</h3>
              <ul className="text-xs text-[#52525B] space-y-1.5">
                <li>• Jokes must be original or properly attributed</li>
                <li>• Tag age ratings accurately — kid safety is non-negotiable</li>
                <li>• Reviews take 24-48 hours</li>
              </ul>
            </Card>
          </div>

          {/* Preview — 2 cols */}
          <div className="hidden lg:block lg:col-span-2 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="size-5 text-[#6B7280]" />
              <h3 className="font-display font-bold text-lg text-[#2E2F2F]">Live Preview</h3>
            </div>
            <JokeCard joke={previewJoke} />

            {/* Guidelines */}
            <Card radius="md" className="p-5 bg-[#F7F0FF] mt-6">
              <h3 className="font-semibold text-sm text-[#6A1CF6] mb-2">Submission Guidelines</h3>
              <ul className="text-xs text-[#52525B] space-y-1.5">
                <li>• Jokes must be original or properly attributed</li>
                <li>• Tag age ratings accurately — kid safety is non-negotiable</li>
                <li>• Reviews typically take 24-48 hours</li>
                <li>• Published jokes earn you creator karma!</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
