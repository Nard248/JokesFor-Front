import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router'

interface WeeklySpecialCardProps {
  title?: string
  description?: string
}

export function WeeklySpecialCard({
  title = 'Back-to-School Survival Kit',
  description = '45 jokes to win over any classroom',
}: WeeklySpecialCardProps) {
  const navigate = useNavigate()

  return (
    <div className="bg-gradient-to-br from-[#FFC965] to-[#FFB800] rounded-[32px] p-5 relative overflow-hidden">
      <div className="absolute -bottom-4 -right-4 size-24 bg-white/10 rounded-full" />
      <Badge variant="default" size="default" className="mb-3">Weekly Special</Badge>
      <h3 className="font-display font-bold text-lg text-[#2E2F2F] mb-1">{title}</h3>
      <p className="text-sm text-[#5F4200] mb-4">{description}</p>
      <Button
        variant="pill-outline"
        size="sm"
        className="border-[#2E2F2F]/20 text-[#2E2F2F] hover:bg-[#2E2F2F]/10"
        onClick={() => navigate('/search')}
      >
        Explore Collection
      </Button>
    </div>
  )
}
