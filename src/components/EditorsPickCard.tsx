import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditorsPickCardProps {
  title?: string
  description?: string
  imageUrl?: string
}

export function EditorsPickCard({
  title = "The Ultimate Corporate Survival Guide",
  description = "A curated list of 50 jokes for your next Zoom call that won't get you fired. Probably.",
  imageUrl = "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=300&fit=crop",
}: EditorsPickCardProps) {
  return (
    <div className="flex flex-col md:flex-row bg-[#FAFAFA] rounded-[48px] overflow-hidden">
      {/* Image */}
      <div className="md:w-2/5 h-48 md:h-auto relative">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="md:w-3/5 p-8 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-3">
          <Star className="size-4 text-[#FFC965] fill-[#FFC965]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#6A1CF6]">
            Editor's Pick
          </span>
        </div>

        <h3 className="font-display font-bold text-xl lg:text-2xl text-[#2E2F2F] mb-2 leading-tight">
          {title}
        </h3>

        <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center gap-3">
          <Button variant="pill" size="default">
            Read Collection
          </Button>
          <Button variant="pill-outline" size="default">
            Save List
          </Button>
        </div>
      </div>
    </div>
  )
}
