"use client";

import { useState } from "react";
import { supabase } from "@/app/utils/supabase/client";
import { KeyRound, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    // Mengambil domain website saat ini secara otomatis (bisa localhost atau Vercel)
    const redirectTo = `${window.location.origin}/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Instruksi pemulihan password telah dikirim ke email Anda. Silakan cek inbox/spam.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
        
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3.5 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Lupa Kata Sandi</h1>
          <p className="text-xs text-slate-400">Masukkan email Anda untuk menerima tautan pemulihan kata sandi.</p>
        </div>

        {message && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs font-semibold text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-200 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase">Email Akun</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type="email" 
                placeholder="nama@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-blue-500" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center"
          >
            {loading ? "Mengirim..." : "Kirim Tautan Pemulihan"}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Halaman Login
          </Link>
        </div>

      </div>
    </div>
  );
}