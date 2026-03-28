import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  // Auth check — only admins
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { kycId, action, rejectReason } = await request.json() as {
    kycId: string
    action: "approve" | "reject"
    rejectReason?: string
  }

  if (!kycId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 })
  }
  if (action === "reject" && !rejectReason?.trim()) {
    return NextResponse.json({ error: "Reject reason required" }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from("seller_kyc")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      reject_reason: action === "reject" ? rejectReason!.trim() : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", kycId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
