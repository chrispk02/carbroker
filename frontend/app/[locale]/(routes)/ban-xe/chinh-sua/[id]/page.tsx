import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/server'
import { EditCarForm } from '@/components/pages/edit-car-form'

export const metadata: Metadata = {
  title: 'Chỉnh sửa tin đăng - CarBroker',
}

interface PageProps {
  params: Promise<{ locale: Locale; id: string }>
}

export default async function EditCarPage({ params }: PageProps) {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth?returnUrl=/${locale}/dashboard`)

  const { data: car } = await supabase
    .from('cars')
    .select('id, slug, title, brand, model, variant, price_vnd, year, mileage_km, fuel, transmission, color, location, description, status')
    .eq('id', id)
    .eq('seller_id', user.id)
    .single()

  if (!car) notFound()

  const { data: featuresRows } = await supabase
    .from('car_features')
    .select('feature')
    .eq('car_id', id)

  const features = featuresRows?.map((r) => r.feature) ?? []

  return <EditCarForm car={{ ...car, features }} locale={locale} />
}
