'use client'

import { Wind } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
  subMessage?: string
}

export function LoadingScreen({
  message    = 'Fetching air data…',
  subMessage = 'Connecting to monitoring stations',
}: LoadingScreenProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0F1A3A 0%, #060B1A 60%, #03070F 100%)' }}
    >
      {/* Rings */}
      <div className="relative flex items-center justify-center mb-8">
        {[1,2,3].map(i => (
          <span
            key={i}
            className="absolute rounded-full border border-cobalt-300/20"
            style={{
              width:  `${i * 60}px`,
              height: `${i * 60}px`,
              animation: `pulse-ring 2s ${i * 0.4}s ease-out infinite`,
            }}
          />
        ))}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #3B6FE8, #00D4FF)' }}
        >
          <Wind size={24} className="text-white" />
        </div>
      </div>

      <p className="font-display font-700 text-white text-xl mb-2"
        style={{ fontFamily: 'var(--font-display)' }}>
        {message}
      </p>
      <p className="text-muted text-sm font-mono">{subMessage}</p>

      {/* Progress dots */}
      <div className="flex gap-2 mt-6">
        {[0,1,2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-cobalt-300"
            style={{ animation: `pulse 1.2s ${i * 0.3}s ease-in-out infinite` }}
          />
        ))}
      </div>
    </div>
  )
}

export function InlineLoader({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 py-8 justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-cobalt-300/30 border-t-cobalt-300 animate-spin" />
      <span className="text-sm text-muted font-mono">{text}</span>
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      <div className="skeleton h-3 w-24 mb-3" />
      <div className="skeleton h-8 w-16 mb-2" />
      <div className="skeleton h-2 w-32" />
    </div>
  )
}
