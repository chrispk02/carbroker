"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Car as CarIcon, ChevronRight, CheckCircle, MapPin, Fuel } from "lucide-react"
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

const BRANDS = ["Tất cả", "Toyota", "Honda", "Mazda", "Hyundai", "VinFast", "Kia", "Ford", "Mercedes-Benz", "Mitsubishi"]
const PRICE_RANGES = [
  { label: "Tất cả mức giá", value: "all" },
  { label: "Dưới 500 triệu", value: "0-500" },
  { label: "500 triệu - 1 tỷ", value: "500-1000" },
  { label: "1 tỷ - 2 tỷ", value: "1000-2000" },
  { label: "Trên 2 tỷ", value: "2000+" },
]
const FUEL_TYPES = ["Tất cả", "Xăng", "Dầu Diesel", "Hybrid", "Điện"]

interface BuyCarsContentProps {
  cars: Car[]
}

export function BuyCarsContent({ cars }: BuyCarsContentProps) {
  const { locale, dictionary: t } = useLocale()
  const [search, setSearch] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("Tất cả")
  const [priceRange, setPriceRange] = useState("all")
  const [fuelType, setFuelType] = useState("Tất cả")

  const filtered = cars.filter((car) => {
    const matchSearch =
      !search ||
      car.name.toLowerCase().includes(search.toLowerCase()) ||
      car.brand.toLowerCase().includes(search.toLowerCase()) ||
      car.model.toLowerCase().includes(search.toLowerCase())

    const matchBrand = selectedBrand === "Tất cả" || car.brand === selectedBrand
    const matchFuel = fuelType === "Tất cả" || car.fuel === fuelType

    let matchPrice = true
    if (priceRange !== "all") {
      const price = car.priceVND / 1_000_000
      if (priceRange === "0-500") matchPrice = price < 500
      else if (priceRange === "500-1000") matchPrice = price >= 500 && price < 1000
      else if (priceRange === "1000-2000") matchPrice = price >= 1000 && price < 2000
      else if (priceRange === "2000+") matchPrice = price >= 2000
    }

    return matchSearch && matchBrand && matchFuel && matchPrice
  })

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
            <div className="mx-auto mt-8 flex max-w-2xl gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t.buyCars.searchPlaceholder}
                  className="h-11 pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-3">
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="h-9 w-40 text-sm">
                  <SelectValue placeholder="Hãng xe" />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="h-9 w-44 text-sm">
                  <SelectValue placeholder="Mức giá" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger className="h-9 w-36 text-sm">
                  <SelectValue placeholder="Nhiên liệu" />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(selectedBrand !== "Tất cả" || priceRange !== "all" || fuelType !== "Tất cả" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("")
                    setSelectedBrand("Tất cả")
                    setPriceRange("all")
                    setFuelType("Tất cả")
                  }}
                >
                  Xóa bộ lọc
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
                  <strong className="text-foreground">{filtered.length}</strong>{" "}
                  {t.buyCars.resultsFound}
                </span>
              </div>
              <Badge variant="secondary">{t.buyCars.allCars}</Badge>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <CarIcon className="mx-auto mb-4 size-12 opacity-30" />
                <p className="text-lg font-medium">Không tìm thấy xe phù hợp</p>
                <p className="mt-1 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((car) => {
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
                              Đã xác minh
                            </Badge>
                          )}
                          {car.fuel === "Điện" && (
                            <Badge className="absolute right-3 top-3 bg-blue-500 text-white hover:bg-blue-500">
                              ⚡ Điện
                            </Badge>
                          )}
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
            )}
          </div>
        </section>
      </div>
      <SiteFooter />
    </>
  )
}
