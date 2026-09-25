"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Memeriksa sesi Anda...");
  const [canUpdate, setCanUpdate] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      // Karena kita menggunakan Route Callback (PKCE), token dari email 
      // sudah otomatis diubah menjadi sesi aktif (cookies).
      // Kita hanya perlu memastikan sesinya benar-benar ada.
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setStatus("Sesi valid! Silakan masukkan password baru Anda.");
        setCanUpdate(true);
      } else {
        setStatus("Sesi tidak ditemukan atau kedaluwarsa. Silakan minta tautan baru.");
      }
    };

    checkSession();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Perbarui password user yang sedang memiliki sesi aktif
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert("Gagal: " + error.message);
    } else {
      alert("Password berhasil diubah!");
      
      // Opsional: Sign out otomatis setelah ubah password agar user login ulang pakai password baru
      await supabase.auth.signOut(); 
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
        <h2 className="text-white font-bold text-xl mb-4 text-center">Atur Kata Sandi Baru</h2>
        
        {!canUpdate && (
          <p className="text-red-400 text-xs text-center mb-6 font-semibold">{status}</p>
        )}
        
        {canUpdate && (
          <>
            <p className="text-emerald-400 text-xs text-center mb-6 font-semibold">{status}</p>
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-3 rounded-xl bg-slate-950 text-white border border-slate-700 text-sm focus:border-blue-500 outline-none"
                placeholder="Masukkan password baru"
                required 
                minLength={6}
              />
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 transition-colors text-white py-3 rounded-xl font-bold text-sm">
                {loading ? "Menyimpan..." : "Simpan Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}