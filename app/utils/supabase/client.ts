import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Memastikan sesi disimpan di perangkat
    autoRefreshToken: true, // Otomatis memperbarui token agar tidak kedaluwarsa
    detectSessionInUrl: true, // Mendeteksi token dari URL (penting untuk login/reset password)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined, // Menyimpan ke LocalStorage HP
  },
})