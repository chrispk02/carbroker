import { Suspense } from "react"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import type { Locale } from "@/lib/i18n/config"
import { createClient } from "@/lib/supabase/server"
import { ProfileContent } from "@/components/pages/profile-content"

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân - CarBroker",
  description: "Xem và cập nhật thông tin tài khoản CarBroker.",
}

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/auth`)
  }

  // Fetch profile from DB
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, role, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <Suspense>
      <ProfileContent
        userId={user.id}
        email={user.email ?? ''}
        initialFullName={profile?.full_name ?? user.user_metadata?.full_name ?? ''}
        initialPhone={profile?.phone ?? ''}
        initialRole={(profile?.role ?? user.user_metadata?.role ?? 'buyer') as 'buyer' | 'seller'}
        initialAvatarUrl={profile?.avatar_url ?? null}
        createdAt={user.created_at}
        phoneConfirmedAt={user.phone_confirmed_at ?? null}
      />
    </Suspense>
  )
}
