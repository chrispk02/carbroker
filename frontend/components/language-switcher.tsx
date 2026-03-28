"use client";

import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/i18n/locale-context";
import { locales, type Locale, getLocalizedPath, getCanonicalPath } from "@/lib/i18n/config";

const languageLabels: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
};

const languageFlags: Record<Locale, string> = {
  en: "EN",
  vi: "VI",
};

export function LanguageSwitcher() {
  const { locale } = useLocale();
  const pathname = usePathname();

  const switchLanguage = (newLocale: Locale) => {
    if (newLocale === locale) return;
    // Hard navigation ensures server re-renders layout with new locale + dictionary
    const canonicalPath = getCanonicalPath(pathname, locale);
    const newPath = getLocalizedPath(canonicalPath, newLocale);
    window.location.href = newPath;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="size-4" />
          <span>{languageFlags[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => switchLanguage(lang)}
            className={locale === lang ? "bg-secondary" : ""}
          >
            <span className="mr-2 font-medium">{languageFlags[lang]}</span>
            {languageLabels[lang]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
