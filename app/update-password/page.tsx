"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";
import { KeyRound, ShieldCheck } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert("Gagal memperbarui password: " + error.message);
      setLoading(false);
    } else {
      setMessage("Password berhasil diperbarui! Mengalihkan ke halaman login...");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  };

  return (
    <div translate="no" className="notranslate min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-3 text-blue-400">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white">Buat Password Baru</h1>
          <p className="text-xs text-slate-400 mt-1">Masukkan kata sandi baru untuk akun Anda.</p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs text-center font-semibold">
            {message}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase">Password Baru</label>
            <input 
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
          >
            {loading ? "Menyimpan..." : <><ShieldCheck className="w-4 h-4" /> Simpan Password Baru</>}
          </button>
        </form>
      </div>
    </div>
  );
}