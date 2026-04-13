import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cleanup-secret')

  if (secret !== process.env.CLEANUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { error, count } = await supabaseAdmin
      .from('air_quality_stations')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString())

    if (error) throw error

    return NextResponse.json({
      success: true,
      deleted: count,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Cleanup error:', err)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}

// Also allow GET for cron job triggers (Vercel Cron)
export async function GET(request: NextRequest) {
  // Vercel cron sends Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { error, count } = await supabaseAdmin
      .from('air_quality_stations')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString())

    if (error) throw error

    return NextResponse.json({ success: true, deleted: count })
  } catch (err) {
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
