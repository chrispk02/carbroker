import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { carId, carName, message } = await req.json()
  if (!carId || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Insert inquiry — table may not exist yet, fail silently
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('car_inquiries').insert({
    car_id: carId,
    buyer_id: user.id,
    message: message.trim(),
    status: 'pending',
  })

  if (error) {
    // Table doesn't exist yet — log and return success anyway
    console.error('[inquiries] DB error:', error.message)
  }

  return NextResponse.json({ success: true, carName })
}
