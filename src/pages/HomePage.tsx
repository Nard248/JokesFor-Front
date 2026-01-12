import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, Smile, Skull, Target, Briefcase, Baby, Sparkles, Zap, PartyPopper } from 'lucide-react'

// Floating joke bubbles for visual interest
const floatingJokes = [
  { text: "Why don't scientists trust atoms? They make up everything!", top: '10%', left: '5%', delay: '0s', size: 'sm' },
  { text: "I told my wife she was drawing her eyebrows too high. She looked surprised.", top: '25%', right: '8%', delay: '1s', size: 'md' },
  { text: "What do you call a fake noodle? An impasta!", top: '60%', left: '3%', delay: '2s', size: 'sm' },
  { text: "Why did the scarecrow win an award? He was outstanding in his field!", top: '75%', right: '5%', delay: '0.5s', size: 'md' },
  { text: "I'm reading a book about anti-gravity. It's impossible to put down!", top: '45%', left: '8%', delay: '1.5s', size: 'sm' },
]

const categories = [
  { label: 'Dad Jokes', slug: 'dad-joke', icon: Smile, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  { label: 'Dark Humor', slug: 'dark-humor', icon: Skull, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { label: 'Puns', slug: 'pun', icon: Target, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { label: 'Work Safe', slug: 'work-safe', icon: Briefcase, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { label: 'Kid Friendly', slug: 'kid-friendly', icon: Baby, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
]

const suggestions = ['wedding speech', 'office party', 'kids birthday', 'first date']

export function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    } else {
      navigate('/search')
    }
  }

  const handleCategoryClick = (slug: string) => {
    navigate(`/search?tones=${slug}`)
  }

  const handleSuggestionClick = (suggestion: string) => {
    navigate(`/search?q=${encodeURIComponent(suggestion)}`)
  }

  return (
    <div className="relative py-8 md:py-12 overflow-hidden">
      {/* Floating joke bubbles - hidden on mobile for cleaner look */}
      <div className="hidden lg:block">
        {floatingJokes.map((joke, i) => (
          <div
            key={i}
            className={`absolute max-w-xs p-3 rounded-2xl bg-card border border-border shadow-lg opacity-60 hover:opacity-100 transition-opacity cursor-default animate-float ${joke.size === 'sm' ? 'text-xs' : 'text-sm'}`}
            style={{
              top: joke.top,
              left: joke.left,
              right: joke.right,
              animationDelay: joke.delay,
            }}
          >
            <p className="text-muted-foreground italic">"{joke.text}"</p>
          </div>
        ))}
      </div>

      {/* Decorative background shapes */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12 relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-bounce-slow">
          <PartyPopper className="w-4 h-4" />
          <span>Over 5,000 jokes and counting!</span>
          <Zap className="w-4 h-4" />
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
          Find Your{' '}
          <span className="text-primary relative">
            Perfect Joke
            <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
              <path d="M1 5.5C47 2 153 2 199 5.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/30" />
            </svg>
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
          Search thousands of jokes by mood, occasion, and style.
        </p>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          From dad jokes to dark humor, <span className="font-semibold text-foreground">we've got you covered.</span>
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12 relative">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center bg-card rounded-xl border-2 border-border focus-within:border-primary transition-colors shadow-lg">
            <Search className="w-5 h-5 text-muted-foreground ml-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for jokes about..."
              className="flex-1 px-4 py-4 text-lg bg-transparent focus:outline-none"
            />
            <button
              type="submit"
              className="m-2 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {/* Search suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <span>Try:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="hover:text-primary hover:underline transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>

      {/* Quick categories */}
      <div className="mb-12">
        <h2 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Browse by category
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => handleCategoryClick(cat.slug)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all hover:scale-105 active:scale-95 ${cat.color}`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Fun stats section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {[
          { value: '5,000+', label: 'Jokes', icon: '?' },
          { value: '50+', label: 'Categories', icon: '?' },
          { value: '10k+', label: 'Happy Users', icon: '?' },
          { value: '99%', label: 'Laugh Rate', icon: '?' },
        ].map((stat) => (
          <div key={stat.label} className="text-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-display font-bold text-primary">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
