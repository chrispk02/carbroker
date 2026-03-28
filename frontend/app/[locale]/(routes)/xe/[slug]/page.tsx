import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { Locale } from "@/lib/i18n/config"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CarDetailContent } from "@/components/pages/car-detail-content"
import { getCarBySlugFromDB } from "@/lib/supabase/queries/cars"
import { formatVND } from "@/lib/utils/format-price"
import { createClient } from "@/lib/supabase/server"

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const car = await getCarBySlugFromDB(slug)
  if (!car) return {}
  return {
    title: `${car.name} - ${formatVND(car.priceVND)} | CarBroker`,
    description: `${car.name}, ${car.year}, ${car.mileageKm.toLocaleString("vi-VN")}km, ${car.fuel}, ${car.location}. ${car.description.slice(0, 120)}...`,
  }
}

export default async function XeDetailPage({ params }: PageProps) {
  const { slug } = await params
  const car = await getCarBySlugFromDB(slug)
  if (!car) notFound()

  // Track view (fire-and-forget, don't block render)
  const supabase = await createClient()
  supabase.from('car_views').insert({ car_id: car.id }).then(() => {})

  return (
    <>
      <SiteHeader />
      <CarDetailContent car={car} />
      <SiteFooter />
    </>
  )
}
