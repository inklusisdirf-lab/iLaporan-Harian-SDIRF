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

    // KUNCI: Supabase SDK secara otomatis akan membaca token dari URL hash
    // tanpa perlu mengirim apikey manual.
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Password berhasil diubah!");
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form onSubmit={handleUpdate} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm">
        <h2 className="text-white font-bold mb-4">Set Password Baru</h2>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="w-full p-3 rounded-xl bg-slate-950 text-white border border-slate-700 mb-4"
          placeholder="Password baru"
          required 
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
          {loading ? "Menyimpan..." : "Simpan Password"}
        </button>
      </form>
    </div>
  );
}