import { createBrowserClient } from '@supabase/ssr' // atau createClient dari '@supabase/supabase-js' tergantung setup Anda

// Jika menggunakan @supabase/ssr (Rekomendasi Next.js):
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
)