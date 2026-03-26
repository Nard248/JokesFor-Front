import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="size-9 flex items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F2F0F0] disabled:opacity-30 transition-colors"
      >
        <ChevronLeft className="size-5" />
      </button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-[#6B7280]">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'size-9 flex items-center justify-center rounded-full text-sm font-semibold transition-colors',
              page === currentPage
                ? 'bg-[#6A1CF6] text-white'
                : 'text-[#2E2F2F] hover:bg-[#F2F0F0]'
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="size-9 flex items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F2F0F0] disabled:opacity-30 transition-colors"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}
