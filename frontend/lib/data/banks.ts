export interface Bank {
  id: string
  name: string
  logo: string
  annualRate: number   // % per year
  minDownPct: number   // minimum down payment %
  maxTermMonths: number
  featureVi: string
  featureEn: string
  popular?: boolean
  colorClass: string
}

export const BANKS: Bank[] = [
  {
    id: 'vietcombank',
    name: 'Vietcombank',
    logo: '🏛️',
    annualRate: 8.2,
    minDownPct: 20,
    maxTermMonths: 84,
    featureVi: 'Lãi suất ưu đãi tháng đầu 6.9%',
    featureEn: 'Promo rate 6.9% first month',
    popular: true,
    colorClass: 'border-green-300 bg-green-50',
  },
  {
    id: 'techcombank',
    name: 'Techcombank',
    logo: '🔴',
    annualRate: 8.9,
    minDownPct: 15,
    maxTermMonths: 96,
    featureVi: 'Trả trước từ 15%, kỳ hạn lên tới 8 năm',
    featureEn: 'From 15% down, up to 8-year term',
    colorClass: 'border-red-300 bg-red-50',
  },
  {
    id: 'vpbank',
    name: 'VPBank',
    logo: '🌟',
    annualRate: 9.5,
    minDownPct: 15,
    maxTermMonths: 84,
    featureVi: 'Giải ngân trong 24 giờ',
    featureEn: 'Disbursement within 24 hours',
    colorClass: 'border-yellow-300 bg-yellow-50',
  },
  {
    id: 'bidv',
    name: 'BIDV',
    logo: '🏦',
    annualRate: 7.8,
    minDownPct: 20,
    maxTermMonths: 84,
    featureVi: 'Lãi suất thấp nhất, uy tín ngân hàng nhà nước',
    featureEn: 'Lowest rate, state-owned bank trust',
    colorClass: 'border-blue-300 bg-blue-50',
  },
  {
    id: 'mbbank',
    name: 'MBBank',
    logo: '🎯',
    annualRate: 8.7,
    minDownPct: 20,
    maxTermMonths: 84,
    featureVi: 'Duyệt hồ sơ trong 2 giờ làm việc',
    featureEn: 'Approval in 2 business hours',
    colorClass: 'border-teal-300 bg-teal-50',
  },
  {
    id: 'acb',
    name: 'ACB',
    logo: '💎',
    annualRate: 9.0,
    minDownPct: 20,
    maxTermMonths: 72,
    featureVi: 'Linh hoạt trả trước không phạt',
    featureEn: 'Flexible early repayment, no penalty',
    colorClass: 'border-indigo-300 bg-indigo-50',
  },
]

/** PMT formula: principal × [r(1+r)^n] / [(1+r)^n − 1] */
export function calcMonthlyPayment(principal: number, annualRatePct: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return principal / termMonths
  const factor = Math.pow(1 + r, termMonths)
  return Math.round((principal * r * factor) / (factor - 1))
}
