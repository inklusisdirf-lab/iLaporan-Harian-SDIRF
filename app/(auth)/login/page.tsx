"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, BookOpen, BrainCircuit, ShieldCheck, KeyRound, Users, Phone } from "lucide-react";
import { supabase } from "@/app/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErrorMessage(error.message); setLoading(false); return; }
    
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user!.id).single();
    if (profile?.role === "admin") router.push("/admin");
    else if (profile?.role === "gpk") router.push("/gpk");
    else if (profile?.role === "psikolog") router.push("/psikolog");
    else router.push("/wali");
  };

  return (
    <div translate="no" className="notranslate min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center relative overflow-hidden py-12 px-4">
      {/* Background Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full" />

      <div className="container mx-auto z-10 flex flex-col lg:flex-row items-center gap-12 max-w-6xl">
        
        {/* SISI KIRI: DESKRIPSI & INFO */}
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="hidden lg:flex lg:w-1/2 flex-col gap-6">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 w-fit">
            <div className="relative w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center">
              <Image src="/images/logo.png" alt="Logo" width={48} height={48} className="object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-400">SD Islam Roushon Fikr</h2>
              <p className="text-slate-400 italic text-sm">"Future Islamic Leadership School"</p>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 leading-tight">
            iLaporan Harian SDIRF
          </h1>
          <p className="text-slate-300 leading-relaxed text-lg">
            Sistem terpadu untuk Guru, Orang Tua, dan Psikolog dalam memantau perkembangan ananda tercinta di bawah naungan <strong>Bidang Inklusi dan Layanan ABK</strong>.
          </p>
          <div className="grid gap-4 mt-4">
            <div className="flex items-center gap-3 text-sm text-slate-200 bg-white/5 p-4 rounded-2xl border border-white/5">
              <BookOpen className="w-6 h-6 text-blue-400" /> Memantau Laporan Harian & Asesmen Awal
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-200 bg-white/5 p-4 rounded-2xl border border-white/5">
              <BrainCircuit className="w-6 h-6 text-purple-400" /> Mencatat progres Pendampingan ABK yang terstruktur
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-200 bg-white/5 p-4 rounded-2xl border border-white/5">
              <ShieldCheck className="w-6 h-6 text-emerald-400" /> Pengajuan & Persetujuan Program PPI
            </div>
          </div>
        </motion.div>

        {/* SISI KANAN: LOGIN BOX */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl">
          {errorMessage && <div className="mb-4 p-3 bg-red-500/20 text-red-200 text-xs rounded-xl text-center">{errorMessage}</div>}
          
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-center text-white mb-2">Masuk</h2>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}