import { redirect } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"
import { createClient } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SellerKycForm } from "@/components/seller-kyc-form"

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export default async function XacMinhPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/auth?returnUrl=/${locale}/xac-minh`)

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // Only sellers need KYC
  if (profile?.role !== "seller") redirect(`/${locale}`)

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Xác minh người bán</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xác minh danh tính để bắt đầu đăng tin bán xe
          </p>
        </div>
        <SellerKycForm />
      </main>
      <SiteFooter />
    </>
  )
}
