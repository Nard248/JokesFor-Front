import type { ReactNode } from 'react'
import { DesktopHeader } from './layout/DesktopHeader'
import { MobileHeader } from './layout/MobileHeader'
import { Sidebar } from './layout/Sidebar'
import { MobileBottomNav } from './layout/MobileBottomNav'
import { FloatingActionButton } from './layout/FloatingActionButton'
import { Footer } from './Footer'

interface LayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  hideDefaultSidebar?: boolean
  hideFAB?: boolean
}

export function Layout({ children, sidebar, hideDefaultSidebar, hideFAB }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8F6F6]">
      <DesktopHeader />
      <MobileHeader />

      <div className="flex">
        {/* Sidebar: custom (e.g. search filters) or default nav */}
        {sidebar || (!hideDefaultSidebar && <Sidebar />)}

        {/* Main Content */}
        <main className="flex-1 min-w-0 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Footer (desktop only) */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />

      {/* FAB */}
      {!hideFAB && <FloatingActionButton />}
    </div>
  )
}
