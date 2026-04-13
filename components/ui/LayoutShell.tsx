'use client'

import { usePathname } from 'next/navigation'
import { ModeProvider } from './ModeProvider'
import { Navigation } from './Navigation'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Only the landing page manages its own header
  const hideNav  = pathname === '/'

  return (
    <ModeProvider>
      <div className="min-h-screen flex flex-col">
        {!hideNav && <Navigation />}
        <main className="flex-1">{children}</main>
      </div>
    </ModeProvider>
  )
}
