import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, type Locale, routeMappings } from "@/lib/i18n/config";
import { updateSession } from "@/lib/supabase/middleware";

function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
    return segments[0] as Locale;
  }
  return null;
}

function getPreferredLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value as Locale;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon")
  ) {
    return NextResponse.next();
  }

  // Refresh Supabase session
  await updateSession(request);

  const pathnameLocale = getLocaleFromPathname(pathname);

  if (!pathnameLocale) {
    const preferredLocale = getPreferredLocale(request);
    const segments = pathname.split("/").filter(Boolean);
    const localizedSegments = segments.map((segment) => {
      const mapping = routeMappings[segment];
      return mapping ? mapping[preferredLocale] : segment;
    });
    const newPath = `/${preferredLocale}${localizedSegments.length > 0 ? `/${localizedSegments.join("/")}` : ""}`;
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Correct route segments for locale
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

  const response = NextResponse.next();
  response.cookies.set("NEXT_LOCALE", pathnameLocale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
