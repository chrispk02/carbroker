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

  // Delete user data before deleting auth user (FK constraints)
  await admin.from('seller_kyc').delete().eq('user_id', userId)
  await admin.from('cars').delete().eq('seller_id', userId)
  await admin.from('profiles').delete().eq('id', userId)

  // Use REST API directly — more reliable than JS client for auth admin operations
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
    }
  )

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return NextResponse.json({ error: body.msg ?? body.message ?? 'Xoá thất bại' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
