import { createClient } from '@/lib/supabase/server'
import { formatVND } from '@/lib/utils/format-price'

export interface SellerCar {
  id: string
  slug: string
  title: string
  brand: string
  price_vnd: number
  priceFormatted: string
  year: number
  status: 'draft' | 'active' | 'sold' | 'hidden'
  verified: boolean
  created_at: string
  image_url: string | null
  total_views: number
  views_last_7d: number
}

export interface DashboardStats {
  totalListings: number
  activeListings: number
  soldListings: number
  totalViews: number
  viewsLast7d: number
  totalValue: number
}

export interface DailyViews {
  date: string       // "2026-03-22"
  label: string      // "22/03"
  views: number
}

export interface DashboardData {
  stats: DashboardStats
  cars: SellerCar[]
  viewsByDay: DailyViews[]
  viewsByCar: { name: string; views: number }[]
}

// Raw DB row shape for type-safe mapping
interface CarRow {
  id: string
  slug: string
  title: string
  brand: string
  price_vnd: number
  year: number
  status: string
  verified: boolean
  created_at: string
  car_images: { url: string | null; is_primary: boolean; sort_order: number }[]
}

interface ViewRow {
  car_id: string
  viewed_at: string
}

export async function getDashboardData(sellerId: string): Promise<DashboardData> {
  const supabase = await createClient()

  // 1. Fetch seller's cars with primary image
  const { data: carsRaw } = await supabase
    .from('cars')
    .select(`
      id, slug, title, brand, price_vnd, year, status, verified, created_at,
      car_images(url, is_primary, sort_order)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })

  const cars = (carsRaw ?? []) as unknown as CarRow[]
  const carIds = cars.map((c) => c.id)

  // 2. Fetch all views for seller's cars
  const { data: viewsRaw } = carIds.length > 0
    ? await supabase
        .from('car_views')
        .select('car_id, viewed_at')
        .in('car_id', carIds)
    : { data: [] }

  const views = (viewsRaw ?? []) as ViewRow[]

  // 3. Calculate per-car view counts
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const viewCountMap: Record<string, { total: number; last7d: number }> = {}
  for (const v of views) {
    if (!viewCountMap[v.car_id]) viewCountMap[v.car_id] = { total: 0, last7d: 0 }
    viewCountMap[v.car_id].total++
    if (new Date(v.viewed_at) >= sevenDaysAgo) {
      viewCountMap[v.car_id].last7d++
    }
  }

  // 4. Build SellerCar list
  const sellerCars: SellerCar[] = cars.map((car) => {
    const imgs = (car.car_images ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    )
    const primaryImg = imgs.find((i: { is_primary: boolean }) => i.is_primary) ?? imgs[0]
    const counts = viewCountMap[car.id] ?? { total: 0, last7d: 0 }

    return {
      id: car.id,
      slug: car.slug,
      title: car.title,
      brand: car.brand,
      price_vnd: car.price_vnd,
      priceFormatted: formatVND(car.price_vnd),
      year: car.year,
      status: car.status as SellerCar['status'],
      verified: car.verified,
      created_at: car.created_at,
      image_url: primaryImg?.url ?? null,
      total_views: counts.total,
      views_last_7d: counts.last7d,
    }
  })

  // 5. Stats
  const totalViews = views.length
  const viewsLast7d = views.filter((v) => new Date(v.viewed_at) >= sevenDaysAgo).length

  const stats: DashboardStats = {
    totalListings: cars.length,
    activeListings: cars.filter((c) => c.status === 'active').length,
    soldListings: cars.filter((c) => c.status === 'sold').length,
    totalViews,
    viewsLast7d,
    totalValue: cars
      .filter((c) => c.status === 'active')
      .reduce((sum, c) => sum + c.price_vnd, 0),
  }

  // 6. Views by day (last 14 days)
  const viewsByDay: DailyViews[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
    const dayViews = views.filter((v) => v.viewed_at.slice(0, 10) === dateStr).length
    viewsByDay.push({ date: dateStr, label, views: dayViews })
  }

  // 7. Views by car (top 6)
  const viewsByCar = sellerCars
    .filter((c) => c.total_views > 0)
    .sort((a, b) => b.total_views - a.total_views)
    .slice(0, 6)
    .map((c) => ({
      name: c.title.length > 20 ? c.title.slice(0, 20) + '…' : c.title,
      views: c.total_views,
    }))

  return { stats, cars: sellerCars, viewsByDay, viewsByCar }
}
