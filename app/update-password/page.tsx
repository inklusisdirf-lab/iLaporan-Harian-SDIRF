"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // updateUser akan otomatis mendeteksi token dari URL hash
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Password berhasil diperbarui!");
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <form onSubmit={handleUpdate} className="bg-white/10 p-8 rounded-3xl w-full max-w-sm text-center">
        <h2 className="text-white text-xl font-bold mb-4">Password Baru</h2>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="w-full p-3 rounded-xl mb-4 bg-slate-900 text-white border border-slate-700"
          placeholder="Minimal 6 karakter"
          required 
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
          {loading ? "Memproses..." : "Simpan Password"}
        </button>
      </form>
    </div>
  );
}