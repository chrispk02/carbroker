"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, X, Plus, Loader2, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/context"
import { useLocale } from "@/lib/i18n/locale-context"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const BRANDS = ['Toyota', 'Honda', 'Mazda', 'Hyundai', 'VinFast', 'Kia', 'Ford', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Suzuki', 'Subaru', 'Khác']
const FUEL_TYPES = ['Xăng', 'Dầu Diesel', 'Hybrid', 'Điện', 'Khác']
const TRANSMISSIONS = ['Số tự động', 'Số sàn', 'Số tự động CVT', 'Số tự động DCT', 'Số tự động 6 cấp', 'Số tự động 8 cấp']
const LOCATIONS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai', 'Hưng Yên', 'Khác']
const COMMON_FEATURES = [
  'Camera lùi', 'Camera 360 độ', 'Màn hình cảm ứng', 'Apple CarPlay / Android Auto',
  'Điều hòa tự động', 'Cửa sổ trời', 'Cửa sổ trời toàn cảnh', 'Hệ thống âm thanh cao cấp',
  'Ghế da', 'Ghế điều chỉnh điện', 'Ghế sưởi', 'Đèn pha LED', 'Chìa khóa thông minh',
  'Khởi động nút bấm', 'Phanh tay điện tử', 'Cảnh báo điểm mù', 'Cảnh báo lệch làn đường',
  'Hỗ trợ phanh khẩn cấp (AEB)', 'Ga tự động thích ứng (ACC)', 'Cân bằng điện tử (ESC)',
  'Hỗ trợ khởi hành ngang dốc', 'Cảm biến đỗ xe',
]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i)

function generateSlug(brand: string, model: string, variant: string, year: number): string {
  const raw = [brand, model, variant, year.toString()].join(' ')
  const normalized = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${normalized}-${suffix}`
}

interface ImageFile {
  file: File
  preview: string
  uploading?: boolean
  uploadedUrl?: string
  uploadedPath?: string
}

export function PostCarForm() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { locale } = useLocale()

  // Form fields
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [variant, setVariant] = useState('')
  const [year, setYear] = useState(CURRENT_YEAR.toString())
  const [priceInput, setPriceInput] = useState('')
  const [mileageInput, setMileageInput] = useState('')
  const [fuel, setFuel] = useState('')
  const [transmission, setTransmission] = useState('')
  const [color, setColor] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [customFeature, setCustomFeature] = useState('')

  // Images
  const [images, setImages] = useState<ImageFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authPath = `/${locale}/auth`
  const supabase = createClient()

  function toggleFeature(feature: string) {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    )
  }

  function addCustomFeature() {
    const trimmed = customFeature.trim()
    if (trimmed && !selectedFeatures.includes(trimmed)) {
      setSelectedFeatures((prev) => [...prev, trimmed])
      setCustomFeature('')
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const newImages: ImageFile[] = files
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 10 - images.length)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
    setImages((prev) => [...prev, ...newImages])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setError(null)

    // Validate
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
      const slug = generateSlug(brand, model, variant, parseInt(year))

      // 1. Insert car
      const { data: car, error: carError } = await supabase
        .from('cars')
        .insert({
          seller_id: user.id,
          slug,
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
          status: 'active',
          verified: false,
        })
        .select('id')
        .single()

      if (carError) throw new Error(carError.message)

      const carId = car.id

      // 2. Upload images
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const ext = img.file.name.split('.').pop() ?? 'jpg'
        const storagePath = `${user.id}/${carId}/${i}-${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(storagePath, img.file, { upsert: false })

        if (uploadError) {
          console.error('[image:upload]', uploadError.message)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('car-images')
          .getPublicUrl(storagePath)

        await supabase.from('car_images').insert({
          car_id: carId,
          storage_path: storagePath,
          url: urlData.publicUrl,
          is_primary: i === 0,
          sort_order: i,
        })
      }

      // 3. Insert features
      if (selectedFeatures.length > 0) {
        await supabase.from('car_features').insert(
          selectedFeatures.map((feature) => ({ car_id: carId, feature }))
        )
      }

      // 4. Redirect to car detail
      const detailPath = locale === 'vi' ? `/${locale}/xe/${slug}` : `/${locale}/car/${slug}`
      router.push(detailPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.')
      setSubmitting(false)
    }
  }

  function formatPriceDisplay(val: string) {
    const digits = val.replace(/\D/g, '')
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
        <SiteFooter />
      </>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-2xl font-bold">Cần đăng nhập để đăng tin</h2>
          <p className="text-muted-foreground">Tạo tài khoản hoặc đăng nhập để bắt đầu đăng bán xe.</p>
          <Button asChild size="lg">
            <Link href={authPath}>Đăng nhập / Đăng ký</Link>
          </Button>
        </div>
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-background py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Đăng tin bán xe</h1>
            <p className="mt-1 text-muted-foreground">Điền đầy đủ thông tin để tin đăng được duyệt nhanh nhất.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ─── Thông tin cơ bản ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin xe</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Hãng xe <span className="text-destructive">*</span></Label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn hãng xe" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Mẫu xe <span className="text-destructive">*</span></Label>
                  <Input placeholder="VD: Vios, CR-V, CX-5..." value={model} onChange={(e) => setModel(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Phiên bản</Label>
                  <Input placeholder="VD: 1.5E CVT, e:HEV RS..." value={variant} onChange={(e) => setVariant(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Năm sản xuất <span className="text-destructive">*</span></Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* ─── Thông số kỹ thuật ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông số kỹ thuật</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Giá bán (VNĐ) <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="VD: 580.000.000"
                    value={formatPriceDisplay(priceInput)}
                    onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Số km đã đi</Label>
                  <Input
                    placeholder="VD: 12.000"
                    value={formatPriceDisplay(mileageInput)}
                    onChange={(e) => setMileageInput(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Nhiên liệu <span className="text-destructive">*</span></Label>
                  <Select value={fuel} onValueChange={setFuel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại nhiên liệu" />
                    </SelectTrigger>
                    <SelectContent>
                      {FUEL_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Hộp số <span className="text-destructive">*</span></Label>
                  <Select value={transmission} onValueChange={setTransmission}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn hộp số" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSMISSIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Màu sắc</Label>
                  <Input placeholder="VD: Trắng ngọc trai, Đen..." value={color} onChange={(e) => setColor(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Khu vực <span className="text-destructive">*</span></Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khu vực" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* ─── Mô tả ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mô tả xe</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Mô tả tình trạng xe, lịch sử bảo dưỡng, điểm nổi bật... (tối thiểu 50 ký tự)"
                  className="min-h-32 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* ─── Tính năng ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tính năng & Trang bị</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {COMMON_FEATURES.map((feature) => {
                    const selected = selectedFeatures.includes(feature)
                    return (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => toggleFeature(feature)}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:border-primary/50'
                        }`}
                      >
                        {selected && <CheckCircle className="mr-1 inline size-3" />}
                        {feature}
                      </button>
                    )
                  })}
                </div>

                {/* Custom feature input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Thêm tính năng tùy chỉnh..."
                    value={customFeature}
                    onChange={(e) => setCustomFeature(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomFeature() } }}
                    className="h-8 text-sm"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addCustomFeature} className="h-8 shrink-0">
                    <Plus className="size-3.5" />
                  </Button>
                </div>

                {/* Custom features tags */}
                {selectedFeatures.filter((f) => !COMMON_FEATURES.includes(f)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFeatures
                      .filter((f) => !COMMON_FEATURES.includes(f))
                      .map((f) => (
                        <Badge key={f} variant="secondary" className="gap-1 text-xs">
                          {f}
                          <button type="button" onClick={() => toggleFeature(f)}>
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── Hình ảnh ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hình ảnh xe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">Tối đa 10 ảnh. Ảnh đầu tiên sẽ là ảnh đại diện. Định dạng: JPG, PNG, WebP.</p>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-lg border">
                      <img src={img.preview} alt={`Ảnh ${i + 1}`} className="size-full object-cover" />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                          Chính
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}

                  {images.length < 10 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                    >
                      <Upload className="size-5" />
                      <span className="text-[11px]">Thêm ảnh</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </CardContent>
            </Card>

            {/* ─── Error & Submit ─── */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {submitting ? 'Đang đăng tin...' : 'Đăng tin bán xe'}
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => router.back()} disabled={submitting}>
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
