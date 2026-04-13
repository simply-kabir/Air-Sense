import { DashboardShell } from '@/components/dashboard/DashboardShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — AirPulse',
  description: 'Real-time air quality data for your location',
}

export default function DashboardPage() {
  return <DashboardShell />
}
