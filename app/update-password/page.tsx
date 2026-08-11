"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Memvalidasi tautan pemulihan...");
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const verifyTokenHash = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash && type === "recovery") {
        // Tukar token_hash secara langsung dengan sesi pemulihan resmi dari Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (error) {
          setStatus("Tautan kedaluwarsa atau tidak valid. Silakan minta tautan baru.");
          setIsValidToken(false);
        } else {
          setStatus("Tautan valid! Silakan masukkan kata sandi baru Anda.");
          setIsValidToken(true);
          // Bersihkan URL agar token_hash hilang dari address bar demi keamanan
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        setStatus("Tautan tidak valid. Silakan minta link reset password baru.");
        setIsValidToken(false);
      }
    };

    verifyTokenHash();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert("Gagal mengubah kata sandi: " + error.message);
    } else {
      alert("Kata sandi berhasil diubah! Silakan masuk dengan kata sandi baru.");
      await supabase.auth.signOut();
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
        <h2 className="text-white font-bold text-xl mb-4 text-center">Atur Kata Sandi Baru</h2>
        <p className="text-slate-400 text-xs text-center mb-6">{status}</p>
        
        {isValidToken && (
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
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 transition-all text-white py-3 rounded-xl font-bold text-sm shadow-lg">
              {loading ? "Menyimpan..." : "Simpan Kata Sandi"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}