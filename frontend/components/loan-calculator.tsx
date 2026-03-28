"use client"

import { useState, useMemo } from "react"
import { Landmark, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale } from "@/lib/i18n/locale-context"
import { BANKS, calcMonthlyPayment } from "@/lib/data/banks"
import { formatVND } from "@/lib/utils/format-price"

interface LoanCalculatorProps {
  carPriceVND: number
}

const TERM_OPTIONS = [24, 36, 48, 60, 72, 84]

export function LoanCalculator({ carPriceVND }: LoanCalculatorProps) {
  const { locale, dictionary: t } = useLocale()
  const isVi = locale === "vi"

  const [selectedBankId, setSelectedBankId] = useState<string>("vietcombank")
  const [downPct, setDownPct] = useState<number>(30)
  const [termMonths, setTermMonths] = useState<number>(60)

  const bank = BANKS.find(b => b.id === selectedBankId)!
  const effectiveDownPct = Math.max(downPct, bank.minDownPct)
  const downPayment = Math.round(carPriceVND * effectiveDownPct / 100)
  const principal = carPriceVND - downPayment
  const effectiveTerm = Math.min(termMonths, bank.maxTermMonths)

  const monthly = useMemo(
    () => calcMonthlyPayment(principal, bank.annualRate, effectiveTerm),
    [principal, bank.annualRate, effectiveTerm]
  )

  const totalPayment = monthly * effectiveTerm
  const totalInterest = totalPayment - principal

  return (
    <section className="rounded-2xl border bg-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
          <Landmark className="size-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{t.finance.loanTitle}</h2>
          <p className="text-xs text-muted-foreground">{t.finance.loanSubtitle}</p>
        </div>
      </div>

      {/* Bank selection */}
      <p className="mb-2 text-xs font-medium text-muted-foreground">{t.finance.selectBank}</p>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BANKS.map((b) => {
          const isSelected = selectedBankId === b.id
          return (
            <button
              key={b.id}
              onClick={() => setSelectedBankId(b.id)}
              className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : `${b.colorClass} hover:border-primary/50`
              }`}
            >
              {b.popular && (
                <span className="absolute -top-2 left-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  {t.finance.popularTag}
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{b.logo}</span>
                <p className="text-xs font-bold text-foreground">{b.name}</p>
                {isSelected && <CheckCircle className="ml-auto size-3.5 text-primary" />}
              </div>
              <p className="text-sm font-bold text-primary">{b.annualRate}%<span className="text-[10px] font-normal text-muted-foreground">/{t.finance.years}</span></p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{isVi ? b.featureVi : b.featureEn}</p>
              <div className="mt-1.5 flex gap-2 text-[10px] text-muted-foreground">
                <span>{t.finance.minDown}: {b.minDownPct}%</span>
                <span>·</span>
                <span>{t.finance.maxTerm}: {b.maxTermMonths / 12}{t.finance.years}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Controls */}
      <div className="mb-5 grid gap-5 sm:grid-cols-2">
        {/* Down payment slider */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">{t.finance.downPayment}</label>
            <div className="text-right">
              <span className="text-sm font-bold text-foreground">{effectiveDownPct}%</span>
              <p className="text-[11px] text-muted-foreground">{formatVND(downPayment)}</p>
            </div>
          </div>
          <input
            type="range"
            min={bank.minDownPct}
            max={70}
            step={5}
            value={effectiveDownPct}
            onChange={e => setDownPct(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{bank.minDownPct}%</span>
            <span>70%</span>
          </div>
        </div>

        {/* Loan term */}
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">{t.finance.loanTerm}</label>
          <div className="grid grid-cols-3 gap-1.5">
            {TERM_OPTIONS.filter(m => m <= bank.maxTermMonths).map(m => (
              <button
                key={m}
                onClick={() => setTermMonths(m)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${
                  termMonths === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {m} {t.finance.monthSuffix}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t.finance.monthlyPayment}</p>
              <p className="mt-1 text-2xl font-bold text-primary tabular-nums">{formatVND(monthly)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{bank.name} · {bank.annualRate}%/{t.finance.years} · {effectiveTerm} {t.finance.monthSuffix}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t.finance.loanAmount}</p>
              <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">{formatVND(principal)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t.finance.totalPayment}</p>
              <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">{formatVND(totalPayment)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t.finance.totalInterest}</p>
              <p className="mt-1 text-sm font-semibold text-rose-600 tabular-nums">{formatVND(totalInterest)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="mt-3 text-[10px] text-muted-foreground">{t.finance.disclaimer}</p>
    </section>
  )
}
