import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return null
  return user
}

export async function GET() {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data } = await admin.from('site_config').select('value').eq('key', 'homepage').maybeSingle()
  return NextResponse.json({ config: data?.value ?? {} })
}

export async function POST(req: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { config } = await req.json()
  if (!config || typeof config !== 'object') {
    return NextResponse.json({ error: 'Invalid config' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('site_config').upsert(
    { key: 'homepage', value: config, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
