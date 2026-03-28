import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomInt } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Chuyển số quốc tế sang format ESMS (+84912345678 → 0912345678)
function toEsmsPhone(phone: string): string {
  phone = phone.replace(/\s/g, '')
  if (phone.startsWith('+84')) return '0' + phone.slice(3)
  if (phone.startsWith('84') && phone.length >= 10) return '0' + phone.slice(2)
  return phone
}

function hashOtp(otp: string): string {
  const secret = process.env.OTP_SECRET ?? 'carbroker-otp'
  return createHash('sha256').update(otp + secret).digest('hex')
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const phone = body?.phone as string | undefined

  if (!phone || !/^\+?\d{9,15}$/.test(phone.replace(/\s/g, ''))) {
    return NextResponse.json({ error: 'Số điện thoại không hợp lệ' }, { status: 400 })
  }

  const otp = String(randomInt(100000, 999999))
  const otpHash = hashOtp(otp)
  const supabase = createAdminClient()

  // Xóa OTP cũ của số này
  await supabase.from('phone_otps').delete().eq('phone', phone)

  // Lưu OTP mới
  const { error: dbError } = await supabase.from('phone_otps').insert({
    phone,
    otp_hash: otpHash,
  })
  if (dbError) {
    console.error('[otp/send] db error:', dbError.message)
    return NextResponse.json({ error: 'Không thể tạo OTP. Vui lòng thử lại.' }, { status: 500 })
  }

  // Gửi SMS qua ESMS.vn
  const esmsPhone = toEsmsPhone(phone)
  const content = `CarBroker: Ma xac nhan cua ban la ${otp}. Het han sau 5 phut. Khong chia se ma nay.`
  const sandbox = process.env.NODE_ENV !== 'production' ? '1' : '0'

  const params = new URLSearchParams({
    ApiKey: process.env.ESMS_API_KEY!,
    SecretKey: process.env.ESMS_SECRET_KEY!,
    Phone: esmsPhone,
    Content: content,
    SmsType: '2',
    IsUnicode: '0',
    Sandbox: sandbox,
  })

  const esmsRes = await fetch(
    `https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get/?${params}`
  )
  const esmsData = await esmsRes.json().catch(() => null)

  // CodeResult: 100 = thành công
  if (!esmsRes.ok || esmsData?.CodeResult !== '100') {
    console.error('[otp/send] esms error:', esmsData)
    return NextResponse.json(
      { error: 'Không thể gửi SMS. Vui lòng thử lại sau.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true })
}
