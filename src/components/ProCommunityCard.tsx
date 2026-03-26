import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function ProCommunityCard() {
  return (
    <div className="bg-gradient-purple rounded-[48px] p-8 text-white relative overflow-hidden">
      <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-2xl" />

      <Badge variant="lime" size="default" className="mb-4">Pro Community</Badge>

      <h3 className="font-display font-extrabold text-2xl leading-tight mb-3">
        Never run out of <span className="text-[#CAFD00]">punchlines</span>.
      </h3>

      <p className="text-sm text-white/80 mb-4 leading-relaxed">
        Join 50,000+ joke masters. Get exclusive access to the "Dad Joke Archive" and AI-powered punchline generator.
      </p>

      <ul className="space-y-2 mb-6">
        {['Ad-free browsing', 'Custom joke generators', 'Community competitions'].map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <CheckCircle className="size-4 text-[#CAFD00] shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <Button variant="pill-lime" size="xl" className="w-full">
        Join Pro Now
      </Button>

      <p className="text-xs text-white/50 mt-3 text-center">Starts at $4.99/mo</p>
    </div>
  )
}
