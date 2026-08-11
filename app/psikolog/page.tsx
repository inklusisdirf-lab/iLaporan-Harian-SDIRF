"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";
import { BrainCircuit, BookOpen, FileText, Search, Eye, X, Save, ClipboardList, User, Calendar, CheckCircle, AlertCircle, RefreshCw, LogOut } from "lucide-react";

export default function PsikologDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("laporan");
  
  // State Data
  const [reports, setReports] = useState<any[]>([]);
  const [groupedReports, setGroupedReports] = useState<{ [key: string]: any[] }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const [assessments, setAssessments] = useState<any[]>([]);
  const [ppiList, setPpiList] = useState<any[]>([]);
  
  // State Modal
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<string>("");
  const [psikologFeedback, setPsikologFeedback] = useState("");

  // State Filter
  const [filterNama, setFilterNama] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [tglMulai, setTglMulai] = useState("");
  const [tglSelesai, setTglSelesai] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!profile || profile.role !== "psikolog") { router.push("/login"); return; }
      fetchAllData();
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const fetchAllData = async () => {
    const { data: r } = await supabase.from("daily_reports").select("*, students(full_name), profiles(full_name)").order("tanggal", { ascending: false });
    const { data: a } = await supabase.from("assessments").select("*, students(full_name), profiles(full_name)").order("created_at", { ascending: false });
    const { data: p } = await supabase.from("ppi").select("*, students(full_name)").order("created_at", { ascending: false });
    
    if (r) {
      console.log("Data Daily Reports:", r); // Cek F12 Console browser untuk pastikan data masuk
      setReports(r);
      
      // Grouping Laporan Berdasarkan Tanggal (dengan fallback ke created_at jika tanggal kosong)
      const grouped = r.reduce((acc: any, report: any) => {
        const dateVal = report.tanggal || (report.created_at ? report.created_at.split('T')[0] : null);
        const dateKey = dateVal || "Tanpa Tanggal";
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(report);
        return acc;
      }, {});
      
      setGroupedReports(grouped);

      const dates = Object.keys(grouped).sort().reverse();
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    }

    if (a) setAssessments(a);
    if (p) setPpiList(p);
  };

  // Fungsi Tombol Keluar / Log Out
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSaveFeedback = async () => {
    const tableName = modalType === "laporan" ? "daily_reports" : modalType === "asesmen" ? "assessments" : "ppi";
    const { error } = await supabase
      .from(tableName)
      .update({ catatan_psikolog: psikologFeedback })
      .eq("id", selectedItem.id);

    if (error) alert("Gagal menyimpan catatan: " + error.message);
    else {
      alert("Catatan profesional berhasil disimpan!");
      fetchAllData();
      setSelectedItem(null);
    }
  };

  // Fungsi Respon Status PPI (ACC, Revisi, Butuh Respon) oleh Psikolog
  const handleUpdatePpiStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("ppi")
      .update({ 
        status: newStatus, 
        ttd_psikolog: newStatus === "ACC" ? true : selectedItem.ttd_psikolog 
      })
      .eq("id", selectedItem.id);

    if (error) {
      alert("Gagal memperbarui status PPI: " + error.message);
    } else {
      alert(`Status PPI berhasil diubah menjadi: ${newStatus}`);
      setSelectedItem({ ...selectedItem, status: newStatus, ttd_psikolog: newStatus === "ACC" ? true : selectedItem.ttd_psikolog });
      fetchAllData();
    }
  };

  const getFilteredData = () => {
    if (activeTab === "laporan") {
      const currentList = (selectedDate && groupedReports[selectedDate]) ? groupedReports[selectedDate] : reports;
      return currentList.filter(item => {
        const matchNama = filterNama ? item.students?.full_name?.toLowerCase().includes(filterNama.toLowerCase()) : true;
        const matchMapel = filterMapel ? item.mata_pelajaran?.toLowerCase().includes(filterMapel.toLowerCase()) : true;
        const matchTglMulai = tglMulai ? item.tanggal >= tglMulai : true;
        const matchTglSelesai = tglSelesai ? item.tanggal <= tglSelesai : true;
        return matchNama && matchMapel && matchTglMulai && matchTglSelesai;
      });
    } else if (activeTab === "asesmen") {
      return assessments.filter(item => {
        return filterNama ? item.students?.full_name?.toLowerCase().includes(filterNama.toLowerCase()) : true;
      });
    } else {
      return ppiList.filter(item => {
        return filterNama ? item.students?.full_name?.toLowerCase().includes(filterNama.toLowerCase()) : true;
      });
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setFilterNama("");
    setFilterMapel("");
    setTglMulai("");
    setTglSelesai("");
  };

  if (loading) return <div className="text-center p-20 text-white font-sans">Loading Dashboard Psikolog...</div>;

  const displayedData = getFilteredData();

  // Helper cerdas untuk memformat nilai objek/array tanpa kurung kurawal mentah
  const formatValue = (val: any): React.ReactNode => {
    if (val === null || val === undefined) return "-";
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }
    if (Array.isArray(val)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {val.map((item, idx) => (
            <li key={idx}>{formatValue(item)}</li>
          ))}
        </ul>
      );
    }
    if (typeof val === 'object') {
      return (
        <div className="space-y-1.5 pl-3 border-l-2 border-purple-500/40 my-1">
          {Object.entries(val).map(([subKey, subVal]) => (
            <div key={subKey} className="text-xs">
              <span className="font-semibold text-slate-400 capitalize">{subKey.replace(/_/g, ' ')}: </span>
              <span className="text-white">{formatValue(subVal)}</span>
            </div>
          ))}
        </div>
      );
    }
    return String(val);
  };

  const renderExtraData = (item: any, excludedKeys: string[]) => {
    const extraKeys = Object.keys(item).filter(key => !excludedKeys.includes(key) && item[key] !== null && item[key] !== undefined && item[key] !== "");
    if (extraKeys.length === 0) return null;

    return (
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 mt-4">
        <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-2">Informasi Tambahan Lainnya</h4>
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm text-left text-slate-300">
            <tbody className="divide-y divide-slate-700/50">
              {extraKeys.map(key => (
                <tr key={key} className="bg-white/5 hover:bg-white/10 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-400 w-1/3 capitalize align-top">{key.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-white whitespace-pre-wrap">
                    {formatValue(item[key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/30 rounded-2xl">
              <BrainCircuit className="text-purple-400 w-8 h-8"/>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                Dashboard Psikolog - SDIRF
              </h1>
              <p className="text-slate-400 text-sm">Review klinis, analisis perilaku, dan persetujuan dokumen PDBK</p>
            </div>
          </div>

          {/* Tombol Keluar (Log Out) */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600/20 border border-red-500/30 text-red-300 px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all shadow-lg"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-3 border-b border-white/10 pb-4 overflow-x-auto">
          {[ 
            {id: "laporan", label: "Laporan Harian", icon: BookOpen}, 
            {id: "asesmen", label: "Asesmen Awal", icon: ClipboardList}, 
            {id: "ppi", label: "Dokumen PPI", icon: FileText}
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => handleTabChange(tab.id)} 
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg whitespace-nowrap ${
                activeTab === tab.id 
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-white/20 shadow-purple-500/20" 
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <tab.icon className="w-4 h-4"/> {tab.label}
            </button>
          ))}
        </div>

        {/* FILTER AREA & TANGGAL GROUPING KHUSUS LAPORAN HARIAN */}
        {activeTab === "laporan" && (
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Pilih Tanggal Laporan:
              </span>
              {Object.keys(groupedReports).length === 0 ? (
                <p className="text-slate-400 text-xs italic">Belum ada data tanggal laporan harian.</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {Object.keys(groupedReports).sort().reverse().map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md whitespace-nowrap flex items-center gap-1.5 ${
                        selectedDate === date
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-white/30"
                          : "bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>📅</span> {date} <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">({groupedReports[date].length})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl flex-grow lg:flex-grow-0">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Cari nama siswa..." 
                  className="bg-transparent outline-none text-sm w-full lg:w-48 text-white"
                  value={filterNama}
                  onChange={e => setFilterNama(e.target.value)} 
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl flex-grow lg:flex-grow-0">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Mata Pelajaran..." 
                  className="bg-transparent outline-none text-sm w-full lg:w-36 text-white"
                  value={filterMapel}
                  onChange={e => setFilterMapel(e.target.value)} 
                />
              </div>
            </div>
          </div>
        )}

        {activeTab !== "laporan" && (
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-xl flex-grow lg:flex-grow-0">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari nama siswa..." 
                className="bg-transparent outline-none text-sm w-full lg:w-48 text-white"
                value={filterNama}
                onChange={e => setFilterNama(e.target.value)} 
              />
            </div>
          </div>
        )}

        {/* LIST KARTU */}
        {displayedData.length === 0 ? (
          <div className="text-center p-12 bg-white/5 border border-white/10 rounded-3xl">
            <p className="text-slate-400 italic">Tidak ada data yang sesuai dengan pencarian atau tanggal yang dipilih.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedData.map(item => (
              <div 
                key={item.id} 
                onClick={() => { setSelectedItem(item); setModalType(activeTab); setPsikologFeedback(item.catatan_psikolog || ""); }} 
                className="bg-white/5 border border-white/10 hover:border-purple-500/50 p-6 rounded-3xl backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl cursor-pointer transition-all group"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold uppercase">
                      {item.mata_pelajaran || activeTab}
                    </span>
                    <span className="text-xs text-slate-400">{item.tanggal || item.tanggal_assessment || item.periode_ppi}</span>
                  </div>
                  <h3 className="font-bold text-lg text-white group-hover:text-purple-400 transition-colors">
                    {item.students?.full_name || "Siswa Tidak Dikenal"}
                  </h3>
                  <p className="text-xs text-indigo-300 mt-0.5">Pendamping/GPK: {item.profiles?.full_name || item.wali_kelas || "Staf Sekolah"}</p>
                  
                  <div className="mt-4 p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-slate-300">
                    <p className="line-clamp-2 italic">"{item.hasil_pembelajaran || item.permasalahan || item.status || "Klik untuk melihat detail lengkap"}"</p>
                  </div>
                </div>

                {item.catatan_psikolog && (
                  <div className="text-[11px] bg-purple-500/10 border border-purple-500/30 text-purple-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
                    <BrainCircuit className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Catatan Klinis Telah Dibuat
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DETAIL LENGKAP */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/20 rounded-[2.5rem] p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl space-y-6 my-auto">
            
            <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="border-b border-white/10 pb-4">
              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold uppercase tracking-wider border border-purple-500/30">
                Detail {modalType.toUpperCase()}
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-2 flex items-center gap-2">
                <User className="w-6 h-6 text-purple-400" /> {selectedItem.students?.full_name || "Siswa PDBK"}
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-4">
                <span>📅 Tanggal/Periode: {selectedItem.tanggal || selectedItem.tanggal_assessment || selectedItem.periode_ppi || "-"}</span>
                <span>👤 Pendamping/GPK: {selectedItem.profiles?.full_name || selectedItem.wali_kelas || "Staf Sekolah"}</span>
              </p>
            </div>

            {/* Render Data Terstruktur Sesuai Jenis */}
            <div className="space-y-6 text-sm text-slate-300">
              
              {/* === LAPORAN HARIAN === */}
              {modalType === "laporan" && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-blue-400 text-xs uppercase mb-3">Rincian Laporan Pembelajaran</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-sm text-left text-slate-300">
                      <tbody className="divide-y divide-slate-700/50">
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-400 w-1/3 align-top">Mata Pelajaran</td>
                          <td className="px-4 py-3 text-white">{selectedItem.mata_pelajaran || "-"}</td>
                        </tr>
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-400 align-top">Materi Pembelajaran</td>
                          <td className="px-4 py-3 text-white whitespace-pre-wrap">{selectedItem.materi_pembelajaran || "-"}</td>
                        </tr>
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-400 align-top">Target Capaian</td>
                          <td className="px-4 py-3 text-white whitespace-pre-wrap">{selectedItem.target_capaian || "-"}</td>
                        </tr>
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-emerald-400 align-top">Hasil Pembelajaran</td>
                          <td className="px-4 py-3 text-emerald-100 whitespace-pre-wrap">{selectedItem.hasil_pembelajaran || "-"}</td>
                        </tr>
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-amber-400 align-top">Kondisi Mood</td>
                          <td className="px-4 py-3 text-amber-100">{selectedItem.kondisi_mood || "-"}</td>
                        </tr>
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-amber-400 align-top">Catatan Perilaku</td>
                          <td className="px-4 py-3 text-amber-100 whitespace-pre-wrap">{selectedItem.catatan_perilaku || "-"}</td>
                        </tr>
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-indigo-400 align-top">Intervensi Pendamping</td>
                          <td className="px-4 py-3 text-indigo-100 whitespace-pre-wrap">{selectedItem.intervensi_pendamping || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {renderExtraData(selectedItem, ['id', 'student_id', 'created_at', 'students', 'profiles', 'catatan_psikolog', 'mata_pelajaran', 'kondisi_mood', 'materi_pembelajaran', 'target_capaian', 'hasil_pembelajaran', 'catatan_perilaku', 'intervensi_pendamping', 'tanggal', 'feedback_wali'])}
                </div>
              )}

              {/* === ASESMEN AWAL === */}
              {modalType === "asesmen" && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-indigo-400 text-xs uppercase mb-3">Rincian Asesmen Awal PDBK</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-sm text-left text-slate-300">
                      <tbody className="divide-y divide-slate-700/50">
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-400 w-1/3 align-top">Tanggal Asesmen</td>
                          <td className="px-4 py-3 text-white">{selectedItem.tanggal_assessment || "-"}</td>
                        </tr>
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-400 align-top">Status Dokumen</td>
                          <td className="px-4 py-3 text-amber-300 uppercase font-bold">{selectedItem.status || "Aktif"}</td>
                        </tr>
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-purple-400 align-top">Permasalahan Utama / Latar Belakang</td>
                          <td className="px-4 py-3 text-white whitespace-pre-wrap">{selectedItem.permasalahan || "-"}</td>
                        </tr>
                        <tr className="bg-slate-800/80">
                          <td colSpan={2} className="px-4 py-3 font-bold text-indigo-300 uppercase text-xs">Profiling Karakteristik</td>
                        </tr>
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-emerald-400 align-top pl-8">Kelebihan / Kekuatan</td>
                          <td className="px-4 py-3 text-white whitespace-pre-wrap">{selectedItem.profiling?.kelebihan || "-"}</td>
                        </tr>
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-red-400 align-top pl-8">Kekurangan / Hambatan</td>
                          <td className="px-4 py-3 text-white whitespace-pre-wrap">{selectedItem.profiling?.kekurangan || "-"}</td>
                        </tr>
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-blue-400 align-top pl-8">Hal yang Disukai</td>
                          <td className="px-4 py-3 text-white whitespace-pre-wrap">{selectedItem.profiling?.disukai || "-"}</td>
                        </tr>
                        <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-amber-400 align-top pl-8">Hal yang Tidak Disukai</td>
                          <td className="px-4 py-3 text-white whitespace-pre-wrap">{selectedItem.profiling?.tidak_disukai || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {renderExtraData(selectedItem, ['id', 'student_id', 'created_at', 'students', 'profiles', 'catatan_psikolog', 'permasalahan', 'profiling', 'tanggal_assessment', 'status'])}
                </div>
              )}

              {/* === DOKUMEN PPI === */}
              {modalType === "ppi" && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-emerald-400 text-xs uppercase mb-3">Dokumen Program Pembelajaran Individual (PPI)</h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                      <table className="w-full text-sm text-left text-slate-300">
                        <tbody className="divide-y divide-slate-700/50">
                          <tr className="bg-slate-800/80"><td colSpan={2} className="px-4 py-2 font-bold text-slate-300 uppercase text-xs">Identitas & Status Dokumen</td></tr>
                          <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-400 w-1/3 align-top">Periode PPI</td>
                            <td className="px-4 py-3 text-white">{selectedItem.periode_ppi || "-"}</td>
                          </tr>
                          <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-400 align-top">Tahun Ajaran</td>
                            <td className="px-4 py-3 text-white">{selectedItem.tahun_ajaran || "-"}</td>
                          </tr>
                          <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-400 align-top">Wali Kelas</td>
                            <td className="px-4 py-3 text-white">{selectedItem.wali_kelas || "-"}</td>
                          </tr>
                          <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-400 align-top">Status Dokumen / Respon Psikolog</td>
                            <td className="px-4 py-3 text-amber-300 uppercase font-bold">{selectedItem.status || "-"}</td>
                          </tr>

                          <tr className="bg-slate-800/80"><td colSpan={2} className="px-4 py-2 font-bold text-blue-300 uppercase text-xs mt-2">Profil PDBK Saat Ini</td></tr>
                          <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-400 align-top pl-8">Jenis Kebutuhan / Diagnosa</td>
                            <td className="px-4 py-3 text-white whitespace-pre-wrap">{formatValue(selectedItem.profil_pdbk?.jenis_kebutuhan)}</td>
                          </tr>
                          <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-400 align-top pl-8">Karakteristik & Hambatan</td>
                            <td className="px-4 py-3 text-white whitespace-pre-wrap">{formatValue(selectedItem.profil_pdbk?.karakteristik)}</td>
                          </tr>

                          <tr className="bg-slate-800/80"><td colSpan={2} className="px-4 py-2 font-bold text-emerald-300 uppercase text-xs mt-2">Tujuan Target Pembelajaran (SMART)</td></tr>
                          <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-emerald-400 align-top pl-8">Tujuan Jangka Panjang</td>
                            <td className="px-4 py-3 text-white whitespace-pre-wrap">{formatValue(selectedItem.tujuan_smart?.jangka_panjang)}</td>
                          </tr>
                          <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-indigo-400 align-top pl-8">Tujuan Jangka Pendek 1</td>
                            <td className="px-4 py-3 text-white whitespace-pre-wrap">{formatValue(selectedItem.tujuan_smart?.jangka_pendek_1)}</td>
                          </tr>
                          {selectedItem.tujuan_smart?.jangka_pendek_2 && (
                            <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                              <td className="px-4 py-3 font-semibold text-indigo-400 align-top pl-8">Tujuan Jangka Pendek 2</td>
                              <td className="px-4 py-3 text-white whitespace-pre-wrap">{formatValue(selectedItem.tujuan_smart.jangka_pendek_2)}</td>
                            </tr>
                          )}

                          <tr className="bg-slate-800/80"><td colSpan={2} className="px-4 py-2 font-bold text-amber-300 uppercase text-xs mt-2">Layanan & Akomodasi</td></tr>
                          <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-400 align-top pl-8">Modifikasi Kurikulum/Materi</td>
                            <td className="px-4 py-3 text-white whitespace-pre-wrap">{formatValue(selectedItem.layanan_akomodasi?.modifikasi)}</td>
                          </tr>
                          <tr className="bg-white/5 hover:bg-white/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-400 align-top pl-8">Metode & Media Khusus</td>
                            <td className="px-4 py-3 text-white whitespace-pre-wrap">{formatValue(selectedItem.layanan_akomodasi?.metode)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {selectedItem.rencana_evaluasi && selectedItem.rencana_evaluasi.length > 0 && (
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                      <h4 className="font-bold text-purple-400 text-xs uppercase mb-3">Rencana Evaluasi Berkala</h4>
                      <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full text-sm text-left text-slate-300">
                          <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
                            <tr>
                              <th className="px-4 py-3 w-1/4">Periode</th>
                              <th className="px-4 py-3">Bentuk Kegiatan</th>
                              <th className="px-4 py-3 w-1/4">Status / Target</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                            {selectedItem.rencana_evaluasi.map((ev: any, i: number) => (
                              <tr key={i} className="bg-white/5 hover:bg-white/10 transition-colors">
                                <td className="px-4 py-3 font-medium text-indigo-300 align-top">{ev.periode}</td>
                                <td className="px-4 py-3 text-white align-top whitespace-pre-wrap">{ev.kegiatan}</td>
                                <td className="px-4 py-3 font-medium text-amber-300 align-top">{ev.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {renderExtraData(selectedItem, ['id', 'student_id', 'created_at', 'students', 'profiles', 'catatan_psikolog', 'periode_ppi', 'tahun_ajaran', 'wali_kelas', 'status', 'profil_pdbk', 'tujuan_smart', 'layanan_akomodasi', 'rencana_evaluasi', 'ttd_gpk', 'ttd_psikolog', 'ttd_orangtua'])}

                  {/* Panel Respon Psikolog (ACC, Revisi, Butuh Respon) & Tanda Tangan */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 mt-4 space-y-4">
                    <h4 className="font-bold text-slate-400 text-xs uppercase border-b border-white/10 pb-3">Respon & Status Persetujuan Psikolog</h4>
                    
                    {/* Tombol Aksi Respon Psikolog */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button 
                        onClick={() => handleUpdatePpiStatus("ACC")}
                        className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                          selectedItem.status === "ACC" 
                            ? "bg-emerald-600 text-white ring-2 ring-emerald-400" 
                            : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" /> ACC (Setujui)
                      </button>

                      <button 
                        onClick={() => handleUpdatePpiStatus("Revisi")}
                        className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                          selectedItem.status === "Revisi" 
                            ? "bg-amber-600 text-white ring-2 ring-amber-400" 
                            : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        <RefreshCw className="w-4 h-4" /> Minta Revisi
                      </button>

                      <button 
                        onClick={() => handleUpdatePpiStatus("Butuh Respon")}
                        className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                          selectedItem.status === "Butuh Respon" 
                            ? "bg-purple-600 text-white ring-2 ring-purple-400" 
                            : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                        }`}
                      >
                        <AlertCircle className="w-4 h-4" /> Butuh Respon / Tindak Lanjut
                      </button>
                    </div>

                    {/* Status Tanda Tangan Stakeholder */}
                    <div className="grid grid-cols-3 gap-3 text-center text-xs pt-2">
                      <div className={`p-3 rounded-xl border ${selectedItem.ttd_gpk ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        <strong className="block mb-1">GPK Pembuat</strong>
                        {selectedItem.ttd_gpk ? '✅ Disetujui' : '⏳ Menunggu'}
                      </div>
                      <div className={`p-3 rounded-xl border ${selectedItem.ttd_psikolog ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        <strong className="block mb-1">Psikolog</strong>
                        {selectedItem.ttd_psikolog ? '✅ Disetujui' : '⏳ Menunggu'}
                      </div>
                      <div className={`p-3 rounded-xl border ${selectedItem.ttd_orangtua ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        <strong className="block mb-1">Wali Siswa</strong>
                        {selectedItem.ttd_orangtua ? '✅ Disetujui' : '⏳ Menunggu'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Area Catatan Profesional Psikolog */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              <label className="text-sm font-bold text-purple-400 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-400" /> Catatan / Analisis Klinis Psikolog
              </label>
              <textarea 
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-sm text-white h-32 focus:border-purple-500 outline-none transition-all shadow-inner"
                value={psikologFeedback}
                onChange={(e) => setPsikologFeedback(e.target.value)}
                placeholder="Tuliskan analisis psikologis, rekomendasi intervensi, atau catatan klinis untuk tim sekolah..."
              />
              <button 
                onClick={handleSaveFeedback} 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold hover:opacity-90 shadow-lg shadow-purple-900/30 transition-all"
              >
                <Save className="w-5 h-5" /> Simpan Catatan Psikolog
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}