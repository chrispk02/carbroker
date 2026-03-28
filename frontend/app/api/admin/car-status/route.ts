import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { carId, status } = await req.json()
  const validStatuses = ['active', 'hidden', 'sold', 'draft']
  if (!carId || !validStatuses.includes(status)) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('cars').update({ status }).eq('id', carId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
