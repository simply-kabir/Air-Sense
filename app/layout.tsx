import type { Metadata } from 'next'
import './globals.css'
import { LayoutShell } from '@/components/ui/LayoutShell'
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: 'AirPulse — Real-Time Air Quality Dashboard',
  description: 'Station-level AQI, pollutant breakdown, health guidance and Kids Mode — all in one place.',
  keywords: ['air quality', 'AQI', 'pollution', 'PM2.5', 'health', 'India', 'environment'],
  openGraph: {
    title: 'AirPulse — Air Quality Dashboard',
    description: 'Real-time air quality monitoring for cities worldwide',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  )
}
