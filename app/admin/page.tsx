"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";
import { 
  ShieldCheck, LogOut, Users, BookOpen, FileText, 
  UserCheck, Printer, Plus, Trash2, Edit3, X, Eye, Save, BrainCircuit, Calendar, Filter, MessageCircle
} from "lucide-react";
import { useReactToPrint } from "react-to-print";

export default function AdminDashboard() {
  const router = useRouter();
  const componentRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  
  const [activeTab, setActiveTab] = useState("siswa");
  const [ppiSubTab, setPpiSubTab] = useState("asesmen");

  const [filterNama, setFilterNama] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [tglMulai, setTglMulai] = useState("");
  const [tglSelesai, setTglSelesai] = useState("");

  const [students, setStudents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [groupedReports, setGroupedReports] = useState<{ [key: string]: any[] }>({});
  const [selectedReportDate, setSelectedReportDate] = useState<string | null>(null);

  const [assessments, setAssessments] = useState<any[]>([]);
  const [ppiList, setPpiList] = useState<any[]>([]);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<string>(""); 

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

  const [showUserModal, setShowUserModal] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("wali");

  const [message, setMessage] = useState("");

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
      .order("tanggal", { ascending: false });
    
    if (reportData) {
      setReports(reportData);

      const grouped = reportData.reduce((acc: any, report: any) => {
        const dateVal = report.tanggal || (report.created_at ? report.created_at.split('T')[0] : null);
        const dateKey = dateVal || "Tanpa Tanggal";
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(report);
        return acc;
      }, {});

      setGroupedReports(grouped);

      const dates = Object.keys(grouped).sort().reverse();
      if (dates.length > 0) {
        setSelectedReportDate(dates[0]);
      }
    }

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

  const getFilteredReports = () => {
    return reports.filter(r => {
      const matchNama = filterNama ? r.students?.full_name?.toLowerCase().includes(filterNama.toLowerCase()) : true;
      const matchMapel = filterMapel ? r.mata_pelajaran?.toLowerCase().includes(filterMapel.toLowerCase()) : true;
      const matchTglMulai = tglMulai ? r.tanggal >= tglMulai : true;
      const matchTglSelesai = tglSelesai ? r.tanggal <= tglSelesai : true;
      
      const matchTabDate = (!tglMulai && !tglSelesai && selectedReportDate) 
        ? (r.tanggal === selectedReportDate || (!r.tanggal && selectedReportDate === "Tanpa Tanggal")) 
        : true;

      return matchNama && matchMapel && matchTglMulai && matchTglSelesai && matchTabDate;
    });
  };

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

  const displayedReports = getFilteredReports();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
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

        <div className="transition-all duration-300">
          
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

          {activeTab === "laporan" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" /> Rekapitulasi Laporan Harian GPK ({reports.length})
                </h3>
              </div>

              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Filter className="w-4 h-4" /> Filter Laporan Harian & Cetak
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Nama Siswa</label>
                    <input 
                      type="text" 
                      placeholder="Cari Nama Siswa..." 
                      value={filterNama} 
                      onChange={(e) => setFilterNama(e.target.value)} 
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white w-full" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Mata Pelajaran</label>
                    <input 
                      type="text" 
                      placeholder="Cari Mata Pelajaran..." 
                      value={filterMapel} 
                      onChange={(e) => setFilterMapel(e.target.value)} 
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white w-full" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Dari Tanggal (Mulai)</label>
                    <input 
                      type="date" 
                      value={tglMulai} 
                      onChange={(e) => setTglMulai(e.target.value)} 
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white w-full" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Sampai Tanggal (Selesai)</label>
                    <input 
                      type="date" 
                      value={tglSelesai} 
                      onChange={(e) => setTglSelesai(e.target.value)} 
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white w-full" 
                    />
                  </div>
                </div>

                <div className="flex flex-wrap justify-between items-center pt-3 border-t border-white/10 gap-2">
                  <button 
                    onClick={() => { setFilterNama(""); setFilterMapel(""); setTglMulai(""); setTglSelesai(""); }}
                    className="text-xs text-slate-400 hover:text-white underline transition-all"
                  >
                    Reset Filter
                  </button>
                  <button 
                    onClick={() => handlePrint()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Printer className="w-4 h-4" /> Print PDF Sesuai Filter ({displayedReports.length})
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Pengelompokan Berdasarkan Tanggal:
                </span>
                {Object.keys(groupedReports).length === 0 ? (
                  <p className="text-slate-400 text-xs italic">Belum ada data tanggal laporan harian.</p>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {Object.keys(groupedReports).sort().reverse().map((date) => (
                      <button
                        key={date}
                        onClick={() => setSelectedReportDate(date)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md whitespace-nowrap flex items-center gap-1.5 ${
                          selectedReportDate === date && !tglMulai && !tglSelesai
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-white/30"
                            : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <span>📅</span> {date} <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">({groupedReports[date].length})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedReports.length === 0 ? (
                  <p className="text-slate-400 text-sm italic col-span-full">Tidak ada laporan harian pada filter yang dipilih.</p>
                ) : (
                  displayedReports.map((r) => (
                    <div key={r.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold">{r.mata_pelajaran}</span>
                          <span className="text-xs text-slate-400">{r.tanggal}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1">{r.students?.full_name || "Siswa"}</h4>
                        
                        <div className="space-y-2 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                          <p><strong className="text-blue-400">Materi:</strong> {r.materi_pembelajaran}</p>
                          <p className="line-clamp-2"><strong className="text-purple-400">Hasil:</strong> {r.hasil_pembelajaran}</p>
                        </div>

                        {r.feedback_wali ? (
                          <div className="bg-blue-500/15 border border-blue-500/40 p-3 rounded-xl text-blue-200 text-xs space-y-1 shadow-inner">
                            <p className="font-bold flex items-center gap-1 text-blue-300">
                              <MessageCircle className="w-3.5 h-3.5 text-blue-400" /> Tanggapan Wali:
                            </p>
                            <p className="italic text-slate-200">"{r.feedback_wali}"</p>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 italic flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 text-slate-600" /> Belum ada tanggapan dari wali.
                          </div>
                        )}
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

              <div className="hidden">
                <div ref={componentRef} className="p-8 bg-white text-black font-sans">
                  <div className="text-center border-b-2 border-black pb-4 mb-6">
                    <h2 className="text-2xl font-bold uppercase">SD Islam Roushon Fikr Jombang</h2>
                    <p className="text-sm font-semibold">Rekapitulasi Laporan Harian Guru Pendamping Khusus (GPK)</p>
                    <div className="text-xs text-gray-700 mt-1 flex justify-center gap-4">
                      {filterNama && <span>Siswa: <b>{filterNama}</b></span>}
                      {filterMapel && <span>Mapel: <b>{filterMapel}</b></span>}
                      {tglMulai && tglSelesai && <span>Periode: <b>{tglMulai} s.d {tglSelesai}</b></span>}
                    </div>
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
                        <th className="border border-black p-2">Tanggapan Wali</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedReports.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-black p-4 text-center italic">Tidak ada laporan yang sesuai dengan filter.</td>
                        </tr>
                      ) : (
                        displayedReports.map((r, idx) => (
                          <tr key={idx}>
                            <td className="border border-black p-2 text-center">{r.tanggal}</td>
                            <td className="border border-black p-2">{r.students?.full_name}</td>
                            <td className="border border-black p-2">{r.mata_pelajaran}</td>
                            <td className="border border-black p-2">{r.materi_pembelajaran}</td>
                            <td className="border border-black p-2">{r.hasil_pembelajaran}</td>
                            <td className="border border-black p-2 italic">{r.feedback_wali || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {activeTab === "ppi" && (
            <div className="flex flex-col gap-6">
              
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
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">Asesmen Awal</span>
                              <span className="text-xs text-slate-400">{a.tanggal_assessment || "-"}</span>
                            </div>
                            <h4 className="text-lg font-bold text-white mb-1">{a.students?.full_name || "Siswa PDBK"}</h4>
                            
                            <div className="space-y-2 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                              <p className="line-clamp-2"><strong>Permasalahan:</strong> {a.permasalahan || "-"}</p>
                              {a.identitas?.kelas && <p><strong>Kelas:</strong> {a.identitas.kelas}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                                <span className="text-emerald-400 font-bold block">Kelebihan:</span>
                                <span className="line-clamp-1">{a.profiling?.kelebihan || "-"}</span>
                              </div>
                              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                                <span className="text-red-400 font-bold block">Kekurangan:</span>
                                <span className="line-clamp-1">{a.profiling?.kekurangan || "-"}</span>
                              </div>
                            </div>

                            {a.catatan_psikolog && (
                              <div className="bg-purple-500/15 border border-purple-500/40 p-3 rounded-xl text-purple-200 text-xs space-y-1 shadow-inner">
                                <p className="font-bold flex items-center gap-1 text-purple-300">
                                  <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> Catatan Psikolog:
                                </p>
                                <p className="italic text-slate-200">"{a.catatan_psikolog}"</p>
                              </div>
                            )}
                          </div>

                          <button 
                            onClick={() => { setSelectedItem(a); setModalType("assessment"); }}
                            className="w-full bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-4"
                          >
                            <Eye className="w-4 h-4" /> Periksa Asesmen Lengkap
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

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
                              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold uppercase">{p.status}</span>
                              <span className="text-xs text-slate-400">{p.periode_ppi}</span>
                            </div>
                            <h4 className="text-lg font-bold text-white mb-1">{p.students?.full_name || "Siswa"}</h4>
                            <div className="space-y-1.5 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 mt-3">
                              <p>TTD GPK: {p.ttd_gpk ? "✅ Selesai" : "⏳ Menunggu"}</p>
                              <p>TTD Psikolog: {p.ttd_psikolog ? "✅ Disetujui" : "⏳ Menunggu"}</p>
                              <p>TTD Orang Tua: {p.ttd_orangtua ? "✅ Selesai" : "⏳ Menunggu"}</p>
                            </div>
                            {p.catatan_psikolog && (
                              <div className="bg-purple-500/15 border border-purple-500/40 p-3 rounded-xl text-purple-200 text-xs space-y-1 mt-3 shadow-inner">
                                <p className="font-bold flex items-center gap-1 text-purple-300">
                                  <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> Catatan Psikolog:
                                </p>
                                <p className="italic text-slate-200">"{p.catatan_psikolog}"</p>
                              </div>
                            )}
                          </div>

                          <button 
                            onClick={() => { setSelectedItem(p); setModalType("ppi"); }}
                            className="w-full bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-300 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-4"
                          >
                            <Eye className="w-4 h-4" /> Periksa Dokumen PPI Lengkap
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

              <div>
                <label className="text-xs text-emerald-400 uppercase font-bold">Tautkan Guru Pendamping Khusus (GPK)</label>
                <select value={studentForm.gpk_id || ""} onChange={(e) => setStudentForm({...studentForm, gpk_id: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white mt-1">
                  <option value="">-- Pilih GPK Pendamping --</option>
                  {users.filter(u => u.role === "gpk").map(gpk => (
                    <option key={gpk.id} value={gpk.id}>{gpk.full_name}</option>
                  ))}
                </select>
              </div>

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
                <option value="gpk">Guru Pendamping Khusus (GPK)</option>
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

      {/* MODAL UNIVERSAL RINCIAN LENGKAP 100% */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl my-auto space-y-6">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all z-10">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-white uppercase flex items-center gap-2 border-b border-white/10 pb-4 pr-8">
              {modalType === "report" ? ( <><BookOpen className="text-emerald-400 flex-shrink-0"/> Rincian Lengkap Laporan Harian PDBK</> ) : 
               modalType === "assessment" ? ( <><BrainCircuit className="text-purple-400 flex-shrink-0"/> Rincian Lengkap Asesmen Awal PDBK</> ) : 
               ( <><FileText className="text-blue-400 flex-shrink-0"/> Rincian Lengkap Dokumen PPI</> )}
            </h3>

            <div className="space-y-6 text-sm text-slate-300">
              {modalType === "report" && (
                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><span className="block text-xs text-slate-500">Nama Siswa</span><strong className="text-white text-base">{selectedItem.students?.full_name}</strong></div>
                    <div><span className="block text-xs text-slate-500">Mata Pelajaran</span><strong className="text-blue-400 text-base">{selectedItem.mata_pelajaran}</strong></div>
                    <div><span className="block text-xs text-slate-500">Tanggal Laporan</span><span className="text-white">{selectedItem.tanggal}</span></div>
                    <div><span className="block text-xs text-slate-500">Pendamping (GPK)</span><span className="text-purple-400 font-semibold">{selectedItem.gpk_name || "-"}</span></div>
                    <div><span className="block text-xs text-slate-500">Kondisi Mood Siswa</span><span className="px-3 py-1 bg-white/10 rounded-full text-xs mt-1 inline-block text-amber-300 font-semibold">{selectedItem.kondisi_mood}</span></div>
                  </div>
                    
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Materi Pembelajaran</h4>
                      <p className="text-white whitespace-pre-wrap">{selectedItem.materi_pembelajaran || "-"}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Target Capaian</h4>
                      <p className="text-white whitespace-pre-wrap">{selectedItem.target_capaian || "-"}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-900/40 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Hasil Pembelajaran</h4>
                    <p className="text-emerald-100 whitespace-pre-wrap">{selectedItem.hasil_pembelajaran || "-"}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Catatan Perilaku</h4>
                      <p className="text-slate-200 whitespace-pre-wrap">{selectedItem.catatan_perilaku || "-"}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Intervensi Pendamping</h4>
                      <p className="text-slate-200 whitespace-pre-wrap">{selectedItem.intervensi_pendamping || "-"}</p>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-blue-400" /> Tanggapan / Feedback Wali Siswa
                    </h4>
                    {selectedItem.feedback_wali ? (
                      <p className="italic text-slate-100">"{selectedItem.feedback_wali}"</p>
                    ) : (
                      <p className="text-slate-400 italic text-xs">Belum ada tanggapan atau feedback yang dikirimkan oleh wali siswa.</p>
                    )}
                  </div>
                </div>
              )}

              {modalType === "assessment" && (
                <div className="space-y-4">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><span className="block text-xs text-slate-500">Nama Siswa</span><strong className="text-white text-base">{selectedItem.students?.full_name}</strong></div>
                    <div><span className="block text-xs text-slate-500">Tanggal Asesmen</span><strong className="text-purple-400 text-base">{selectedItem.tanggal_assessment}</strong></div>
                  </div>

                  {selectedItem.identitas && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">1. Identitas Diri Anak</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div><span className="text-slate-500 block">Nama Anak:</span> <span className="text-white font-medium">{selectedItem.identitas.nama_anak || "-"}</span></div>
                        <div><span className="text-slate-500 block">Tanggal Lahir:</span> <span className="text-white font-medium">{selectedItem.identitas.tanggal_lahir || "-"}</span></div>
                        <div><span className="text-slate-500 block">Kelas:</span> <span className="text-white font-medium">{selectedItem.identitas.kelas || "-"}</span></div>
                        <div><span className="text-slate-500 block">Alamat:</span> <span className="text-white font-medium">{selectedItem.identitas.alamat || "-"}</span></div>
                        <div><span className="text-slate-500 block">Nama Ibu:</span> <span className="text-white font-medium">{selectedItem.identitas.nama_ibu || "-"}</span></div>
                        <div><span className="text-slate-500 block">Nama Ayah:</span> <span className="text-white font-medium">{selectedItem.identitas.nama_ayah || "-"}</span></div>
                        <div><span className="text-slate-500 block">Urutan Kelahiran:</span> <span className="text-white font-medium">{selectedItem.identitas.urutan_kelahiran || "-"}</span></div>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Permasalahan yang Dihadapi Anak</h4>
                    <p className="text-white whitespace-pre-wrap">{selectedItem.permasalahan || "-"}</p>
                  </div>

                  {selectedItem.metode_hasil && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Metode & Hasil Assessment</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div><span className="text-slate-500 block">Observasi:</span> <span className="text-white">{selectedItem.metode_hasil.observasi || "-"}</span></div>
                        <div><span className="text-slate-500 block">Wawancara:</span> <span className="text-white">{selectedItem.metode_hasil.wawancara || "-"}</span></div>
                        <div><span className="text-slate-500 block">Psikotes:</span> <span className="text-white">{selectedItem.metode_hasil.psikotes || "-"}</span></div>
                        <div><span className="text-slate-500 block">Data Pendukung:</span> <span className="text-white">{selectedItem.metode_hasil.data_pendukung || "-"}</span></div>
                      </div>
                    </div>
                  )}

                  {selectedItem.profiling && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Profiling Anak</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div><span className="text-emerald-400 font-bold block">Kelebihan:</span> <span className="text-white whitespace-pre-wrap">{selectedItem.profiling.kelebihan || "-"}</span></div>
                        <div><span className="text-red-400 font-bold block">Kekurangan / Tantangan:</span> <span className="text-white whitespace-pre-wrap">{selectedItem.profiling.kekurangan || "-"}</span></div>
                        <div><span className="text-blue-400 font-bold block">Hal yang Disukai:</span> <span className="text-white whitespace-pre-wrap">{selectedItem.profiling.disukai || "-"}</span></div>
                        <div><span className="text-amber-400 font-bold block">Hal yang Tidak Disukai:</span> <span className="text-white whitespace-pre-wrap">{selectedItem.profiling.tidak_disukai || "-"}</span></div>
                      </div>
                    </div>
                  )}

                  {selectedItem.temuan_lapangan && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Temuan Lapangan (5 Aspek)</h4>
                      
                      <div className="space-y-1.5 text-xs border-b border-white/5 pb-3">
                        <strong className="text-blue-300 block">1. Kognitif</strong>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div><span className="text-slate-500">Daya Tangkap:</span> {selectedItem.temuan_lapangan.kognitif?.daya_tangkap || "-"}</div>
                          <div><span className="text-slate-500">Fokus:</span> {selectedItem.temuan_lapangan.kognitif?.fokus || "-"}</div>
                          <div><span className="text-slate-500">Konsentrasi:</span> {selectedItem.temuan_lapangan.kognitif?.konsentrasi || "-"}</div>
                          <div><span className="text-slate-500">Mengingat:</span> {selectedItem.temuan_lapangan.kognitif?.mengingat || "-"}</div>
                          <div><span className="text-slate-500">Membaca:</span> {selectedItem.temuan_lapangan.kognitif?.membaca || "-"}</div>
                          <div><span className="text-slate-500">Menulis:</span> {selectedItem.temuan_lapangan.kognitif?.menulis || "-"}</div>
                          <div><span className="text-slate-500">Berhitung:</span> {selectedItem.temuan_lapangan.kognitif?.berhitung || "-"}</div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs border-b border-white/5 pb-3">
                        <strong className="text-purple-300 block">2. Bahasa / Komunikasi</strong>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div><span className="text-slate-500">Reseptif:</span> {selectedItem.temuan_lapangan.bahasa?.reseptif || "-"}</div>
                          <div><span className="text-slate-500">Ekspresif:</span> {selectedItem.temuan_lapangan.bahasa?.ekspresif || "-"}</div>
                          <div><span className="text-slate-500">Fonologi:</span> {selectedItem.temuan_lapangan.bahasa?.fonologi || "-"}</div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs border-b border-white/5 pb-3">
                        <strong className="text-emerald-300 block">3. Kemandirian</strong>
                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                          <div><span className="text-slate-500">Motorik Kasar:</span> {selectedItem.temuan_lapangan.kemandirian?.motorik_kasar || "-"}</div>
                          <div><span className="text-slate-500">Motorik Halus:</span> {selectedItem.temuan_lapangan.kemandirian?.motorik_halus || "-"}</div>
                          <div><span className="text-slate-500">Keseimbangan:</span> {selectedItem.temuan_lapangan.kemandirian?.keseimbangan || "-"}</div>
                          <div><span className="text-slate-500">Kontrol Sendi:</span> {selectedItem.temuan_lapangan.kemandirian?.kontrol_sendi || "-"}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div><strong className="text-amber-300 block">4. Sosial</strong> {selectedItem.temuan_lapangan.sosial?.adaptasi || "-"}</div>
                        <div><strong className="text-pink-300 block">5. Emosi</strong> {selectedItem.temuan_lapangan.emosi?.kontrol_emosi || "-"}</div>
                      </div>
                    </div>
                  )}

                  {selectedItem.catatan_psikolog && (
                    <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                        <BrainCircuit className="w-4 h-4 text-purple-400" /> Catatan Profesional Psikolog
                      </h4>
                      <p className="italic text-slate-100">"{selectedItem.catatan_psikolog}"</p>
                    </div>
                  )}
                </div>
              )}

              {modalType === "ppi" && (
                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div><span className="block text-xs text-slate-500">Nama Siswa</span><strong className="text-white text-base">{selectedItem.students?.full_name}</strong></div>
                    <div className="text-left sm:text-right"><span className="block text-xs text-slate-500">Status Validasi</span><span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-xs uppercase mt-1 inline-block">{selectedItem.status}</span></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                    <div><span className="text-slate-500 block">Wali Kelas:</span> <span className="text-white font-medium">{selectedItem.wali_kelas || "-"}</span></div>
                    <div><span className="text-slate-500 block">Tahun Ajaran:</span> <span className="text-white font-medium">{selectedItem.tahun_ajaran || "-"}</span></div>
                    <div><span className="text-slate-500 block">Periode PPI:</span> <span className="text-white font-medium">{selectedItem.periode_ppi || "-"}</span></div>
                  </div>

                  {selectedItem.profil_pdbk && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">1. Profil PDBK</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div><span className="text-slate-500">Nama:</span> {selectedItem.profil_pdbk.nama || "-"}</div>
                        <div><span className="text-slate-500">Kelas/Usia:</span> {selectedItem.profil_pdbk.kelas_usia || "-"}</div>
                        <div><span className="text-slate-500">Jenis Kebutuhan:</span> {selectedItem.profil_pdbk.jenis_kebutuhan || "-"}</div>
                      </div>
                    </div>
                  )}

                  {selectedItem.kemampuan_saat_ini && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">2. Tingkat Kemampuan Saat Ini</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div><strong className="text-emerald-400 block mb-1">Kekuatan / Potensi</strong> <p className="text-white whitespace-pre-wrap">{selectedItem.kemampuan_saat_ini.kekuatan || "-"}</p></div>
                        <div><strong className="text-amber-400 block mb-1">Area Pengembangan</strong> <p className="text-white whitespace-pre-wrap">{selectedItem.kemampuan_saat_ini.area_pengembangan || "-"}</p></div>
                      </div>
                    </div>
                  )}

                  {selectedItem.tujuan_smart && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">3. Tujuan SMART</h4>
                      <div className="space-y-2 text-xs">
                        <div><strong className="text-slate-400 block">Jangka Panjang:</strong> <p className="text-white">{selectedItem.tujuan_smart.jangka_panjang || "-"}</p></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          <div><strong className="text-slate-400 block">Jangka Pendek 1:</strong> {selectedItem.tujuan_smart.jangka_pendek_1 || "-"}</div>
                          <div><strong className="text-slate-400 block">Jangka Pendek 2:</strong> {selectedItem.tujuan_smart.jangka_pendek_2 || "-"}</div>
                          <div><strong className="text-slate-400 block">Jangka Pendek 3:</strong> {selectedItem.tujuan_smart.jangka_pendek_3 || "-"}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedItem.layanan_akomodasi && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">4. Layanan & Akomodasi Pembelajaran</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div><strong className="text-slate-400 block">Modifikasi:</strong> {selectedItem.layanan_akomodasi.modifikasi || "-"}</div>
                        <div><strong className="text-slate-400 block">Media Belajar:</strong> {selectedItem.layanan_akomodasi.media || "-"}</div>
                        <div><strong className="text-slate-400 block">Komunikasi:</strong> {selectedItem.layanan_akomodasi.komunikasi || "-"}</div>
                        <div><strong className="text-slate-400 block">Modifikasi Tugas:</strong> {selectedItem.layanan_akomodasi.tugas || "-"}</div>
                        <div><strong className="text-slate-400 block">Pendamping GPK:</strong> {selectedItem.layanan_akomodasi.pendamping || "-"}</div>
                        <div><strong className="text-slate-400 block">Kolaborasi:</strong> {selectedItem.layanan_akomodasi.kolaborasi || "-"}</div>
                      </div>
                    </div>
                  )}

                  {selectedItem.rencana_evaluasi && selectedItem.rencana_evaluasi.length > 0 && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">5. Rencana Evaluasi Berkala</h4>
                      <div className="space-y-2">
                        {selectedItem.rencana_evaluasi.map((ev: any, idx: number) => (
                          <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row justify-between gap-2">
                            <div><strong className="text-indigo-300">{ev.periode}</strong>: {ev.kegiatan}</div>
                            <div className="text-amber-400 font-semibold">{ev.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Status Tanda Tangan Digital</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">GPK: <span className={selectedItem.ttd_gpk ? "text-emerald-400 font-bold" : "text-amber-400"}>{selectedItem.ttd_gpk ? "✅ Disetujui" : "⏳ Menunggu"}</span></div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">Psikolog: <span className={selectedItem.ttd_psikolog ? "text-emerald-400 font-bold" : "text-amber-400"}>{selectedItem.ttd_psikolog ? "✅ Disetujui" : "⏳ Menunggu"}</span></div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">Orang Tua: <span className={selectedItem.ttd_orangtua ? "text-emerald-400 font-bold" : "text-amber-400"}>{selectedItem.ttd_orangtua ? "✅ Disetujui" : "⏳ Menunggu"}</span></div>
                    </div>
                  </div>

                  {selectedItem.catatan_psikolog && (
                    <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                        <BrainCircuit className="w-4 h-4 text-purple-400" /> Catatan Profesional Psikolog
                      </h4>
                      <p className="italic text-slate-100">"{selectedItem.catatan_psikolog}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => setSelectedItem(null)} className="mt-6 w-full bg-slate-800 hover:bg-slate-700 transition-colors py-3 rounded-xl font-bold text-white shadow-lg">Tutup Detail</button>
          </div>
        </div>
      )}

    </div>
  );
}