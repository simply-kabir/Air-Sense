'use client'

import { useState, useRef, useCallback } from 'react'
import { Search, X, Loader2, MapPin } from 'lucide-react'
import clsx from 'clsx'

interface CitySearchProps {
  onSearch: (city: string) => void
  onDetectLocation?: () => void
  loading?: boolean
  locLoading?: boolean
  placeholder?: string
  className?: string
  isKids?: boolean // <-- ADDED THIS PROP
}

export function CitySearch({
  onSearch,
  onDetectLocation,
  loading = false,
  locLoading = false,
  placeholder = 'Search city or station…',
  className,
  isKids = false, // <-- ADDED THIS PROP
}: CitySearchProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    if (!value.trim() || loading) return
    onSearch(value.trim())
  }, [value, loading, onSearch])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') { setValue(''); inputRef.current?.blur() }
  }

  // Dynamic styles based on Kids Mode
  const inputBg = isKids ? 'rgba(255,255,255,0.7)' : 'rgba(10,17,40,0.6)'
  const inputBorder = isKids ? 'rgba(109, 40, 217, 0.25)' : 'rgba(59,111,232,0.2)'
  const inputFocusBorder = isKids ? 'rgba(245,166,35,0.6)' : 'rgba(245,166,35,0.4)'
  const textColor = isKids ? '#2D1B69' : '#FFFFFF'
  const mutedColor = isKids ? 'rgba(45, 27, 105, 0.5)' : 'var(--muted2)'
  const btnBg = isKids ? 'rgba(255,255,255,0.5)' : 'rgba(10,17,40,0.6)'
  const btnBorder = isKids ? 'rgba(109, 40, 217, 0.2)' : 'rgba(59,111,232,0.2)'

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {onDetectLocation && (
        <button
          onClick={onDetectLocation}
          disabled={locLoading}
          title="Detect my location"
          className={clsx(
            'flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 shrink-0',
            locLoading ? 'cursor-wait' : 'hover:scale-105 active:scale-95'
          )}
          style={{ 
            background: btnBg,
            borderColor: btnBorder,
            color: mutedColor 
          }}
        >
          {locLoading
            ? <Loader2 size={16} className="animate-spin" />
            : <MapPin size={16} />
          }
        </button>
      )}

      <div className="relative flex-1">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: mutedColor }}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
          style={{
            background: inputBg,
            border: `1px solid ${inputBorder}`,
            color: textColor,
            fontFamily: 'var(--font-body)',
          }}
          onFocus={e => { e.target.style.borderColor = inputFocusBorder }}
          onBlur={e  => { e.target.style.borderColor = inputBorder  }}
        />
        {value && (
          <button
            onClick={() => { setValue(''); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
            style={{ color: mutedColor }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!value.trim() || loading}
        className={clsx(
          'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-display transition-all duration-200 shrink-0',
          value.trim() && !loading ? 'hover:scale-105 active:scale-95' : 'opacity-40 cursor-not-allowed'
        )}
        style={value.trim() && !loading ? {
          background: 'linear-gradient(135deg, #F5A623, #FFB84D)',
          boxShadow: '0 4px 16px rgba(245,166,35,0.3)',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          color: isKids ? '#2D1B69' : 'var(--navy-800)' // Dark text on gold button
        } : {
          background: btnBg,
          border: `1px solid ${btnBorder}`,
          color: mutedColor,
          fontWeight: 600,
          fontFamily: 'var(--font-display)',
        }}
      >
        {loading
          ? <Loader2 size={15} className="animate-spin" />
          : <Search size={15} />
        }
        {loading ? 'Loading' : 'Go'}
      </button>
    </div>
  )
}