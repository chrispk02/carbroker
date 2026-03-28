export type PlanType = 'basic' | 'standard' | 'premium'

export interface InsuranceProvider {
  id: string
  name: string
  logo: string
  colorClass: string
  popular?: boolean
  plans: Record<PlanType, {
    rate: number          // % of car value / year
    coverageVi: string[]
    coverageEn: string[]
  }>
}

// TNDS bắt buộc fixed price (xe dưới 9 chỗ, theo quy định nhà nước 2024)
export const TNDS_PRICE_VND = 666_000

// rate = % of car value per year
export const INSURANCE_PROVIDERS: InsuranceProvider[] = [
  {
    id: 'bao-viet',
    name: 'Bảo Việt',
    logo: '🛡️',
    colorClass: 'border-red-200 bg-red-50',
    popular: true,
    plans: {
      basic: {
        rate: 0.9,
        coverageVi: ['Bảo hiểm thân xe toàn phần', 'Tai nạn do va chạm', 'Lật đổ, đâm phải vật cố định', 'Hỗ trợ bồi thường nhanh'],
        coverageEn: ['Full own-damage cover', 'Collision damage', 'Overturn / fixed object impact', 'Fast claims processing'],
      },
      standard: {
        rate: 1.1,
        coverageVi: ['Toàn bộ quyền lợi Cơ bản', 'Trộm cắp / cướp xe', 'Cháy nổ toàn phần', 'Thiên tai (lũ lụt, mưa đá)', 'Tài xế thay thế khẩn cấp'],
        coverageEn: ['All Basic benefits', 'Theft / robbery', 'Fire & explosion', 'Natural disaster (flood, hail)', 'Emergency replacement driver'],
      },
      premium: {
        rate: 1.4,
        coverageVi: ['Toàn bộ quyền lợi Tiêu chuẩn', 'Cứu hộ xe 24/7 toàn quốc', 'Bảo hiểm tai nạn lái xe', 'Xe thay thế trong thời gian sửa chữa', 'Bảo hiểm hành lý trên xe'],
        coverageEn: ['All Standard benefits', '24/7 nationwide roadside assistance', 'Driver personal accident', 'Replacement vehicle during repair', 'In-car luggage cover'],
      },
    },
  },
  {
    id: 'pti',
    name: 'PTI',
    logo: '📮',
    colorClass: 'border-blue-200 bg-blue-50',
    plans: {
      basic: {
        rate: 0.85,
        coverageVi: ['Bảo hiểm thân xe toàn phần', 'Va chạm & tai nạn', 'Lật đổ, trượt bánh', 'Đường dây hỗ trợ 24/7'],
        coverageEn: ['Full own-damage cover', 'Collision & accident', 'Overturn / skid', '24/7 hotline support'],
      },
      standard: {
        rate: 1.05,
        coverageVi: ['Toàn bộ quyền lợi Cơ bản', 'Trộm cắp / mất bộ phận', 'Cháy nổ, sét đánh', 'Lũ lụt, bão, mưa đá'],
        coverageEn: ['All Basic benefits', 'Theft / parts theft', 'Fire, explosion, lightning', 'Flood, storm, hail'],
      },
      premium: {
        rate: 1.35,
        coverageVi: ['Toàn bộ quyền lợi Tiêu chuẩn', 'Cứu hộ 24/7', 'Tai nạn cá nhân lái xe & khách', 'Xe thay thế miễn phí', 'Kính xe'],
        coverageEn: ['All Standard benefits', '24/7 roadside rescue', 'Driver & passenger PA', 'Free replacement car', 'Windscreen cover'],
      },
    },
  },
  {
    id: 'bsh',
    name: 'BSH',
    logo: '🏦',
    colorClass: 'border-green-200 bg-green-50',
    plans: {
      basic: {
        rate: 0.88,
        coverageVi: ['Bảo hiểm thân xe toàn phần', 'Va chạm & đụng chạm', 'Cứu hộ kéo xe tới 30km', 'Hotline hỗ trợ 24h'],
        coverageEn: ['Full own-damage cover', 'Collision & impact', 'Towing up to 30km', '24h support hotline'],
      },
      standard: {
        rate: 1.08,
        coverageVi: ['Toàn bộ quyền lợi Cơ bản', 'Trộm cắp toàn phần', 'Cháy nổ & chập điện', 'Mưa đá, lũ lụt, bão'],
        coverageEn: ['All Basic benefits', 'Total theft', 'Fire, explosion & electrical', 'Hail, flood, storm'],
      },
      premium: {
        rate: 1.38,
        coverageVi: ['Toàn bộ quyền lợi Tiêu chuẩn', 'Cứu hộ toàn quốc 24/7', 'Tai nạn lái xe & hành khách', 'Xe thuê trong thời gian sửa chữa'],
        coverageEn: ['All Standard benefits', 'Nationwide 24/7 rescue', 'Driver & passenger accident', 'Rental car during repairs'],
      },
    },
  },
  {
    id: 'mic',
    name: 'MIC',
    logo: '⭐',
    colorClass: 'border-purple-200 bg-purple-50',
    plans: {
      basic: {
        rate: 0.82,
        coverageVi: ['Bảo hiểm thân xe toàn phần', 'Va chạm giao thông', 'Lật đổ, trượt', 'Hỗ trợ bồi thường trực tuyến'],
        coverageEn: ['Full own-damage cover', 'Traffic collision', 'Overturn / slide', 'Online claims support'],
      },
      standard: {
        rate: 1.02,
        coverageVi: ['Toàn bộ quyền lợi Cơ bản', 'Trộm cắp & mất cắp', 'Cháy nổ ngẫu nhiên', 'Thiên tai'],
        coverageEn: ['All Basic benefits', 'Theft & burglary', 'Accidental fire & explosion', 'Natural perils'],
      },
      premium: {
        rate: 1.3,
        coverageVi: ['Toàn bộ quyền lợi Tiêu chuẩn', 'Cứu hộ 24/7', 'Tai nạn lái xe', 'Xe thay thế', 'Kính xe & gương chiếu hậu'],
        coverageEn: ['All Standard benefits', '24/7 roadside assist', 'Driver accident cover', 'Replacement vehicle', 'Glass & mirror cover'],
      },
    },
  },
]

export function calcInsurancePrice(carValueVND: number, rate: number): number {
  return Math.round(carValueVND * (rate / 100))
}
