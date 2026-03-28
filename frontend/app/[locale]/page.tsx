import { redirect } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HomeContent } from "@/components/pages/home-content"
import type { Locale } from "@/lib/i18n/config"
import { getFeaturedCars } from "@/lib/supabase/queries/cars"
import { getSiteConfig } from "@/lib/supabase/queries/admin"

interface PageProps {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<Record<string, string>>
}

export default async function HomePage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const sp = await searchParams

  // Supabase redirects to Site URL with error/success params on auth events.
  // Forward them to the auth page so users see a proper message.
  if (sp.error_code || sp.error) {
    const code = sp.error_code ?? sp.error
    redirect(`/${locale}/auth?error_code=${code}`)
  }

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
