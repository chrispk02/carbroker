import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Detect locale from next param or Accept-Language header
  const next = searchParams.get('next') ?? ''
  const locale = next.startsWith('/en') ? 'en' : 'vi'
  const authPath = `${origin}/${locale}/auth`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Redirect to next param if provided, else home
      const destination = next || `/${locale}`
      return NextResponse.redirect(`${origin}${destination}`)
    }
    return NextResponse.redirect(`${authPath}?error_code=confirmation_failed`)
  }

  // Supabase may forward error params here too
  const errorCode = searchParams.get('error_code')
  if (errorCode) {
    return NextResponse.redirect(`${authPath}?error_code=${errorCode}`)
  }

  return NextResponse.redirect(`${authPath}?error_code=confirmation_failed`)
}
