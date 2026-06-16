import { Heart } from 'lucide-react'
import { Link } from 'react-router'

export function Footer() {
  return (
    <footer className="border-t border-[#E9E8E7] bg-white/50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/">
            <img src="/Logos/horizontal_light.svg" alt="Jokes For" className="h-10" />
          </Link>

          <div className="flex items-center gap-6 text-sm text-[#6B7280]">
            <Link to="/privacy" className="hover:text-[#6A1CF6] transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-[#6A1CF6] transition-colors">Terms</Link>
            <Link to="/cookie-policy" className="hover:text-[#6A1CF6] transition-colors">Cookie Policy</Link>
            <Link to="/childrens-privacy" className="hover:text-[#6A1CF6] transition-colors">Children's Privacy</Link>
          </div>

          <div className="flex items-center gap-1 text-sm text-[#6B7280]">
            Made with <Heart className="size-4 text-red-500 fill-red-500" /> for laughs
          </div>
        </div>
      </div>
    </footer>
  )
}
