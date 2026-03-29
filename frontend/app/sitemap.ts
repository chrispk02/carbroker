import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://carbroker.vn'
const LOCALES = ['vi', 'en'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Fetch active car slugs
  const { data: cars } = await supabase
    .from('cars')
    .select('slug, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(500)

  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) => [
    {
      url: `${BASE_URL}/${locale}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/${locale}/${locale === 'vi' ? 'mua-xe' : 'buy-cars'}`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/${locale}/${locale === 'vi' ? 'ban-xe' : 'sell-cars'}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/${locale}/auth`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ])

  const carRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    (cars ?? []).map((car) => ({
      url: `${BASE_URL}/${locale}/${locale === 'vi' ? 'xe' : 'car'}/${car.slug}`,
      lastModified: new Date(car.updated_at ?? now),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  )

  return [...staticRoutes, ...carRoutes]
}
