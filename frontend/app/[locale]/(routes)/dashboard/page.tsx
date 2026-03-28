import { redirect } from "next/navigation"
import type { Metadata } from "next"
import type { Locale } from "@/lib/i18n/config"
import { createClient } from "@/lib/supabase/server"
import { getDashboardData } from "@/lib/supabase/queries/dashboard"
import { DashboardContent } from "@/components/pages/dashboard-content"

export const metadata: Metadata = {
  title: "Dashboard - CarBroker",
  description: "Quản lý tin đăng và xem phân tích dữ liệu.",
}

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createClient()

  // Auth check — redirect nếu chưa đăng nhập
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/auth`)
  }

  // Seller check — chỉ người bán mới xem dashboard phân tích
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? user.user_metadata?.role ?? 'buyer'
  if (role !== 'seller') {
    redirect(`/${locale}/profile?notice=seller_required`)
  }

  const data = await getDashboardData(user.id)
  const userName =
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Người dùng'

  return <DashboardContent data={data} userName={userName} />
}
