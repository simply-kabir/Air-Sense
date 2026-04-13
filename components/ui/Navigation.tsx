'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wind, LayoutDashboard, Clock, Menu, X } from 'lucide-react'
import { KidsModeToggle } from '@/components/dashboard/KidsModeToggle'
import { useMode } from './ModeProvider'
import clsx from 'clsx'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', kidsLabel: '🏠 Dashboard', icon: LayoutDashboard },
  { href: '/history',   label: 'History',   kidsLabel: '📅 History',   icon: Clock },
]

export function Navigation() {
  const pathname    = usePathname()
  const { isKids }  = useMode()
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 md:px-8"
        style={{
          background:           isKids ? 'rgba(255,248,240,0.95)' : 'rgba(6,11,26,0.85)',
          backdropFilter:       'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom:         isKids
            ? '1px solid rgba(255,107,107,0.2)'
            : '1px solid rgba(59,111,232,0.12)',
        }}
      >
        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #3B6FE8, #00D4FF)' }}
          >
            <Wind size={15} className="text-white" />
          </div>
          <span
            className="font-display font-700 text-base tracking-tight hidden sm:block"
            style={{
              fontFamily: 'var(--font-display)',
              color: isKids ? '#2D1B69' : 'white',
            }}
          >
            {isKids ? 'AirPulse Jr. 🐻' : 'AirPulse'}
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, kidsLabel, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-500 transition-all duration-200',
                  active
                    ? isKids
                      ? 'bg-kids-primary/15 text-kids-primary border border-kids-primary/25'
                      : 'bg-gold-400/10 text-gold-300 border border-gold-400/20'
                    : isKids
                    ? 'text-purple-700/60 hover:text-purple-700 hover:bg-kids-primary/8'
                    : 'text-muted hover:text-white hover:bg-navy-500/50',
                )}
              >
                <Icon size={15} />
                {isKids ? kidsLabel : label}
              </Link>
            )
          })}
        </div>

        {/* ── Right: Kids toggle + mobile menu ── */}
        <div className="flex items-center gap-2">
          <KidsModeToggle compact />
          {/* Mobile burger */}
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: isKids ? '#2D1B69' : 'var(--muted)' }}
            onClick={() => setOpen(v => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute top-[57px] left-0 right-0 py-3 px-4 shadow-card-lg"
            style={{
              background:     isKids ? 'rgba(255,248,240,0.98)' : 'rgba(6,11,26,0.98)',
              backdropFilter: 'blur(20px)',
              borderBottom:   isKids ? '1px solid rgba(255,107,107,0.2)' : '1px solid rgba(59,111,232,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {NAV_ITEMS.map(({ href, label, kidsLabel, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-500 transition-all',
                    active
                      ? isKids ? 'bg-kids-primary/15 text-kids-primary' : 'bg-gold-400/10 text-gold-300'
                      : isKids ? 'text-purple-700/60 hover:text-purple-700' : 'text-muted hover:text-white hover:bg-navy-500/40',
                  )}
                >
                  <Icon size={16} />
                  {isKids ? kidsLabel : label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
