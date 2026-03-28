"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { User, Phone, Mail, Shield, Camera, Loader2, CheckCircle, Car, ShoppingBag, ShieldCheck, KeyRound } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
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
  phoneConfirmedAt: string | null
}

export function ProfileContent({
  userId,
  email,
  initialFullName,
  initialPhone,
  initialRole,
  initialAvatarUrl,
  createdAt,
  phoneConfirmedAt,
}: ProfileContentProps) {
  const { locale, dictionary: t } = useLocale()
  const { sendPhoneOtp, verifyPhoneOtp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [fullName, setFullName] = useState(initialFullName)
  const [phone, setPhone] = useState(initialPhone)
  const [role] = useState<'buyer' | 'seller'>(initialRole)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(
    searchParams.get('notice') === 'seller_required'
      ? t.profile.sellerRequiredDesc
      : null
  )

  // Phone OTP state
  const [phoneVerified, setPhoneVerified] = useState(!!phoneConfirmedAt)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  const memberSince = new Date(createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
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
      setError(t.profile.imageOnly)
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(t.profile.imageSize)
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
      setError(t.profile.uploadFailed)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('car-images').getPublicUrl(path)
    const newUrl = data.publicUrl + `?t=${Date.now()}`
    setAvatarUrl(newUrl)
    setUploading(false)
  }

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq('id', userId)

    if (updateErr) {
      if (updateErr.code === '23505' || updateErr.message?.includes('profiles_phone_unique')) {
        setError(t.profile.phoneDuplicate)
      } else {
        setError(t.profile.saveFailed)
      }
      setSaving(false)
      return
    }

    await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  async function handleSendOtp() {
    if (!phone.trim()) {
      setOtpError(t.profile.otpEnterPhone)
      return
    }
    setOtpLoading(true)
    setOtpError(null)
    const { error: err } = await sendPhoneOtp(phone.trim())
    setOtpLoading(false)
    if (err) {
      setOtpError(err)
      return
    }
    setOtpSent(true)
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) return
    setOtpLoading(true)
    setOtpError(null)
    const { error: err } = await verifyPhoneOtp(phone.trim(), otp.trim())
    setOtpLoading(false)
    if (err) {
      setOtpError(err)
      return
    }
    setPhoneVerified(true)
    setOtpSent(false)
    setOtp('')
  }

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-background py-10">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t.profile.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.profile.subtitle}</p>
          </div>

          {notice && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
              <Shield className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">{t.profile.sellerRequired}</p>
                <p className="mt-0.5 opacity-90">{notice}</p>
              </div>
              <button onClick={() => setNotice(null)} className="ml-auto shrink-0 opacity-60 hover:opacity-100">✕</button>
            </div>
          )}

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
                    <p className="text-lg font-semibold text-foreground">{fullName || t.profile.user}</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                      <Badge variant="secondary" className="gap-1 text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                        <ShieldCheck className="size-3" />
                        {t.profile.emailVerified}
                      </Badge>
                      {phoneVerified && (
                        <Badge variant="secondary" className="gap-1 text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                          <ShieldCheck className="size-3" />
                          {t.profile.phoneVerified}
                        </Badge>
                      )}
                      <Badge variant="outline" className="gap-1 text-xs">
                        {t.profile.memberSince} {memberSince}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── Thông tin cá nhân ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.profile.personalInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <User className="size-3.5 text-muted-foreground" />
                    {t.profile.fullNameLabel}
                  </Label>
                  <Input
                    placeholder={t.profile.fullNamePlaceholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    {t.auth.email}
                  </Label>
                  <Input value={email} disabled className="bg-secondary/50 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">{t.profile.emailCannotChange}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                    {t.profile.phoneLabel}
                    {phoneVerified && (
                      <Badge variant="secondary" className="ml-1 gap-1 text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                        <ShieldCheck className="size-3" />
                        {t.profile.phoneVerifiedTag}
                      </Badge>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="+84912345678"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setPhoneVerified(false); setOtpSent(false); setOtp('') }}
                      type="tel"
                      className="flex-1"
                    />
                    {!phoneVerified && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={otpLoading || !phone.trim()}
                        onClick={handleSendOtp}
                        className="shrink-0"
                      >
                        {otpLoading && !otpSent ? <Loader2 className="size-3.5 animate-spin" /> : t.profile.sendOtp}
                      </Button>
                    )}
                  </div>
                  {otpSent && !phoneVerified && (
                    <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t.profile.otpSentTo} <span className="font-medium">{phone}</span>
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder={t.profile.enterOtp}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                          className="flex-1 text-center tracking-widest text-lg font-mono"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={otpLoading || otp.length < 4}
                          onClick={handleVerifyOtp}
                          className="shrink-0"
                        >
                          {otpLoading ? <Loader2 className="size-3.5 animate-spin" /> : <><KeyRound className="mr-1.5 size-3.5" />{t.profile.verifyOtp}</>}
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                        className="text-xs text-accent hover:underline disabled:opacity-50"
                      >
                        {t.profile.resendOtp}
                      </button>
                    </div>
                  )}
                  {otpError && (
                    <p className="text-xs text-destructive">{otpError}</p>
                  )}
                  {phoneVerified && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="size-3" />
                      {t.profile.otpVerified}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">{t.profile.phoneFormat}</p>
                </div>
              </CardContent>
            </Card>

            {/* ─── Loại tài khoản ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.profile.accountType}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-4 rounded-xl border-2 p-4 ${
                  role === 'seller' ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'
                }`}>
                  {role === 'seller'
                    ? <Car className="size-8 shrink-0 text-primary" />
                    : <ShoppingBag className="size-8 shrink-0 text-muted-foreground" />
                  }
                  <div className="flex-1">
                    <p className={`font-semibold ${role === 'seller' ? 'text-primary' : 'text-foreground'}`}>
                      {role === 'seller' ? t.profile.seller : t.profile.buyer}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {role === 'seller' ? t.profile.sellerDesc : t.profile.buyerDesc}
                    </p>
                  </div>
                  <CheckCircle className={`size-5 shrink-0 ${role === 'seller' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {t.profile.accountTypeReadonly}
                </p>
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
                {t.profile.savedSuccess}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" size="lg" className="flex-1" disabled={saving || uploading}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {saving ? t.profile.saving : t.profile.save}
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
