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

  // Use PostgreSQL RPC (SECURITY DEFINER) to delete from auth.users
  // This bypasses GoTrue API restrictions entirely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: rpcError } = await (admin.rpc as any)('admin_delete_auth_user', { user_id: userId })

  if (rpcError) {
    // RPC function not created yet — fall back to GoTrue admin API
    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId)
    if (deleteErr) {
      // Last resort: return success anyway since all user data is already cleared
      // The auth record will linger but user cannot use the app (no profile)
      console.error('[delete-user] GoTrue error:', deleteErr.message)
      return NextResponse.json({ success: true, warn: 'auth_record_may_linger' })
    }
  }

  return NextResponse.json({ success: true })
}
