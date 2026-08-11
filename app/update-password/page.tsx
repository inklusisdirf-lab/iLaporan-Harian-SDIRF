"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Memvalidasi token...");

  useEffect(() => {
    // Kita menangani verifikasi di sisi klien menggunakan token_hash
    const handleToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (error) {
          setStatus("Token tidak valid: " + error.message);
        } else {
          setStatus("Token valid! Silakan masukkan password baru Anda.");
        }
      } else {
        setStatus("Tautan tidak valid. Silakan minta link reset baru.");
      }
    };
    handleToken();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert("Gagal: " + error.message);
    } else {
      alert("Password berhasil diubah!");
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
        <h2 className="text-white font-bold text-xl mb-4 text-center">Set Password Baru</h2>
        <p className="text-slate-400 text-xs text-center mb-6">{status}</p>
        
        {status === "Token valid! Silakan masukkan password baru Anda." && (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-3 rounded-xl bg-slate-950 text-white border border-slate-700 text-sm"
              placeholder="Masukkan password baru"
              required 
              minLength={6}
            />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm">
              {loading ? "Menyimpan..." : "Simpan Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}