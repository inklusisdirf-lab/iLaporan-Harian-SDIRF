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

  const [activeTab, setActiveTab] = useState("asesmen"); // asesmen | ppi | evaluasi | laporan
  
  // State Data
  const [reports, setReports] = useState<any[]>([]);
  const [groupedReports, setGroupedReports] = useState<{ [key: string]: any[] }>({});
  const [selectedReportDate, setSelectedReportDate] = useState<string | null>(null);

  const [assessments, setAssessments] = useState<any[]>([]);
  const [ppiList, setPpiList] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);

  // State Modal Detail & Aksi
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<string>(""); 
  const [catatanPsikologInput, setCatatanPsikologInput] = useState("");

  // State Filter
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

  // PENGAMBILAN DATA
  const fetchPsikologData = async () => {
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

    const { data: evalData } = await supabase
      .from("evaluation_reports")
      .select("*, students(full_name)")
      .order("created_at", { ascending: false });
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
      if (dates.length > 0) setSelectedReportDate(dates[0]);
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

  const handleSaveAssessmentNotes = async (assessmentId: string) => {
    const { error } = await supabase.from("assessments").update({ catatan_psikolog: catatanPsikologInput }).eq("id", assessmentId);
    if (error) alert("Gagal menyimpan catatan: " + error.message);
    else {
      setMessage("Catatan psikolog berhasil disimpan!");
      fetchPsikologData();
      setSelectedItem(null);
      setTimeout(() => setMessage(""), 4000);
    }
  };

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
                Psikolog: <strong className="text-white">{psikologName}</strong> | Asesmen, Temuan Lapangan, PPI, & Evaluasi PDBK
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
            <BrainCircuit className="w-4 h-4" /> Asesmen & Temuan Lapangan ({filteredAssessments.length})
          </button>
          <button 
            onClick={() => setActiveTab("ppi")} 
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "ppi" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" /> Dokumen PPI ({filteredPpi.length})
          </button>
          <button 
            onClick={() => setActiveTab("evaluasi")} 
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "evaluasi" ? "bg-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" /> Evaluasi 3 Bulanan ({filteredEvaluations.length})
          </button>
          <button 
            onClick={() => setActiveTab("laporan")} 
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "laporan" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Laporan Harian GPK ({displayedReports.length})
          </button>
        </div>

        {/* === TAB 1: ASESMEN & TEMUAN LAPANGAN === */}
        {activeTab === "asesmen" && (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-400" /> Data Asesmen & Temuan Lapangan ({filteredAssessments.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssessments.length === 0 ? (
                <p className="text-slate-400 text-sm italic col-span-full">Belum ada data asesmen atau temuan lapangan.</p>
              ) : (
                filteredAssessments.map((a) => (
                  <div key={a.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">Asesmen / Temuan</span>
                        <span className="text-xs text-slate-400">{a.tanggal_assessment || a.created_at?.split('T')[0] || "-"}</span>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">{a.students?.full_name || "Siswa PDBK"}</h4>
                      
                      <div className="space-y-2 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                        <p className="line-clamp-3"><strong>Permasalahan / Temuan:</strong> {a.permasalahan || a.deskripsi || a.catatan || JSON.stringify(a)}</p>
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
                      <Eye className="w-4 h-4" /> Periksa Lengkap
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB PPI */}
        {activeTab === "ppi" && (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" /> Monitoring Program Pembelajaran Individual (PPI) ({filteredPpi.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPpi.length === 0 ? (
                <p className="text-slate-400 text-sm italic col-span-full">Belum ada dokumen PPI.</p>
              ) : (
                filteredPpi.map((p) => (
                  <div key={p.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold uppercase">{p.status}</span>
                        <span className="text-xs text-slate-400">{p.periode_ppi}</span>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">{p.students?.full_name || "Siswa"}</h4>
                    </div>
                    <button 
                      onClick={() => { setSelectedItem(p); setModalType("ppi"); setCatatanPsikologInput(p.catatan_psikolog || ""); }}
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

        {/* TAB EVALUASI */}
        {activeTab === "evaluasi" && (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-teal-400" /> Review & Berikan Feedback Evaluasi 3 Bulanan ({filteredEvaluations.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvaluations.length === 0 ? (
                <p className="text-slate-400 text-sm italic col-span-full">Belum ada laporan evaluasi 3 bulanan dari GPK.</p>
              ) : (
                filteredEvaluations.map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">{item.students?.full_name || "Siswa PDBK"}</h4>
                      <p className="text-xs text-slate-400">GPK: {item.gpk_name || "-"}</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedItem(item); setModalType("evaluation"); setCatatanPsikologInput(item.feedback_psikolog || ""); }}
                      className="w-full bg-teal-600/20 border border-teal-500/30 hover:bg-teal-600/30 text-teal-300 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-4"
                    >
                      <Eye className="w-4 h-4" /> Periksa & Beri Feedback Evaluasi
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB LAPORAN HARIAN */}
        {activeTab === "laporan" && (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" /> Rekapitulasi Laporan Harian GPK ({displayedReports.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedReports.length === 0 ? (
                <p className="text-slate-400 text-sm italic col-span-full">Tidak ada laporan harian pada filter yang dipilih.</p>
              ) : (
                displayedReports.map((r) => (
                  <div key={r.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">{r.students?.full_name || "Siswa"}</h4>
                      <p className="text-xs text-slate-300">Materi: {r.materi_pembelajaran}</p>
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

      {/* MODAL DETAIL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl my-auto space-y-6">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-2 rounded-full z-10">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-white uppercase flex items-center gap-2 border-b border-white/10 pb-4 pr-8">
              {modalType === "assessment" ? "Rincian Asesmen & Temuan Lapangan" : 
               modalType === "evaluation" ? "Review Evaluasi 3 Bulanan" : 
               modalType === "ppi" ? "Dokumen PPI" : "Rincian Laporan Harian"}
            </h3>

            <div className="space-y-4 text-sm text-slate-300">
              <p><strong>Siswa:</strong> {selectedItem.students?.full_name}</p>
              <p><strong>Isi Data Lengkap:</strong></p>
              <pre className="bg-slate-950 p-4 rounded-xl text-xs text-white overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(selectedItem, null, 2)}
              </pre>

              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="text-xs font-bold text-purple-300">Catatan / Feedback Psikolog:</label>
                <textarea 
                  rows={3} 
                  value={catatanPsikologInput} 
                  onChange={(e) => setCatatanPsikologInput(e.target.value)} 
                  className="w-full bg-slate-950 border border-purple-500/40 rounded-xl p-3 text-white text-xs" 
                />
                <button 
                  onClick={() => {
                    if (modalType === "evaluation") handleSaveEvaluationFeedback(selectedItem.id);
                    else if (modalType === "report") handleSaveReportNotes(selectedItem.id);
                    else if (modalType === "ppi") handleValidatePpi(selectedItem.id, true);
                    else handleSaveAssessmentNotes(selectedItem.id);
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Simpan Catatan / Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}