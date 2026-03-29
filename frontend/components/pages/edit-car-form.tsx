"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useLocale } from "@/lib/i18n/locale-context"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { Locale } from "@/lib/i18n/config"

const BRANDS = ['Toyota', 'Honda', 'Mazda', 'Hyundai', 'VinFast', 'Kia', 'Ford', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Suzuki', 'Subaru', 'Khác']
const FUEL_TYPES = ['Xăng', 'Dầu Diesel', 'Hybrid', 'Điện', 'Khác']
const TRANSMISSIONS = ['Số tự động', 'Số sàn', 'Số tự động CVT', 'Số tự động DCT', 'Số tự động 6 cấp', 'Số tự động 8 cấp']
const LOCATIONS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai', 'Hưng Yên', 'Khác']
const COMMON_FEATURES = [
  'Camera lùi', 'Camera 360 độ', 'Màn hình cảm ứng', 'Apple CarPlay / Android Auto',
  'Điều hòa tự động', 'Cửa sổ trời', 'Hệ thống âm thanh cao cấp', 'Ghế da',
  'Đèn pha LED', 'Chìa khóa thông minh', 'Cảnh báo điểm mù', 'Hỗ trợ phanh khẩn cấp (AEB)',
]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i)

interface CarData {
  id: string
  slug: string
  title: string
  brand: string | null
  model: string | null
  variant: string | null
  price_vnd: number
  year: number
  mileage_km: number | null
  fuel: string | null
  transmission: string | null
  color: string | null
  location: string | null
  description: string | null
  status: string
  features: string[]
}

interface EditCarFormProps {
  car: CarData
  locale: Locale
}

export function EditCarForm({ car, locale }: EditCarFormProps) {
  const router = useRouter()
  const { dictionary: t } = useLocale()
  const supabase = createClient()

  const [brand, setBrand] = useState(car.brand ?? '')
  const [model, setModel] = useState(car.model ?? '')
  const [variant, setVariant] = useState(car.variant ?? '')
  const [year, setYear] = useState(car.year.toString())
  const [priceInput, setPriceInput] = useState(car.price_vnd.toString())
  const [mileageInput, setMileageInput] = useState(car.mileage_km?.toString() ?? '')
  const [fuel, setFuel] = useState(car.fuel ?? '')
  const [transmission, setTransmission] = useState(car.transmission ?? '')
  const [color, setColor] = useState(car.color ?? '')
  const [location, setLocation] = useState(car.location ?? '')
  const [description, setDescription] = useState(car.description ?? '')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(car.features)
  const [status, setStatus] = useState(car.status)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dashboardPath = `/${locale}/dashboard`

  function toggleFeature(feature: string) {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    )
  }

  function formatPriceDisplay(val: string) {
    const digits = val.replace(/\D/g, '')
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!brand || !model || !year || !priceInput || !fuel || !transmission || !location) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc (*).')
      return
    }

    const priceVND = parseInt(priceInput.replace(/\D/g, ''), 10)
    const mileageKm = mileageInput ? parseInt(mileageInput.replace(/\D/g, ''), 10) : 0
    if (isNaN(priceVND) || priceVND <= 0) {
      setError('Giá xe không hợp lệ.')
      return
    }

    setSubmitting(true)

    try {
      const title = [brand, model, variant, year].filter(Boolean).join(' ')

      const { error: updateError } = await supabase
        .from('cars')
        .update({
          title,
          brand,
          model,
          variant: variant || null,
          price_vnd: priceVND,
          year: parseInt(year),
          mileage_km: mileageKm,
          fuel,
          transmission,
          color: color || null,
          location,
          description: description || null,
          status: status as 'draft' | 'active' | 'sold' | 'hidden',
        })
        .eq('id', car.id)

      if (updateError) throw new Error(updateError.message)

      // Update features: delete old, insert new
      await supabase.from('car_features').delete().eq('car_id', car.id)
      if (selectedFeatures.length > 0) {
        await supabase.from('car_features').insert(
          selectedFeatures.map((feature) => ({ car_id: car.id, feature }))
        )
      }

      router.push(dashboardPath)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chỉnh sửa tin đăng</h1>
            <p className="mt-1 text-sm text-muted-foreground">{car.title}</p>
          </div>
          <Button variant="outline" onClick={() => router.push(dashboardPath)}>
            Huỷ
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Hãng xe *</Label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger><SelectValue placeholder="Chọn hãng" /></SelectTrigger>
                    <SelectContent>
                      {BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Dòng xe *</Label>
                  <Input placeholder="VD: Vios, CR-V..." value={model} onChange={(e) => setModel(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Phiên bản</Label>
                  <Input placeholder="VD: 1.5E CVT" value={variant} onChange={(e) => setVariant(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Năm sản xuất *</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Giá (VNĐ) *</Label>
                  <Input
                    placeholder="VD: 500.000.000"
                    value={formatPriceDisplay(priceInput)}
                    onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Số km đã đi</Label>
                  <Input
                    placeholder="VD: 20.000"
                    value={formatPriceDisplay(mileageInput)}
                    onChange={(e) => setMileageInput(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader><CardTitle className="text-base">Chi tiết kỹ thuật</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nhiên liệu *</Label>
                  <Select value={fuel} onValueChange={setFuel}>
                    <SelectTrigger><SelectValue placeholder="Chọn loại nhiên liệu" /></SelectTrigger>
                    <SelectContent>
                      {FUEL_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Hộp số *</Label>
                  <Select value={transmission} onValueChange={setTransmission}>
                    <SelectTrigger><SelectValue placeholder="Chọn hộp số" /></SelectTrigger>
                    <SelectContent>
                      {TRANSMISSIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Màu sắc</Label>
                  <Input placeholder="VD: Trắng ngọc trai" value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Địa điểm *</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger><SelectValue placeholder="Chọn tỉnh/thành" /></SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang bán</SelectItem>
                    <SelectItem value="draft">Nháp</SelectItem>
                    <SelectItem value="hidden">Ẩn</SelectItem>
                    <SelectItem value="sold">Đã bán</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="text-base">Mô tả xe</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                placeholder="Mô tả tình trạng xe, lịch sử bảo dưỡng, lý do bán..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader><CardTitle className="text-base">Tính năng & trang bị</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {COMMON_FEATURES.map((feature) => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      selectedFeatures.includes(feature)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
            {submitting ? (
              <><Loader2 className="size-4 animate-spin" />{t.common.loading}</>
            ) : (
              <><Save className="size-4" />Lưu thay đổi</>
            )}
          </Button>
        </form>
      </main>
      <SiteFooter />
    </>
  )
}
