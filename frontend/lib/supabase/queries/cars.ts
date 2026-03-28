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

export async function getActiveCars(): Promise<Car[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cars')
    .select(CAR_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[cars:getActiveCars]', error.message)
    return []
  }
  return (data ?? []).map(mapDBCar)
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
