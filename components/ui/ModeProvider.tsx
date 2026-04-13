'use client'

import { createContext, useContext } from 'react'
import { useAppMode } from '@/hooks'
import type { AppMode } from '@/types'

interface ModeContextValue {
  mode: AppMode
  toggleMode: () => void
  isKids: boolean
}

const ModeContext = createContext<ModeContextValue>({
  mode: 'normal',
  toggleMode: () => {},
  isKids: false,
})

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const { mode, toggleMode, mounted } = useAppMode()

  if (!mounted) return <>{children}</>

  return (
    <ModeContext.Provider value={{ mode, toggleMode, isKids: mode === 'kids' }}>
      <div data-mode={mode}>
        {children}
      </div>
    </ModeContext.Provider>
  )
}

export function useMode() {
  return useContext(ModeContext)
}
