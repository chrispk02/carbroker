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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale } from "@/lib/i18n/locale-context"
import { brands } from "@/lib/data/cars"
import type { Car } from "@/lib/data/cars"
import { formatVND, formatKm } from "@/lib/utils/format-price"
import type { SiteConfig } from "@/lib/supabase/queries/admin"

const howItWorks = [
  {
    step: "01",
    icon: Search,
    title: "Tìm xe phù hợp",
    description: "Duyệt hàng nghìn xe đã được xác minh. Lọc theo hãng, giá, năm sản xuất, địa điểm.",
  },
  {
    step: "02",
    icon: MessageCircle,
    title: "Kết nối qua môi giới",
    description: "Mọi liên lạc đều qua đội ngũ môi giới chuyên nghiệp. Thông tin cá nhân được bảo vệ tuyệt đối.",
  },
  {
    step: "03",
    icon: Shield,
    title: "Thanh toán an toàn",
    description: "Tiền được giữ ký quỹ cho đến khi xe được bàn giao đầy đủ và bạn hài lòng.",
  },
]

interface HomeContentProps {
  featuredCars: Car[]
  siteConfig: SiteConfig
  locale: string
}

export function HomeContent({ featuredCars, siteConfig, locale: localeProp }: HomeContentProps) {
  const { locale: ctxLocale } = useLocale()
  const locale = localeProp || ctxLocale

  const isVi = locale === "vi"
  const buyPath = isVi ? `/${locale}/mua-xe` : `/${locale}/buy-cars`
  const sellPath = isVi ? `/${locale}/ban-xe` : `/${locale}/sell-cars`

  const heroBadge   = isVi ? siteConfig.hero_badge_vi    : siteConfig.hero_badge_en
  const heroTitle   = isVi ? siteConfig.hero_title_vi    : siteConfig.hero_title_en
  const heroSubtitle = isVi ? siteConfig.hero_subtitle_vi : siteConfig.hero_subtitle_en

  const stats = [
    { icon: CarIcon, value: siteConfig.stats_cars_value,   label: isVi ? "Xe đang bán"            : "Cars Listed" },
    { icon: Users,   value: siteConfig.stats_users_value,  label: isVi ? "Người dùng tin tưởng"   : "Trusted Users" },
    { icon: CheckCircle, value: siteConfig.stats_deals_value,  label: isVi ? "Giao dịch thành công" : "Successful Deals" },
    { icon: Star,    value: siteConfig.stats_rating_value, label: isVi ? "Đánh giá hài lòng"      : "Satisfaction Rating" },
  ]

  return (
    <main className="min-h-screen">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary/30 py-20 sm:py-28">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 gap-2 px-4 py-1.5 text-sm">
              <Zap className="size-3.5 text-yellow-500" />
              {heroBadge}
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>

            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              {heroSubtitle}
            </p>

            {/* Search bar */}
            <div className="mx-auto mt-10 flex max-w-xl gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo hãng xe, mẫu xe..."
                  className="h-12 pl-10 text-base"
                />
              </div>
              <Button size="lg" className="h-12 px-6" asChild>
                <Link href={buyPath}>Tìm xe</Link>
              </Button>
            </div>

            {/* Quick filters */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
              {["Toyota", "Honda", "Mazda", "VinFast", "Hyundai"].map((brand) => (
                <Link
                  key={brand}
                  href={`${buyPath}?brand=${brand}`}
                  className="rounded-full border bg-background px-3 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {brand}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href={buyPath}>
                  Xem xe ngay
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={sellPath}>Đăng bán xe</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="border-y bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground sm:text-3xl">{value}</p>
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
              <p className="text-sm font-medium text-primary">Xe nổi bật</p>
              <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                Xe mới đăng gần đây
              </h2>
            </div>
            <Button variant="ghost" asChild className="gap-1 text-sm">
              <Link href={buyPath}>
                Xem tất cả
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCars.map((car) => {
              const carPath = locale === "vi"
                ? `/${locale}/xe/${car.slug}`
                : `/${locale}/car/${car.slug}`
              return (
                <Link key={car.id} href={carPath}>
                  <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={car.images[0].src}
                        alt={car.images[0].alt}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                      {car.verified && (
                        <Badge className="absolute left-3 top-3 gap-1 bg-emerald-500 text-white hover:bg-emerald-500">
                          <CheckCircle className="size-3" />
                          Đã xác minh
                        </Badge>
                      )}
                      <p className="absolute bottom-3 left-3 text-sm font-semibold text-white">
                        {car.location}
                      </p>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-1">{car.name}</h3>
                      <p className="mt-1 text-xl font-bold text-primary">
                        {formatVND(car.priceVND)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                          {car.year}
                        </span>
                        <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                          {formatKm(car.mileageKm)}
                        </span>
                        <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                          {car.fuel}
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
            <p className="text-sm font-medium text-primary">Thương hiệu</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              Hãng xe phổ biến
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
            {brands.map((brand) => (
              <Link
                key={brand.name}
                href={`${buyPath}?brand=${brand.name}`}
                className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition-all hover:border-primary/50 hover:shadow-sm"
              >
                <span className="text-2xl">{brand.logo}</span>
                <span className="text-xs font-medium text-foreground leading-tight">{brand.name}</span>
                <span className="text-[10px] text-muted-foreground">{brand.count} xe</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-medium text-primary">Đơn giản & An toàn</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              Cách thức hoạt động
            </h2>
            <p className="mt-3 text-muted-foreground">
              Chỉ 3 bước đơn giản để sở hữu chiếc xe mơ ước
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {howItWorks.map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="relative text-center">
                <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="size-8 text-primary" />
                </div>
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 text-5xl font-black text-muted/20 select-none">
                  {step}
                </span>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
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
                <h3 className="font-semibold text-foreground">Giao dịch bảo vệ</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tiền được giữ ký quỹ an toàn cho đến khi bạn nhận xe và hài lòng.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <TrendingUp className="size-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Giá thị trường minh bạch</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Giá xe được so sánh với thị trường. Không có phí ẩn hay chi phí bất ngờ.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="flex size-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <CheckCircle className="size-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Xe đã qua kiểm định</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mọi xe đều được xác minh lý lịch, kiểm tra kỹ thuật trước khi đăng bán.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-primary px-8 py-14 text-center">
            <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
              Sẵn sàng tìm chiếc xe mơ ước?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Hơn 1.200 xe ô tô đang chờ bạn khám phá. Đăng ký miễn phí và bắt đầu ngay hôm nay.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href={buyPath}>
                  Xem xe ngay
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link href={sellPath}>Đăng bán xe của bạn</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
