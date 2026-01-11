import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header placeholder - will be built in 11-04 */}
      <header className="border-b border-foreground/10 p-4">
        <nav className="container mx-auto flex items-center justify-between">
          <a href="/" className="text-xl font-display font-bold text-primary">
            Jokes For
          </a>
          <div className="flex gap-4">
            <a href="/daily" className="text-foreground/70 hover:text-foreground">Daily</a>
            <a href="/collections" className="text-foreground/70 hover:text-foreground">Collections</a>
            <a href="/settings" className="text-foreground/70 hover:text-foreground">Settings</a>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  )
}
