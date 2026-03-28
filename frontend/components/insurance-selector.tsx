"use client"

import { useState } from "react"
import { CheckCircle, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale } from "@/lib/i18n/locale-context"
import {
  INSURANCE_PROVIDERS,
  TNDS_PRICE_VND,
  calcInsurancePrice,
  type PlanType,
} from "@/lib/data/insurance"
import { formatVND } from "@/lib/utils/format-price"

interface InsuranceSelectorProps {
  carPriceVND: number
}

const PLAN_TYPES: PlanType[] = ["basic", "standard", "premium"]

export function InsuranceSelector({ carPriceVND }: InsuranceSelectorProps) {
  const { locale, dictionary: t } = useLocale()
  const isVi = locale === "vi"

  const [selectedPlan, setSelectedPlan] = useState<PlanType>("standard")
  const [selectedProvider, setSelectedProvider] = useState<string>("bao-viet")

  const planLabels: Record<PlanType, { label: string; desc: string }> = {
    basic:    { label: t.finance.planBasic,    desc: t.finance.planBasicDesc },
    standard: { label: t.finance.planStandard, desc: t.finance.planStandardDesc },
    premium:  { label: t.finance.planPremium,  desc: t.finance.planPremiumDesc },
  }

  const activeProvider = INSURANCE_PROVIDERS.find(p => p.id === selectedProvider)!
  const activePlanData = activeProvider.plans[selectedPlan]
  const ownDamagePrice = calcInsurancePrice(carPriceVND, activePlanData.rate)
  const totalPrice = TNDS_PRICE_VND + ownDamagePrice
  const coverage = isVi ? activePlanData.coverageVi : activePlanData.coverageEn

  return (
    <section className="rounded-2xl border bg-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
          <Shield className="size-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{t.finance.insuranceTitle}</h2>
          <p className="text-xs text-muted-foreground">{t.finance.insuranceSubtitle}</p>
        </div>
      </div>

      {/* Mandatory TNDS banner */}
      <div className="mb-4 flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle className="size-4 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{t.finance.mandatoryLabel}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{t.finance.mandatoryNote}</p>
          </div>
        </div>
        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 shrink-0 ml-4">
          {t.finance.mandatoryPrice}
        </p>
      </div>

      {/* Plan type tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border bg-muted/50 p-1">
        {PLAN_TYPES.map((plan) => (
          <button
            key={plan}
            onClick={() => setSelectedPlan(plan)}
            className={`flex-1 rounded-lg px-3 py-2 text-center transition-all ${
              selectedPlan === plan
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <p className="text-xs font-medium leading-tight">{planLabels[plan].label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">{planLabels[plan].desc}</p>
          </button>
        ))}
      </div>

      {/* Provider cards */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {INSURANCE_PROVIDERS.map((provider) => {
          const price = TNDS_PRICE_VND + calcInsurancePrice(carPriceVND, provider.plans[selectedPlan].rate)
          const isSelected = selectedProvider === provider.id
          return (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : `${provider.colorClass} hover:border-primary/50`
              }`}
            >
              {provider.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground whitespace-nowrap">
                  {t.finance.popularTag}
                </span>
              )}
              <p className="text-xl leading-none mb-1">{provider.logo}</p>
              <p className="text-xs font-semibold text-foreground">{provider.name}</p>
              <p className="mt-1 text-xs font-bold text-primary">
                {formatVND(price)}<span className="font-normal text-muted-foreground">{t.finance.perYear}</span>
              </p>
              {isSelected && (
                <CheckCircle className="absolute right-2 top-2 size-3.5 text-primary" />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected plan summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">{t.finance.coverage}</p>
              <ul className="space-y-1">
                {coverage.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <CheckCircle className="size-3 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground mb-1">{t.finance.mandatoryLabel}</p>
              <p className="text-sm font-medium text-foreground">{formatVND(TNDS_PRICE_VND)}</p>
              <p className="text-xs text-muted-foreground mt-2 mb-1">{planLabels[selectedPlan].label}</p>
              <p className="text-sm font-medium text-foreground">{formatVND(ownDamagePrice)}</p>
              <div className="mt-3 border-t pt-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total{t.finance.perYear}</p>
                <p className="text-xl font-bold text-primary">{formatVND(totalPrice)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
