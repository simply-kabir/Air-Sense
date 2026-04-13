import { KidsDashboard } from '@/components/kids/KidsDashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AirPulse Jr. — Kids Air Quality',
  description: 'Fun, kid-friendly air quality dashboard with Air Bear!',
}

export default function KidsPage() {
  return <KidsDashboard />
}
