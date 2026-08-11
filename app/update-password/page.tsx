"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Memuat sesi pemulihan...");
  const [isReady, setIsReady] = useState(false);

  // Mendengarkan dan memastikan sesi aktif terbaca dari URL hash saat halaman dibuka
  useEffect(() => {
    const checkSession = async () => {
      // Supabase secara otomatis membaca token dari URL (#access_token atau recovery token)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setMessage("Sesi pemulihan tidak valid atau sudah kedaluwarsa. Silakan minta ulang link reset password.");
        setIsReady(false);
      } else {
        setMessage("");
        setIsReady(true);
      }
    };

    checkSession();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert("Gagal mengubah password: " + error.message);
    } else {
      alert("Password berhasil diubah! Silakan masuk dengan password baru.");
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
        <h2 className="text-white font-bold text-xl mb-4 text-center">Set Password Baru</h2>
        
        {message && (
          <div className={`p-3 rounded-xl text-xs mb-4 text-center ${isReady ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'}`}>
            {message}
          </div>
        )}

        {isReady && (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-3 rounded-xl bg-slate-950 text-white border border-slate-700 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Masukkan password baru"
              required 
              minLength={6}
            />
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg"
            >
              {loading ? "Menyimpan..." : "Simpan Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}