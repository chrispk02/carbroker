"use client"

import { useCallback } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, Car as CarIcon, ChevronRight, CheckCircle, MapPin, Fuel, ChevronLeft } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Car } from "@/lib/data/cars"
import { formatVND, formatKm } from "@/lib/utils/format-price"
import { FavoriteButton } from "@/components/favorite-button"

const BRANDS = ["Toyota", "Honda", "Mazda", "Hyundai", "VinFast", "Kia", "Ford", "Mercedes-Benz", "Mitsubishi"]

interface BuyCarsContentProps {
  cars: Car[]
  total: number
  page: number
  totalPages: number
  initialSearch: string
  initialBrand: string
  initialFuel: string
  initialPrice: string
}

export function BuyCarsContent({
  cars,
  total,
  page,
  totalPages,
  initialSearch,
  initialBrand,
  initialFuel,
  initialPrice,
}: BuyCarsContentProps) {
  const { locale, dictionary: t } = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const PRICE_RANGES = [
    { label: t.buyCars.priceAll,       value: "all" },
    { label: t.buyCars.priceUnder500m, value: "0-500" },
    { label: t.buyCars.price500m1b,    value: "500-1000" },
    { label: t.buyCars.price1b2b,      value: "1000-2000" },
    { label: t.buyCars.priceOver2b,    value: "2000+" },
  ]
  const FUEL_TYPES = [
    { value: "Xăng",       label: t.buyCars.fuelGasoline },
    { value: "Dầu Diesel", label: t.buyCars.fuelDiesel },
    { value: "Hybrid",     label: t.buyCars.fuelHybrid },
    { value: "Điện",       label: t.buyCars.fuelElectric },
  ]

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === 'all') params.delete(key)
      else params.set(key, value)
    }
    params.delete('page') // reset to page 1 when filters change
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', p.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearFilters() {
    router.push(pathname)
  }

  const hasFilters = initialBrand || initialPrice !== 'all' || initialFuel || initialSearch

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="border-b bg-card py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t.buyCars.title}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                {t.buyCars.subtitle}
              </p>
            </div>

            {/* Search Bar */}
            <form
              className="mx-auto mt-8 flex max-w-2xl gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
                updateParams({ q })
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder={t.buyCars.searchPlaceholder}
                  className="h-11 pl-10"
                  defaultValue={initialSearch}
                  key={initialSearch}
                />
              </div>
              <Button type="submit" className="h-11 px-6">{t.home.searchBtn}</Button>
            </form>

            {/* Filters */}
            <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-3">
              <Select value={initialBrand || '__all__'} onValueChange={(v) => updateParams({ brand: v === '__all__' ? '' : v })}>
                <SelectTrigger className="h-9 w-40 text-sm">
                  <SelectValue placeholder={t.buyCars.brandLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t.buyCars.brandLabel}</SelectItem>
                  {BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={initialPrice || 'all'} onValueChange={(v) => updateParams({ price: v })}>
                <SelectTrigger className="h-9 w-44 text-sm">
                  <SelectValue placeholder={t.buyCars.priceLabel} />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={initialFuel || '__all__'} onValueChange={(v) => updateParams({ fuel: v === '__all__' ? '' : v })}>
                <SelectTrigger className="h-9 w-36 text-sm">
                  <SelectValue placeholder={t.buyCars.fuelLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t.buyCars.fuelLabel}</SelectItem>
                  {FUEL_TYPES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  {t.buyCars.clearFilters}
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Listings Section */}
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CarIcon className="size-4" />
                <span>
                  <strong className="text-foreground">{total}</strong>{" "}
                  {t.buyCars.resultsFound}
                </span>
              </div>
              <Badge variant="secondary">{t.buyCars.allCars}</Badge>
            </div>

            {cars.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <CarIcon className="mx-auto mb-4 size-12 opacity-30" />
                <p className="text-lg font-medium">{t.buyCars.noResults}</p>
                <p className="mt-1 text-sm">{t.buyCars.noResultsHint}</p>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {cars.map((car) => {
                    const carPath =
                      locale === "vi"
                        ? `/${locale}/xe/${car.slug}`
                        : `/${locale}/car/${car.slug}`
                    return (
                      <Link key={car.id} href={carPath}>
                        <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <img
                              src={car.images[0].src}
                              alt={car.images[0].alt}
                              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {car.verified && (
                              <Badge className="absolute left-3 top-3 gap-1 bg-emerald-500 text-white hover:bg-emerald-500">
                                <CheckCircle className="size-3" />
                                {t.buyCars.verified}
                              </Badge>
                            )}
                            {car.fuel === "Điện" && (
                              <Badge className="absolute right-3 top-3 bg-blue-500 text-white hover:bg-blue-500">
                                ⚡ {t.buyCars.electric}
                              </Badge>
                            )}
                            <FavoriteButton carId={car.id} className="absolute right-3 bottom-3" />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="line-clamp-1 font-semibold text-foreground">{car.name}</h3>
                            <p className="mt-1 text-lg font-bold text-primary">
                              {formatVND(car.priceVND)}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                              <span className="rounded-md bg-secondary px-2 py-1">{car.year}</span>
                              <span className="rounded-md bg-secondary px-2 py-1">{formatKm(car.mileageKm)}</span>
                              <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1">
                                <Fuel className="size-3" />
                                {car.fuel}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3" />
                              {car.location}
                            </div>
                            <div className="mt-3 flex items-center text-sm font-medium text-primary">
                              {t.buyCars.viewDetails}
                              <ChevronRight className="ml-1 size-4" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="size-4" />
                      {locale === 'vi' ? 'Trước' : 'Prev'}
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let p: number
                        if (totalPages <= 7) {
                          p = i + 1
                        } else if (page <= 4) {
                          p = i + 1
                        } else if (page >= totalPages - 3) {
                          p = totalPages - 6 + i
                        } else {
                          p = page - 3 + i
                        }
                        return (
                          <Button
                            key={p}
                            variant={p === page ? 'default' : 'outline'}
                            size="sm"
                            className="size-9 p-0"
                            onClick={() => goToPage(p)}
                          >
                            {p}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages}
                      className="gap-1"
                    >
                      {locale === 'vi' ? 'Tiếp' : 'Next'}
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
      <SiteFooter />
    </>
  )
}
