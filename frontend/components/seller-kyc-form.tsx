"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  User, Building2, Upload, CheckCircle, Clock, XCircle,
  ShieldCheck, ArrowLeft, ArrowRight, Loader2, FileText,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/context"
import { useLocale } from "@/lib/i18n/locale-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type SellerType = "individual" | "business"
type KycStatus = "pending" | "reviewing" | "approved" | "rejected"

interface KycRecord {
  status: KycStatus
  reject_reason: string | null
  seller_type: SellerType
}

// ── File upload dropzone ─────────────────────────────────────
function FileDropzone({
  label, hint, preview, accept, maxMb,
  onChange,
}: {
  label: string
  hint: string
  preview: string | null
  accept: string
  maxMb: number
  onChange: (file: File) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const { dictionary: t } = useLocale()

  return (
    <div>
      <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={cn(
          "relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors",
          preview ? "border-primary/40 bg-primary/5 p-2" : "border-border bg-secondary/30 p-6 hover:border-primary/50 hover:bg-secondary/50"
        )}
      >
        {preview ? (
          <img src={preview} alt={label} className="max-h-40 w-full rounded-lg object-contain" />
        ) : (
          <>
            <Upload className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{t.kyc.uploadPhoto}</span>
          </>
        )}
        <span className="text-[11px] text-muted-foreground">{hint}</span>
        {preview && (
          <span className="absolute bottom-2 right-2 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {t.kyc.changePhoto}
          </span>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (!f) return
          if (f.size > maxMb * 1024 * 1024) return
          onChange(f)
          e.target.value = ""
        }}
      />
    </div>
  )
}

// ── Step indicator ───────────────────────────────────────────
function StepBar({ step, total, titles }: { step: number; total: number; titles: string[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-0">
        {titles.map((title, i) => {
          const idx = i + 1
          const done = step > idx
          const active = step === idx
          return (
            <div key={idx} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  done ? "bg-primary text-primary-foreground" :
                  active ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                  "bg-secondary text-muted-foreground"
                )}>
                  {done ? <CheckCircle className="size-4" /> : idx}
                </div>
                <span className={cn(
                  "hidden text-center text-[10px] leading-tight sm:block",
                  active ? "font-semibold text-foreground" : "text-muted-foreground"
                )}>{title}</span>
              </div>
              {i < titles.length - 1 && (
                <div className={cn("mx-1 h-0.5 flex-1 transition-colors", done ? "bg-primary" : "bg-border")} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Status screens ───────────────────────────────────────────
function StatusScreen({
  icon, iconBg, title, desc, children,
}: {
  icon: React.ReactNode; iconBg: string; title: string; desc: string; children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className={cn("mb-4 flex size-16 items-center justify-center rounded-full", iconBg)}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{desc}</p>
      {children}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────
export function SellerKycForm() {
  const { user, isLoading: authLoading } = useAuth()
  const { locale, dictionary: t } = useLocale()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [existing, setExisting] = useState<KycRecord | null>(null)
  const [resubmit, setResubmit] = useState(false)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [sellerType, setSellerType] = useState<SellerType>("individual")
  const [cccdNumber, setCccdNumber] = useState("")
  const [cccdName, setCccdName] = useState("")
  const [cccdDob, setCccdDob] = useState("")
  const [cccdAddress, setCccdAddress] = useState("")
  const [cccdFront, setCccdFront] = useState<File | null>(null)
  const [cccdFrontPreview, setCccdFrontPreview] = useState<string | null>(null)
  const [cccdBack, setCccdBack] = useState<File | null>(null)
  const [cccdBackPreview, setCccdBackPreview] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState("")
  const [businessTaxId, setBusinessTaxId] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [businessLicense, setBusinessLicense] = useState<File | null>(null)
  const [businessLicensePreview, setBusinessLicensePreview] = useState<string | null>(null)

  const isBusiness = sellerType === "business"
  const totalSteps = isBusiness ? 4 : 3
  const stepTitles = isBusiness
    ? [t.kyc.step1Title, t.kyc.step2Title, t.kyc.step3Title, t.kyc.step4Title]
    : [t.kyc.step1Title, t.kyc.step2Title, t.kyc.step4Title]

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    setCccdName(user.name)
    supabase
      .from("seller_kyc")
      .select("status, reject_reason, seller_type")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setExisting(data ?? null)
        setLoading(false)
      })
  }, [user, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilePreview(file: File, setFile: (f: File) => void, setPreview: (u: string | null) => void) {
    setFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function uploadDoc(file: File, path: string): Promise<string> {
    const { error } = await supabase.storage
      .from("kyc-documents")
      .upload(path, file, { upsert: true })
    if (error) throw new Error(error.message)
    return path
  }

  async function handleSubmit() {
    if (!user) return
    setSubmitting(true)
    setError(null)
    try {
      const ext = (f: File) => f.name.split(".").pop() ?? "jpg"
      const [frontPath, backPath] = await Promise.all([
        cccdFront ? uploadDoc(cccdFront, `${user.id}/cccd-front.${ext(cccdFront)}`) : Promise.resolve(null),
        cccdBack  ? uploadDoc(cccdBack,  `${user.id}/cccd-back.${ext(cccdBack)}`)  : Promise.resolve(null),
      ])
      const licensePath = isBusiness && businessLicense
        ? await uploadDoc(businessLicense, `${user.id}/business-license.${ext(businessLicense)}`)
        : null

      const { error: dbErr } = await supabase
        .from("seller_kyc")
        .upsert({
          user_id: user.id,
          seller_type: sellerType,
          cccd_number: cccdNumber || null,
          cccd_name: cccdName || null,
          cccd_dob: cccdDob || null,
          cccd_address: cccdAddress || null,
          cccd_front_path: frontPath,
          cccd_back_path: backPath,
          business_name: isBusiness ? (businessName || null) : null,
          business_tax_id: isBusiness ? (businessTaxId || null) : null,
          business_address: isBusiness ? (businessAddress || null) : null,
          business_license_path: licensePath,
          status: "pending",
          submitted_at: new Date().toISOString(),
          reject_reason: null,
        }, { onConflict: "user_id" })

      if (dbErr) throw new Error(dbErr.message)
      setExisting({ status: "pending", reject_reason: null, seller_type: sellerType })
      setResubmit(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setSubmitting(false)
    }
  }

  const sellPath = locale === "vi" ? `/${locale}/ban-xe/dang-tin` : `/${locale}/sell-cars/post`

  if (authLoading || loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── Status screens ────────────────────────────────────────
  if (existing && !resubmit) {
    if (existing.status === "approved") {
      return (
        <StatusScreen
          icon={<ShieldCheck className="size-8 text-emerald-600" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          title={t.kyc.approvedTitle}
          desc={t.kyc.approvedDesc}
        >
          <Button className="mt-6 gap-2" onClick={() => router.push(sellPath)}>
            {t.kyc.approvedCta}
          </Button>
        </StatusScreen>
      )
    }
    if (existing.status === "pending" || existing.status === "reviewing") {
      const isPending = existing.status === "pending"
      return (
        <StatusScreen
          icon={<Clock className="size-8 text-amber-600" />}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          title={isPending ? t.kyc.pendingTitle : t.kyc.reviewingTitle}
          desc={isPending ? t.kyc.pendingDesc : t.kyc.reviewingDesc}
        />
      )
    }
    if (existing.status === "rejected") {
      return (
        <StatusScreen
          icon={<XCircle className="size-8 text-destructive" />}
          iconBg="bg-destructive/10"
          title={t.kyc.rejectedTitle}
          desc={t.kyc.rejectedDesc}
        >
          {existing.reject_reason && (
            <div className="mt-4 w-full rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-left">
              <p className="text-xs font-semibold text-destructive">{t.kyc.rejectedReason}</p>
              <p className="mt-1 text-sm text-foreground">{existing.reject_reason}</p>
            </div>
          )}
          <Button variant="outline" className="mt-6" onClick={() => setResubmit(true)}>
            {t.kyc.resubmitButton}
          </Button>
        </StatusScreen>
      )
    }
  }

  // ── Step validation ───────────────────────────────────────
  const step2Valid = cccdNumber.trim().length >= 9 && cccdName.trim() && cccdDob && cccdFront && cccdBack
  const step3Valid = !isBusiness || (businessName.trim() && businessTaxId.trim() && businessLicense)
  const lastStep = isBusiness ? 4 : 3

  function canProceed() {
    if (step === 1) return true
    if (step === 2) return !!step2Valid
    if (step === 3 && isBusiness) return !!step3Valid
    return true
  }

  function nextStep() {
    if (step === lastStep) { handleSubmit(); return }
    setStep(s => s + 1)
  }

  // ── Form render ───────────────────────────────────────────
  return (
    <div>
      <StepBar step={step} total={totalSteps} titles={stepTitles} />

      {/* Step 1 — Seller type */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{t.kyc.step1Title}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["individual", "business"] as SellerType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSellerType(type)}
                className={cn(
                  "rounded-xl border-2 p-5 text-left transition-all",
                  sellerType === type
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-secondary">
                  {type === "individual"
                    ? <User className="size-5 text-foreground" />
                    : <Building2 className="size-5 text-foreground" />}
                </div>
                <p className="font-semibold text-foreground">
                  {type === "individual" ? t.kyc.individual : t.kyc.business}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {type === "individual" ? t.kyc.individualDesc : t.kyc.businessDesc}
                </p>
                {sellerType === type && (
                  <CheckCircle className="absolute right-3 top-3 size-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — CCCD */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-foreground">{t.kyc.cccdSection}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-sm">{t.kyc.cccdNumber} *</Label>
              <Input
                value={cccdNumber}
                onChange={e => setCccdNumber(e.target.value)}
                placeholder={t.kyc.cccdNumberPlaceholder}
                maxLength={12}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">{t.kyc.cccdDob} *</Label>
              <Input type="date" value={cccdDob} onChange={e => setCccdDob(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">{t.kyc.cccdName} *</Label>
            <Input
              value={cccdName}
              onChange={e => setCccdName(e.target.value)}
              placeholder={t.kyc.cccdNamePlaceholder}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">{t.kyc.cccdAddress}</Label>
            <Input
              value={cccdAddress}
              onChange={e => setCccdAddress(e.target.value)}
              placeholder={t.kyc.cccdAddressPlaceholder}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileDropzone
              label={`${t.kyc.cccdFront} *`}
              hint={t.kyc.uploadHint}
              preview={cccdFrontPreview}
              accept="image/*"
              maxMb={5}
              onChange={f => handleFilePreview(f, setCccdFront, setCccdFrontPreview)}
            />
            <FileDropzone
              label={`${t.kyc.cccdBack} *`}
              hint={t.kyc.uploadHint}
              preview={cccdBackPreview}
              accept="image/*"
              maxMb={5}
              onChange={f => handleFilePreview(f, setCccdBack, setCccdBackPreview)}
            />
          </div>
        </div>
      )}

      {/* Step 3 — Business (only for business type) */}
      {step === 3 && isBusiness && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-foreground">{t.kyc.businessSection}</h2>
          <div>
            <Label className="mb-1.5 block text-sm">{t.kyc.businessName} *</Label>
            <Input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder={t.kyc.businessNamePlaceholder}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-sm">{t.kyc.businessTaxId} *</Label>
              <Input
                value={businessTaxId}
                onChange={e => setBusinessTaxId(e.target.value)}
                placeholder={t.kyc.businessTaxIdPlaceholder}
                maxLength={13}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">{t.kyc.businessAddress}</Label>
              <Input
                value={businessAddress}
                onChange={e => setBusinessAddress(e.target.value)}
                placeholder={t.kyc.businessAddressPlaceholder}
              />
            </div>
          </div>
          <FileDropzone
            label={`${t.kyc.businessLicense} *`}
            hint={t.kyc.businessLicenseHint}
            preview={businessLicensePreview}
            accept="image/*,application/pdf"
            maxMb={10}
            onChange={f => handleFilePreview(f, setBusinessLicense, setBusinessLicensePreview)}
          />
        </div>
      )}

      {/* Last step — Review */}
      {step === lastStep && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{t.kyc.reviewTitle}</h2>
          <div className="divide-y rounded-xl border bg-card">
            <div className="grid grid-cols-[140px,1fr] gap-2 px-4 py-3 text-sm">
              <span className="text-muted-foreground">{t.kyc.reviewType}</span>
              <span className="font-medium text-foreground">
                {sellerType === "individual" ? t.kyc.typeIndividual : t.kyc.typeBusiness}
              </span>
            </div>
            <div className="px-4 py-3 text-sm">
              <p className="mb-2 font-medium text-foreground">{t.kyc.reviewCccd}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-muted-foreground">{t.kyc.cccdNumber}</span>
                <span>{cccdNumber}</span>
                <span className="text-muted-foreground">{t.kyc.cccdName}</span>
                <span>{cccdName}</span>
                <span className="text-muted-foreground">{t.kyc.cccdDob}</span>
                <span>{cccdDob}</span>
              </div>
              <div className="mt-3 flex gap-2">
                {cccdFrontPreview && (
                  <img src={cccdFrontPreview} alt="CCCD front" className="h-20 rounded-lg border object-cover" />
                )}
                {cccdBackPreview && (
                  <img src={cccdBackPreview} alt="CCCD back" className="h-20 rounded-lg border object-cover" />
                )}
              </div>
            </div>
            {isBusiness && (
              <div className="px-4 py-3 text-sm">
                <p className="mb-2 font-medium text-foreground">{t.kyc.reviewBusiness}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">{t.kyc.businessName}</span>
                  <span>{businessName}</span>
                  <span className="text-muted-foreground">{t.kyc.businessTaxId}</span>
                  <span>{businessTaxId}</span>
                </div>
                {businessLicensePreview && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border bg-secondary/50 px-3 py-2 text-xs">
                    <FileText className="size-4 text-muted-foreground" />
                    <span>{businessLicense?.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1 || submitting}
        >
          <ArrowLeft className="size-4" />
          {t.kyc.back}
        </Button>
        <Button
          type="button"
          className="gap-2"
          onClick={nextStep}
          disabled={!canProceed() || submitting}
        >
          {submitting
            ? <><Loader2 className="size-4 animate-spin" />{t.kyc.submitting}</>
            : step === lastStep
              ? <><CheckCircle className="size-4" />{t.kyc.submitButton}</>
              : <>{t.kyc.next}<ArrowRight className="size-4" /></>
          }
        </Button>
      </div>
    </div>
  )
}
