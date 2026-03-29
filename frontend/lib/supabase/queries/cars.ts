import { createClient } from '@/lib/supabase/server'
import type { Car } from '@/lib/data/cars'

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDBCar(row: any): Car {
  const images: { src: string; alt: string }[] = (row.car_images ?? [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((img: any) => ({
      src: img.url ?? PLACEHOLDER_IMAGE,
      alt: row.title,
    }))

  if (images.length === 0) {
    images.push({ src: PLACEHOLDER_IMAGE, alt: row.title })
  }

  const features: string[] = (row.car_features ?? []).map((f: any) => f.feature)

  return {
    id: row.id,
    slug: row.slug,
    name: row.title,
    brand: row.brand,
    model: row.model,
    variant: row.variant ?? '',
    priceVND: row.price_vnd,
    year: row.year,
    mileageKm: row.mileage_km ?? 0,
    fuel: row.fuel ?? '',
    transmission: row.transmission ?? '',
    color: row.color ?? '',
    location: row.location ?? '',
    status: (row.status as 'active' | 'sold') ?? 'active',
    verified: row.verified ?? false,
    images,
    description: row.description ?? '',
    features,
    seller: {
      name: 'Người bán',
      location: row.location ?? '',
      memberSince: new Date(row.created_at ?? Date.now()).getFullYear().toString(),
      isVerified: false,
    },
  }
}

const CAR_SELECT = `
  id, slug, title, brand, model, variant,
  price_vnd, year, mileage_km, fuel, transmission,
  color, location, description, status, verified, created_at,
  car_images(url, storage_path, is_primary, sort_order),
  car_features(feature)
`

export const PAGE_SIZE = 12

export interface CarFilters {
  search?: string
  brand?: string
  fuelType?: string
  priceRange?: string   // "0-500" | "500-1000" | "1000-2000" | "2000+"
  page?: number
}

export async function getActiveCars(filters: CarFilters = {}): Promise<{ cars: Car[]; total: number }> {
  const supabase = await createClient()
  const { search, brand, fuelType, priceRange, page = 1 } = filters
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('cars')
    .select(CAR_SELECT, { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (brand) query = query.eq('brand', brand)
  if (fuelType) query = query.eq('fuel', fuelType)

  if (priceRange && priceRange !== 'all') {
    const [minStr, maxStr] = priceRange.split('-')
    const min = parseInt(minStr) * 1_000_000
    if (maxStr) {
      const max = parseInt(maxStr) * 1_000_000
      query = query.gte('price_vnd', min).lt('price_vnd', max)
    } else {
      query = query.gte('price_vnd', min)
    }
  }

  // Full-text search via ilike on title (Supabase free tier doesn't always have FTS)
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[cars:getActiveCars]', error.message)
    return { cars: [], total: 0 }
  }
  return { cars: (data ?? []).map(mapDBCar), total: count ?? 0 }
}

export async function getCarBySlugFromDB(slug: string): Promise<Car | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cars')
    .select(CAR_SELECT)
    .eq('slug', slug)
    .single()

  if (error) return null
  return mapDBCar(data)
}

export async function getFeaturedCars(limit = 6): Promise<Car[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cars')
    .select(CAR_SELECT)
    .eq('status', 'active')
    .eq('verified', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[cars:getFeaturedCars]', error.message)
    return []
  }
  return (data ?? []).map(mapDBCar)
}
