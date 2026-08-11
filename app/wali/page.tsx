"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";
import { Users, LogOut, BookOpen, FileText, CheckCircle, Eye, MessageCircle, X } from "lucide-react";

export default function WaliDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState("");
  const [childInfo, setChildInfo] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("laporan");

  // State Data untuk Wali
  const [reports, setReports] = useState<any[]>([]);
  const [ppiList, setPpiList] = useState<any[]>([]);
  
  // State untuk Modal Detail
  const [selectedPpi, setSelectedPpi] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  // State untuk Input Feedback Harian
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    async function checkWaliAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, info_anak")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.role !== "wali") {
        router.push("/login");
        return;
      }

      setParentName(profile.full_name);
      setChildInfo(profile.info_anak || "Ananda PDBK");

      let foundStudentId = null;
      const { data: studentData } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("wali_id", user.id)
        .maybeSingle();

      if (studentData) {
        foundStudentId = studentData.id;
        setChildInfo(studentData.full_name);
      } else if (profile.info_anak) {
        const { data: altStudent } = await supabase
          .from("students")
          .select("id, full_name")
          .ilike("full_name", `%${profile.info_anak}%`)
          .maybeSingle();
        
        if (altStudent) {
          foundStudentId = altStudent.id;
          setChildInfo(altStudent.full_name);
        }
      }

      setStudentId(foundStudentId);
      
      if (foundStudentId) {
        fetchWaliData(foundStudentId);
      }

      setLoading(false);
    }
    checkWaliAuth();
  }, [router]);

  const fetchWaliData = async (sId: string) => {
    // Mengambil relasi profiles:gpk_id agar nama GPK dapat ditampilkan
    const { data: reportData } = await supabase
      .from("daily_reports")
      .select("*, students(full_name), profiles:gpk_id(full_name)")
      .eq("student_id", sId)
      .order("created_at", { ascending: false });
    if (reportData) setReports(reportData);

    const { data: ppiData } = await supabase
      .from("ppi")
      .select("*, students(full_name)")
      .eq("student_id", sId)
      .order("created_at", { ascending: false });
    if (ppiData) setPpiList(ppiData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSendFeedback = async (reportId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = feedbackInput[reportId];
    if (!text || text.trim() === "") {
      alert("Silakan tulis feedback terlebih dahulu.");
      return;
    }

    const { error } = await supabase
      .from("daily_reports")
      .update({ feedback_wali: text })
      .eq("id", reportId);

    if (error) {
      alert("Gagal mengirim feedback: " + error.message);
    } else {
      alert("Feedback berhasil dikirim ke GPK!");
      if (studentId) fetchWaliData(studentId);
    }
  };

  const handleSignPpi = async (ppiId: string) => {
    const { error } = await supabase
      .from("ppi")
      .update({ ttd_orangtua: true, status: "Disetujui Lengkap" })
      .eq("id", ppiId);

    if (error) {
      alert("Gagal memberikan tanda tangan: " + error.message);
    } else {
      alert("Persetujuan PPI berhasil disimpan!");
      setSelectedPpi((prev: any) => prev ? { ...prev, ttd_orangtua: true, status: "Disetujui Lengkap" } : null);
      if (studentId) fetchWaliData(studentId);
    }
  };

  if (loading) {
    return (
      <div translate="no" className="notranslate min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div translate="no" className="notranslate min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-4 md:p-8 font-sans pb-24">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* HEADER DENGAN LOGO & TAGLINE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl gap-4 shadow-2xl">
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
              <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400 truncate">
                Dashboard Wali Siswa
              </h1>
              <p className="text-[11px] sm:text-xs font-extrabold tracking-wider text-emerald-400 uppercase mt-0.5 mb-1 truncate">
                Future Islamic Leadership School
              </p>
              <p className="text-slate-300 text-xs truncate">
                Wali dari: <strong className="text-white">{childInfo}</strong>
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold flex-shrink-0"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>

        {/* WELCOME CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-white/10 backdrop-blur-xl shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">Selamat Datang, {parentName || "Wali Siswa"}! 👋</h2>
          <p className="text-slate-300 max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed">
            Pantau perkembangan harian ananda di sekolah, lihat catatan capaian dari Guru Pendamping Khusus (GPK), berikan tanggapan/feedback, serta tanda tangani dokumen Program Pembelajaran Individual (PPI).
          </p>
          {!studentId && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
              ⚠️ Akun Anda belum ditautkan ke data siswa tertentu oleh Admin. Silakan hubungi admin sekolah jika laporan belum muncul.
            </div>
          )}
        </div>

        {/* TAB NAVIGASI WALI */}
        <div className="w-full overflow-x-auto scrollbar-none pb-2">
          <div className="flex gap-3 border-b border-white/10 pb-2 min-w-max">
            <button
              onClick={() => setActiveTab("laporan")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all shadow-lg whitespace-nowrap ${
                activeTab === "laporan" 
                  ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white border border-white/20" 
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" /> Laporan Harian Ananda ({reports.length})
            </button>
            <button
              onClick={() => setActiveTab("ppi")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all shadow-lg whitespace-nowrap ${
                activeTab === "ppi" 
                  ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white border border-white/20" 
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" /> Dokumen & Persetujuan PPI ({ppiList.length})
            </button>
          </div>
        </div>

        {/* KONTEN TAB: LAPORAN HARIAN */}
        {activeTab === "laporan" && (
          <div className="flex flex-col gap-6">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400 flex-shrink-0" /> Riwayat Laporan Pembelajaran Harian & Tanggapan Orang Tua
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.length === 0 ? (
                <p className="text-slate-400 text-sm italic col-span-full">Belum ada laporan harian yang diunggah oleh GPK untuk ananda.</p>
              ) : (
                reports.map((r) => (
                  <div 
                    key={r.id} 
                    onClick={() => setSelectedReport(r)}
                    className="bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl cursor-pointer transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold">{r.mata_pelajaran}</span>
                        <span className="text-xs text-slate-400">{r.tanggal}</span>
                      </div>
                      <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Ananda: {r.students?.full_name || childInfo}</h4>
                      
                      {/* Menampilkan Nama Pendamping (GPK) */}
                      <p className="text-xs text-slate-300">
                        Pendamping: <strong className="text-purple-400">{r.profiles?.full_name || r.gpk_name || "-"}</strong>
                      </p>
                      
                      <p className="text-xs text-purple-300">Mood Ananda: {r.kondisi_mood || "Stabil"}</p>
                      
                      <div className="space-y-2 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                        <p className="line-clamp-1"><strong className="text-blue-400">Materi:</strong> {r.materi_pembelajaran}</p>
                        <p className="line-clamp-2"><strong className="text-emerald-400">Hasil:</strong> {r.hasil_pembelajaran}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <label className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-400" /> Feedback / Tanggapan Anda:
                      </label>
                      {r.feedback_wali ? (
                        <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl text-blue-200 text-xs italic">
                          "{r.feedback_wali}"
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input 
                            type="text"
                            placeholder="Tulis tanggapan untuk GPK..."
                            value={feedbackInput[r.id] || ""}
                            onChange={(e) => setFeedbackInput({ ...feedbackInput, [r.id]: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                          />
                          <button 
                            onClick={(e) => handleSendFeedback(r.id, e)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-semibold shadow-lg transition-all"
                          >
                            Kirim Feedback
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* KONTEN TAB: PPI */}
        {activeTab === "ppi" && (
          <div className="flex flex-col gap-6">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" /> Program Pembelajaran Individual (PPI) & Persetujuan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ppiList.length === 0 ? (
                <p className="text-slate-400 text-sm italic col-span-full">Belum ada dokumen PPI yang diterbitkan.</p>
              ) : (
                ppiList.map((p) => (
                  <div key={p.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold uppercase">{p.status}</span>
                        <span className="text-xs text-slate-400">{p.periode_ppi}</span>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">{p.students?.full_name || childInfo}</h4>
                      
                      <div className="space-y-1.5 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 mt-3">
                        <p><strong className="text-slate-400">Wali Kelas:</strong> {p.wali_kelas || "-"}</p>
                        <p><strong className="text-slate-400">TTD GPK:</strong> {p.ttd_gpk ? "✅ Selesai" : "⏳ Menunggu"}</p>
                        <p><strong className="text-slate-400">TTD Psikolog:</strong> {p.ttd_psikolog ? "✅ Disetujui" : "⏳ Menunggu"}</p>
                        <p><strong className="text-slate-400">TTD Orang Tua:</strong> {p.ttd_orangtua ? "✅ Selesai" : "⏳ Belum Tanda Tangan"}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedPpi(p)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-white/10"
                    >
                      <Eye className="w-4 h-4 text-blue-400" /> Lihat Detail & Tanda Tangan
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL POPUP DETAIL LAPORAN HARIAN */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-4 my-auto">
            <button onClick={() => setSelectedReport(null)} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-emerald-400 border-b border-white/10 pb-3 pr-8">Detail Laporan Harian Pembelajaran</h3>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><span className="text-xs text-slate-500 block">Mata Pelajaran</span><strong className="text-blue-400">{selectedReport.mata_pelajaran}</strong></div>
                <div><span className="text-xs text-slate-500 block">Tanggal</span><strong className="text-white">{selectedReport.tanggal}</strong></div>
                <div><span className="text-xs text-slate-500 block">Siswa</span><strong className="text-white">{selectedReport.students?.full_name || childInfo}</strong></div>
                <div><span className="text-xs text-slate-500 block">Pendamping (GPK)</span><strong className="text-purple-400">{selectedReport.profiles?.full_name || selectedReport.gpk_name || "-"}</strong></div>
                <div><span className="text-xs text-slate-500 block">Kondisi Mood</span><strong className="text-purple-300">{selectedReport.kondisi_mood || "Stabil"}</strong></div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div>
                  <h4 className="text-xs uppercase text-slate-400 font-semibold mb-1">Materi Pembelajaran</h4>
                  <p className="text-white bg-white/5 p-3 rounded-lg text-xs sm:text-sm">{selectedReport.materi_pembelajaran || "-"}</p>
                </div>
                <div>
                  <h4 className="text-xs uppercase text-slate-400 font-semibold mb-1">Target Capaian</h4>
                  <p className="text-white bg-white/5 p-3 rounded-lg text-xs sm:text-sm">{selectedReport.target_capaian || "-"}</p>
                </div>
                <div>
                  <h4 className="text-xs uppercase text-emerald-400 font-semibold mb-1">Hasil Pembelajaran</h4>
                  <p className="text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-xs sm:text-sm">{selectedReport.hasil_pembelajaran || "-"}</p>
                </div>
                {selectedReport.catatan_perilaku && (
                  <div>
                    <h4 className="text-xs uppercase text-amber-400 font-semibold mb-1">Catatan Perilaku</h4>
                    <p className="text-amber-200 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs sm:text-sm">{selectedReport.catatan_perilaku}</p>
                  </div>
                )}
                {selectedReport.intervensi_pendamping && (
                  <div>
                    <h4 className="text-xs uppercase text-purple-400 font-semibold mb-1">Intervensi Pendamping</h4>
                    <p className="text-purple-200 bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg text-xs sm:text-sm">{selectedReport.intervensi_pendamping}</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => setSelectedReport(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm">
              Tutup Detail
            </button>
          </div>
        </div>
      )}

      {/* MODAL POPUP DETAIL & TANDA TANGAN PPI */}
      {selectedPpi && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-4 my-auto">
            <button onClick={() => setSelectedPpi(null)} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-blue-400 border-b border-white/10 pb-3 pr-8">Detail Dokumen Program Pembelajaran Individual (PPI)</h3>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><span className="text-xs text-slate-500 block">Periode PPI</span><strong className="text-white">{selectedPpi.periode_ppi}</strong></div>
                <div><span className="text-xs text-slate-500 block">Tahun Ajaran</span><strong className="text-white">{selectedPpi.tahun_ajaran}</strong></div>
                <div><span className="text-xs text-slate-500 block">Wali Kelas</span><strong className="text-white">{selectedPpi.wali_kelas || "-"}</strong></div>
                <div><span className="text-xs text-slate-500 block">Status Dokumen</span><strong className="text-amber-300 uppercase">{selectedPpi.status}</strong></div>
              </div>

              {selectedPpi.profil_pdbk && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs sm:text-sm">
                  <h4 className="font-bold text-blue-400 text-xs uppercase">Profil PDBK</h4>
                  <p><strong>Jenis Kebutuhan:</strong> {selectedPpi.profil_pdbk.jenis_kebutuhan || "-"}</p>
                  <p><strong>Karakteristik & Hambatan:</strong> {selectedPpi.profil_pdbk.karakteristik || "-"}</p>
                </div>
              )}

              {selectedPpi.tujuan_smart && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs sm:text-sm">
                  <h4 className="font-bold text-emerald-400 text-xs uppercase">Tujuan SMART (Target Pembelajaran)</h4>
                  <p><strong>Jangka Panjang:</strong> {selectedPpi.tujuan_smart.jangka_panjang || "-"}</p>
                  <p><strong>Jangka Pendek 1:</strong> {selectedPpi.tujuan_smart.jangka_pendek_1 || "-"}</p>
                  <p><strong>Jangka Pendek 2:</strong> {selectedPpi.tujuan_smart.jangka_pendek_2 || "-"}</p>
                </div>
              )}

              {selectedPpi.layanan_akomodasi && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs sm:text-sm">
                  <h4 className="font-bold text-amber-400 text-xs uppercase">Layanan & Akomodasi Pembelajaran</h4>
                  <p><strong>Modifikasi Kurikulum / Materi:</strong> {selectedPpi.layanan_akomodasi.modifikasi || "-"}</p>
                  <p><strong>Metode & Media Khusus:</strong> {selectedPpi.layanan_akomodasi.metode || "-"}</p>
                </div>
              )}

              {selectedPpi.rencana_evaluasi && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs sm:text-sm">
                  <h4 className="font-bold text-purple-400 text-xs uppercase">Rencana Evaluasi & Asesmen Berkala</h4>
                  {selectedPpi.rencana_evaluasi.map((ev: any, i: number) => (
                    <div key={i} className="text-xs bg-white/5 p-2.5 rounded-lg space-y-1">
                      <p><strong>Periode:</strong> {ev.periode}</p>
                      <p><strong>Bentuk Kegiatan:</strong> {ev.kegiatan}</p>
                      <p><strong>Status:</strong> {ev.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/15">
              {!selectedPpi.ttd_orangtua ? (
                <button 
                  onClick={() => handleSignPpi(selectedPpi.id)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:opacity-90 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-sm"
                >
                  <CheckCircle className="w-5 h-5" /> Berikan Tanda Tangan Digital & Setujui PPI
                </button>
              ) : (
                <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 py-3 rounded-xl font-semibold text-center text-sm">
                  ✅ Anda Telah Menandatangani & Menyetujui Dokumen Ini
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}