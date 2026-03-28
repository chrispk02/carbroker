import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HomeContent } from "@/components/pages/home-content"
import type { Locale } from "@/lib/i18n/config"
import { getFeaturedCars } from "@/lib/supabase/queries/cars"

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  await params
  const featuredCars = await getFeaturedCars(6)

  return (
    <>
      <SiteHeader />
      <HomeContent featuredCars={featuredCars} />
      <SiteFooter />
    </>
  )
}
