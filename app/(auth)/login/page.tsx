"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, ShieldCheck, BookOpen, BrainCircuit, Phone, Users } from "lucide-react";
import { supabase } from "@/app/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState("login"); // 'login', 'register', 'forgot'

  // State Form Register
  const [registerRole, setRegisterRole] = useState("wali");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [childName, setChildName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // State Form Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // State Loading & Error Message
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fungsi Register (Daftar Akun)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // 1. Daftarkan akun ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Masukkan data profil tambahan ke tabel 'profiles'
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

        setSuccessMessage("Registrasi berhasil! Silakan masuk menggunakan akun baru Anda.");
        setTimeout(() => setView("login"), 3000);
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Terjadi kesalahan saat mendaftar.");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Login (Masuk)
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

      if (data.user) {
        // Ambil role pengguna dari tabel profiles untuk diarahkan ke dashboard masing-masing
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const role = profileData?.role;

        // Arahkan ke dashboard sesuai role masing-masing (tanpa kurung siku rute)
        if (role === "admin") router.push("/admin");
        else if (role === "gpk") router.push("/gpk");
        else if (role === "psikolog") router.push("/psikolog");
        else router.push("/wali");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Email atau password salah.");
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden font-sans text-slate-100 py-12">
      {/* Efek Latar Belakang Futuristik */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        
        {/* Sisi Kiri: Deskripsi Sekolah & Logo */}
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-white/10 p-2 rounded-xl border border-white/20 backdrop-blur-sm shadow-lg">
              <Image src="/logo.png" alt="Logo SD Islam Roushon Fikr" fill className="object-contain p-1" />
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
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs">
                {successMessage}
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* === LOGIN FORM === */}
              {view === "login" && (
                <motion.form key="login" onSubmit={handleLogin} variants={fadeIn} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">Selamat Datang</h3>
                    <p className="text-slate-400 text-sm">Masuk untuk mengakses dashboard Anda</p>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        type="email" 
                        placeholder="Email Terdaftar" 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 text-sm" 
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        type="password" 
                        placeholder="Password" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 text-sm" 
                      />
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setView("forgot")} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Lupa Password?</button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {loading ? "Memproses..." : <>Masuk <ArrowRight className="w-4 h-4" /></>}
                  </button>

                  <div className="text-center mt-4 text-sm text-slate-400">
                    Belum punya akun? <button type="button" onClick={() => setView("register")} className="text-blue-400 font-semibold hover:underline">Daftar sekarang</button>
                  </div>
                </motion.form>
              )}

              {/* === REGISTER FORM === */}
              {view === "register" && (
                <motion.form key="register" onSubmit={handleRegister} variants={fadeIn} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">Buat Akun</h3>
                    <p className="text-slate-400 text-sm">Daftar sebagai pengguna baru SDIRF</p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Daftar Sebagai</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <select 
                          value={registerRole}
                          onChange={(e) => setRegisterRole(e.target.value)}
                          className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer text-sm"
                        >
                          <option value="wali">Wali Siswa (Orang Tua)</option>
                          <option value="gpk">Guru Pendamping Khusus (GPK)</option>
                          <option value="psikolog">Psikolog</option>
                          <option value="admin">Admin Sekolah</option>
                        </select>
                      </div>
                    </div>

                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        type="text" 
                        placeholder="Nama Lengkap & Gelar" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 text-sm" 
                      />
                    </div>

                    {registerRole === "wali" && (
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 w-5 h-5" />
                          <input 
                            type="text" 
                            placeholder="Nama Lengkap Anak (Siswa ABK)" 
                            value={childName}
                            onChange={(e) => setChildName(e.target.value)}
                            required
                            className="w-full bg-slate-900/50 border border-emerald-500/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-500 text-sm" 
                          />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 w-5 h-5" />
                          <input 
                            type="tel" 
                            placeholder="Nomor WhatsApp Aktif" 
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            required
                            className="w-full bg-slate-900/50 border border-emerald-500/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-500 text-sm" 
                          />
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        type="email" 
                        placeholder="Email Aktif" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 text-sm" 
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        type="password" 
                        placeholder="Buat Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 text-sm" 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
                  >
                    {loading ? "Memproses..." : <>Daftar Akun SDIRF <ArrowRight className="w-4 h-4" /></>}
                  </button>

                  <div className="text-center text-sm text-slate-400">
                    Sudah punya akun? <button type="button" onClick={() => setView("login")} className="text-blue-400 font-semibold hover:underline">Masuk di sini</button>
                  </div>
                </motion.form>
              )}

              {/* === FORGOT PASSWORD FORM === */}
              {view === "forgot" && (
                <motion.div key="forgot" variants={fadeIn} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">Lupa Password?</h3>
                    <p className="text-slate-400 text-sm">Masukkan email Anda untuk menerima link reset</p>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input type="email" placeholder="Email Terdaftar" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500" />
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm">
                    Kirim Link Reset <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center mt-4 text-sm text-slate-400">
                    Ingat password Anda? <button onClick={() => setView("login")} className="text-blue-400 font-semibold hover:underline">Kembali ke Login</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
      </div>
    </div>
  );
}