import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ favorites: [] })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).from('car_favorites').select('car_id').eq('user_id', user.id)
  const favorites = (data ?? []).map((r: { car_id: string }) => r.car_id)
  return NextResponse.json({ favorites })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { carId } = await req.json()
  if (!carId) return NextResponse.json({ error: 'Missing carId' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any

  // Check if already favorited
  const { data: existing } = await supabaseAny
    .from('car_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('car_id', carId)
    .maybeSingle()

  if (existing) {
    await supabaseAny.from('car_favorites').delete().eq('user_id', user.id).eq('car_id', carId)
    return NextResponse.json({ favorited: false })
  } else {
    await supabaseAny.from('car_favorites').insert({ user_id: user.id, car_id: carId })
    return NextResponse.json({ favorited: true })
  }
}
