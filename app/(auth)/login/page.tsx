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
        setSuccessMessage("Registrasi berhasil! Silakan masuk.");
        setTimeout(() => setView("login"), 3000);
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
  
  try {
    // Kita tambahkan '#' agar Supabase mengirim token sebagai fragmen URL, 
    // bukan sebagai parameter URL yang salah sasaran ke API.
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: "https://i-laporan-harian-sdirf.vercel.app/update-password",
    });

    if (error) throw error;
    setSuccessMessage("Tautan pemulihan telah dikirim ke email Anda.");
  } catch (error: any) {
    setErrorMessage(error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div translate="no" className="notranslate min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
        
        {errorMessage && <div className="mb-4 p-3 bg-red-500/20 text-red-200 text-xs rounded-xl">{errorMessage}</div>}
        {successMessage && <div className="mb-4 p-3 bg-emerald-500/20 text-emerald-200 text-xs rounded-xl">{successMessage}</div>}

        <AnimatePresence mode="wait">
          {view === "login" && (
            <motion.form key="login" onSubmit={handleLogin} className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-white text-center mb-4">Masuk</h2>
              <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" required />
              <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" required />
              <button type="button" onClick={() => setView("forgot")} className="text-sm text-blue-400 text-right">Lupa Password?</button>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">{loading ? "Loading..." : "Masuk"}</button>
              <p className="text-center text-sm text-slate-400">Belum punya akun? <button type="button" onClick={() => setView("register")} className="text-blue-400">Daftar</button></p>
            </motion.form>
          )}

          {view === "register" && (
            <motion.form key="register" onSubmit={handleRegister} className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold text-white text-center mb-2">Daftar</h2>
              <select value={registerRole} onChange={(e) => setRegisterRole(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white">
                <option value="wali">Wali Siswa</option>
                <option value="gpk">GPK</option>
                <option value="psikolog">Psikolog</option>
              </select>
              <input type="text" placeholder="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" required />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" required />
              <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold">Daftar</button>
              <button type="button" onClick={() => setView("login")} className="text-slate-400 text-sm">Kembali ke Login</button>
            </motion.form>
          )}

          {view === "forgot" && (
            <motion.form key="forgot" onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-white text-center">Reset Password</h2>
              <input type="email" placeholder="Email Terdaftar" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" required />
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Kirim Link Reset</button>
              <button type="button" onClick={() => setView("login")} className="text-slate-400 text-sm">Kembali</button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}