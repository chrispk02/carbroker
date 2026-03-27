import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SellCarsContent } from "@/components/pages/sell-cars-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return {
    title: dict.meta.sellCarsTitle,
    description: dict.meta.sellCarsDescription,
  };
}

export default function BanXePage() {
  return <SellCarsContent />;
}
