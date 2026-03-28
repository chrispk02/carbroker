import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HomeContent } from "@/components/pages/home-content"
import type { Locale } from "@/lib/i18n/config"
import { getFeaturedCars } from "@/lib/supabase/queries/cars"
import { getSiteConfig } from "@/lib/supabase/queries/admin"

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const [featuredCars, siteConfig] = await Promise.all([
    getFeaturedCars(6),
    getSiteConfig(),
  ])

  return (
    <>
      <SiteHeader />
      <HomeContent featuredCars={featuredCars} siteConfig={siteConfig} locale={locale} />
      <SiteFooter />
    </>
  )
}
