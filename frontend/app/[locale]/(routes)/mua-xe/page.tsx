import type { Metadata } from "next"
import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { BuyCarsContent } from "@/components/pages/buy-cars-content"
import { getActiveCars, PAGE_SIZE, type CarFilters } from "@/lib/supabase/queries/cars"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale)

  return {
    title: dict.meta.buyCarsTitle,
    description: dict.meta.buyCarsDescription,
  }
}

interface PageProps {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function MuaXePage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))

  const filters: CarFilters = {
    search: sp.q ?? '',
    brand: sp.brand ?? '',
    fuelType: sp.fuel ?? '',
    priceRange: sp.price ?? 'all',
    page,
  }

  const { cars, total } = await getActiveCars(filters)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <BuyCarsContent
      cars={cars}
      total={total}
      page={page}
      totalPages={totalPages}
      initialSearch={sp.q ?? ''}
      initialBrand={sp.brand ?? ''}
      initialFuel={sp.fuel ?? ''}
      initialPrice={sp.price ?? 'all'}
    />
  )
}
