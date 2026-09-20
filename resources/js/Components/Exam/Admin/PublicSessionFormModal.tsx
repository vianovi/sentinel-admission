import { FormEvent, useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import SentinelSelect from "@/Components/Dashboard/Shared/SentinelSelect";
import type { SessionFormReturn } from "@/Pages/Dashboard/Admin/Exam/PublicSessions";

type Props = {
    show: boolean;
    onClose: () => void;
    editingSessionId: number | null;
    sessionForm: SessionFormReturn;
    packages: Array<{ id: number; title: string; code: string; duration_minutes: number; passing_score?: number }>;
    waves: Array<{ id: number; title: string; academic_year: string }>;
    handlePackageChange: (packageId: number) => void;
    handleSaveSession: (e: FormEvent) => void;
    formatToLocalDateTime: (date: Date) => string;
};


export default function PublicSessionFormModal({
    show,
    onClose,
    editingSessionId,
    sessionForm,
    packages,
    waves,
    handlePackageChange,
    handleSaveSession,
    formatToLocalDateTime,
}: Props) {
    const [showOpensQuick, setShowOpensQuick] = useState(false);
    const [showClosesQuick, setShowClosesQuick] = useState(false);

    const selectedPackage = useMemo(
        () => packages.find((p) => p.id === Number(sessionForm.data.exam_package_id)) || packages[0],
        [packages, sessionForm.data.exam_package_id]
    );

    const packageOptions = useMemo(
        () =>
            packages.map((pkg) => ({
                value: pkg.id,
                label: `${pkg.title} (${pkg.code})`,
                description: `Durasi: ${pkg.duration_minutes}m | Passing Score: ${pkg.passing_score ?? 70}%`,
                badge: `${pkg.duration_minutes}m`,
            })),
        [packages]
    );

    const waveOptions = useMemo(
        () => [
            { value: 0, label: "Tanpa Gelombang (Publik Umum)", description: "Terbuka bagi pendaftar umum" },
            ...waves.map((w) => ({
                value: w.id,
                label: `${w.title} (${w.academic_year})`,
                description: `Tahun Akademik: ${w.academic_year}`,
            })),
        ],
        [waves]
    );

    const accessTypeOptions = useMemo(
        () => [
            { value: "token_required", label: "Token Proktor Wajib", description: "Peserta wajib memasukkan token 6 karakter untuk masuk" },
            { value: "open", label: "Akses Terbuka Tanpa Token", description: "Peserta publik langsung mengerjakan tanpa input token" },
        ],
        []
    );

    const statusOptions = useMemo(
        () => [
            { value: "published", label: "Diterbitkan (Published)", badge: "Live" },
            { value: "draft", label: "Draft (Disimpan saja)", badge: "Draft" },
            { value: "closed", label: "Ditutup (Closed)", badge: "Closed" },
        ],
        []
    );

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            {editingSessionId ? "MODIFIKASI SESI" : "SESI PUBLIK BARU"}
                        </span>
                        <h3 className="text-lg font-black text-white">
                            {editingSessionId ? "Edit Konfigurasi Sesi Ujian Publik" : "Buat Sesi Ujian Publik Baru"}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <i className="fa-solid fa-xmark text-lg" />
                    </button>
                </div>

                {packages.length === 0 ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center space-y-3">
                        <i className="fa-solid fa-box-open text-3xl text-amber-400" />
                        <h4 className="text-sm font-bold text-white">Belum Ada Paket Soal Ujian</h4>
                        <p className="text-xs text-slate-300">
                            Anda perlu membuat minimal satu Paket Soal Ujian sebelum dapat membuat Sesi Ujian Publik.
                        </p>
                        <Link
                            href="/dashboard/admin/exams/packages"
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-400 transition-all"
                        >
                            <i className="fa-solid fa-plus text-xs" /> Buat Paket Soal Sekarang
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSaveSession} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">Judul Sesi Ujian Publik</label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: Tryout Nasional Matematika 2026"
                                value={sessionForm.data.title}
                                onChange={(e) => sessionForm.setData("title", e.target.value)}
                                className="sentinel-field"
                            />
                            {sessionForm.errors.title && <p className="text-[11px] text-red-400 mt-1">{sessionForm.errors.title}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <SentinelSelect
                                label="Paket Soal Ujian"
                                icon="fa-solid fa-box"
                                options={packageOptions}
                                value={sessionForm.data.exam_package_id}
                                onChange={(val) => handlePackageChange(Number(val))}
                            />

                            <SentinelSelect
                                label="Gelombang SPMB (Opsional)"
                                icon="fa-solid fa-layer-group"
                                options={waveOptions}
                                value={sessionForm.data.admission_wave_id || 0}
                                onChange={(val) => sessionForm.setData("admission_wave_id", val === 0 ? null : Number(val))}
                            />
                        </div>

                        {/* Package Inheritance Read-Only Badge Box */}
                        <div className="rounded-xl border border-amber-500/20 bg-slate-950/80 p-3.5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                                    <i className="fa-solid fa-circle-info text-xs" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Aturan Paket & Sesi</span>
                                    <span className="text-xs text-slate-300">Konfigurasi diwarisi otomatis dari Paket Soal Ujian</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 block">Durasi</span>
                                    <strong className="text-white font-bold">{selectedPackage?.duration_minutes ?? 60} Menit</strong>
                                </div>
                                <div className="text-right border-l border-white/10 pl-4">
                                    <span className="text-[10px] text-slate-400 block">Passing Grade</span>
                                    <strong className="text-emerald-400 font-bold">{selectedPackage?.passing_score ?? 70}%</strong>
                                </div>
                                <div className="text-right border-l border-white/10 pl-4">
                                    <span className="text-[10px] text-slate-400 block">Percobaan</span>
                                    <strong className="text-amber-300 font-bold">1x Utama</strong>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="relative">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-slate-300">Waktu Buka (WIB)</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowOpensQuick(!showOpensQuick);
                                                setShowClosesQuick(false);
                                            }}
                                            className="flex items-center gap-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400 transition-all border border-amber-500/20"
                                        >
                                            <i className="fa-solid fa-bolt text-amber-400" /> Cepat
                                        </button>
                                        {showOpensQuick && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowOpensQuick(false)} />
                                                <div className="absolute right-0 top-6 z-50 w-64 rounded-xl border border-white/10 bg-slate-900 p-3 shadow-xl text-slate-100">
                                                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Pilih Jam Hari Ini</div>
                                                    <div className="grid grid-cols-3 gap-1 mb-2">
                                                        {["Sekarang", "07:30", "08:00", "09:00", "10:00", "13:00", "14:00", "16:00", "19:00"].map((t) => (
                                                            <button
                                                                key={t}
                                                                type="button"
                                                                onClick={() => {
                                                                    const newDate = sessionForm.data.opens_at ? new Date(sessionForm.data.opens_at) : new Date();
                                                                    if (t !== "Sekarang") {
                                                                        const [h, m] = t.split(":").map(Number);
                                                                        newDate.setHours(h, m, 0, 0);
                                                                    } else {
                                                                        const now = new Date();
                                                                        newDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
                                                                    }
                                                                    sessionForm.setData("opens_at", formatToLocalDateTime(newDate));
                                                                    setShowOpensQuick(false);
                                                                }}
                                                                className="rounded-md bg-white/5 hover:bg-white/10 px-1 py-1 text-[11px] font-medium text-center border border-white/5 text-slate-200"
                                                            >
                                                                {t}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <input
                                    type="datetime-local"
                                    required
                                    value={sessionForm.data.opens_at}
                                    onChange={(e) => sessionForm.setData("opens_at", e.target.value)}
                                    className="sentinel-field"
                                />
                            </div>

                            <div className="relative">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-slate-300">Waktu Tutup (WIB)</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowClosesQuick(!showClosesQuick);
                                                setShowOpensQuick(false);
                                            }}
                                            className="flex items-center gap-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400 transition-all border border-amber-500/20"
                                        >
                                            <i className="fa-solid fa-bolt text-amber-400" /> Cepat
                                        </button>
                                        {showClosesQuick && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowClosesQuick(false)} />
                                                <div className="absolute right-0 top-6 z-50 w-64 rounded-xl border border-white/10 bg-slate-900 p-3 shadow-xl text-slate-100">
                                                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Tambah Waktu (dari Buka)</div>
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                        {[1, 2, 3, 4, 6, 12, 24].map((h) => (
                                                            <button
                                                                key={h}
                                                                type="button"
                                                                onClick={() => {
                                                                    const baseStr = sessionForm.data.opens_at || formatToLocalDateTime(new Date());
                                                                    const baseDate = new Date(baseStr);
                                                                    baseDate.setHours(baseDate.getHours() + h);
                                                                    sessionForm.setData("closes_at", formatToLocalDateTime(baseDate));
                                                                    setShowClosesQuick(false);
                                                                }}
                                                                className="rounded-lg bg-white/5 hover:bg-white/10 px-2 py-1 text-xs font-medium text-center border border-white/5 text-slate-200"
                                                            >
                                                                +{h} Jam
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <input
                                    type="datetime-local"
                                    required
                                    value={sessionForm.data.closes_at}
                                    onChange={(e) => sessionForm.setData("closes_at", e.target.value)}
                                    className="sentinel-field"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">Petunjuk Khusus Ujian (Opsional)</label>
                            <textarea
                                rows={2}
                                placeholder="Petunjuk pengerjaan yang tampil pada layar peserta sebelum mulai..."
                                value={sessionForm.data.instructions}
                                onChange={(e) => sessionForm.setData("instructions", e.target.value)}
                                className="sentinel-field"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <SentinelSelect
                                label="Tipe Akses Publik"
                                icon="fa-solid fa-lock"
                                options={accessTypeOptions}
                                value={sessionForm.data.public_access_type}
                                onChange={(val) => sessionForm.setData("public_access_type", val)}
                            />

                            <SentinelSelect
                                label="Status Sesi Ujian"
                                icon="fa-solid fa-toggle-on"
                                options={statusOptions}
                                value={sessionForm.data.status}
                                onChange={(val) => sessionForm.setData("status", val)}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={sessionForm.data.show_result_to_candidate}
                                    onChange={(e) => sessionForm.setData("show_result_to_candidate", e.target.checked)}
                                    className="rounded border-white/10 bg-slate-950 text-amber-500 focus:ring-amber-500"
                                />
                                <span className="text-xs text-slate-300 font-semibold">Tampilkan nilai/hasil langsung ke peserta setelah submit</span>
                            </label>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={sessionForm.processing}
                                    className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                                >
                                    {sessionForm.processing ? "Menyimpan..." : (editingSessionId ? "Simpan Perubahan" : "Buat Sesi Publik")}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
