"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";
import { 
  FileText, BrainCircuit, CheckCircle2, XCircle, 
  X, Eye, Save, LogOut, BookOpen, Calendar, MessageCircle, ClipboardCheck
} from "lucide-react";

export default function PsikologDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [psikologName, setPsikologName] = useState("");
  const [psikologId, setPsikologId] = useState("");

  const [activeTab, setActiveTab] = useState("asesmen"); // asesmen | ppi | laporan | evaluasi
  
  // State Data
  const [reports, setReports] = useState<any[]>([]);
  const [groupedReports, setGroupedReports] = useState<{ [key: string]: any[] }>({});
  const [selectedReportDate, setSelectedReportDate] = useState<string | null>(null);

  const [assessments, setAssessments] = useState<any[]>([]);
  const [ppiList, setPpiList] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);

  // State Modal Detail & Aksi
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<string>(""); // report | assessment | ppi | evaluation
  const [catatanPsikologInput, setCatatanPsikologInput] = useState("");

  // State Filter Laporan
  const [filterNama, setFilterNama] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [tglMulai, setTglMulai] = useState("");
  const [tglSelesai, setTglSelesai] = useState("");

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkPsikologAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      
      const { data: profile } = await supabase.from("profiles").select("id, full_name, role").eq("id", user.id).maybeSingle();
      if (!profile || profile.role !== "psikolog") { router.push("/login"); return; }
      
      setPsikologId(profile.id);
      setPsikologName(profile.full_name);

      fetchPsikologData();
      setLoading(false);
    }
    checkPsikologAuth();
  }, [router]);

  const fetchPsikologData = async () => {
    const { data: assessData } = await supabase.from("assessments").select("*, students(full_name)").order("created_at", { ascending: false });
    if (assessData) setAssessments(assessData);

    const { data: ppiData } = await supabase.from("ppi").select("*, students(full_name)").order("created_at", { ascending: false });
    if (ppiData) setPpiList(ppiData);

    const { data: evalData } = await supabase.from("evaluation_reports").select("*, students(full_name)").order("created_at", { ascending: false });
    if (evalData) setEvaluations(evalData);

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
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

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

  // Aksi Psikolog: Beri/Edit Catatan pada Laporan Harian
  const handleSaveReportNotes = async (reportId: string) => {
    const { error } = await supabase.from("daily_reports").update({ catatan_psikolog: catatanPsikologInput }).eq("id", reportId);
    if (error) alert("Gagal menyimpan catatan: " + error.message);
    else {
      setMessage("Catatan psikolog pada laporan harian berhasil disimpan!");
      fetchPsikologData();
      setSelectedItem(null);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  // Aksi Psikolog: Beri/Edit Catatan pada Asesmen
  const handleSaveAssessmentNotes = async (assessmentId: string) => {
    const { error } = await supabase.from("assessments").update({ catatan_psikolog: catatanPsikologInput }).eq("id", assessmentId);
    if (error) alert("Gagal menyimpan catatan: " + error.message);
    else {
      setMessage("Catatan psikolog pada asesmen berhasil disimpan!");
      fetchPsikologData();
      setSelectedItem(null);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  // Aksi Psikolog: Validasi TTD & Catatan pada PPI
  const handleValidatePpi = async (ppiId: string, approve: boolean) => {
    const payload = {
      ttd_psikolog: approve,
      catatan_psikolog: catatanPsikologInput,
      status: approve ? "Disetujui Psikolog (Menunggu Wali)" : "Perlu Revisi oleh GPK"
    };
    const { error } = await supabase.from("ppi").update(payload).eq("id", ppiId);
    if (error) alert("Gagal memperbarui PPI: " + error.message);
    else {
      setMessage(approve ? "Dokumen PPI berhasil divalidasi dan disetujui!" : "Status PPI diperbarui.");
      fetchPsikologData();
      setSelectedItem(null);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  // Aksi Psikolog: Beri/Edit Feedback pada Evaluasi 3 Bulanan
  const handleSaveEvaluationFeedback = async (evalId: string) => {
    const { error } = await supabase.from("evaluation_reports").update({ feedback_psikolog: catatanPsikologInput }).eq("id", evalId);
    if (error) alert("Gagal menyimpan feedback evaluasi: " + error.message);
    else {
      setMessage("Feedback psikolog untuk evaluasi 3 bulanan berhasil disimpan!");
      fetchPsikologData();
      setSelectedItem(null);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const displayedReports = getFilteredReports();
  const filteredAssessments = assessments.filter(a => filterNama ? a.students?.full_name?.toLowerCase().includes(filterNama.toLowerCase()) : true);
  const filteredPpi = ppiList.filter(p => filterNama ? p.students?.full_name?.toLowerCase().includes(filterNama.toLowerCase()) : true);
  const filteredEvaluations = evaluations.filter(e => filterNama ? e.students?.full_name?.toLowerCase().includes(filterNama.toLowerCase()) : true);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* HEADER */}
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
              <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 truncate">
                Dashboard Psikolog Sekolah
              </h1>
              <p className="text-[11px] sm:text-xs font-extrabold tracking-wider text-purple-400 uppercase mt-0.5 mb-1 truncate">
                Future Islamic Leadership School
              </p>
              <p className="text-slate-300 text-xs truncate">
                Psikolog: <strong className="text-white">{psikologName}</strong> • Asesmen, PPI, Evaluasi & Layanan PDBK
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold flex-shrink-0">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>

        {message && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-200 text-sm font-semibold text-center">
            {message}
          </div>
        )}

        {/* TAB UTAMA */}
        <div className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
          <button 
            onClick={() => setActiveTab("asesmen")} 
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "asesmen" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            <BrainCircuit className="w-4 h-4" /> Asesmen Awal
          </button>
          <button 
            onClick={() => setActiveTab("ppi")} 
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "ppi" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" /> Dokumen PPI
          </button>
          <button 
            onClick={() => setActiveTab("evaluasi")} 
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "evaluasi" ? "bg-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" /> Evaluasi 3 Bulanan ({evaluations.length})
          </button>
          <button 
            onClick={() => setActiveTab("laporan")} 
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "laporan" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Laporan Harian GPK
          </button>
        </div>

        {/* === TAB 1: ASESMEN AWAL === */}
        {activeTab === "asesmen" && (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-400" /> Monitoring Asesmen Awal PDBK
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssessments.length === 0 ? (
                <p className="text-slate-400 text-sm italic col-span-full">Belum ada data asesmen awal.</p>
              ) : (
                filteredAssessments.map((a) => (
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

                      {a.catatan_psikolog && (
                        <div className="bg-purple-500/15 border border-purple-500/40 p-3 rounded-xl text-purple-200 text-xs space-y-1 shadow-inner">
                          <p className="font-bold flex items-center gap-1 text-purple-300">
                            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> Catatan Anda:
                          </p>
                          <p className="italic text-slate-200">"{a.catatan_psikolog}"</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => { setSelectedItem(a); setModalType("assessment"); setCatatanPsikologInput(a.catatan_psikolog || ""); }}
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

        {/* === TAB 2: DOKUMEN PPI === */}
        {activeTab === "ppi" && (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" /> Monitoring Program Pembelajaran Individual (PPI)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPpi.length === 0 ? (
                <p className="text-slate-400 text-sm italic col-span-full">Belum ada dokumen PPI.</p>
              ) : (
                filteredPpi.map((p) => {
                  const parentFeedback = p.catatan_orangtua || p.feedback_orangtua || p.catatan_wali || p.feedback_wali;
                  return (
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

                        {parentFeedback && (
                          <div className="bg-blue-500/15 border border-blue-500/40 p-3 rounded-xl text-blue-200 text-xs space-y-1 mt-3 shadow-inner">
                            <p className="font-bold flex items-center gap-1 text-blue-300">
                              <MessageCircle className="w-3.5 h-3.5 text-blue-400" /> Tanggapan Orang Tua:
                            </p>
                            <p className="italic text-slate-200">"{parentFeedback}"</p>
                          </div>
                        )}

                        {p.catatan_psikolog && (
                          <div className="bg-purple-500/15 border border-purple-500/40 p-3 rounded-xl text-purple-200 text-xs space-y-1 mt-3 shadow-inner">
                            <p className="font-bold flex items-center gap-1 text-purple-300">
                              <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> Catatan Anda:
                            </p>
                            <p className="italic text-slate-200">"{p.catatan_psikolog}"</p>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => { setSelectedItem(p); setModalType("ppi"); setCatatanPsikologInput(p.catatan_psikolog || ""); }}
                        className="w-full bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-300 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-4"
                      >
                        <Eye className="w-4 h-4" /> Periksa Dokumen PPI Lengkap
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* === TAB 3: EVALUASI 3 BULANAN === */}
        {activeTab === "evaluasi" && (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-teal-400" /> Review & Berikan Feedback Evaluasi 3 Bulanan ({filteredEvaluations.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvaluations.length === 0 ? (
                <p className="text-slate-400 text-sm italic col-span-full">Belum ada laporan evaluasi 3 bulanan dari GPK.</p>
              ) : (
                filteredEvaluations.map((item) => {
                  const hasFeedback = Boolean(item.feedback_psikolog);
                  return (
                    <div key={item.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 font-semibold">Evaluasi 3 Bulanan</span>
                          <span className="text-xs text-slate-400">{item.tanggal_pengisian || "-"}</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1">{item.students?.full_name || "Siswa PDBK"}</h4>
                          <p className="text-xs text-slate-400">GPK: {item.gpk_name || "-"}</p>
                          <p className="text-xs text-purple-300 mt-0.5">Lama Pendampingan: {item.lama_pendampingan || "-"}</p>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="flex justify-between">
                            <span>Status Feedback:</span>
                            <span className={hasFeedback ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                              {hasFeedback ? "✅ Sudah Ada" : "⏳ Belum Ada"}
                            </span>
                          </p>
                        </div>

                        {hasFeedback && (
                          <div className="bg-teal-500/15 border border-teal-500/40 p-3 rounded-xl text-teal-200 text-xs space-y-1 shadow-inner">
                            <p className="font-bold flex items-center gap-1 text-teal-300">
                              <BrainCircuit className="w-3.5 h-3.5 text-teal-400" /> Feedback Anda:
                            </p>
                            <p className="italic text-slate-200">"{item.feedback_psikolog}"</p>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => { setSelectedItem(item); setModalType("evaluation"); setCatatanPsikologInput(item.feedback_psikolog || ""); }}
                        className="w-full bg-teal-600/20 border border-teal-500/30 hover:bg-teal-600/30 text-teal-300 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-4"
                      >
                        <Eye className="w-4 h-4" /> Periksa & Beri Feedback Evaluasi
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* === TAB 4: LAPORAN HARIAN === */}
        {activeTab === "laporan" && (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" /> Rekapitulasi Laporan Harian GPK
            </h3>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nama Siswa</label>
                  <input type="text" placeholder="Cari Nama Siswa..." value={filterNama} onChange={(e) => setFilterNama(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white w-full" />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Mata Pelajaran</label>
                  <input type="text" placeholder="Cari Mata Pelajaran..." value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white w-full" />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Dari Tanggal (Mulai)</label>
                  <input type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white w-full" />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Sampai Tanggal (Selesai)</label>
                  <input type="date" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white w-full" />
                </div>
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

                      {r.catatan_psikolog && (
                        <div className="bg-purple-500/15 border border-purple-500/40 p-3 rounded-xl text-purple-200 text-xs space-y-1 shadow-inner">
                          <p className="font-bold flex items-center gap-1 text-purple-300">
                            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> Catatan Anda:
                          </p>
                          <p className="italic text-slate-200">"{r.catatan_psikolog}"</p>
                        </div>
                      )}

                      {r.feedback_wali && (
                        <div className="bg-blue-500/15 border border-blue-500/40 p-3 rounded-xl text-blue-200 text-xs space-y-1 shadow-inner">
                          <p className="font-bold flex items-center gap-1 text-blue-300">
                            <MessageCircle className="w-3.5 h-3.5 text-blue-400" /> Tanggapan Wali:
                          </p>
                          <p className="italic text-slate-200">"{r.feedback_wali}"</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => { setSelectedItem(r); setModalType("report"); setCatatanPsikologInput(r.catatan_psikolog || ""); }}
                      className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <Eye className="w-4 h-4 text-emerald-400" /> Periksa & Beri Catatan Laporan
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL DETAIL LENGKAP + FEEDBACK PSIKOLOG ================= */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl my-auto space-y-6">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all z-10">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-white uppercase flex items-center gap-2 border-b border-white/10 pb-4 pr-8">
              {modalType === "report" ? ( <><BookOpen className="text-emerald-400 flex-shrink-0"/> Rincian Lengkap Laporan Harian PDBK</> ) : 
               modalType === "assessment" ? ( <><BrainCircuit className="text-purple-400 flex-shrink-0"/> Rincian Lengkap Asesmen Awal PDBK</> ) : 
               modalType === "evaluation" ? ( <><ClipboardCheck className="text-teal-400 flex-shrink-0"/> Review Evaluasi 3 Bulanan (Komparasi)</> ) :
               ( <><FileText className="text-blue-400 flex-shrink-0"/> Rincian Lengkap Dokumen PPI</> )}
            </h3>

            <div className="space-y-6 text-sm text-slate-300">
              
              {/* LAPORAN HARIAN + FORM CATATAN PSIKOLOG */}
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

                  {selectedItem.feedback_wali && (
                    <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-blue-400" /> Tanggapan / Feedback Wali Siswa
                      </h4>
                      <p className="italic text-slate-100">"{selectedItem.feedback_wali}"</p>
                    </div>
                  )}

                  {/* FORM CATATAN PSIKOLOG UNTUK LAPORAN HARIAN */}
                  <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4 text-purple-400" /> Catatan Profesional Psikolog
                    </h4>
                    <textarea 
                      rows={3} 
                      placeholder="Tuliskan catatan atau masukan klinis terkait laporan harian ini..." 
                      value={catatanPsikologInput} 
                      onChange={(e) => setCatatanPsikologInput(e.target.value)} 
                      className="w-full bg-slate-950 border border-purple-500/40 rounded-xl p-3 text-white text-xs" 
                    />
                    <button 
                      onClick={() => handleSaveReportNotes(selectedItem.id)}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all"
                    >
                      <Save className="w-4 h-4" /> Simpan Catatan Laporan Harian
                    </button>
                  </div>
                </div>
              )}

              {/* ASESMEN AWAL LENGKAP + FORM CATATAN PSIKOLOG */}
              {modalType === "assessment" && (
                <div className="space-y-4">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><span className="block text-xs text-slate-500">Nama Siswa</span><strong className="text-white text-base">{selectedItem.students?.full_name}</strong></div>
                    <div><span className="block text-xs text-slate-500">Tanggal Asesmen</span><strong className="text-purple-400 text-base">{selectedItem.tanggal_assessment}</strong></div>
                  </div>

                  {selectedItem.identitas && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Identitas Diri Anak</h4>
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

                  {/* FORM CATATAN PSIKOLOG */}
                  <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4 text-purple-400" /> Catatan Profesional Psikolog
                    </h4>
                    <textarea 
                      rows={3} 
                      placeholder="Tuliskan catatan atau rekomendasi psikolog..." 
                      value={catatanPsikologInput} 
                      onChange={(e) => setCatatanPsikologInput(e.target.value)} 
                      className="w-full bg-slate-950 border border-purple-500/40 rounded-xl p-3 text-white text-xs" 
                    />
                    <button 
                      onClick={() => handleSaveAssessmentNotes(selectedItem.id)}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all"
                    >
                      <Save className="w-4 h-4" /> Simpan Catatan Asesmen
                    </button>
                  </div>
                </div>
              )}

              {/* EVALUASI 3 BULANAN KOMPARASI + FORM FEEDBACK PSIKOLOG */}
              {modalType === "evaluation" && (
                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div><span className="block text-slate-500">Nama Siswa:</span><strong className="text-white text-sm">{selectedItem.students?.full_name}</strong></div>
                    <div><span className="block text-slate-500">Guru Pendamping (GPK):</span><strong className="text-teal-400 text-sm">{selectedItem.gpk_name || "-"}</strong></div>
                    <div><span className="block text-slate-500">Lama Pendampingan:</span><span className="text-white text-sm">{selectedItem.lama_pendampingan || "-"}</span></div>
                    <div><span className="block text-slate-500">Tanggal Pengisian:</span><span className="text-white text-sm">{selectedItem.tanggal_pengisian || "-"}</span></div>
                  </div>

                  <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider mt-4">Rincian Evaluasi 8 Aspek (Kondisi Awal vs Sekarang)</h4>

                  {selectedItem.aspek_data ? (
                    Object.keys(selectedItem.aspek_data)
                      .sort((a, b) => {
                        const urutan = ["sensori_motorik", "kognitif", "bahasa_komunikasi", "sosial", "emosi", "membaca", "menulis", "berhitung"];
                        const indexA = urutan.indexOf(a.toLowerCase());
                        const indexB = urutan.indexOf(b.toLowerCase());
                        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
                      })
                      .map((aspekKey) => (
                      <div key={aspekKey} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{aspekKey.replace(/_/g, " ")}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.keys(selectedItem.aspek_data[aspekKey]).map((indKey) => {
                            const ind = selectedItem.aspek_data[aspekKey][indKey];
                            return (
                              <div key={indKey} className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                                <span className="font-bold text-blue-300 block uppercase border-b border-slate-800 pb-1.5">{indKey.replace(/_/g, " ")}</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-slate-500 block text-[10px] mb-0.5">Kondisi Awal:</span>
                                    <p className="text-slate-300 whitespace-pre-wrap">{ind.kondisi_awal || "-"}</p>
                                  </div>
                                  <div>
                                    <span className="text-emerald-500 block text-[10px] mb-0.5">Kondisi Sekarang:</span>
                                    <p className="text-emerald-100 whitespace-pre-wrap">{ind.kondisi_sekarang || "-"}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                      <p className="text-slate-400 text-xs italic">Data format tabel komparasi tidak tersedia.</p>
                    </div>
                  )}

                  {/* FORM FEEDBACK PSIKOLOG UNTUK EVALUASI 3 BULANAN */}
                  <div className="bg-teal-500/10 border border-teal-500/30 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4 text-teal-400" /> Feedback & Masukan Profesional Psikolog
                    </h4>
                    <p className="text-[11px] text-slate-400">Feedback ini wajib diisi agar laporan evaluasi dapat dikonfirmasi dan dikirimkan kepada orang tua oleh Admin.</p>
                    <textarea 
                      rows={3} 
                      placeholder="Tuliskan feedback psikolog terhadap perkembangan 3 bulanan siswa..." 
                      value={catatanPsikologInput} 
                      onChange={(e) => setCatatanPsikologInput(e.target.value)} 
                      className="w-full bg-slate-950 border border-teal-500/40 rounded-xl p-3 text-white text-xs" 
                    />
                    <button 
                      onClick={() => handleSaveEvaluationFeedback(selectedItem.id)}
                      className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all"
                    >
                      <Save className="w-4 h-4" /> Simpan Feedback Evaluasi 3 Bulanan
                    </button>
                  </div>
                </div>
              )}

              {/* DOKUMEN PPI LENGKAP + VALIDASI */}
              {modalType === "ppi" && (
                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div><span className="block text-xs text-slate-500">Nama Siswa</span><strong className="text-white text-base">{selectedItem.students?.full_name}</strong></div>
                    <div className="text-left sm:text-right"><span className="block text-xs text-slate-500">Status Validasi</span><span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-xs uppercase mt-1 inline-block">{selectedItem.status}</span></div>
                  </div>

                  {selectedItem.profil_pdbk && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Profil PDBK</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div><span className="text-slate-500">Nama:</span> {selectedItem.profil_pdbk.nama || "-"}</div>
                        <div><span className="text-slate-500">Kelas/Usia:</span> {selectedItem.profil_pdbk.kelas_usia || "-"}</div>
                        <div><span className="text-slate-500">Jenis Kebutuhan:</span> {selectedItem.profil_pdbk.jenis_kebutuhan || "-"}</div>
                      </div>
                    </div>
                  )}

                  {/* FORM VALIDASI & CATATAN PPI PSIKOLOG */}
                  <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-400" /> Validasi & Catatan Psikolog untuk PPI
                    </h4>
                    <textarea 
                      rows={3} 
                      placeholder="Tuliskan catatan atau masukan terkait PPI..." 
                      value={catatanPsikologInput} 
                      onChange={(e) => setCatatanPsikologInput(e.target.value)} 
                      className="w-full bg-slate-950 border border-blue-500/40 rounded-xl p-3 text-white text-xs" 
                    />
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button 
                        onClick={() => handleValidatePpi(selectedItem.id, true)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Setujui & TTD Dokumen PPI
                      </button>
                      <button 
                        onClick={() => handleValidatePpi(selectedItem.id, false)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <XCircle className="w-4 h-4" /> Minta Revisi GPK
                      </button>
                    </div>
                  </div>
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