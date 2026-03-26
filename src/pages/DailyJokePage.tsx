import { AlertCircle, RefreshCw, CalendarDays, History } from 'lucide-react'
import { useTodaysJoke, useDailyJokeHistory } from '@/features/daily-joke'
import { DailyJokeCard } from '@/components/DailyJokeCard'
import { JokeCard } from '@/components/JokeCard'
import { Button } from '@/components/ui/button'
import { mockDailyJoke, mockDailyJokeHistory } from '@/lib/mock-data'

function DailyJokeCardSkeleton() {
  return (
    <div className="bg-gradient-purple rounded-[32px] p-8 animate-pulse">
      <div className="h-5 bg-white/20 rounded-full w-32 mb-6" />
      <div className="space-y-4 mb-8">
        <div className="h-6 bg-white/20 rounded w-3/4" />
        <div className="h-6 bg-white/20 rounded w-full" />
        <div className="h-6 bg-white/20 rounded w-2/3" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 bg-white/20 rounded-full w-32" />
        <div className="h-9 bg-white/20 rounded-full w-24" />
      </div>
    </div>
  )
}

function HistoryCardSkeleton() {
  return (
    <div className="bg-[#FAFAFA] rounded-[48px] p-6 animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-[#E9E8E7] rounded-full w-16" />
      </div>
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-[#E9E8E7] rounded w-full" />
        <div className="h-4 bg-[#E9E8E7] rounded w-3/4" />
      </div>
      <hr className="border-[#E9E8E7] my-4" />
      <div className="flex items-center gap-2">
        <div className="size-8 bg-[#E9E8E7] rounded-full" />
        <div className="h-3 bg-[#E9E8E7] rounded w-24" />
      </div>
    </div>
  )
}

export function DailyJokePage() {
  const {
    data: todayData,
    isLoading: isTodayLoading,
    isError: isTodayError,
    error: todayError,
    refetch: refetchToday,
  } = useTodaysJoke()

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
  } = useDailyJokeHistory()

  // Use mock data as fallback
  const todayJoke = todayData?.joke || mockDailyJoke.joke
  const history = historyData?.results || mockDailyJokeHistory

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-4xl">
      {/* Page header */}
      <div className="text-center mb-8 lg:mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <CalendarDays className="size-8 text-[#6A1CF6]" />
          <h1 className="text-3xl lg:text-5xl font-display font-black text-[#2E2F2F]">
            Daily Joke
          </h1>
        </div>
        <p className="text-[#6B7280] text-lg max-w-md mx-auto">
          Your personalized daily dose of humor
        </p>
      </div>

      {/* Today's joke */}
      <section className="mb-12 lg:mb-16">
        {isTodayLoading && <DailyJokeCardSkeleton />}

        {isTodayError && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[#FAFAFA] rounded-[32px]">
            <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="size-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-[#2E2F2F] mb-2">Couldn't load today's joke</h2>
            <p className="text-[#6B7280] mb-6 max-w-md px-4">
              {todayError instanceof Error ? todayError.message : 'Something went wrong.'}
            </p>
            <Button onClick={() => refetchToday()} variant="pill-outline">
              <RefreshCw className="size-4 mr-2" /> Try again
            </Button>
          </div>
        )}

        {!isTodayLoading && !isTodayError && todayJoke && (
          <DailyJokeCard joke={todayJoke} />
        )}
      </section>

      {/* History */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <History className="size-6 text-[#6B7280]" />
          <h2 className="text-xl lg:text-2xl font-display font-bold text-[#2E2F2F]">
            Previous Daily Jokes
          </h2>
        </div>

        {isHistoryLoading && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <HistoryCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isHistoryError && (
          <div className="text-center py-8 text-[#6B7280]">
            Couldn't load history. Try refreshing the page.
          </div>
        )}

        {!isHistoryLoading && !isHistoryError && history.length === 0 && (
          <div className="text-center py-12 text-[#6B7280] bg-[#FAFAFA] rounded-[32px]">
            <CalendarDays className="size-12 mx-auto mb-3 opacity-50" />
            <p>No previous daily jokes yet. Come back tomorrow!</p>
          </div>
        )}

        {!isHistoryLoading && !isHistoryError && history.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {history.map((item) => (
              <div key={`${item.joke.id}-${item.date}`} className="relative">
                <div className="absolute top-4 left-5 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-[#6B7280] border border-[#E9E8E7]">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <JokeCard joke={item.joke} className="pt-12" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
