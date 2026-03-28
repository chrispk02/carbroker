import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, password, fullName, role } = await req.json()
  if (!email || !password || !role) return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
  if (!['buyer', 'seller'].includes(role)) return NextResponse.json({ error: 'Role không hợp lệ' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Mật khẩu ít nhất 6 ký tự' }, { status: 400 })

  const admin = createAdminClient()

  // Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || '', role },
  })
  if (authErr) {
    if (authErr.message.includes('already registered')) {
      return NextResponse.json({ error: 'Email này đã được đăng ký' }, { status: 400 })
    }
    return NextResponse.json({ error: authErr.message }, { status: 500 })
  }

  // Upsert profile (trigger may already create it)
  await admin.from('profiles').upsert({
    id: authData.user.id,
    full_name: fullName || null,
    role,
    is_admin: false,
  }, { onConflict: 'id' })

  return NextResponse.json({ success: true, userId: authData.user.id })
}
