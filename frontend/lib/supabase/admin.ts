import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Admin client — chỉ dùng trong Server Actions và API Routes
// TUYỆT ĐỐI KHÔNG import file này trong Client Components
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
