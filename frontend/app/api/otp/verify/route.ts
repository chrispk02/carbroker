import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

function hashOtp(otp: string): string {
  const secret = process.env.OTP_SECRET ?? 'carbroker-otp'
  return createHash('sha256').update(otp + secret).digest('hex')
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { phone, otp, loginMode } = body ?? {}

  if (!phone || !otp) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
  }

  const otpHash = hashOtp(String(otp))
  const supabase = createAdminClient()

  // Tìm OTP hợp lệ
  const { data: record, error: findError } = await supabase
    .from('phone_otps')
    .select('id, used, expires_at')
    .eq('phone', phone)
    .eq('otp_hash', otpHash)
    .single()

  if (findError || !record) {
    return NextResponse.json({ error: 'Mã OTP không đúng hoặc đã hết hạn.' }, { status: 400 })
  }

  if (record.used) {
    return NextResponse.json({ error: 'Mã OTP đã được sử dụng.' }, { status: 400 })
  }

  if (new Date(record.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' }, { status: 400 })
  }

  // Đánh dấu đã dùng
  await supabase.from('phone_otps').update({ used: true }).eq('id', record.id)

  // Nếu chỉ verify SĐT (trong profile), trả về success
  if (!loginMode) {
    return NextResponse.json({ success: true })
  }

  // Login mode: tìm user theo SĐT và tạo magic link session
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .single()

  if (!profile) {
    return NextResponse.json(
      { error: 'Số điện thoại chưa được liên kết với tài khoản nào. Vui lòng đăng ký trước.' },
      { status: 404 }
    )
  }

  // Lấy email của user để tạo magic link
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.id)
  if (userError || !user?.email) {
    console.error('[otp/verify] getUserById error:', userError?.message)
    return NextResponse.json({ error: 'Không tìm thấy tài khoản.' }, { status: 404 })
  }

  // Tạo magic link token để client exchange lấy session
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
  })
  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('[otp/verify] generateLink error:', linkError?.message)
    return NextResponse.json({ error: 'Không thể tạo phiên đăng nhập.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, token_hash: linkData.properties.hashed_token })
}
