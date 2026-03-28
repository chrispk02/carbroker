"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Phone, Mail, Shield, Camera, Loader2, CheckCircle, Car, ShoppingBag } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useLocale } from "@/lib/i18n/locale-context"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileContentProps {
  userId: string
  email: string
  initialFullName: string
  initialPhone: string
  initialRole: 'buyer' | 'seller'
  initialAvatarUrl: string | null
  createdAt: string
}

export function ProfileContent({
  userId,
  email,
  initialFullName,
  initialPhone,
  initialRole,
  initialAvatarUrl,
  createdAt,
}: ProfileContentProps) {
  const { locale, dictionary: t } = useLocale()
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState(initialFullName)
  const [phone, setPhone] = useState(initialPhone)
  const [role, setRole] = useState<'buyer' | 'seller'>(initialRole)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const memberSince = new Date(createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
  })

  const initials = fullName
    ? fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : email[0]?.toUpperCase() ?? 'U'

  const dashboardPath = `/${locale}/dashboard`

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Ảnh tối đa 2MB.')
      return
    }

    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `avatars/${userId}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('car-images')
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      setError('Không thể upload ảnh. Vui lòng thử lại.')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('car-images').getPublicUrl(path)
    const newUrl = data.publicUrl + `?t=${Date.now()}`
    setAvatarUrl(newUrl)
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        role,
        avatar_url: avatarUrl,
      })
      .eq('id', userId)

    if (updateErr) {
      setError('Không thể lưu thông tin. Vui lòng thử lại.')
      setSaving(false)
      return
    }

    // Update auth metadata
    await supabase.auth.updateUser({
      data: { full_name: fullName.trim(), role },
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-background py-10">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Hồ sơ cá nhân</h1>
            <p className="mt-1 text-sm text-muted-foreground">Quản lý thông tin tài khoản của bạn</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* ─── Avatar + basic info ─── */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className="size-20 border-2 border-border">
                      <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
                      <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute -bottom-1 -right-1 flex size-7 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {uploading
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Camera className="size-3.5" />
                      }
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-lg font-semibold text-foreground">{fullName || 'Người dùng'}</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Shield className="size-3" />
                        Đã xác minh email
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs">
                        Thành viên từ {memberSince}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── Thông tin cá nhân ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <User className="size-3.5 text-muted-foreground" />
                    Họ và tên
                  </Label>
                  <Input
                    placeholder="Nhập họ và tên"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    Email
                  </Label>
                  <Input value={email} disabled className="bg-secondary/50 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">Email không thể thay đổi</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                    Số điện thoại
                  </Label>
                  <Input
                    placeholder="VD: 0912 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ─── Loại tài khoản ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Loại tài khoản</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                      role === 'buyer'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <ShoppingBag className="size-6" />
                    <div>
                      <p className="text-sm font-medium">Người mua</p>
                      <p className="mt-0.5 text-xs opacity-70">Tìm và mua xe</p>
                    </div>
                    {role === 'buyer' && <CheckCircle className="size-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('seller')}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                      role === 'seller'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <Car className="size-6" />
                    <div>
                      <p className="text-sm font-medium">Người bán</p>
                      <p className="mt-0.5 text-xs opacity-70">Đăng và bán xe</p>
                    </div>
                    {role === 'seller' && <CheckCircle className="size-4" />}
                  </button>
                </div>

                {role === 'seller' && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                    <CheckCircle className="size-3.5 shrink-0" />
                    Với tài khoản Người bán, bạn có thể đăng tin bán xe và xem Dashboard phân tích.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── Error + Submit ─── */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
                <CheckCircle className="size-4" />
                Thông tin đã được lưu thành công!
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" size="lg" className="flex-1" disabled={saving || uploading}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => router.push(dashboardPath)}
                disabled={saving}
              >
                Dashboard
              </Button>
            </div>
          </form>
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
