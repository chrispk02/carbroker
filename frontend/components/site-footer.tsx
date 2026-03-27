"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

export function SiteFooter() {
  const { locale, dictionary: t } = useLocale();

  // Localized paths
  const buyPath = locale === "vi" ? `/${locale}/mua-xe` : `/${locale}/buy-cars`;
  const sellPath = locale === "vi" ? `/${locale}/ban-xe` : `/${locale}/sell-cars`;

  return (
    <footer className="border-t bg-card py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-6">
            <Link href={`/${locale}`} className="font-semibold text-foreground">
              {t.footer.copyright}
            </Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href={buyPath} className="hover:text-foreground">
                {t.nav.buyCars}
              </Link>
              <Link href={sellPath} className="hover:text-foreground">
                {t.nav.sellCars}
              </Link>
            </nav>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 {t.footer.copyright}. {t.footer.allRightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
}
