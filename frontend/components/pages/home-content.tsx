"use client"

import Link from "next/link"
import {
  Search,
  Shield,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Car as CarIcon,
  Users,
  Star,
  Zap,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale } from "@/lib/i18n/locale-context"
import { brands } from "@/lib/data/cars"
import type { Car } from "@/lib/data/cars"
import { formatVND, formatKm } from "@/lib/utils/format-price"
import { cn } from "@/lib/utils"
import type { SiteConfig } from "@/lib/supabase/queries/admin"

interface HomeContentProps {
  featuredCars: Car[]
  siteConfig: SiteConfig
  locale: string
}

export function HomeContent({ featuredCars, siteConfig, locale: localeProp }: HomeContentProps) {
  const { locale: ctxLocale, dictionary: t } = useLocale()
  const locale = localeProp || ctxLocale

  const isVi = locale === "vi"
  const buyPath = isVi ? `/${locale}/mua-xe` : `/${locale}/buy-cars`
  const sellPath = isVi ? `/${locale}/ban-xe` : `/${locale}/sell-cars`

  const heroBadge   = isVi ? siteConfig.hero_badge_vi    : siteConfig.hero_badge_en
  const heroTitle   = isVi ? siteConfig.hero_title_vi    : siteConfig.hero_title_en
  const heroSubtitle = isVi ? siteConfig.hero_subtitle_vi : siteConfig.hero_subtitle_en

  const stats = [
    { icon: CarIcon,     value: siteConfig.stats_cars_value,   label: t.home.statsCars },
    { icon: Users,       value: siteConfig.stats_users_value,  label: t.home.statsUsers },
    { icon: CheckCircle, value: siteConfig.stats_deals_value,  label: t.home.statsDeals },
    { icon: Star,        value: siteConfig.stats_rating_value, label: t.home.statsRating },
  ]

  const howItWorks = [
    { step: "01", icon: Search,        title: t.home.step1Title, description: t.home.step1Desc },
    { step: "02", icon: MessageCircle, title: t.home.step2Title, description: t.home.step2Desc },
    { step: "03", icon: Shield,        title: t.home.step3Title, description: t.home.step3Desc },
  ]

  return (
    <main className="min-h-screen">
      {/* ─── Announcement Bar ─── */}
      <div className="bg-primary text-primary-foreground py-2.5 text-center text-xs font-medium tracking-wide">
        🚗 &nbsp;
        {isVi
          ? "CarBroker — Nền tảng mua bán xe uy tín số 1 Việt Nam · Bảo vệ 100% giao dịch"
          : "CarBroker — Vietnam's #1 Trusted Car Marketplace · 100% Transaction Protection"}
        <Link href={sellPath} className="ml-3 underline underline-offset-2 opacity-80 hover:opacity-100">
          {isVi ? "Đăng tin →" : "Sell now →"}
        </Link>
      </div>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-zinc-950 py-20 sm:py-28">
        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0v40M40 0v40M0 0h40M0 40h40' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")",
          }}
        />
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        {/* Top accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 gap-2 border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white hover:bg-white/10">
              <Zap className="size-3.5 text-primary" />
              {heroBadge}
            </Badge>

            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>

            <p className="mt-6 text-lg text-zinc-300 sm:text-xl leading-relaxed">
              {heroSubtitle}
            </p>

            {/* Search bar */}
            <div className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-2xl border border-white/15 bg-white/8 p-2 backdrop-blur-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder={t.home.searchPlaceholder}
                  className="h-11 border-0 bg-transparent pl-10 text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Button size="sm" className="h-11 px-5 rounded-xl shrink-0" asChild>
                <Link href={buyPath}>{t.home.searchBtn}</Link>
              </Button>
            </div>

            {/* Quick brand pills */}
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
              {["Toyota", "Honda", "Mazda", "VinFast", "Hyundai", "Kia"].map((brand) => (
                <Link
                  key={brand}
                  href={`${buyPath}?brand=${brand}`}
                  className="rounded-full border border-white/20 bg-white/8 px-3.5 py-1 text-zinc-300 transition-all hover:border-white/40 hover:bg-white/15 hover:text-white"
                >
                  {brand}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link href={buyPath}>
                  {t.home.viewCars}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/25 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href={sellPath}>{t.home.sellCar}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="border-b bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-xl border bg-background p-5 text-center shadow-sm">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>
                <p className="text-2xl font-black text-foreground sm:text-3xl">{value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Cars ─── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t.home.featuredLabel}</p>
              <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                {t.home.featuredTitle}
              </h2>
            </div>
            <Button variant="ghost" asChild className="gap-1 text-sm">
              <Link href={buyPath}>
                {t.home.viewAll}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCars.map((car) => {
              const carPath =
                locale === "vi"
                  ? `/${locale}/xe/${car.slug}`
                  : `/${locale}/car/${car.slug}`
              return (
                <Link key={car.id} href={carPath} className="group">
                  <Card className="overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={car.images[0].src}
                        alt={car.images[0].alt}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      {/* Top badges */}
                      <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                        {car.verified && (
                          <Badge className="gap-1 bg-emerald-500 text-white shadow-sm hover:bg-emerald-500">
                            <CheckCircle className="size-3" />
                            {t.home.verified}
                          </Badge>
                        )}
                      </div>
                      {(car.fuel === "Điện" || car.fuel === "Hybrid") && (
                        <Badge
                          className={cn(
                            "absolute right-3 top-3 shadow-sm text-white",
                            car.fuel === "Điện"
                              ? "bg-blue-500 hover:bg-blue-500"
                              : "bg-green-600 hover:bg-green-600"
                          )}
                        >
                          {car.fuel === "Điện" ? "⚡ Điện" : "🌿 Hybrid"}
                        </Badge>
                      )}

                      {/* Bottom overlay — location + year */}
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 pb-3">
                        <span className="flex items-center gap-1 text-xs font-medium text-white/90">
                          <MapPin className="size-3" />
                          {car.location}
                        </span>
                        <span className="rounded-md bg-black/50 px-1.5 py-0.5 text-xs text-white">
                          {car.year}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-primary">
                        {car.name}
                      </h3>
                      <p className="mt-1 text-xl font-black text-primary">
                        {formatVND(car.priceVND)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                          {formatKm(car.mileageKm)}
                        </span>
                        <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                          {car.fuel}
                        </span>
                        <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                          {car.transmission}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Popular Brands ─── */}
      <section className="bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t.home.brandsLabel}</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              {t.home.brandsTitle}
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-12">
            {brands.map((brand) => (
              <Link
                key={brand.name}
                href={`${buyPath}?brand=${brand.name}`}
                className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <span
                  className="flex size-10 items-center justify-center rounded-full text-sm font-black text-white shadow-sm"
                  style={{ backgroundColor: brand.color }}
                >
                  {brand.name.charAt(0)}
                </span>
                <span className="text-[11px] font-medium leading-tight text-foreground">
                  {brand.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {brand.count} {t.home.carsUnit}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t.home.simpleAndSafe}</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              {t.home.howWorksTitle}
            </h2>
            <p className="mt-3 text-muted-foreground">{t.home.howWorksSubtitle}</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {howItWorks.map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/10">
                  <Icon className="size-8 text-primary" />
                  <span className="absolute -right-2.5 -top-2.5 flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground shadow-sm">
                    {step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust Section ─── */}
      <section className="border-y bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Shield className="size-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t.home.trust1Title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.home.trust1Desc}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <TrendingUp className="size-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t.home.trust2Title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.home.trust2Desc}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="flex size-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <CheckCircle className="size-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t.home.trust3Title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.home.trust3Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-zinc-950 px-8 py-16 text-center">
            {/* Grid pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0v40M40 0v40M0 0h40M0 40h40' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")",
              }}
            />
            {/* Top accent line */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="relative">
              <Badge className="mb-5 border-white/20 bg-white/10 text-white hover:bg-white/10">
                CarBroker Platform
              </Badge>
              <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                {t.home.ctaTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-zinc-400">{t.home.ctaDesc}</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" className="h-12 px-8" asChild>
                  <Link href={buyPath}>
                    {t.home.ctaViewCars}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/25 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href={sellPath}>{t.home.ctaSell}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
