import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true, // Pastikan true agar sesi disimpan
      autoRefreshToken: true, // Otomatis memperbarui token jika expired
      detectSessionInUrl: true,
    },
  }
);