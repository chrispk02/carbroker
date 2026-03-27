import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, type Locale, routeMappings } from "@/lib/i18n/config";

function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
    return segments[0] as Locale;
  }
  return null;
}

function getPreferredLocale(request: NextRequest): Locale {
  // Check cookie first
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value as Locale;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim().substring(0, 2))
      .find((lang) => locales.includes(lang as Locale)) as Locale | undefined;
    
    if (preferredLocale) {
      return preferredLocale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon")
  ) {
    return NextResponse.next();
  }

  const pathnameLocale = getLocaleFromPathname(pathname);
  
  // If no locale in pathname, redirect to preferred locale
  if (!pathnameLocale) {
    const preferredLocale = getPreferredLocale(request);
    
    // Map any route segments to the correct locale
    const segments = pathname.split("/").filter(Boolean);
    const localizedSegments = segments.map((segment) => {
      const mapping = routeMappings[segment];
      return mapping ? mapping[preferredLocale] : segment;
    });
    
    const newPath = `/${preferredLocale}${localizedSegments.length > 0 ? `/${localizedSegments.join("/")}` : ""}`;
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Check if route segments match the locale (e.g., prevent /vi/buy-cars, should be /vi/mua-xe)
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 1) {
    const locale = segments[0] as Locale;
    const routeSegments = segments.slice(1);
    
    const correctedSegments = routeSegments.map((segment) => {
      const mapping = routeMappings[segment];
      if (mapping && mapping[locale] !== segment) {
        return mapping[locale];
      }
      return segment;
    });
    
    const correctedPath = `/${locale}/${correctedSegments.join("/")}`;
    if (correctedPath !== pathname) {
      return NextResponse.redirect(new URL(correctedPath, request.url));
    }
  }

  // Set locale cookie for future requests
  const response = NextResponse.next();
  response.cookies.set("NEXT_LOCALE", pathnameLocale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
  
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
