import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  if (userId === user.id) return NextResponse.json({ error: 'Không thể xoá tài khoản của chính mình' }, { status: 400 })

  const admin = createAdminClient()

  // Delete user data first (FK constraints)
  await admin.from('seller_kyc').delete().eq('user_id', userId)
  await admin.from('cars').delete().eq('seller_id', userId)
  await admin.from('profiles').delete().eq('id', userId)

  // Delete auth user using properly configured admin client
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    // Fallback: ban user if hard delete is restricted by Supabase plan
    const { error: banErr } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: '876600h',
    })
    if (banErr) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
