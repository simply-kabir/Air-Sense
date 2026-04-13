'use client'

import { useMode } from '@/components/ui/ModeProvider'
import clsx from 'clsx'

interface KidsModeToggleProps {
  compact?: boolean
}

export function KidsModeToggle({ compact = false }: KidsModeToggleProps) {
  const { mode, toggleMode, isKids } = useMode()

  if (compact) {
    return (
      <button
        onClick={toggleMode}
        title={isKids ? 'Switch to Adult Mode' : 'Switch to Kids Mode'}
        className={clsx(
          'relative flex items-center gap-2.5 rounded-full transition-all duration-300 select-none',
          'px-3 py-1.5 border',
        )}
        style={isKids ? {
          background:  'rgba(255,255,255,0.6)',
          border:      '1px solid rgba(109, 40, 217, 0.2)',
        } : {
          background:  'rgba(15,26,58,0.6)',
          border:      '1px solid rgba(59,111,232,0.2)',
        }}
      >
        <span
          className="text-base leading-none"
          style={{
            filter:    isKids ? 'drop-shadow(0 0 6px rgba(255,182,0,0.7))' : 'none',
            animation: isKids ? 'float 3s ease-in-out infinite' : 'none',
            fontSize:  16,
          }}
        >
          {isKids ? '🐻' : '⭐'}
        </span>

        <span
          className="text-xs font-display hidden sm:inline"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            // FIX: Changed from '#FFD080' to dark purple so it's visible on pastel background
            color: isKids ? '#4C1D95' : 'var(--muted)',
          }}
        >
          {isKids ? 'Kids On' : 'Kids Mode'}
        </span>

        <div
          className="relative rounded-full transition-all duration-300 shrink-0"
          style={{
            width:      32,
            height:     18,
            background: isKids ? '#F5A623' : 'rgba(30,45,107,0.8)',
            border:     isKids ? '1px solid rgba(255,182,0,0.5)' : '1px solid rgba(59,111,232,0.3)',
          }}
        >
          <span
            className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all duration-300"
            style={{ left: isKids ? 15 : 2 }}
          />
        </div>
      </button>
    )
  }

  // Full card version
  return (
    <button
      onClick={toggleMode}
      className={clsx(
        'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left',
        isKids
          ? 'border-purple-200 bg-white/50'
          : 'border-cobalt-300/15 bg-navy-600/40 hover:border-cobalt-300/30',
      )}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
        style={{
          background: isKids ? 'rgba(245,166,35,0.2)' : 'rgba(59,111,232,0.12)',
          border:     isKids ? '1px solid rgba(245,166,35,0.3)' : '1px solid rgba(59,111,232,0.2)',
          animation:  isKids ? 'float 3s ease-in-out infinite' : 'none',
        }}
      >
        {isKids ? '🐻' : '⭐'}
      </div>

      <div className="flex-1 min-w-0">
        {/* FIX: Removed text-white, using conditional inline style */}
        <div 
          className="font-display text-sm"
          style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: 700, 
            color: isKids ? '#2D1B69' : '#FFFFFF' 
          }}
        >
          Kids Mode
        </div>
        {/* FIX: Removed text-muted, using conditional inline style */}
        <div 
          className="text-xs mt-0.5"
          style={{ 
            color: isKids ? 'rgba(45, 27, 105, 0.6)' : 'var(--muted)' 
          }}
        >
          {isKids ? 'Air Bear is watching over you! 🌟' : 'Switch to fun, emoji-friendly view'}
        </div>
      </div>

      <div
        className="relative rounded-full shrink-0 transition-all duration-300"
        style={{
          width:      44,
          height:     24,
          background: isKids ? '#F5A623' : 'rgba(15,26,58,0.8)',
          border:     isKids ? '1px solid rgba(255,182,0,0.4)' : '1px solid rgba(59,111,232,0.25)',
          boxShadow:  isKids ? '0 0 12px rgba(245,166,35,0.4)' : 'none',
        }}
      >
        <span
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300"
          style={{ left: isKids ? 23 : 4 }}
        />
      </div>
    </button>
  )
}