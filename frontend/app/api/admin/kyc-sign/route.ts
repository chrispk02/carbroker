import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Returns signed URLs for KYC documents — admin only
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const paths = request.nextUrl.searchParams.getAll("path").filter(Boolean)
  if (!paths.length) return NextResponse.json({ urls: {} })

  const admin = createAdminClient()
  const urls: Record<string, string> = {}

  await Promise.all(
    paths.map(async (path) => {
      const { data } = await admin.storage
        .from("kyc-documents")
        .createSignedUrl(path, 300) // 5-minute expiry
      if (data?.signedUrl) urls[path] = data.signedUrl
    })
  )

  return NextResponse.json({ urls })
}
