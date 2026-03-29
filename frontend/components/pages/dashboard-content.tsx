"use client"

import Link from "next/link"
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import {
  Car, Eye, TrendingUp, CheckCircle, Plus,
  ArrowUpRight, MoreHorizontal, Pencil, Trash2,
} from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DashboardData, SellerCar } from "@/lib/supabase/queries/dashboard"
import { formatVND } from "@/lib/utils/format-price"
import { useLocale } from "@/lib/i18n/locale-context"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

function getStatusLabel(status: string, t: { dashboard: { statusActive: string; statusDraft: string; statusSold: string; statusHidden: string } }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active:  { label: t.dashboard.statusActive,  variant: "default" },
    draft:   { label: t.dashboard.statusDraft,   variant: "secondary" },
    sold:    { label: t.dashboard.statusSold,    variant: "outline" },
    hidden:  { label: t.dashboard.statusHidden,  variant: "destructive" },
  }
  return map[status] ?? { label: status, variant: "secondary" as const }
}

interface DashboardContentProps {
  data: DashboardData
  userName: string
}

export function DashboardContent({ data, userName }: DashboardContentProps) {
  const { locale, dictionary: t } = useLocale()
  const [cars, setCars] = useState<SellerCar[]>(data.cars)
  const supabase = createClient()

  const postCarPath = locale === 'vi' ? `/${locale}/ban-xe/dang-tin` : `/${locale}/sell-cars/post`
  const editCarPath = (carId: string) => locale === 'vi' ? `/${locale}/ban-xe/chinh-sua/${carId}` : `/${locale}/sell-cars/edit/${carId}`

  async function handleToggleStatus(car: SellerCar) {
    const newStatus = car.status === 'active' ? 'hidden' : 'active'
    await supabase.from('cars').update({ status: newStatus }).eq('id', car.id)
    setCars((prev) => prev.map((c) => c.id === car.id ? { ...c, status: newStatus } : c))
  }

  async function handleDelete(carId: string) {
    if (!confirm('Bạn chắc chắn muốn xóa tin này?')) return
    await supabase.from('cars').delete().eq('id', carId)
    setCars((prev) => prev.filter((c) => c.id !== carId))
  }

  const { stats, viewsByDay, viewsByCar } = data
  const hasData = viewsByDay.some((d) => d.views > 0)

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* ─── Header ─── */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Xin chào, {userName} 👋
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Quản lý tin đăng và theo dõi hiệu suất
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href={postCarPath}>
                <Plus className="size-4" />
                Đăng tin mới
              </Link>
            </Button>
          </div>

          {/* ─── Stats Cards ─── */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Tin đăng</p>
                    <p className="mt-1 text-2xl font-bold">{stats.totalListings}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{stats.activeListings} đang bán</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Car className="size-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Tổng lượt xem</p>
                    <p className="mt-1 text-2xl font-bold">{stats.totalViews.toLocaleString('vi-VN')}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="text-emerald-500">+{stats.viewsLast7d}</span> 7 ngày qua
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <Eye className="size-4 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Đã bán</p>
                    <p className="mt-1 text-2xl font-bold">{stats.soldListings}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">tin đăng</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <CheckCircle className="size-4 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Tổng giá trị</p>
                    <p className="mt-1 text-xl font-bold leading-tight">
                      {stats.totalValue > 0 ? formatVND(stats.totalValue) : '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">xe đang bán</p>
                  </div>
                  <div className="rounded-lg bg-yellow-500/10 p-2">
                    <TrendingUp className="size-4 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Charts ─── */}
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            {/* Line chart: views 14 ngày */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lượt xem 14 ngày qua</CardTitle>
              </CardHeader>
              <CardContent>
                {hasData ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={viewsByDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        axisLine={false}
                        interval={1}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value} lượt xem`, '']}
                        labelFormatter={(label) => `Ngày ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                    <Eye className="size-8 opacity-30" />
                    <p className="text-sm">Chưa có lượt xem nào</p>
                    <p className="text-xs">Dữ liệu sẽ cập nhật khi có người xem tin của bạn</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bar chart: views theo xe */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lượt xem theo xe</CardTitle>
              </CardHeader>
              <CardContent>
                {viewsByCar.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={viewsByCar} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        axisLine={false}
                        width={70}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value} lượt xem`, '']}
                      />
                      <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                    <TrendingUp className="size-8 opacity-30" />
                    <p className="text-sm">Chưa có dữ liệu</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── Listings Table ─── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tin đăng của bạn</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cars.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
                  <Car className="size-10 opacity-30" />
                  <p className="text-sm">Bạn chưa có tin đăng nào</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={postCarPath}>
                      <Plus className="mr-1 size-3.5" />
                      Đăng tin đầu tiên
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {cars.map((car) => {
                    const carPath = locale === 'vi' ? `/${locale}/xe/${car.slug}` : `/${locale}/car/${car.slug}`
                    const statusConfig = getStatusLabel(car.status, t)
                    return (
                      <div key={car.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                        {/* Thumbnail */}
                        <div className="size-14 shrink-0 overflow-hidden rounded-lg border bg-secondary">
                          {car.image_url ? (
                            <img src={car.image_url} alt={car.title} className="size-full object-cover" />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <Car className="size-5 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">{car.title}</p>
                            <Badge variant={statusConfig.variant} className="text-[10px]">
                              {statusConfig.label}
                            </Badge>
                            {car.verified && (
                              <Badge variant="outline" className="gap-1 text-[10px] text-emerald-500 border-emerald-500/30">
                                <CheckCircle className="size-2.5" />
                                Đã xác minh
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-medium text-primary">{car.priceFormatted}</span>
                            <span>{car.year}</span>
                            <span className="flex items-center gap-1">
                              <Eye className="size-3" />
                              {car.total_views} lượt xem
                              {car.views_last_7d > 0 && (
                                <span className="text-emerald-500">(+{car.views_last_7d} tuần này)</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-2">
                          <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" asChild>
                            <Link href={carPath} target="_blank">
                              <ArrowUpRight className="size-3.5" />
                              Xem
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={editCarPath(car.id)}>
                                  <Pencil className="mr-2 size-3.5" />
                                  Chỉnh sửa tin
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(car)}>
                                <Pencil className="mr-2 size-3.5" />
                                {car.status === 'active' ? 'Ẩn tin' : 'Hiện tin'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(car.id)}
                              >
                                <Trash2 className="mr-2 size-3.5" />
                                Xóa tin
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
