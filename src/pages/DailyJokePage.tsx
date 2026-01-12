import { AlertCircle, RefreshCw, CalendarDays, History } from 'lucide-react'
import { useTodaysJoke, useDailyJokeHistory } from '@/features/daily-joke'
import { DailyJokeCard } from '@/components/DailyJokeCard'
import { JokeCard } from '@/components/JokeCard'
import { Button } from '@/components/ui/button'

/**
 * Loading skeleton for the main daily joke card
 */
function DailyJokeCardSkeleton() {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-6 md:p-10 animate-pulse">
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="h-4 w-4 bg-muted rounded-full" />
        <div className="h-4 bg-muted rounded w-48" />
        <div className="h-4 w-4 bg-muted rounded-full" />
      </div>
      <div className="space-y-4 mb-8">
        <div className="h-8 bg-muted rounded w-3/4 mx-auto" />
        <div className="h-8 bg-muted rounded w-full mx-auto" />
        <div className="h-8 bg-muted rounded w-2/3 mx-auto" />
      </div>
      <div className="flex justify-center gap-3 mb-6">
        <div className="h-8 bg-muted rounded-full w-24" />
        <div className="h-8 bg-muted rounded-full w-28" />
      </div>
      <div className="flex justify-center gap-2 pt-6 border-t border-border">
        <div className="h-10 bg-muted rounded w-20" />
        <div className="h-10 bg-muted rounded w-20" />
        <div className="h-10 bg-muted rounded w-20" />
        <div className="h-10 bg-muted rounded w-20" />
      </div>
    </div>
  )
}

/**
 * Loading skeleton for history joke cards
 */
function HistoryCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 animate-pulse">
      <div className="h-3 bg-muted rounded w-32 mb-4" />
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
      <div className="flex gap-2">
        <div className="h-5 bg-muted rounded-full w-16" />
        <div className="h-5 bg-muted rounded-full w-20" />
      </div>
    </div>
  )
}

/**
 * Daily Joke page - shows today's personalized joke and history
 */
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

  return (
    <div className="py-6 md:py-10">
      {/* Page header */}
      <div className="text-center mb-8 md:mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <CalendarDays className="w-8 h-8 text-primary" />
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            Daily Joke
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Your personalized daily dose of humor
        </p>
      </div>

      {/* Today's joke section */}
      <section className="max-w-3xl mx-auto mb-12 md:mb-16">
        {/* Loading state */}
        {isTodayLoading && <DailyJokeCardSkeleton />}

        {/* Error state */}
        {isTodayError && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Couldn't load today's joke
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md px-4">
              {todayError instanceof Error
                ? todayError.message
                : 'Something went wrong. Please try again.'}
            </p>
            <Button onClick={() => refetchToday()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
          </div>
        )}

        {/* Today's joke */}
        {!isTodayLoading && !isTodayError && todayData && (
          <DailyJokeCard joke={todayData.joke} date={todayData.date} />
        )}
      </section>

      {/* History section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <History className="w-6 h-6 text-muted-foreground" />
          <h2 className="text-xl md:text-2xl font-display font-semibold text-foreground">
            Previous Daily Jokes
          </h2>
        </div>

        {/* History loading */}
        {isHistoryLoading && (
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <HistoryCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* History error */}
        {isHistoryError && (
          <div className="text-center py-8 text-muted-foreground">
            Couldn't load history. Try refreshing the page.
          </div>
        )}

        {/* History empty */}
        {!isHistoryLoading && !isHistoryError && historyData?.results.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No previous daily jokes yet. Come back tomorrow!</p>
          </div>
        )}

        {/* History grid */}
        {!isHistoryLoading && !isHistoryError && historyData && historyData.results.length > 0 && (
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {historyData.results.map((item) => (
              <div key={`${item.joke.id}-${item.date}`} className="relative">
                {/* Date overlay */}
                <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground border border-border">
                  {new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <JokeCard joke={item.joke} className="pt-10" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
