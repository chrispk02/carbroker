import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomInt } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// SpeedSMS nhận số dạng 0912345678 (không cần +84)
function normalizePhone(phone: string): string {
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
    return NextResponse.json({ error: `DB error: ${dbError.message} (code: ${dbError.code})` }, { status: 500 })
  }

  // Sandbox: log OTP ra console thay vì gửi thật (khi dev local)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[OTP DEV] Phone: ${phone} — Code: ${otp}`)
    return NextResponse.json({ success: true })
  }

  // Gửi SMS qua SpeedSMS
  const token = process.env.SPEEDSMS_ACCESS_TOKEN!
  const content = `CarBroker: Ma xac nhan cua ban la ${otp}. Het han sau 5 phut.`

  const smsRes = await fetch('https://api.speedsms.vn/index.php/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // SpeedSMS dùng Basic Auth: base64(access_token:x)
      Authorization: 'Basic ' + Buffer.from(`${token}:x`).toString('base64'),
    },
    body: JSON.stringify({
      to: [normalizePhone(phone)],
      content,
      sms_type: 2,   // 2 = SMS quảng cáo (rẻ nhất), 4 = có brandname
      sender: '',
    }),
  })

  const smsData = await smsRes.json().catch(() => null)

  // SpeedSMS trả về status: "success" khi thành công
  if (!smsRes.ok || smsData?.status !== 'success') {
    console.error('[otp/send] speedsms error:', smsData)
    return NextResponse.json(
      { error: 'Không thể gửi SMS. Vui lòng thử lại sau.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true })
}
