import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-display font-bold text-primary">
          Jokes For
        </h1>
        <p className="text-foreground/70">
          Your daily dose of humor
        </p>
        <Button>Get Started</Button>
      </div>
    </div>
  )
}

export default App
