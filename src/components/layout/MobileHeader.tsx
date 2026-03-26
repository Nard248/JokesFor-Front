import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

export function MobileHeader() {
  const navigate = useNavigate()

  return (
    <header className="lg:hidden flex sticky top-0 z-50 w-full items-center justify-between h-14 px-4 glass shadow-[var(--shadow-header)]">
      <Link to="/">
        <img src="/Logos/compact_light.svg" alt="Jokes For" className="h-7" />
      </Link>
      <Button
        variant="pill-lime"
        size="sm"
        className="rounded-full px-4 h-8 text-xs"
        onClick={() => navigate('/submit')}
      >
        Post Joke
      </Button>
    </header>
  )
}
