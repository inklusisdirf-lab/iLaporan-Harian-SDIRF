"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";
import { 
  ShieldCheck, LogOut, Users, BookOpen, FileText, 
  UserCheck, Printer, Plus, Trash2, Edit3, X, Eye, Save, BrainCircuit
} from "lucide-react";
import { useReactToPrint } from "react-to-print";

export default function AdminDashboard() {
  const router = useRouter();
  const componentRef = useRef(null); // Ref untuk Print PDF Laporan
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState("siswa");
  const [ppiSubTab, setPpiSubTab] = useState("asesmen"); // Sub-menu untuk tab PPI & Asesmen

  // State Filter Laporan Harian
  const [filterNama, setFilterNama] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [tglMulai, setTglMulai] = useState("");
  const [tglSelesai, setTglSelesai] = useState("");

  // State Data dari Supabase
  const [students, setStudents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [ppiList, setPpiList] = useState<any[]>([]);

  // State Modal Detail
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<string>(""); 

  // State Form Tambah/Edit Siswa
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState({
    full_name: "",
    nis: "",
    kelas: "",
    jenis_kebutuhan_khusus: "",
    gpk_id: null as string | null,
    wali_id: null as string | null
  });

  // State Form Edit Role User
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("wali");

  const [message, setMessage] = useState("");

  // Handler Print PDF Laporan
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  useEffect(() => {
    async function checkAdminAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.role !== "admin") {
        router.push("/login");
        return;
      }

      setUserName(profile.full_name);
      fetchAllData();
      setLoading(false);
    }
    checkAdminAuth();
  }, [router]);

  const fetchAllData = async () => {
    const { data: studentData } = await supabase.from("students").select("*");
    if (studentData) setStudents(studentData);

    const { data: userData } = await supabase.from("profiles").select("*");
    if (userData) setUsers(userData);

    const { data: reportData } = await supabase
      .from("daily_reports")
      .select("*, students(full_name)")
      .order("created_at", { ascending: false });
    if (reportData) setReports(reportData);

    const { data: assessData } = await supabase
      .from("assessments")
      .select("*, students(full_name)")
      .order("created_at", { ascending: false });
    if (assessData) setAssessments(assessData);

    const { data: ppiData } = await supabase
      .from("ppi")
      .select("*, students(full_name)")
      .order("created_at", { ascending: false });
    if (ppiData) setPpiList(ppiData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // --- FILTERED REPORTS ---
  const filteredReports = reports.filter(r => {
    const matchNama = filterNama ? r.students?.full_name.toLowerCase().includes(filterNama.toLowerCase()) : true;
    const matchMapel = filterMapel ? r.mata_pelajaran.toLowerCase().includes(filterMapel.toLowerCase()) : true;
    const matchTanggal = (tglMulai && tglSelesai) ? (r.tanggal >= tglMulai && r.tanggal <= tglSelesai) : true;
    return matchNama && matchMapel && matchTanggal;
  });

  // --- CRUD SISWA & PLOTTING GPK/WALI (DENGAN PENANGANAN UUID NULL) ---
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      full_name: studentForm.full_name,
      nis: studentForm.nis || null,
      kelas: studentForm.kelas || null,
      jenis_kebutuhan_khusus: studentForm.jenis_kebutuhan_khusus || null,
      gpk_id: studentForm.gpk_id === "" || !studentForm.gpk_id ? null : studentForm.gpk_id,
      wali_id: studentForm.wali_id === "" || !studentForm.wali_id ? null : studentForm.wali_id,
    };

    if (editStudentId) {
      const { error } = await supabase.from("students").update(payload).eq("id", editStudentId);
      if (error) alert("Gagal memperbarui siswa: " + error.message);
      else {
        setMessage("Data siswa berhasil diperbarui!");
        closeStudentModal();
        fetchAllData();
        setTimeout(() => setMessage(""), 4000);
      }
    } else {
      const { error } = await supabase.from("students").insert([payload]);
      if (error) alert("Gagal menambah siswa: " + error.message);
      else {
        setMessage("Siswa baru berhasil ditambahkan!");
        closeStudentModal();
        fetchAllData();
        setTimeout(() => setMessage(""), 4000);
      }
    }
  };

  const handleEditStudent = (s: any) => {
    setEditStudentId(s.id);
    setStudentForm({
      full_name: s.full_name || "",
      nis: s.nis || "",
      kelas: s.kelas || "",
      jenis_kebutuhan_khusus: s.jenis_kebutuhan_khusus || "",
      gpk_id: s.gpk_id || null,
      wali_id: s.wali_id || null
    });
    setShowStudentModal(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data siswa ini?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) alert("Gagal menghapus: " + error.message);
    else {
      setMessage("Siswa berhasil dihapus.");
      fetchAllData();
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setEditStudentId(null);
    setStudentForm({ full_name: "", nis: "", kelas: "", jenis_kebutuhan_khusus: "", gpk_id: null, wali_id: null });
  };

  // --- EDIT ROLE USER ---
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserId) return;

    const { error } = await supabase.from("profiles").update({ role: selectedRole }).eq("id", editUserId);
    if (error) alert("Gagal memperbarui role: " + error.message);
    else {
      setMessage("Role user berhasil diperbarui!");
      setShowUserModal(false);
      setEditUserId(null);
      fetchAllData();
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleOpenEditRole = (u: any) => {
    setEditUserId(u.id);
    setSelectedRole(u.role || "wali");
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Yakin ingin menghapus user ini dari profil?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) alert("Gagal menghapus: " + error.message);
    else {
      setMessage("User berhasil dihapus.");
      fetchAllData();
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Sinkronisasi Data Panel Admin SDIRF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* HEADER UTAMA DENGAN LOGO SEKOLAH & TAGLINE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 border border-white/10 p-5 md:p-6 rounded-3xl backdrop-blur-xl gap-4 shadow-2xl">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-2.5 bg-white rounded-2xl shadow-md flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 border border-white/20">
              <img 
                src="/images/logo.png" 
                alt="Logo SD Islam Roushon Fikr" 
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain" 
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = '<span class="text-xs font-bold text-slate-900 text-center">SD IRF</span>';
                  }
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 truncate">
                Dashboard Admin
              </h1>
              <p className="text-[11px] sm:text-xs font-extrabold tracking-wider text-blue-400 uppercase mt-0.5 mb-1 truncate">
                Future Islamic Leadership School
              </p>
              <p className="text-slate-300 text-xs truncate">
                Bidang Inklusi & Layanan ABK • Kelola Sistem, Siswa & Pengguna
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold flex-shrink-0 shadow-lg"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>

        {message && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-200 text-sm font-semibold text-center">
            {message}
          </div>
        )}

        {/* TAB NAVIGASI UTAMA */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {[
            { id: "siswa", label: "Manajemen Siswa & Plotting", icon: Users },
            { id: "user", label: "Manajemen User & Role", icon: UserCheck },
            { id: "laporan", label: "Rekapitulasi Laporan Harian", icon: BookOpen },
            { id: "ppi", label: "Monitoring Asesmen & PPI", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-medium text-sm transition-all shadow-lg ${
                  isActive 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border border-white/25 shadow-blue-500/20" 
                    : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* KONTEN TAB */}
        <div className="transition-all duration-300">
          
          {/* === TAB 1: MANAJEMEN SISWA & PLOTTING === */}
          {activeTab === "siswa" && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" /> Data Siswa Terdaftar ({students.length})
                </h3>
                <button 
                  onClick={() => { closeStudentModal(); setShowStudentModal(true); }}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Tambah Siswa Baru
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.length === 0 ? (
                  <p className="text-slate-400 text-sm italic col-span-full">Belum ada data siswa. Klik tombol "Tambah Siswa Baru" di atas.</p>
                ) : (
                  students.map((s) => {
                    const assignedGpk = users.find(u => u.id === s.gpk_id);
                    const assignedWali = users.find(u => u.id === s.wali_id);

                    return (
                      <div key={s.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-semibold">{s.kelas || "Kelas Umum"}</span>
                            <span className="text-xs text-slate-400">NIS: {s.nis || "-"}</span>
                          </div>
                          <h4 className="text-lg font-bold text-white mb-1">{s.full_name}</h4>
                          <p className="text-xs text-purple-300 mb-4">Kebutuhan: {s.jenis_kebutuhan_khusus || "Belum diatur"}</p>
                          
                          <div className="space-y-1.5 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                            <p><strong className="text-slate-400">GPK Tertaut:</strong> {assignedGpk?.full_name || "⚠️ Belum ditautkan"}</p>
                            <p><strong className="text-slate-400">Wali Tertaut:</strong> {assignedWali?.full_name || "⚠️ Belum ditautkan"}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-white/10">
                          <button onClick={() => handleEditStudent(s)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" /> Edit / Plotting
                          </button>
                          <button onClick={() => handleDeleteStudent(s.id)} className="p-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-xl">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* === TAB 2: MANAJEMEN USER & EDIT ROLE === */}
          {activeTab === "user" && (
            <div className="flex flex-col gap-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-400" /> Daftar Pengguna Sistem & Hak Akses ({users.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((u) => (
                  <div key={u.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold uppercase">{u.role}</span>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">{u.full_name}</h4>
                      {u.nomor_wa && <p className="text-xs text-emerald-400 mb-1">WA: {u.nomor_wa}</p>}
                      {u.info_anak && <p className="text-xs text-slate-400 mb-4">Info Anak: {u.info_anak}</p>}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-white/10">
                      <button onClick={() => handleOpenEditRole(u)} className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                        <Edit3 className="w-3.5 h-3.5" /> Edit Role
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === TAB 3: REKAPITULASI LAPORAN HARIAN === */}
          {activeTab === "laporan" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" /> Rekapitulasi Laporan Harian GPK ({filteredReports.length})
                </h3>
              </div>

              {/* Panel Filter & Tombol Print */}
              <div className="flex flex-wrap gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 items-center">
                <input 
                  type="text" 
                  placeholder="Filter Nama Siswa..." 
                  value={filterNama} 
                  onChange={(e) => setFilterNama(e.target.value)} 
                  className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white w-full sm:w-48" 
                />
                <input 
                  type="text" 
                  placeholder="Filter Mata Pelajaran..." 
                  value={filterMapel} 
                  onChange={(e) => setFilterMapel(e.target.value)} 
                  className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white w-full sm:w-48" 
                />
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Dari:</span>
                  <input 
                    type="date" 
                    value={tglMulai} 
                    onChange={(e) => setTglMulai(e.target.value)} 
                    className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white" 
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Sampai:</span>
                  <input 
                    type="date" 
                    value={tglSelesai} 
                    onChange={(e) => setTglSelesai(e.target.value)} 
                    className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white" 
                  />
                </div>
                <button 
                  onClick={() => handlePrint()}
                  className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                  <Printer className="w-4 h-4" /> Print PDF / Cetak
                </button>
              </div>

              {/* Grid Laporan Harian */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.length === 0 ? (
                  <p className="text-slate-400 text-sm italic col-span-full">Tidak ada laporan harian yang sesuai dengan filter.</p>
                ) : (
                  filteredReports.map((r) => (
                    <div key={r.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold">{r.mata_pelajaran}</span>
                          <span className="text-xs text-slate-400">{r.tanggal}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1">{r.students?.full_name || "Siswa"}</h4>
                        
                        <div className="space-y-2 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 mt-3">
                          <p><strong className="text-blue-400">Materi:</strong> {r.materi_pembelajaran}</p>
                          <p className="line-clamp-2"><strong className="text-purple-400">Hasil:</strong> {r.hasil_pembelajaran}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => { setSelectedItem(r); setModalType("report"); }}
                        className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                      >
                        <Eye className="w-4 h-4 text-emerald-400" /> Lihat Detail Laporan
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* AREA TERSEMBUNYI UNTUK CETAK PDF/PRINT */}
              <div className="hidden">
                <div ref={componentRef} className="p-8 bg-white text-black font-sans">
                  <div className="text-center border-b-2 border-black pb-4 mb-6">
                    <h2 className="text-2xl font-bold uppercase">SD Islam Roushon Fikr Jombang</h2>
                    <p className="text-sm">Rekapitulasi Laporan Harian Guru Pendamping Khusus (GPK)</p>
                    <p className="text-xs text-gray-600 mt-1">Dicetak pada: {new Date().toLocaleDateString("id-ID")}</p>
                  </div>
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-black p-2">Tanggal</th>
                        <th className="border border-black p-2">Nama Siswa</th>
                        <th className="border border-black p-2">Mata Pelajaran</th>
                        <th className="border border-black p-2">Materi</th>
                        <th className="border border-black p-2">Hasil Pembelajaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((r, idx) => (
                        <tr key={idx}>
                          <td className="border border-black p-2 text-center">{r.tanggal}</td>
                          <td className="border border-black p-2">{r.students?.full_name}</td>
                          <td className="border border-black p-2">{r.mata_pelajaran}</td>
                          <td className="border border-black p-2">{r.materi_pembelajaran}</td>
                          <td className="border border-black p-2">{r.hasil_pembelajaran}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* === TAB 4: MONITORING ASESMEN & PPI === */}
          {activeTab === "ppi" && (
            <div className="flex flex-col gap-6">
              
              {/* Tombol Sub-Menu Asesmen & PPI */}
              <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
                <button 
                  onClick={() => setPpiSubTab("asesmen")} 
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    ppiSubTab === "asesmen" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <BrainCircuit className="w-4 h-4" /> Asesmen Awal ({assessments.length})
                </button>
                <button 
                  onClick={() => setPpiSubTab("ppi")} 
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    ppiSubTab === "ppi" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileText className="w-4 h-4" /> Dokumen PPI ({ppiList.length})
                </button>
              </div>

              {/* Konten Sub-Menu: Asesmen */}
              {ppiSubTab === "asesmen" && (
                <div className="flex flex-col gap-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-purple-400" /> Monitoring Asesmen Awal PDBK
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.length === 0 ? (
                      <p className="text-slate-400 text-sm italic col-span-full">Belum ada data asesmen awal.</p>
                    ) : (
                      assessments.map((a) => (
                        <div key={a.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">Asesmen: {a.tanggal_assessment}</span>
                            </div>
                            <h4 className="text-lg font-bold text-white mb-1">{a.students?.full_name || "Siswa"}</h4>
                            <p className="text-xs text-slate-400 mb-3 line-clamp-2"><strong>Permasalahan:</strong> {a.permasalahan}</p>
                          </div>

                          <button 
                            onClick={() => { setSelectedItem(a); setModalType("assessment"); }}
                            className="w-full bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                          >
                            <Eye className="w-4 h-4" /> Periksa Asesmen
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Konten Sub-Menu: PPI */}
              {ppiSubTab === "ppi" && (
                <div className="flex flex-col gap-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" /> Monitoring Program Pembelajaran Individual (PPI)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ppiList.length === 0 ? (
                      <p className="text-slate-400 text-sm italic col-span-full">Belum ada dokumen PPI.</p>
                    ) : (
                      ppiList.map((p) => (
                        <div key={p.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold uppercase">{p.status}</span>
                            </div>
                            <h4 className="text-lg font-bold text-white mb-1">{p.students?.full_name || "Siswa"}</h4>
                            <p className="text-xs text-slate-400 mb-4">Periode: {p.periode_ppi} ({p.tahun_ajaran})</p>
                            
                            <div className="space-y-1.5 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                              <p>TTD GPK: {p.ttd_gpk ? "✅ Selesai" : "⏳ Menunggu"}</p>
                              <p>TTD Psikolog: {p.ttd_psikolog ? "✅ Disetujui" : "⏳ Menunggu"}</p>
                              <p>TTD Orang Tua: {p.ttd_orangtua ? "✅ Selesai" : "⏳ Menunggu"}</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => { setSelectedItem(p); setModalType("ppi"); }}
                            className="w-full bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-300 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                          >
                            <Eye className="w-4 h-4" /> Periksa Dokumen PPI
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* MODAL TAMBAH / EDIT SISWA & PLOTTING */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveStudent} className="bg-slate-900 border border-white/20 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative space-y-4">
            <button type="button" onClick={closeStudentModal} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-blue-400">{editStudentId ? "Edit Siswa & Plotting" : "Tambah Siswa Baru"}</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 uppercase">Nama Lengkap Siswa</label>
                <input type="text" value={studentForm.full_name} onChange={(e) => setStudentForm({...studentForm, full_name: e.target.value})} required className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 uppercase">NIS</label>
                  <input type="text" value={studentForm.nis} onChange={(e) => setStudentForm({...studentForm, nis: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-300 uppercase">Kelas</label>
                  <input type="text" value={studentForm.kelas} onChange={(e) => setStudentForm({...studentForm, kelas: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-300 uppercase">Jenis Kebutuhan Khusus</label>
                <input type="text" value={studentForm.jenis_kebutuhan_khusus} onChange={(e) => setStudentForm({...studentForm, jenis_kebutuhan_khusus: e.target.value})} placeholder="Contoh: Slow Learner / ADHD" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white mt-1" />
              </div>

              {/* Plotting GPK */}
              <div>
                <label className="text-xs text-emerald-400 uppercase font-bold">Tautkan Guru Pendamping Khusus (GPK)</label>
                <select value={studentForm.gpk_id || ""} onChange={(e) => setStudentForm({...studentForm, gpk_id: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white mt-1">
                  <option value="">-- Pilih GPK Pendamping --</option>
                  {users.filter(u => u.role === "gpk").map(gpk => (
                    <option key={gpk.id} value={gpk.id}>{gpk.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Plotting Wali Siswa */}
              <div>
                <label className="text-xs text-purple-400 uppercase font-bold">Tautkan Wali Siswa (Orang Tua)</label>
                <select value={studentForm.wali_id || ""} onChange={(e) => setStudentForm({...studentForm, wali_id: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white mt-1">
                  <option value="">-- Pilih Wali Siswa --</option>
                  {users.filter(u => u.role === "wali").map(wali => (
                    <option key={wali.id} value={wali.id}>{wali.full_name} ({wali.info_anak || "Wali"})</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Simpan Data Siswa
            </button>
          </form>
        </div>
      )}

      {/* MODAL EDIT ROLE USER */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateRole} className="bg-slate-900 border border-white/20 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative space-y-4">
            <button type="button" onClick={() => setShowUserModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-purple-400">Ubah Role Pengguna</h3>
            <div>
              <label className="text-xs text-slate-300 uppercase font-bold">Pilih Peran (Role)</label>
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white mt-2">
                <option value="wali">Wali Siswa (Orang Tua)</option>
                <option value="gpk">Guru Pembimbing Khusus (GPK)</option>
                <option value="psikolog">Psikolog</option>
                <option value="admin">Admin Sekolah</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl shadow-lg mt-2 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Perbarui Role
            </button>
          </form>
        </div>
      )}

      {/* MODAL POPUP DETAIL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <X className="w-5 h-5" />
            </button>

            {modalType === "report" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-emerald-400 border-b border-white/10 pb-3">Detail Laporan Harian Pendampingan</h3>
                <div className="space-y-4 text-sm text-slate-300">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-2 gap-3">
                    <div><span className="text-xs text-slate-500 block">Siswa</span><strong className="text-white">{selectedItem.students?.full_name}</strong></div>
                    <div><span className="text-xs text-slate-500 block">Mata Pelajaran</span><strong className="text-blue-400">{selectedItem.mata_pelajaran}</strong></div>
                    <div><span className="text-xs text-slate-500 block">Tanggal</span><span className="text-white">{selectedItem.tanggal}</span></div>
                    <div><span className="text-xs text-slate-500 block">Kondisi Mood</span><span className="text-emerald-300">{selectedItem.kondisi_mood || "-"}</span></div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <p><strong>Materi Pembelajaran:</strong><br />{selectedItem.materi_pembelajaran}</p>
                    <p><strong>Target Capaian:</strong><br />{selectedItem.target_capaian}</p>
                    <p className="text-emerald-300"><strong>Hasil Pembelajaran:</strong><br />{selectedItem.hasil_pembelajaran}</p>
                    <p><strong>Catatan Perilaku:</strong><br />{selectedItem.catatan_perilaku || "-"}</p>
                    <p><strong>Intervensi Pendamping:</strong><br />{selectedItem.intervensi_pendamping || "-"}</p>
                  </div>
                </div>
              </div>
            )}

            {modalType === "assessment" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-purple-400 border-b border-white/10 pb-3">Detail Asesmen Awal PDBK</h3>
                <div className="space-y-4 text-sm text-slate-300">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-2 gap-3">
                    <div><span className="text-xs text-slate-500 block">Siswa</span><strong className="text-white">{selectedItem.students?.full_name}</strong></div>
                    <div><span className="text-xs text-slate-500 block">Tanggal Asesmen</span><strong className="text-purple-400">{selectedItem.tanggal_assessment}</strong></div>
                  </div>

                  {selectedItem.identitas && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-blue-400 text-xs uppercase">1. Identitas Anak</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Nama: {selectedItem.identitas.nama_anak || "-"}</div>
                        <div>Kelas: {selectedItem.identitas.kelas || "-"}</div>
                        <div>TTL: {selectedItem.identitas.tanggal_lahir || "-"}</div>
                        <div>Alamat: {selectedItem.identitas.alamat || "-"}</div>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <h4 className="font-bold text-slate-400 text-xs uppercase mb-1">Permasalahan yang Dihadapi</h4>
                    <p>{selectedItem.permasalahan || "-"}</p>
                  </div>

                  {selectedItem.profiling && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-purple-400 text-xs uppercase">Profiling Anak</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><strong className="text-emerald-400">Kelebihan:</strong> {selectedItem.profiling.kelebihan || "-"}</div>
                        <div><strong className="text-red-400">Kekurangan:</strong> {selectedItem.profiling.kekurangan || "-"}</div>
                        <div><strong className="text-blue-400">Disukai:</strong> {selectedItem.profiling.disukai || "-"}</div>
                        <div><strong className="text-amber-400">Tidak Disukai:</strong> {selectedItem.profiling.tidak_disukai || "-"}</div>
                      </div>
                    </div>
                  )}

                  {selectedItem.temuan_lapangan && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-emerald-400 text-xs uppercase">Temuan 5 Aspek di Lapangan</h4>
                      <div className="space-y-1 text-xs text-slate-300">
                        <p><strong>1. Kognitif:</strong> Daya tangkap: {selectedItem.temuan_lapangan.kognitif?.daya_tangkap || "-"}, Fokus: {selectedItem.temuan_lapangan.kognitif?.fokus || "-"}</p>
                        <p><strong>2. Bahasa:</strong> Reseptif: {selectedItem.temuan_lapangan.bahasa?.reseptif || "-"}, Ekspresif: {selectedItem.temuan_lapangan.bahasa?.ekspresif || "-"}</p>
                        <p><strong>3. Kemandirian:</strong> Motorik kasar: {selectedItem.temuan_lapangan.kemandirian?.motorik_kasar || "-"}, Halus: {selectedItem.temuan_lapangan.kemandirian?.motorik_halus || "-"}</p>
                        <p><strong>4. Sosial:</strong> Adaptasi: {selectedItem.temuan_lapangan.sosial?.adaptasi || "-"}</p>
                        <p><strong>5. Emosi:</strong> Kontrol emosi: {selectedItem.temuan_lapangan.emosi?.kontrol_emosi || "-"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {modalType === "ppi" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-blue-400 border-b border-white/10 pb-3">Detail Program Pembelajaran Individual (PPI)</h3>
                <div className="space-y-4 text-sm text-slate-300">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                    <div><span className="text-xs text-slate-500 block">Siswa</span><strong className="text-white">{selectedItem.students?.full_name}</strong></div>
                    <div><span className="text-xs text-slate-500 block">Status Dokumen</span><span className="text-amber-300 font-bold uppercase">{selectedItem.status}</span></div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <p><strong>Wali Kelas:</strong> {selectedItem.wali_kelas || "-"}</p>
                    <p><strong>Periode:</strong> {selectedItem.periode_ppi} ({selectedItem.tahun_ajaran})</p>
                    <p><strong>Jenis Kebutuhan (Profil):</strong> {selectedItem.profil_pdbk?.jenis_kebutuhan || "-"}</p>
                  </div>

                  {selectedItem.tujuan_smart && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-emerald-400 text-xs uppercase">Tujuan SMART</h4>
                      <p><strong>Jangka Panjang:</strong> {selectedItem.tujuan_smart.jangka_panjang || "-"}</p>
                      <p><strong>Jangka Pendek 1:</strong> {selectedItem.tujuan_smart.jangka_pendek_1 || "-"}</p>
                    </div>
                  )}

                  {selectedItem.layanan_akomodasi && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-amber-400 text-xs uppercase">Layanan & Akomodasi</h4>
                      <p>{selectedItem.layanan_akomodasi.modifikasi || "-"}</p>
                    </div>
                  )}

                  {selectedItem.rencana_evaluasi && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-purple-400 text-xs uppercase">Rencana Evaluasi</h4>
                      {selectedItem.rencana_evaluasi.map((ev: any, i: number) => (
                        <div key={i} className="text-xs bg-white/5 p-2 rounded-lg">
                          <strong>{ev.periode}:</strong> {ev.kegiatan} ({ev.status})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button onClick={() => setSelectedItem(null)} className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold">
              Tutup Detail
            </button>
          </div>
        </div>
      )}

    </div>
  );
}