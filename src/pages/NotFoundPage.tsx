import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { mockJokes } from '@/lib/mock-data'

export function NotFoundPage() {
  // Pick a random joke for the 404 page
  const randomJoke = mockJokes[Math.floor(Math.random() * mockJokes.length)]

  return (
    <div className="min-h-screen bg-[#F8F6F6] flex flex-col items-center justify-center px-4 text-center">
      {/* Logo */}
      <Link to="/" className="mb-8">
        <img src="/Logos/compact_light.svg" alt="Jokes For" className="h-10" />
      </Link>

      {/* 404 */}
      <h1 className="font-display font-black text-8xl lg:text-[150px] text-[#6A1CF6] leading-none mb-4">
        404
      </h1>

      <h2 className="font-display font-bold text-2xl lg:text-3xl text-[#2E2F2F] mb-3">
        This joke doesn't exist... yet.
      </h2>

      <p className="text-[#6B7280] max-w-md mb-8">
        The page you're looking for has pulled a disappearing act. But hey, here's a consolation joke:
      </p>

      {/* Random Joke */}
      <div className="bg-white rounded-[32px] p-6 max-w-md w-full mb-8 shadow-[var(--shadow-card)]">
        {randomJoke.setup ? (
          <>
            <p className="font-semibold text-[#2E2F2F] text-base mb-2">{randomJoke.setup}</p>
            {randomJoke.punchline && (
              <div className="flex gap-3">
                <div className="w-[3px] bg-[#6A1CF6] rounded-full shrink-0" />
                <p className="font-display font-bold italic text-base text-[#6A1CF6]">{randomJoke.punchline}</p>
              </div>
            )}
          </>
        ) : (
          <p className="font-semibold text-[#2E2F2F] text-base">{randomJoke.text}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="pill" size="xl" asChild>
          <Link to="/">Take Me Home</Link>
        </Button>
        <Button variant="pill-outline" size="xl" asChild>
          <Link to="/search">Try Searching</Link>
        </Button>
      </div>
    </div>
  )
}
