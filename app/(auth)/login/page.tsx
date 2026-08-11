"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, ShieldCheck, BookOpen, BrainCircuit, Phone, Users, KeyRound } from "lucide-react";
import { supabase } from "@/app/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState("login"); // 'login', 'register', 'forgot'

  const [registerRole, setRegisterRole] = useState("wali");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [childName, setChildName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Memastikan link konfirmasi email diarahkan kembali ke halaman login website Anda
          emailRedirectTo: "https://i-laporan-harian-sdirf.vercel.app/login",
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: authData.user.id,
            full_name: fullName,
            role: registerRole,
            nomor_wa: registerRole === "wali" ? whatsapp : null,
            info_anak: registerRole === "wali" ? childName : null,
          },
        ]);

        if (profileError) throw profileError;
        setSuccessMessage("Registrasi berhasil! Silakan cek email Anda untuk verifikasi.");
      }
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user!.id)
        .single();

      const role = profileData?.role;
      if (role === "admin") router.push("/admin");
      else if (role === "gpk") router.push("/gpk");
      else if (role === "psikolog") router.push("/psikolog");
      else router.push("/wali");
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `https://i-laporan-harian-sdirf.vercel.app/update-password`,
      });

      if (error) throw error;
      setSuccessMessage("Tautan pemulihan telah dikirim ke email Anda.");
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div translate="no" className="notranslate min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden font-sans text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Efek Latar Belakang Futuristik */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full" />
      
      <div className="container mx-auto z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-24 max-w-7xl">
        
        {/* Sisi Kiri: Deskripsi Sekolah & Logo */}
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-white/10 p-2 rounded-xl border border-white/20 backdrop-blur-sm shadow-lg flex items-center justify-center">
              <Image src="/images/logo.png" alt="Logo SD Islam Roushon Fikr" width={64} height={64} className="object-contain p-1" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-blue-400 tracking-wider uppercase mb-1">SD Islam Roushon Fikr</h2>
              <p className="text-sm md:text-base text-slate-400 italic">"Future Islamic Leadership School"</p>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 leading-tight">
            iLaporan Harian SDIRF
          </h1>
          
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mt-4 shadow-xl">
            <p className="text-slate-300 leading-relaxed text-sm md:text-base mb-4">
              Aplikasi ini berada di bawah naungan <strong>Bidang Inklusi dan Layanan ABK</strong>. 
              Sistem ini dirancang khusus sebagai jembatan penghubung yang transparan dan interaktif antara <strong>Guru Pendamping Khusus (GPK)</strong>, <strong>Wali Siswa</strong>, dan <strong>Psikolog</strong>.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-sm text-slate-200 bg-white/5 p-3 rounded-xl border border-white/5">
                <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0" /> 
                <span>Memantau Laporan Harian per mata pelajaran & Asesmen Awal</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-200 bg-white/5 p-3 rounded-xl border border-white/5">
                <BrainCircuit className="w-5 h-5 text-purple-400 flex-shrink-0" /> 
                <span>Mencatat progres Program Pendampingan ABK yang terstruktur</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-200 bg-white/5 p-3 rounded-xl border border-white/5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" /> 
                <span>Pengajuan & Persetujuan Program Pembelajaran Individual (PPI)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sisi Kanan: Kartu Form Interaktif */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full" />
            
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs text-center font-semibold">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs text-center font-semibold">
                {successMessage}
              </div>
            )}

            <AnimatePresence mode="wait">
              {view === "login" && (
                <motion.form key="login" onSubmit={handleLogin} variants={fadeIn} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4">
                  <h2 className="text-2xl font-bold text-white text-center mb-4">Masuk</h2>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm" required />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm" required />
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setView("forgot"); setErrorMessage(""); setSuccessMessage(""); }} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" /> Lupa Password?
                    </button>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg">{loading ? "Loading..." : "Masuk"}</button>
                  <p className="text-center text-sm text-slate-400 mt-2">Belum punya akun? <button type="button" onClick={() => { setView("register"); setErrorMessage(""); setSuccessMessage(""); }} className="text-blue-400 font-semibold hover:underline">Daftar</button></p>
                </motion.form>
              )}

              {view === "register" && (
                <motion.form key="register" onSubmit={handleRegister} variants={fadeIn} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-3">
                  <h2 className="text-2xl font-bold text-white text-center mb-2">Daftar</h2>
                  <select value={registerRole} onChange={(e) => setRegisterRole(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm">
                    <option value="wali">Wali Siswa</option>
                    <option value="gpk">GPK</option>
                    <option value="psikolog">Psikolog</option>
                  </select>
                  <input type="text" placeholder="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" required />
                  
                  {registerRole === "wali" && (
                    <>
                      <input type="text" placeholder="Nama Anak (Siswa ABK)" value={childName} onChange={(e) => setChildName(e.target.value)} className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl p-3 text-white text-sm" required />
                      <input type="tel" placeholder="Nomor WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl p-3 text-white text-sm" required />
                    </>
                  )}

                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" required />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" required minLength={6} />
                  
                  <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg mt-2">Daftar</button>
                  <button type="button" onClick={() => { setView("login"); setErrorMessage(""); setSuccessMessage(""); }} className="text-slate-400 text-sm mt-1">Kembali ke Login</button>
                </motion.form>
              )}

              {view === "forgot" && (
                <motion.form key="forgot" onSubmit={handleForgotPassword} variants={fadeIn} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4">
                  <h2 className="text-2xl font-bold text-white text-center">Reset Password</h2>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input type="email" placeholder="Email Terdaftar" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm" required />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg">{loading ? "Mengirim..." : "Kirim Link Reset"}</button>
                  <button type="button" onClick={() => { setView("login"); setErrorMessage(""); setSuccessMessage(""); }} className="text-slate-400 text-sm">Kembali</button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
        
      </div>
    </div>
  );
}