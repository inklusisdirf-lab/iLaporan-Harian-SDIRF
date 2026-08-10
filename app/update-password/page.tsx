"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Penting: Supabase perlu menangkap session dari URL (hash)
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // User diizinkan untuk mengganti password
      }
    });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Password berhasil diubah!");
      window.location.href = "/login";
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <form onSubmit={handleUpdate} className="w-full max-w-sm space-y-4 bg-white p-6 rounded-2xl">
        <h2 className="text-xl font-bold">Masukkan Password Baru</h2>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="w-full p-2 border rounded" 
          required 
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}