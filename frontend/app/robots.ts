import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://carbroker.vn'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/vi/dashboard', '/en/dashboard', '/vi/admin', '/en/admin'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
