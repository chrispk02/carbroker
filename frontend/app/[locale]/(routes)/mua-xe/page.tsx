import type { Metadata } from "next"
import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { BuyCarsContent } from "@/components/pages/buy-cars-content"
import { getActiveCars } from "@/lib/supabase/queries/cars"

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

export default async function MuaXePage() {
  const cars = await getActiveCars()
  return <BuyCarsContent cars={cars} />
}
