import { createAdminClient } from '@/lib/supabase/admin'

export interface AdminUser {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  role: 'buyer' | 'seller'
  is_admin: boolean
  created_at: string
  car_count: number
}

export interface AdminCar {
  id: string
  slug: string
  title: string
  brand: string
  price_vnd: number
  year: number
  status: string
  verified: boolean
  created_at: string
  seller_name: string | null
  seller_email: string
  view_count: number
}

export interface AdminKyc {
  id: string
  user_id: string
  seller_type: 'individual' | 'business'
  cccd_number: string | null
  cccd_name: string | null
  cccd_dob: string | null
  cccd_address: string | null
  cccd_front_path: string | null
  cccd_back_path: string | null
  business_name: string | null
  business_tax_id: string | null
  business_address: string | null
  business_license_path: string | null
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  reject_reason: string | null
  submitted_at: string
  user_email: string
  user_full_name: string | null
}

export interface AdminStats {
  totalUsers: number
  totalSellers: number
  totalBuyers: number
  totalCars: number
  activeCars: number
  soldCars: number
  totalViews: number
  newUsersToday: number
  newCarsToday: number
}

export interface GrowthPoint {
  date: string
  users: number
  cars: number
}

export interface AdminData {
  stats: AdminStats
  users: AdminUser[]
  cars: AdminCar[]
  growth: GrowthPoint[]
  kyc: AdminKyc[]
}

export interface SiteConfig {
  hero_badge_vi: string
  hero_badge_en: string
  hero_title_vi: string
  hero_title_en: string
  hero_subtitle_vi: string
  hero_subtitle_en: string
  stats_cars_value: string
  stats_users_value: string
  stats_deals_value: string
  stats_rating_value: string
}

export const defaultSiteConfig: SiteConfig = {
  hero_badge_vi: 'Nền tảng mua bán xe uy tín #1 Việt Nam',
  hero_badge_en: "Vietnam's #1 Trusted Car Marketplace",
  hero_title_vi: 'Mua bán xe ô tô an toàn, minh bạch',
  hero_title_en: 'Buy & Sell Cars Safely, Transparently',
  hero_subtitle_vi: 'Kết nối người mua và người bán qua đội ngũ môi giới chuyên nghiệp. Mọi giao dịch đều được bảo vệ — không lo lừa đảo, không lo mất tiền.',
  hero_subtitle_en: 'Connect buyers and sellers through our professional broker team. Every transaction is protected — no fraud, no lost money.',
  stats_cars_value: '1.200+',
  stats_users_value: '5.000+',
  stats_deals_value: '850+',
  stats_rating_value: '4.9/5',
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'homepage')
    .maybeSingle()
  if (!data) return defaultSiteConfig
  return { ...defaultSiteConfig, ...(data.value as Partial<SiteConfig>) }
}

export async function getAdminData(): Promise<AdminData> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // ── Fetch all data in parallel ──────────────────────────────
  const [
    { data: profiles },
    { data: cars },
    { data: views },
    { data: { users: authUsers } },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone, role, is_admin, created_at').order('created_at', { ascending: false }),
    supabase.from('cars').select('id, slug, title, brand, price_vnd, year, status, verified, created_at, seller_id').order('created_at', { ascending: false }),
    supabase.from('car_views').select('car_id, viewed_at'),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ])

  // Fetch KYC separately — table may not exist until migration 005 is run
  interface RawKyc {
    id: string; user_id: string; seller_type: 'individual' | 'business'
    cccd_number: string | null; cccd_name: string | null; cccd_dob: string | null
    cccd_address: string | null; cccd_front_path: string | null; cccd_back_path: string | null
    business_name: string | null; business_tax_id: string | null; business_address: string | null
    business_license_path: string | null; status: 'pending' | 'reviewing' | 'approved' | 'rejected'
    reject_reason: string | null; submitted_at: string
  }
  let kycRows: RawKyc[] = []
  try {
    const { data } = await supabase
      .from('seller_kyc')
      .select('*')
      .order('submitted_at', { ascending: false })
    kycRows = (data ?? []) as RawKyc[]
  } catch {
    // Table not yet migrated — admin page still works, KYC tab shows empty
  }

  // ── Email map ────────────────────────────────────────────────
  const emailMap = new Map<string, string>()
  for (const u of authUsers ?? []) {
    emailMap.set(u.id, u.email ?? '')
  }

  // ── Car count per user ───────────────────────────────────────
  const carCountMap = new Map<string, number>()
  for (const car of cars ?? []) {
    carCountMap.set(car.seller_id, (carCountMap.get(car.seller_id) ?? 0) + 1)
  }

  // ── View count per car ───────────────────────────────────────
  const viewCountMap = new Map<string, number>()
  for (const v of views ?? []) {
    viewCountMap.set(v.car_id, (viewCountMap.get(v.car_id) ?? 0) + 1)
  }

  // ── Seller name map ──────────────────────────────────────────
  const sellerNameMap = new Map<string, string | null>()
  for (const p of profiles ?? []) {
    sellerNameMap.set(p.id, p.full_name)
  }

  // ── Stats ────────────────────────────────────────────────────
  const totalUsers = profiles?.length ?? 0
  const totalSellers = profiles?.filter(p => p.role === 'seller').length ?? 0
  const totalCars = cars?.length ?? 0
  const activeCars = cars?.filter(c => c.status === 'active').length ?? 0
  const soldCars = cars?.filter(c => c.status === 'sold').length ?? 0
  const totalViews = views?.length ?? 0
  const newUsersToday = profiles?.filter(p => p.created_at.startsWith(today)).length ?? 0
  const newCarsToday = cars?.filter(c => c.created_at.startsWith(today)).length ?? 0

  // ── Growth data (last 14 days) ───────────────────────────────
  const growth: GrowthPoint[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    growth.push({
      date: dateStr,
      users: profiles?.filter(p => p.created_at.startsWith(dateStr)).length ?? 0,
      cars: cars?.filter(c => c.created_at.startsWith(dateStr)).length ?? 0,
    })
  }

  // ── Users list ───────────────────────────────────────────────
  const adminUsers: AdminUser[] = (profiles ?? []).map(p => ({
    id: p.id,
    full_name: p.full_name,
    email: emailMap.get(p.id) ?? '',
    phone: p.phone,
    role: p.role,
    is_admin: p.is_admin ?? false,
    created_at: p.created_at,
    car_count: carCountMap.get(p.id) ?? 0,
  }))

  // ── Cars list ────────────────────────────────────────────────
  const adminCars: AdminCar[] = (cars ?? []).map(c => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    brand: c.brand,
    price_vnd: c.price_vnd,
    year: c.year,
    status: c.status,
    verified: c.verified ?? false,
    created_at: c.created_at,
    seller_name: sellerNameMap.get(c.seller_id) ?? null,
    seller_email: emailMap.get(c.seller_id) ?? '',
    view_count: viewCountMap.get(c.id) ?? 0,
  }))

  // ── KYC list ─────────────────────────────────────────────────
  const adminKyc: AdminKyc[] = (kycRows ?? []).map(k => ({
    id: k.id,
    user_id: k.user_id,
    seller_type: k.seller_type,
    cccd_number: k.cccd_number,
    cccd_name: k.cccd_name,
    cccd_dob: k.cccd_dob,
    cccd_address: k.cccd_address,
    cccd_front_path: k.cccd_front_path,
    cccd_back_path: k.cccd_back_path,
    business_name: k.business_name,
    business_tax_id: k.business_tax_id,
    business_address: k.business_address,
    business_license_path: k.business_license_path,
    status: k.status,
    reject_reason: k.reject_reason,
    submitted_at: k.submitted_at,
    user_email: emailMap.get(k.user_id) ?? '',
    user_full_name: (profiles ?? []).find(p => p.id === k.user_id)?.full_name ?? null,
  }))

  return {
    stats: {
      totalUsers,
      totalSellers,
      totalBuyers: totalUsers - totalSellers,
      totalCars,
      activeCars,
      soldCars,
      totalViews,
      newUsersToday,
      newCarsToday,
    },
    users: adminUsers,
    cars: adminCars,
    growth,
    kyc: adminKyc,
  }
}
