export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xl">😂</span>
            <span className="font-display font-semibold">Jokes For</span>
            <span className="text-sm">- Find the perfect joke</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/about" className="hover:text-foreground transition-colors">About</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
          </div>

          <div className="text-sm text-muted-foreground">
            Made with ❤️ and 😂
          </div>
        </div>
      </div>
    </footer>
  )
}
