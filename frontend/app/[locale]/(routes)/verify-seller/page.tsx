import { redirect } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"
import { createClient } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SellerKycForm } from "@/components/seller-kyc-form"

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export default async function VerifySellerPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/auth?returnUrl=/${locale}/verify-seller`)

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "seller") redirect(`/${locale}`)

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Seller Verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verify your identity to start listing cars for sale
          </p>
        </div>
        <SellerKycForm />
      </main>
      <SiteFooter />
    </>
  )
}
