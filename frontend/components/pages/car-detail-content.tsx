"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Shield,
  MessageCircle,
  Lock,
  MapPin,
  CheckCircle,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CarImageGallery } from "@/components/car-image-gallery"
import { CarFeatures } from "@/components/car-features"
import { TrustBox } from "@/components/trust-box"
import { useLocale } from "@/lib/i18n/locale-context"
import { useAuth } from "@/lib/auth/context"
import { formatVND, formatVNDFull, formatKm } from "@/lib/utils/format-price"
import type { Car } from "@/lib/data/cars"

interface CarDetailContentProps {
  car: Car
}

export function CarDetailContent({ car }: CarDetailContentProps) {
  const { locale, dictionary: t } = useLocale()
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const buyPath = locale === "vi" ? `/${locale}/mua-xe` : `/${locale}/buy-cars`
  const authPath = `/${locale}/auth`

  const specs = [
    { icon: Calendar, label: t.carSpecs.year,         value: car.year.toString() },
    { icon: Gauge,    label: t.carSpecs.mileage,      value: formatKm(car.mileageKm) },
    { icon: Fuel,     label: t.carSpecs.fuel,         value: car.fuel },
    { icon: Settings2, label: t.carSpecs.transmission, value: car.transmission },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      {/* Back Link */}
      <Link
        href={buyPath}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t.carDetail.backToListings}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr,400px] lg:gap-12">
        {/* Left Column */}
        <div className="space-y-6">
          <CarImageGallery images={car.images} />

          {/* Description */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {t.carDetail.description}
            </h2>
            {isAuthenticated ? (
              <p className="leading-relaxed text-muted-foreground">{car.description}</p>
            ) : (
              <div className="relative">
                <p className="line-clamp-3 select-none leading-relaxed text-muted-foreground blur-sm">
                  {car.description}
                </p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`${authPath}?returnUrl=/${locale}/xe/${car.slug}`)}
                    className="gap-2"
                  >
                    <Lock className="size-4" />
                    {t.carDetail.signInToView}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Features */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {t.carDetail.featuresEquipment}
            </h2>
            {isAuthenticated ? (
              <CarFeatures features={car.features} />
            ) : (
              <div className="relative">
                <div className="select-none blur-sm">
                  <CarFeatures features={car.features.slice(0, 6)} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`${authPath}?returnUrl=/${locale}/xe/${car.slug}`)}
                    className="gap-2"
                  >
                    <Lock className="size-4" />
                    {t.carDetail.signInToView}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Seller Info */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {t.carDetail.sellerInfo}
            </h2>
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {car.seller.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{car.seller.name}</p>
                  {car.seller.isVerified && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <CheckCircle className="size-3 text-emerald-500" />
                      {t.seller.verified}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3" />
                  {car.seller.location}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.seller.memberSince} {car.seller.memberSince}
                </p>
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
              {t.seller.note}
            </p>
          </section>
        </div>

        {/* Right Column — Sticky */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
            {/* Badge */}
            <Badge className="gap-1.5 bg-emerald-500 py-1.5 px-3 text-sm text-white hover:bg-emerald-500">
              <Shield className="size-3.5" />
              {t.carDetail.brokerProtectedDeal}
            </Badge>

            {/* Car Name & Price */}
            <div>
              <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
                {car.name}
              </h1>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-primary">
                  {formatVND(car.priceVND)}
                </p>
                <p className="text-sm text-muted-foreground">
                  ({formatVNDFull(car.priceVND)})
                </p>
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                {car.location}
              </div>
            </div>

            <Separator />

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="size-3.5" />
                    {label}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full text-base"
                onClick={() => {
                  if (!isAuthenticated) {
                    router.push(`${authPath}?returnUrl=/${locale}/xe/${car.slug}`)
                    return
                  }
                }}
              >
                {!isAuthenticated && <Lock className="mr-2 size-4" />}
                {t.carDetail.requestPurchase}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 text-base"
                onClick={() => {
                  if (!isAuthenticated) {
                    router.push(`${authPath}?returnUrl=/${locale}/xe/${car.slug}`)
                    return
                  }
                }}
              >
                <MessageCircle className="size-4" />
                {t.carDetail.talkToBroker}
              </Button>
            </div>

            {!isAuthenticated && (
              <p className="text-center text-xs text-muted-foreground">
                {t.carDetail.signInRequired}
              </p>
            )}

            <TrustBox />
          </div>
        </div>
      </div>
    </main>
  )
}
