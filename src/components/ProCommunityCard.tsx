import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router'

export function ProCommunityCard() {
  return (
    <div className="bg-gradient-purple rounded-[48px] p-8 text-white relative overflow-hidden">
      <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-2xl" />

      <Badge variant="lime" size="default" className="mb-4">Creator workspace</Badge>

      <h3 className="font-display font-extrabold text-2xl leading-tight mb-3">
        A place for your <span className="text-[#CAFD00]">next joke</span>.
      </h3>

      <p className="text-sm text-white/80 mb-4 leading-relaxed">
        Write a joke, follow its review status, and explore basic insights on your published work.
      </p>

      <ul className="space-y-2 mb-6">
        {['Drafts and previews', 'Submission status', 'Basic creator insights'].map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <CheckCircle className="size-4 text-[#CAFD00] shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <Button asChild variant="pill-lime" size="xl" className="w-full">
        <Link to="/create">Open creator workspace</Link>
      </Button>

      <p className="text-xs text-white/50 mt-3 text-center">Reading and basic publishing are free</p>
    </div>
  )
}
