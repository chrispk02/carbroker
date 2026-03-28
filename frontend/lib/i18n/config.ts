export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Route mappings between languages
export const routeMappings: Record<string, Record<Locale, string>> = {
  "buy-cars": {
    en: "buy-cars",
    vi: "mua-xe",
  },
  "mua-xe": {
    en: "buy-cars",
    vi: "mua-xe",
  },
  "sell-cars": {
    en: "sell-cars",
    vi: "ban-xe",
  },
  "ban-xe": {
    en: "sell-cars",
    vi: "ban-xe",
  },
  "auth": {
    en: "auth",
    vi: "auth",
  },
  "car": {
    en: "car",
    vi: "xe",
  },
  "xe": {
    en: "car",
    vi: "xe",
  },
  "verify-seller": {
    en: "verify-seller",
    vi: "xac-minh",
  },
  "xac-minh": {
    en: "verify-seller",
    vi: "xac-minh",
  },
};

// Get the localized path for a given route
export function getLocalizedPath(path: string, locale: Locale): string {
  const segments = path.split("/").filter(Boolean);
  
  // Handle root path
  if (segments.length === 0) {
    return `/${locale}`;
  }
  
  // Map each segment
  const localizedSegments = segments.map((segment) => {
    const mapping = routeMappings[segment];
    return mapping ? mapping[locale] : segment;
  });
  
  return `/${locale}/${localizedSegments.join("/")}`;
}

// Get the canonical (English) path from a localized path
export function getCanonicalPath(path: string, locale: Locale): string {
  const segments = path.split("/").filter(Boolean);
  
  // Remove locale prefix if present
  if (locales.includes(segments[0] as Locale)) {
    segments.shift();
  }
  
  // Map Vietnamese routes to English
  const canonicalSegments = segments.map((segment) => {
    const mapping = routeMappings[segment];
    return mapping ? mapping.en : segment;
  });
  
  return `/${canonicalSegments.join("/")}`;
}

// Check if a route segment is valid for a given locale
export function isValidRouteForLocale(segment: string, locale: Locale): boolean {
  const mapping = routeMappings[segment];
  if (!mapping) return true; // Unknown segments are allowed
  return mapping[locale] === segment;
}
