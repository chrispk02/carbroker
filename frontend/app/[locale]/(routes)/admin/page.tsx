import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/server'
import { getAdminData, getSiteConfig } from '@/lib/supabase/queries/admin'
import { AdminContent } from '@/components/pages/admin-content'

export const metadata: Metadata = {
  title: 'Admin Dashboard - CarBroker',
}

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect(`/${locale}`)

  const [data, siteConfig] = await Promise.all([getAdminData(), getSiteConfig()])

  return <AdminContent data={data} siteConfig={siteConfig} />
}
