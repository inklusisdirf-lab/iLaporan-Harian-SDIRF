"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";
import { 
  BookOpen, FileText, PlusCircle, LogOut, 
  BrainCircuit, Save, UserCheck, Edit3, Trash2, X, Eye, Plus, Minus, Users
} from "lucide-react";

export default function GpkDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gpkName, setGpkName] = useState("");
  const [gpkId, setGpkId] = useState("");

  const [activeTab, setActiveTab] = useState("laporan-harian");
  const [laporanSubTab, setLaporanSubTab] = useState("tambah");
  const [ppiSubTab, setPpiSubTab] = useState("form-asesmen");

  // State Modal Detail
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<string>("");

  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [isRollingMode, setIsRollingMode] = useState(false); 
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // State Form Laporan Harian
  const [editReportId, setEditReportId] = useState<string | null>(null);
  const [mataPelajaran, setMataPelajaran] = useState("");
  const [materi, setMateri] = useState("");
  const [targetCapaian, setTargetCapaian] = useState("");
  const [hasilPembelajaran, setHasilPembelajaran] = useState("");
  const [catatanPerilaku, setCatatanPerilaku] = useState("");
  const [intervensi, setIntervensi] = useState("");
  const [kondisiMood, setKondisiMood] = useState("Senang / Kooperatif");

  // State Form Asesmen Awal
  const [editAssessmentId, setEditAssessmentId] = useState<string | null>(null);
  const [identitas, setIdentitas] = useState({ nama_anak: "", tanggal_lahir: "", kelas: "", alamat: "", nama_ibu: "", nama_ayah: "", urutan_kelahiran: "" });
  const [tglAssessment, setTglAssessment] = useState("");
  const [permasalahan, setPermasalahan] = useState("");
  const [metode, setMetode] = useState({ observasi: "", wawancara: "", psikotes: "", data_pendukung: "" });
  const [profiling, setProfiling] = useState({ kelebihan: "", kekurangan: "", disukai: "", tidak_disukai: "" });
  const [kognitif, setKognitif] = useState({ daya_tangkap: "", fokus: "", konsentrasi: "", mengingat: "", membaca: "", menulis: "", berhitung: "" });
  const [bahasa, setBahasa] = useState({ reseptif: "", ekspresif: "", fonologi: "" });
  const [kemandirian, setKemandirian] = useState({ motorik_kasar: "", motorik_halus: "", keseimbangan: "", kontrol_sendi: "" });
  const [sosial, setSosial] = useState({ adaptasi: "", interaksi: "", problem_solving: "" });
  const [emosi, setEmosi] = useState({ kontrol_emosi: "" });

  // State Form PPI
  const [editPpiId, setEditPpiId] = useState<string | null>(null);
  const [profilPdbk, setProfilPdbk] = useState({ nama: "", kelas_usia: "", jenis_kebutuhan: "", sekolah: "SD Islam Roushon Fikr" });
  const [waliKelas, setWaliKelas] = useState("");
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [periodePpi, setPeriodePpi] = useState("");
  const [kemampuanSaatIni, setKemampuanSaatIni] = useState({ kekuatan: "", area_pengembangan: "" });
  const [tujuanSmart, setTujuanSmart] = useState({ jangka_panjang: "", jangka_pendek_1: "", jangka_pendek_2: "", jangka_pendek_3: "" });
  const [layananAkomodasi, setLayananAkomodasi] = useState({ modifikasi: "", media: "", komunikasi: "", tugas: "", pendamping: "", kolaborasi: "" });
  
  const [rencanaEvaluasi, setRencanaEvaluasi] = useState<{ periode: string, kegiatan: string, status: string }[]>([
    { periode: "", kegiatan: "", status: "Aktif" }
  ]);
  
  const [ttdGpk, setTtdGpk] = useState(false);

  // Riwayat Data
  const [myReports, setMyReports] = useState<any[]>([]);
  const [myAssessments, setMyAssessments] = useState<any[]>([]);
  const [myPpi, setMyPpi] = useState<any[]>([]);

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkGpkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      
      const { data: profile } = await supabase.from("profiles").select("id, full_name, role").eq("id", user.id).maybeSingle();
      if (!profile || profile.role !== "gpk") { router.push("/login"); return; }
      
      setGpkId(profile.id); 
      setGpkName(profile.full_name);

      const { data: allStudentsData } = await supabase.from("students").select("*");
      if (allStudentsData) {
        setAllStudents(allStudentsData);
        const mine = allStudentsData.filter(s => s.gpk_id === profile.id);
        setAssignedStudents(mine);
      }

      fetchGpkHistory(profile.id);
      setLoading(false);
    }
    checkGpkAuth();
  }, [router]);

  const fetchGpkHistory = async (id: string) => {
    const { data: repData } = await supabase.from("daily_reports").select("*, students(full_name)").eq("gpk_id", id).order("created_at", { ascending: false });
    if (repData) setMyReports(repData);
    const { data: assessData } = await supabase.from("assessments").select("*, students(full_name)").eq("gpk_id", id).order("created_at", { ascending: false });
    if (assessData) setMyAssessments(assessData);
    const { data: ppiData } = await supabase.from("ppi").select("*, students(full_name)").eq("gpk_id", id).order("created_at", { ascending: false });
    if (ppiData) setMyPpi(ppiData);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  const addEvaluasiRow = () => setRencanaEvaluasi([...rencanaEvaluasi, { periode: "", kegiatan: "", status: "Aktif" }]);
  const removeEvaluasiRow = (index: number) => setRencanaEvaluasi(rencanaEvaluasi.filter((_, i) => i !== index));
  const updateEvaluasiRow = (index: number, field: string, value: string) => {
    const newEvaluasi = [...rencanaEvaluasi];
    newEvaluasi[index] = { ...newEvaluasi[index], [field]: value };
    setRencanaEvaluasi(newEvaluasi);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return alert("Pilih siswa terlebih dahulu!");
    const payload = { student_id: selectedStudentId, gpk_id: gpkId, mata_pelajaran: mataPelajaran, materi_pembelajaran: materi, target_capaian: targetCapaian, hasil_pembelajaran: hasilPembelajaran, catatan_perilaku: catatanPerilaku, intervensi_pendamping: intervensi, kondisi_mood: kondisiMood };
    if (editReportId) {
      const { error } = await supabase.from("daily_reports").update(payload).eq("id", editReportId);
      if (error) alert("Gagal update laporan: " + error.message);
      else { setMessage("Laporan harian berhasil diperbarui!"); setEditReportId(null); resetReportForm(); fetchGpkHistory(gpkId); setTimeout(() => setMessage(""), 4000); }
    } else {
      const { error } = await supabase.from("daily_reports").insert([payload]);
      if (error) alert("Gagal: " + error.message);
      else { setMessage("Laporan harian berhasil disimpan!"); resetReportForm(); fetchGpkHistory(gpkId); setTimeout(() => setMessage(""), 4000); }
    }
  };

  const handleEditReport = (r: any) => {
    setEditReportId(r.id); setSelectedStudentId(r.student_id); setMataPelajaran(r.mata_pelajaran); setMateri(r.materi_pembelajaran); setTargetCapaian(r.target_capaian); setHasilPembelajaran(r.hasil_pembelajaran); setCatatanPerilaku(r.catatan_perilaku || ""); setIntervensi(r.intervensi_pendamping || ""); setKondisiMood(r.kondisi_mood || "Senang / Kooperatif"); setLaporanSubTab("tambah");
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm("Yakin ingin menghapus laporan ini?")) return;
    const { error } = await supabase.from("daily_reports").delete().eq("id", id);
    if (error) alert("Gagal menghapus: " + error.message);
    else { setMessage("Laporan berhasil dihapus."); fetchGpkHistory(gpkId); setTimeout(() => setMessage(""), 3000); }
  };

  const resetReportForm = () => { setMataPelajaran(""); setMateri(""); setTargetCapaian(""); setHasilPembelajaran(""); setCatatanPerilaku(""); setIntervensi(""); setSelectedStudentId(""); };

  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return alert("Pilih siswa terlebih dahulu!");
    const payload = { student_id: selectedStudentId, gpk_id: gpkId, tanggal_assessment: tglAssessment, identitas, permasalahan, metode_hasil: metode, profiling, temuan_lapangan: { kognitif, bahasa, kemandirian, sosial, emosi } };
    if (editAssessmentId) {
      const { error } = await supabase.from("assessments").update(payload).eq("id", editAssessmentId);
      if (error) alert("Gagal update asesmen: " + error.message);
      else { setMessage("Asesmen awal berhasil diperbarui!"); setEditAssessmentId(null); resetAssessmentForm(); fetchGpkHistory(gpkId); setTimeout(() => setMessage(""), 4000); }
    } else {
      const { error } = await supabase.from("assessments").insert([payload]);
      if (error) alert("Gagal menyimpan asesmen: " + error.message);
      else { setMessage("Asesmen awal berhasil disimpan!"); resetAssessmentForm(); fetchGpkHistory(gpkId); setTimeout(() => setMessage(""), 4000); }
    }
  };

  const handleEditAssessment = (a: any) => {
    setEditAssessmentId(a.id); setSelectedStudentId(a.student_id); setTglAssessment(a.tanggal_assessment || "");
    setIdentitas(a.identitas || { nama_anak: "", tanggal_lahir: "", kelas: "", alamat: "", nama_ibu: "", nama_ayah: "", urutan_kelahiran: "" });
    setPermasalahan(a.permasalahan || "");
    setMetode(a.metode_hasil || { observasi: "", wawancara: "", psikotes: "", data_pendukung: "" });
    setProfiling(a.profiling || { kelebihan: "", kekurangan: "", disukai: "", tidak_disukai: "" });
    if (a.temuan_lapangan) {
      setKognitif(a.temuan_lapangan.kognitif || { daya_tangkap: "", fokus: "", konsentrasi: "", mengingat: "", membaca: "", menulis: "", berhitung: "" });
      setBahasa(a.temuan_lapangan.bahasa || { reseptif: "", ekspresif: "", fonologi: "" });
      setKemandirian(a.temuan_lapangan.kemandirian || { motorik_kasar: "", motorik_halus: "", keseimbangan: "", kontrol_sendi: "" });
      setSosial(a.temuan_lapangan.sosial || { adaptasi: "", interaksi: "", problem_solving: "" });
      setEmosi(a.temuan_lapangan.emosi || { kontrol_emosi: "" });
    }
    setPpiSubTab("form-asesmen");
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm("Yakin ingin menghapus dokumen asesmen ini?")) return;
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (error) alert("Gagal menghapus: " + error.message);
    else { setMessage("Asesmen berhasil dihapus."); fetchGpkHistory(gpkId); setTimeout(() => setMessage(""), 3000); }
  };

  const resetAssessmentForm = () => { setTglAssessment(""); setPermasalahan(""); setSelectedStudentId(""); };

  const handleSubmitPpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return alert("Pilih siswa terlebih dahulu!");
    const payload = { student_id: selectedStudentId, gpk_id: gpkId, profil_pdbk: profilPdbk, wali_kelas: waliKelas, tahun_ajaran: tahunAjaran, periode_ppi: periodePpi, kemampuan_saat_ini: kemampuanSaatIni, tujuan_smart: tujuanSmart, layanan_akomodasi: layananAkomodasi, rencana_evaluasi: rencanaEvaluasi, ttd_gpk: ttdGpk };
    if (editPpiId) {
      const { error } = await supabase.from("ppi").update(payload).eq("id", editPpiId);
      if (error) alert("Gagal update PPI: " + error.message);
      else { setMessage("Dokumen PPI berhasil diperbarui!"); setEditPpiId(null); fetchGpkHistory(gpkId); setTimeout(() => setMessage(""), 4000); }
    } else {
      const { error } = await supabase.from("ppi").insert([{ ...payload, ttd_psikolog: false, ttd_orangtua: false, status: "Menunggu Persetujuan Psikolog & Wali" }]);
      if (error) alert("Gagal menyimpan PPI: " + error.message);
      else { setMessage("Dokumen PPI berhasil diajukan!"); fetchGpkHistory(gpkId); setTimeout(() => setMessage(""), 4000); }
    }
  };

  const handleEditPpi = (p: any) => {
    setEditPpiId(p.id); setSelectedStudentId(p.student_id); setWaliKelas(p.wali_kelas || ""); setTahunAjaran(p.tahun_ajaran || ""); setPeriodePpi(p.periode_ppi || "");
    setProfilPdbk(p.profil_pdbk || { nama: "", kelas_usia: "", jenis_kebutuhan: "", sekolah: "SD Islam Roushon Fikr" });
    setKemampuanSaatIni(p.kemampuan_saat_ini || { kekuatan: "", area_pengembangan: "" });
    setTujuanSmart(p.tujuan_smart || { jangka_panjang: "", jangka_pendek_1: "", jangka_pendek_2: "", jangka_pendek_3: "" });
    setLayananAkomodasi(p.layanan_akomodasi || { modifikasi: "", media: "", komunikasi: "", tugas: "", pendamping: "", kolaborasi: "" });
    setRencanaEvaluasi(p.rencana_evaluasi || [{ periode: "", kegiatan: "", status: "Aktif" }]);
    setTtdGpk(p.ttd_gpk || false);
    setPpiSubTab("form-ppi");
  };

  const handleDeletePpi = async (id: string) => {
    if (!confirm("Yakin ingin menghapus dokumen PPI ini?")) return;
    const { error } = await supabase.from("ppi").delete().eq("id", id);
    if (error) alert("Gagal menghapus: " + error.message);
    else { setMessage("Dokumen PPI berhasil dihapus."); fetchGpkHistory(gpkId); setTimeout(() => setMessage(""), 3000); }
  };

  if (loading) return ( <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> );

  const studentOptionsList = isRollingMode ? allStudents : assignedStudents;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-4 md:p-8 font-sans pb-24 overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 w-full">
        
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
              <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 truncate">
                Dashboard GPK
              </h1>
              <p className="text-[11px] sm:text-xs font-extrabold tracking-wider text-emerald-400 uppercase mt-0.5 mb-1 truncate">
                Future Islamic Leadership School
              </p>
              <p className="text-slate-300 text-xs truncate">
                Pendamping: <strong className="text-white">{gpkName}</strong> • Inklusi & ABK
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

        {/* TAB UTAMA (SCROLLABLE & TIDAK OVERFLOW) */}
        <div className="w-full overflow-x-auto scrollbar-none pb-2">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-2 min-w-max">
            {[
              { id: "laporan-harian", label: "Laporan Harian PDBK", icon: BookOpen },
              { id: "ppi-asesmen", label: "Asesmen & PPI Detail", icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all shadow-lg whitespace-nowrap flex-shrink-0 ${
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
        </div>

        {/* === TAB 1: LAPORAN HARIAN === */}
        {activeTab === "laporan-harian" && (
          <div className="flex flex-col gap-6">
            <div className="w-full overflow-x-auto scrollbar-none pb-1">
              <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-max">
                <button onClick={() => { setEditReportId(null); resetReportForm(); setLaporanSubTab("tambah"); }} className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${laporanSubTab === "tambah" ? "bg-blue-600 text-white" : "text-slate-400"}`}>
                  {editReportId ? "✏️ Edit Laporan" : "+ Tambah Laporan"}
                </button>
                <button onClick={() => setLaporanSubTab("riwayat")} className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${laporanSubTab === "riwayat" ? "bg-blue-600 text-white" : "text-slate-400"}`}>📜 Riwayat ({myReports.length})</button>
              </div>
            </div>

            {laporanSubTab === "tambah" && (
              <form onSubmit={handleSubmitReport} className="bg-white/5 border border-white/10 p-5 sm:p-8 rounded-3xl backdrop-blur-xl flex flex-col gap-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-blue-400 flex-shrink-0" /> 
                    <span>{editReportId ? "Edit Laporan Harian Pendampingan" : "Form Input Laporan Harian"}</span>
                  </h3>
                  
                  <label className="flex items-center gap-2 bg-slate-900 border border-blue-500/40 px-3.5 py-2 rounded-xl cursor-pointer shadow-md w-full sm:w-auto">
                    <input 
                      type="checkbox" 
                      checked={isRollingMode} 
                      onChange={(e) => setIsRollingMode(e.target.checked)} 
                      className="w-4 h-4 text-blue-600 rounded flex-shrink-0" 
                    />
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5 whitespace-nowrap">
                      <Users className="w-3.5 h-3.5" /> Mode Rolling (Semua Siswa)
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Nama Siswa PDBK</label>
                    <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} required className="bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm w-full">
                      <option value="">-- Pilih Siswa --</option>
                      {studentOptionsList.map((s) => (
                        <option key={s.id} value={s.id}>{s.full_name} ({s.kelas || "Inklusi"})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Mata Pelajaran</label>
                    <input type="text" placeholder="Contoh: Matematika" value={mataPelajaran} onChange={(e) => setMataPelajaran(e.target.value)} required className="bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm w-full" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Kondisi Mood</label>
                    <select value={kondisiMood} onChange={(e) => setKondisiMood(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm w-full">
                      <option value="Senang / Kooperatif">Senang / Kooperatif</option>
                      <option value="Kurang Fokus / Bad Mood">Kurang Fokus / Bad Mood</option>
                      <option value="Butuh Pendampingan Ekstra">Butuh Pendampingan Ekstra</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Materi Pembelajaran</label>
                    <textarea rows={3} value={materi} onChange={(e) => setMateri(e.target.value)} required className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm w-full" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Target Capaian</label>
                    <textarea rows={3} value={targetCapaian} onChange={(e) => setTargetCapaian(e.target.value)} required className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm w-full" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-emerald-400 uppercase">Hasil Pembelajaran</label>
                    <textarea rows={3} value={hasilPembelajaran} onChange={(e) => setHasilPembelajaran(e.target.value)} required className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 text-white text-sm w-full" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Catatan Perilaku</label>
                    <textarea rows={3} value={catatanPerilaku} onChange={(e) => setCatatanPerilaku(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm w-full" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Intervensi Pendamping</label>
                    <textarea rows={3} value={intervensi} onChange={(e) => setIntervensi(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm w-full" />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" /> {editReportId ? "Perbarui Laporan Harian" : "Simpan Laporan Harian"}
                  </button>
                  {editReportId && (
                    <button type="button" onClick={() => { setEditReportId(null); resetReportForm(); }} className="bg-slate-800 hover:bg-slate-700 px-6 rounded-xl text-sm font-semibold">
                      Batal
                    </button>
                  )}
                </div>
              </form>
            )}

            {laporanSubTab === "riwayat" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myReports.length === 0 ? (
                  <p className="text-slate-400 text-sm italic col-span-full">Belum ada riwayat laporan harian.</p>
                ) : (
                  myReports.map((r) => (
                    <div key={r.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">{r.mata_pelajaran}</span>
                          <span className="text-xs text-slate-400">{r.tanggal}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1">{r.students?.full_name}</h4>
                        <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl mb-3 line-clamp-2"><strong>Materi:</strong> {r.materi_pembelajaran}</p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-white/10">
                        <button onClick={() => { setSelectedItem(r); setModalType("report"); }} className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all">
                          <Eye className="w-4 h-4" /> Detail
                        </button>
                        <button onClick={() => handleEditReport(r)} className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDeleteReport(r.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* === TAB 2: ASESMEN & PPI DETAIL === */}
        {activeTab === "ppi-asesmen" && (
          <div className="flex flex-col gap-6">
            <div className="w-full overflow-x-auto scrollbar-none pb-1">
              <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-max">
                <button onClick={() => setPpiSubTab("form-asesmen")} className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${ppiSubTab === "form-asesmen" ? "bg-purple-600 text-white" : "text-slate-400"}`}>📝 Form Asesmen</button>
                <button onClick={() => setPpiSubTab("riwayat-asesmen")} className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${ppiSubTab === "riwayat-asesmen" ? "bg-purple-600 text-white" : "text-slate-400"}`}>📚 Riwayat Asesmen ({myAssessments.length})</button>
                <button onClick={() => setPpiSubTab("form-ppi")} className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${ppiSubTab === "form-ppi" ? "bg-purple-600 text-white" : "text-slate-400"}`}>📋 Form PPI</button>
                <button onClick={() => setPpiSubTab("riwayat-ppi")} className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${ppiSubTab === "riwayat-ppi" ? "bg-purple-600 text-white" : "text-slate-400"}`}>📑 Riwayat PPI ({myPpi.length})</button>
              </div>
            </div>

            {/* FORM ASESMEN AWAL */}
            {ppiSubTab === "form-asesmen" && (
              <form onSubmit={handleSubmitAssessment} className="bg-white/5 border border-white/10 p-5 sm:p-8 rounded-3xl backdrop-blur-xl flex flex-col gap-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <span>{editAssessmentId ? "Edit Asesmen Awal PDBK" : "Form Asesmen Awal PDBK"}</span>
                  </h3>
                  <label className="flex items-center gap-2 bg-slate-900 border border-purple-500/40 px-3.5 py-2 rounded-xl cursor-pointer shadow-md w-full sm:w-auto">
                    <input type="checkbox" checked={isRollingMode} onChange={(e) => setIsRollingMode(e.target.checked)} className="w-4 h-4 text-purple-600 rounded flex-shrink-0" />
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 whitespace-nowrap"><Users className="w-3.5 h-3.5" /> Mode Rolling</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Pilih Siswa Sistem</label>
                    <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} required className="bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm w-full">
                      <option value="">-- Pilih Siswa --</option>
                      {studentOptionsList.map((s) => (
                        <option key={s.id} value={s.id}>{s.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Tanggal Asesmen</label>
                    <input type="date" value={tglAssessment} onChange={(e) => setTglAssessment(e.target.value)} required className="bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm w-full" />
                  </div>
                </div>

                {/* Identitas Diri */}
                <div className="border border-white/10 p-4 sm:p-5 rounded-2xl bg-white/5 space-y-4">
                  <h4 className="font-bold text-blue-400 text-sm uppercase">1. Identitas Diri Anak</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Nama Lengkap Anak</label><input type="text" value={identitas.nama_anak} onChange={(e) => setIdentitas({...identitas, nama_anak: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Tanggal Lahir</label><input type="date" value={identitas.tanggal_lahir} onChange={(e) => setIdentitas({...identitas, tanggal_lahir: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Kelas</label><input type="text" value={identitas.kelas} onChange={(e) => setIdentitas({...identitas, kelas: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Alamat</label><input type="text" value={identitas.alamat} onChange={(e) => setIdentitas({...identitas, alamat: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Nama Ibu</label><input type="text" value={identitas.nama_ibu} onChange={(e) => setIdentitas({...identitas, nama_ibu: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Nama Ayah</label><input type="text" value={identitas.nama_ayah} onChange={(e) => setIdentitas({...identitas, nama_ayah: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Urutan Kelahiran</label><input type="text" value={identitas.urutan_kelahiran} onChange={(e) => setIdentitas({...identitas, urutan_kelahiran: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white w-full" /></div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Permasalahan yang Dihadapi Anak</label>
                  <textarea rows={3} value={permasalahan} onChange={(e) => setPermasalahan(e.target.value)} required className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm w-full" />
                </div>

                {/* Metode & Profiling */}
                <div className="border border-white/10 p-4 sm:p-5 rounded-2xl bg-white/5 space-y-4">
                  <h4 className="font-bold text-blue-400 text-sm uppercase">Metode dan Hasil Assessment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Hasil Observasi</label><input type="text" value={metode.observasi} onChange={(e) => setMetode({...metode, observasi: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Hasil Wawancara</label><input type="text" value={metode.wawancara} onChange={(e) => setMetode({...metode, wawancara: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Hasil Psikotes</label><input type="text" value={metode.psikotes} onChange={(e) => setMetode({...metode, psikotes: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Data Pendukung</label><input type="text" value={metode.data_pendukung} onChange={(e) => setMetode({...metode, data_pendukung: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                  </div>
                </div>

                <div className="border border-white/10 p-4 sm:p-5 rounded-2xl bg-white/5 space-y-4">
                  <h4 className="font-bold text-purple-400 text-sm uppercase">Profiling Anak</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Kelebihan Anak</label><textarea rows={2} value={profiling.kelebihan} onChange={(e) => setProfiling({...profiling, kelebihan: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Kekurangan / Tantangan</label><textarea rows={2} value={profiling.kekurangan} onChange={(e) => setProfiling({...profiling, kekurangan: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Hal yang Disukai</label><textarea rows={2} value={profiling.disukai} onChange={(e) => setProfiling({...profiling, disukai: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Hal yang Tidak Disukai</label><textarea rows={2} value={profiling.tidak_disukai} onChange={(e) => setProfiling({...profiling, tidak_disukai: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                  </div>
                </div>

                {/* 5 Aspek Temuan Lapangan */}
                <div className="border border-white/10 p-4 sm:p-5 rounded-2xl bg-white/5 space-y-6">
                  <h4 className="font-bold text-emerald-400 text-sm uppercase">Data Temuan di Lapangan (5 Aspek)</h4>
                   
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-blue-300">1. Kognitif</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Daya Tangkap</label><input type="text" value={kognitif.daya_tangkap} onChange={(e) => setKognitif({...kognitif, daya_tangkap: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Fokus</label><input type="text" value={kognitif.fokus} onChange={(e) => setKognitif({...kognitif, fokus: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Konsentrasi</label><input type="text" value={kognitif.konsentrasi} onChange={(e) => setKognitif({...kognitif, konsentrasi: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Mengingat</label><input type="text" value={kognitif.mengingat} onChange={(e) => setKognitif({...kognitif, mengingat: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Membaca</label><input type="text" value={kognitif.membaca} onChange={(e) => setKognitif({...kognitif, membaca: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Menulis</label><input type="text" value={kognitif.menulis} onChange={(e) => setKognitif({...kognitif, menulis: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Berhitung</label><input type="text" value={kognitif.berhitung} onChange={(e) => setKognitif({...kognitif, berhitung: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <p className="text-xs font-bold text-purple-300">2. Bahasa / Komunikasi</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Bahasa Reseptif</label><input type="text" value={bahasa.reseptif} onChange={(e) => setBahasa({...bahasa, reseptif: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Bahasa Ekspresif</label><input type="text" value={bahasa.ekspresif} onChange={(e) => setBahasa({...bahasa, ekspresif: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Fonologi</label><input type="text" value={bahasa.fonologi} onChange={(e) => setBahasa({...bahasa, fonologi: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <p className="text-xs font-bold text-emerald-300">3. Kemandirian</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Motorik Kasar</label><input type="text" value={kemandirian.motorik_kasar} onChange={(e) => setKemandirian({...kemandirian, motorik_kasar: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Motorik Halus</label><input type="text" value={kemandirian.motorik_halus} onChange={(e) => setKemandirian({...kemandirian, motorik_halus: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Keseimbangan</label><input type="text" value={kemandirian.keseimbangan} onChange={(e) => setKemandirian({...kemandirian, keseimbangan: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Kontrol Gerak Sendi</label><input type="text" value={kemandirian.kontrol_sendi} onChange={(e) => setKemandirian({...kemandirian, kontrol_sendi: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/5">
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">4. Sosial (Adaptasi, Interaksi)</label><input type="text" value={sosial.adaptasi} onChange={(e) => setSosial({...sosial, adaptasi: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">5. Emosi (Kontrol Emosi)</label><input type="text" value={emosi.kontrol_emosi} onChange={(e) => setEmosi({...emosi, kontrol_emosi: e.target.value})} className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" /> {editAssessmentId ? "Perbarui Asesmen" : "Simpan Asesmen Awal"}
                  </button>
                  {editAssessmentId && (
                    <button type="button" onClick={() => { setEditAssessmentId(null); resetAssessmentForm(); }} className="bg-slate-800 hover:bg-slate-700 px-6 rounded-xl text-sm font-semibold">
                      Batal
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* RIWAYAT ASESMEN */}
            {ppiSubTab === "riwayat-asesmen" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAssessments.length === 0 ? (
                  <p className="text-slate-400 text-sm italic col-span-full">Belum ada dokumen asesmen awal.</p>
                ) : (
                  myAssessments.map((a) => (
                    <div key={a.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                      <div>
                        <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold mb-2 inline-block">Tanggal: {a.tanggal_assessment}</span>
                        <h4 className="text-lg font-bold text-white mb-1">{a.students?.full_name}</h4>
                        <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl mb-3 line-clamp-2"><strong>Permasalahan:</strong> {a.permasalahan}</p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-white/10">
                        <button onClick={() => { setSelectedItem(a); setModalType("assessment"); }} className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all">
                          <Eye className="w-4 h-4" /> Detail
                        </button>
                        <button onClick={() => { handleEditAssessment(a); }} className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDeleteAssessment(a.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* FORM PPI */}
            {ppiSubTab === "form-ppi" && (
              <form onSubmit={handleSubmitPpi} className="bg-white/5 border border-white/10 p-5 sm:p-8 rounded-3xl backdrop-blur-xl flex flex-col gap-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>{editPpiId ? "Edit Dokumen PPI" : "Program Pembelajaran Individual (PPI)"}</span>
                  </h3>
                  <label className="flex items-center gap-2 bg-slate-900 border border-emerald-500/40 px-3.5 py-2 rounded-xl cursor-pointer shadow-md w-full sm:w-auto">
                    <input type="checkbox" checked={isRollingMode} onChange={(e) => setIsRollingMode(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded flex-shrink-0" />
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 whitespace-nowrap"><Users className="w-3.5 h-3.5" /> Mode Rolling</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Pilih Siswa Sistem</label>
                    <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} required className="bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm w-full">
                      <option value="">-- Pilih Siswa --</option>
                      {studentOptionsList.map((s) => (
                        <option key={s.id} value={s.id}>{s.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Wali Kelas</label>
                    <input type="text" value={waliKelas} onChange={(e) => setWaliKelas(e.target.value)} required className="bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm w-full" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Tahun Ajaran / Periode</label>
                    <div className="flex gap-2">
                      <div className="flex-1 flex flex-col gap-1.5"><input type="text" placeholder="2025/2026" value={tahunAjaran} onChange={(e) => setTahunAjaran(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-3 text-white text-sm" /></div>
                      <div className="flex-1 flex flex-col gap-1.5"><input type="text" placeholder="Semester 1" value={periodePpi} onChange={(e) => setPeriodePpi(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-3 text-white text-sm" /></div>
                    </div>
                  </div>
                </div>

                {/* 1. Profil PDBK */}
                <div className="border border-white/10 p-4 sm:p-5 rounded-2xl bg-white/5 space-y-4">
                  <h4 className="font-bold text-blue-400 text-sm uppercase">1. Profil PDBK</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Nama PDBK</label><input type="text" value={profilPdbk.nama} onChange={(e) => setProfilPdbk({...profilPdbk, nama: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Kelas / Usia</label><input type="text" value={profilPdbk.kelas_usia} onChange={(e) => setProfilPdbk({...profilPdbk, kelas_usia: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Jenis Kebutuhan Khusus</label><input type="text" value={profilPdbk.jenis_kebutuhan} onChange={(e) => setProfilPdbk({...profilPdbk, jenis_kebutuhan: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                  </div>
                </div>

                {/* 2. Tingkat Kemampuan Saat Ini */}
                <div className="border border-white/10 p-4 sm:p-5 rounded-2xl bg-white/5 space-y-4">
                  <h4 className="font-bold text-purple-400 text-sm uppercase">2. Tingkat Kemampuan Saat Ini</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Kekuatan / Potensi Anak</label><textarea rows={3} value={kemampuanSaatIni.kekuatan} onChange={(e) => setKemampuanSaatIni({...kemampuanSaatIni, kekuatan: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Area Pengembangan / Tantangan</label><textarea rows={3} value={kemampuanSaatIni.area_pengembangan} onChange={(e) => setKemampuanSaatIni({...kemampuanSaatIni, area_pengembangan: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white w-full" /></div>
                  </div>
                </div>

                {/* 3. Tujuan SMART */}
                <div className="border border-white/10 p-4 sm:p-5 rounded-2xl bg-white/5 space-y-4">
                  <h4 className="font-bold text-emerald-400 text-sm uppercase">3. Tujuan Jangka Panjang & Pendek (SMART)</h4>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Tujuan Jangka Panjang</label><textarea rows={2} value={tujuanSmart.jangka_panjang} onChange={(e) => setTujuanSmart({...tujuanSmart, jangka_panjang: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-white" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Jangka Pendek 1</label><input type="text" value={tujuanSmart.jangka_pendek_1} onChange={(e) => setTujuanSmart({...tujuanSmart, jangka_pendek_1: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Jangka Pendek 2</label><input type="text" value={tujuanSmart.jangka_pendek_2} onChange={(e) => setTujuanSmart({...tujuanSmart, jangka_pendek_2: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Jangka Pendek 3</label><input type="text" value={tujuanSmart.jangka_pendek_3} onChange={(e) => setTujuanSmart({...tujuanSmart, jangka_pendek_3: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                    </div>
                  </div>
                </div>

                {/* 4. Layanan & Akomodasi */}
                <div className="border border-white/10 p-4 sm:p-5 rounded-2xl bg-white/5 space-y-4">
                  <h4 className="font-bold text-blue-300 text-sm uppercase">4. Layanan & Akomodasi Pembelajaran</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Modifikasi Lingkungan / Materi</label><input type="text" value={layananAkomodasi.modifikasi} onChange={(e) => setLayananAkomodasi({...layananAkomodasi, modifikasi: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Media Bantu Belajar</label><input type="text" value={layananAkomodasi.media} onChange={(e) => setLayananAkomodasi({...layananAkomodasi, media: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Strategi Komunikasi</label><input type="text" value={layananAkomodasi.komunikasi} onChange={(e) => setLayananAkomodasi({...layananAkomodasi, komunikasi: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Modifikasi Tugas</label><input type="text" value={layananAkomodasi.tugas} onChange={(e) => setLayananAkomodasi({...layananAkomodasi, tugas: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Pendamping GPK</label><input type="text" value={layananAkomodasi.pendamping} onChange={(e) => setLayananAkomodasi({...layananAkomodasi, pendamping: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-400">Kolaborasi Orangtua & Psikolog</label><input type="text" value={layananAkomodasi.kolaborasi} onChange={(e) => setLayananAkomodasi({...layananAkomodasi, kolaborasi: e.target.value})} className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs text-white w-full" /></div>
                  </div>
                </div>

                {/* 5. Jadwal & Rencana Evaluasi */}
                <div className="border border-white/10 p-4 sm:p-5 rounded-2xl bg-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-amber-300 text-sm uppercase">5. Jadwal & Rencana Evaluasi</h4>
                    <button 
                      type="button" 
                      onClick={addEvaluasiRow}
                      className="text-xs bg-amber-500/25 px-3.5 py-2 rounded-xl text-amber-300 hover:bg-amber-500/40 flex items-center gap-1.5 font-semibold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Baris
                    </button>
                  </div>

                  <div className="space-y-3">
                    {rencanaEvaluasi.map((row, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 items-end">
                        <div className="md:col-span-3 flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-400">Periode Waktu</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Bulan ke-1" 
                            value={row.periode} 
                            onChange={(e) => updateEvaluasiRow(index, "periode", e.target.value)} 
                            className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" 
                          />
                        </div>
                        <div className="md:col-span-5 flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-400">Kegiatan Evaluasi</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Observasi pemahaman materi" 
                            value={row.kegiatan} 
                            onChange={(e) => updateEvaluasiRow(index, "kegiatan", e.target.value)} 
                            className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full" 
                          />
                        </div>
                        <div className="md:col-span-3 flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-400">Status Progres</label>
                          <select 
                            value={row.status} 
                            onChange={(e) => updateEvaluasiRow(index, "status", e.target.value)} 
                            className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 text-xs text-white w-full"
                          >
                            <option value="Aktif">Aktif</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Tertunda">Tertunda</option>
                          </select>
                        </div>
                        <div className="md:col-span-1 flex justify-center">
                          {rencanaEvaluasi.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeEvaluasiRow(index)} 
                              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all w-full md:w-auto flex justify-center"
                              title="Hapus Baris"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tanda Tangan GPK Saja */}
                <div className="border border-white/10 p-4 sm:p-5 rounded-2xl bg-white/5 space-y-4">
                  <h4 className="font-bold text-slate-200 text-sm uppercase">Persetujuan & Tanda Tangan Digital GPK</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-3.5 rounded-xl border border-blue-500/50">
                      <input type="checkbox" checked={ttdGpk} onChange={(e) => setTtdGpk(e.target.checked)} className="w-4 h-4 text-blue-600 rounded flex-shrink-0" />
                      <span className="text-xs font-semibold text-blue-300">TTD GPK {ttdGpk ? "✅ Disetujui" : "⏳ Belum"}</span>
                    </label>
                    <div className="flex items-center justify-between bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-slate-400 text-xs">
                      <span>TTD Psikolog:</span>
                      <span className="text-purple-400 font-semibold">⏳ Menunggu Validasi</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-slate-400 text-xs">
                      <span>TTD Orang Tua:</span>
                      <span className="text-emerald-400 font-semibold">⏳ Menunggu Persetujuan</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="submit" className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" /> {editPpiId ? "Perbarui Dokumen PPI" : "Simpan & Ajukan Dokumen PPI"}
                  </button>
                  {editPpiId && (
                    <button type="button" onClick={() => setEditPpiId(null)} className="bg-slate-800 hover:bg-slate-700 px-6 rounded-xl text-sm font-semibold">
                      Batal
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* RIWAYAT PPI */}
            {ppiSubTab === "riwayat-ppi" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPpi.length === 0 ? (
                  <p className="text-slate-400 text-sm italic col-span-full">Belum ada dokumen PPI.</p>
                ) : (
                  myPpi.map((p) => (
                    <div key={p.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold uppercase">{p.status}</span>
                          <span className="text-xs text-slate-400">{p.periode_ppi}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1">{p.students?.full_name}</h4>
                        <div className="space-y-1.5 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 mt-3">
                          <p>TTD GPK: {p.ttd_gpk ? "✅ Selesai" : "⏳ Menunggu"}</p>
                          <p>TTD Psikolog: {p.ttd_psikolog ? "✅ Disetujui" : "⏳ Menunggu"}</p>
                          <p>TTD Orang Tua: {p.ttd_orangtua ? "✅ Selesai" : "⏳ Menunggu"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-white/10 mt-4">
                        <button onClick={() => { setSelectedItem(p); setModalType("ppi"); }} className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all">
                          <Eye className="w-4 h-4" /> Detail
                        </button>
                        <button onClick={() => { handleEditPpi(p); }} className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDeletePpi(p.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= MODAL UNIVERSAL ================= */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl my-auto">
              <button 
                onClick={() => setSelectedItem(null)} 
                className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-lg sm:text-xl font-bold text-white mb-6 uppercase flex items-center gap-2 border-b border-white/10 pb-4 pr-8">
                {modalType === "report" ? ( <><BookOpen className="text-blue-400 flex-shrink-0"/> Detail Laporan Harian</> ) : 
                 modalType === "assessment" ? ( <><BrainCircuit className="text-purple-400 flex-shrink-0"/> Detail Asesmen Awal</> ) : 
                 ( <><FileText className="text-emerald-400 flex-shrink-0"/> Detail Dokumen PPI</> )}
              </h3>

              <div className="space-y-6 text-sm text-slate-300">
                {modalType === "report" && (
                  <>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><span className="block text-xs text-slate-500">Siswa</span><strong className="text-white">{selectedItem.students?.full_name}</strong></div>
                      <div><span className="block text-xs text-slate-500">Mata Pelajaran</span><strong className="text-blue-400">{selectedItem.mata_pelajaran}</strong></div>
                      <div><span className="block text-xs text-slate-500">Kondisi Mood</span><span className="px-2 py-1 bg-white/10 rounded-md text-xs mt-1 inline-block">{selectedItem.kondisi_mood}</span></div>
                    </div>
                    
                    <div className="space-y-3">
                      <div><h4 className="text-xs font-bold text-slate-400 uppercase">Materi & Target</h4>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-1">
                          <p className="mb-2"><strong>Materi:</strong> {selectedItem.materi_pembelajaran}</p>
                          <p><strong>Target:</strong> {selectedItem.target_capaian}</p>
                        </div>
                      </div>
                      <div><h4 className="text-xs font-bold text-emerald-400 uppercase">Hasil Pembelajaran</h4>
                        <div className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-900/50 mt-1 text-emerald-100">
                          {selectedItem.hasil_pembelajaran}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><h4 className="text-xs font-bold text-slate-400 uppercase">Catatan Perilaku</h4>
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-1 h-full">{selectedItem.catatan_perilaku || "-"}</div>
                        </div>
                        <div><h4 className="text-xs font-bold text-slate-400 uppercase">Intervensi</h4>
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-1 h-full">{selectedItem.intervensi_pendamping || "-"}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {modalType === "assessment" && (
                  <>
                     <div className="bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><span className="block text-xs text-slate-500">Siswa</span><strong className="text-white">{selectedItem.students?.full_name}</strong></div>
                      <div><span className="block text-xs text-slate-500">Tanggal Asesmen</span><strong className="text-purple-400">{selectedItem.tanggal_assessment}</strong></div>
                    </div>

                    {selectedItem.identitas && (
                      <div>
                        <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">1. Identitas Diri Anak</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                          <div><span className="text-slate-500 block">Nama Anak</span> {selectedItem.identitas.nama_anak || "-"}</div>
                          <div><span className="text-slate-500 block">Tanggal Lahir</span> {selectedItem.identitas.tanggal_lahir || "-"}</div>
                          <div><span className="text-slate-500 block">Kelas</span> {selectedItem.identitas.kelas || "-"}</div>
                          <div><span className="text-slate-500 block">Alamat</span> {selectedItem.identitas.alamat || "-"}</div>
                          <div><span className="text-slate-500 block">Nama Ibu</span> {selectedItem.identitas.nama_ibu || "-"}</div>
                          <div><span className="text-slate-500 block">Nama Ayah</span> {selectedItem.identitas.nama_ayah || "-"}</div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Permasalahan yang Dihadapi</h4>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">{selectedItem.permasalahan || "-"}</div>
                    </div>
                  </>
                )}

                {modalType === "ppi" && (
                  <>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div><span className="block text-xs text-slate-500">Siswa</span><strong className="text-white">{selectedItem.students?.full_name}</strong></div>
                      <div className="text-left sm:text-right"><span className="block text-xs text-slate-500">Status</span><span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-xs uppercase mt-1 inline-block">{selectedItem.status}</span></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                      <div><span className="text-slate-500 block">Wali Kelas</span> {selectedItem.wali_kelas || "-"}</div>
                      <div><span className="text-slate-500 block">Tahun Ajaran / Periode</span> {selectedItem.tahun_ajaran || "-"} ({selectedItem.periode_ppi || "-"})</div>
                    </div>
                  </>
                )}
              </div>

              <button onClick={() => setSelectedItem(null)} className="mt-8 w-full bg-slate-800 hover:bg-slate-700 transition-colors py-3 rounded-xl font-bold text-white shadow-lg">Tutup Detail</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}