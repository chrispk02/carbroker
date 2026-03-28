import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Admin client — chỉ dùng trong Server Actions và API Routes
// TUYỆT ĐỐI KHÔNG import file này trong Client Components
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      global: {
        headers: {
          // Required for GoTrue admin API (auth.admin.*) to use service role
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )
}
