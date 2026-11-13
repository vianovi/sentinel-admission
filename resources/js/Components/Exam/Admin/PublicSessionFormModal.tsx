import { FormEvent, useMemo, useState, useCallback } from "react";
import { Link } from "@inertiajs/react";
import SentinelSelect from "@/Components/Dashboard/Shared/SentinelSelect";
import type { SessionFormReturn } from "@/Pages/Dashboard/Admin/Exam/PublicSessions";

type PackageOption = { id: number; title: string; code: string; duration_minutes: number; passing_score?: number };

type Props = {
    show: boolean;
    onClose: () => void;
    editingSessionId: number | null;
    sessionForm: SessionFormReturn;
    packages: PackageOption[];
    waves: Array<{ id: number; title: string; academic_year: string }>;
    handlePackageChange: (packageId: number) => void;
    handleSaveSession: (e: FormEvent) => void;
    formatToLocalDateTime: (date: Date) => string;
};

const MAX_PACKAGES = 5;

const startShortcuts = [
    { label: "Mulai sekarang", hours: 0 },
    { label: "1 jam lagi", hours: 1 },
    { label: "2 jam lagi", hours: 2 },
    { label: "Besok pagi", hours: 12 },
] as const;

const endShortcuts = [
    { label: "2 jam setelah mulai", hours: 2 },
    { label: "4 jam setelah mulai", hours: 4 },
    { label: "1 hari setelah mulai", hours: 24 },
    { label: "2 hari setelah mulai", hours: 48 },
] as const;

export default function PublicSessionFormModal({
    show,
    onClose,
    editingSessionId,
    sessionForm,
    packages,
    waves,
    handleSaveSession,
    formatToLocalDateTime,
}: Props) {
    const [showOpensQuick, setShowOpensQuick] = useState(false);
    const [showClosesQuick, setShowClosesQuick] = useState(false);

    const selectedPackages = useMemo(
        () => packages.filter((pkg) => sessionForm.data.package_ids?.includes(pkg.id)),
        [packages, sessionForm.data.package_ids]
    );

    const availablePackages = useMemo(
        () => packages.filter((pkg) => !sessionForm.data.package_ids?.includes(pkg.id)),
        [packages, sessionForm.data.package_ids]
    );

    const togglePackage = useCallback(
        (packageId: number) => {
            const currentIds = sessionForm.data.package_ids || [];
            const isSelected = currentIds.includes(packageId);

            if (isSelected) {
                if (currentIds.length <= 1) return;
                const newIds = currentIds.filter((id) => id !== packageId);
                const primaryPkg = packages.find((p) => p.id === newIds[0]);
                sessionForm.setData((current) => ({
                    ...current,
                    package_ids: newIds,
                    exam_package_id: newIds[0],
                    duration_minutes: primaryPkg?.duration_minutes ?? current.duration_minutes,
                    passing_score: primaryPkg?.passing_score ?? current.passing_score,
                }));
            } else {
                if (currentIds.length >= MAX_PACKAGES) return;
                const newIds = [...currentIds, packageId];
                sessionForm.setData((current) => ({ ...current, package_ids: newIds }));
            }
        },
        [packages, sessionForm]
    );

    const addPackage = useCallback(
        (packageId: number) => {
            const currentIds = sessionForm.data.package_ids || [];
            if (currentIds.length >= MAX_PACKAGES) return;
            const newIds = [...currentIds, packageId];
            const primaryPkg = packages.find((p) => p.id === newIds[0]);

            sessionForm.setData((current) => ({
                ...current,
                package_ids: newIds,
                exam_package_id: newIds[0],
                duration_minutes: primaryPkg?.duration_minutes ?? current.duration_minutes,
                passing_score: primaryPkg?.passing_score ?? current.passing_score,
            }));
        },
        [packages, sessionForm]
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

    const orderTypeOptions = useMemo(
        () => [
            { value: "flexible", label: "Fleksibel (Bebas Memilih)", description: "Peserta bebas memilih urutan pengerjaan paket" },
            { value: "sequential", label: "Berurutan (Sekuensial)", description: "Peserta harus mengerjakan sesuai urutan" },
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

                        {/* Multi-Package Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                                Paket Ujian Terpilih <span className="ml-1 text-[10px] text-amber-400 font-medium">({(sessionForm.data.package_ids || []).length}/{MAX_PACKAGES})</span>
                            </label>

                            {selectedPackages.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2 border border-slate-700/50 p-2 rounded-xl bg-slate-800/30">
                                    {selectedPackages.map((pkg, index) => (
                                        <div
                                            key={pkg.id}
                                            className="group flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs transition-all"
                                        >
                                            <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-500/20 text-[9px] font-black text-amber-400">
                                                {index + 1}
                                            </span>
                                            <span className="font-semibold text-amber-300 max-w-[160px] truncate">{pkg.title}</span>
                                            <span className="text-[10px] text-slate-400">{pkg.duration_minutes}m</span>
                                            {selectedPackages.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => togglePackage(pkg.id)}
                                                    className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                                >
                                                    <i className="fa-solid fa-xmark text-[9px]" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {availablePackages.length > 0 && (sessionForm.data.package_ids || []).length < MAX_PACKAGES && (
                                <div className="relative">
                                    <select
                                        value=""
                                        onChange={(event) => {
                                            const val = Number(event.target.value);
                                            if (val) addPackage(val);
                                        }}
                                        className="sentinel-field"
                                    >
                                        <option value="">
                                            {(sessionForm.data.package_ids || []).length === 0
                                                ? "Pilih Paket Ujian..."
                                                : `+ Tambah Paket (sisa ${MAX_PACKAGES - (sessionForm.data.package_ids || []).length})`}
                                        </option>
                                        {availablePackages.map((pkg) => (
                                            <option key={pkg.id} value={pkg.id}>
                                                {pkg.title} ({pkg.duration_minutes}m, {pkg.passing_score}%)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {(sessionForm.errors as Record<string, string>).exam_package_id && <p className="text-[11px] text-red-400 mt-1">{(sessionForm.errors as Record<string, string>).exam_package_id}</p>}
                        </div>

                        {/* Package Inheritance Read-Only Badge Box */}
                        {selectedPackages.length > 0 && (
                            <div className="rounded-xl border border-amber-500/20 bg-slate-950/80 p-3.5 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                                        <i className="fa-solid fa-circle-info text-xs" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Konfigurasi per Paket</span>
                                        <span className="text-xs text-slate-300">Durasi dan Passing Grade mengikuti pengaturan masing-masing paket</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {selectedPackages.map((pkg, index) => (
                                        <div key={pkg.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 border border-white/5 px-3 py-2 text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-amber-500/20 text-[9px] font-black text-amber-400">
                                                    {index + 1}
                                                </span>
                                                <span className="font-medium text-slate-300 truncate">{pkg.title}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[11px] text-slate-400 shrink-0 ml-2">
                                                <span><i className="fa-regular fa-clock mr-1" />{pkg.duration_minutes}m</span>
                                                <span className="text-emerald-400"><i className="fa-solid fa-check-double mr-1" />{pkg.passing_score}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(sessionForm.data.package_ids || []).length > 1 ? (
                                <SentinelSelect
                                    label="Urutan Pengerjaan Paket"
                                    icon="fa-solid fa-arrow-down-1-9"
                                    options={orderTypeOptions}
                                    value={sessionForm.data.package_order_type}
                                    onChange={(val) => sessionForm.setData("package_order_type", val)}
                                />
                            ) : (
                                <div></div>
                            )}

                            <SentinelSelect
                                label="Gelombang SPMB (Opsional)"
                                icon="fa-solid fa-layer-group"
                                options={waveOptions}
                                value={sessionForm.data.admission_wave_id || 0}
                                onChange={(val) => sessionForm.setData("admission_wave_id", val === 0 ? null : Number(val))}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="relative">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-slate-300">Waktu mulai (WIB)</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowOpensQuick(!showOpensQuick);
                                                setShowClosesQuick(false);
                                            }}
                                            aria-expanded={showOpensQuick}
                                            aria-haspopup="menu"
                                            className="min-h-9 flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 transition-colors hover:bg-amber-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
                                        >
                                            <i className="fa-solid fa-bolt text-amber-400" /> Cepat
                                        </button>
                                        {showOpensQuick && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowOpensQuick(false)} />
                                                <div role="menu" className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-100 shadow-xl">
                                                    <div className="mb-2 text-xs font-semibold text-slate-300">Pilih waktu mulai</div>
                                                    <div className="grid gap-1">
                                                        {startShortcuts.map(({ label, hours }) => (
                                                            <button
                                                                key={label}
                                                                type="button"
                                                                role="menuitem"
                                                                onClick={() => {
                                                                    const newDate = new Date();
                                                                    newDate.setHours(newDate.getHours() + hours, hours === 0 ? newDate.getMinutes() : 0, 0, 0);
                                                                    sessionForm.setData("opens_at", formatToLocalDateTime(newDate));
                                                                    setShowOpensQuick(false);
                                                                }}
                                                                className="min-h-11 rounded-lg border border-slate-700 bg-white/5 px-3 py-2 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
                                                            >
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <p className="mb-2 text-[11px] text-slate-400">Pilih opsi cepat atau tentukan waktu sendiri.</p>
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
                                    <label className="block text-xs font-bold text-slate-300">Waktu berakhir (WIB)</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowClosesQuick(!showClosesQuick);
                                                setShowOpensQuick(false);
                                            }}
                                            aria-expanded={showClosesQuick}
                                            aria-haspopup="menu"
                                            className="min-h-9 flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 transition-colors hover:bg-amber-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
                                        >
                                            <i className="fa-solid fa-bolt text-amber-400" /> Cepat
                                        </button>
                                        {showClosesQuick && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowClosesQuick(false)} />
                                                <div role="menu" className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-100 shadow-xl">
                                                    <div className="mb-2 text-xs font-semibold text-slate-300">Pilih waktu berakhir</div>
                                                    <div className="grid gap-1">
                                                        {endShortcuts.map(({ label, hours }) => (
                                                            <button
                                                                key={label}
                                                                type="button"
                                                                onClick={() => {
                                                                    const baseStr = sessionForm.data.opens_at || formatToLocalDateTime(new Date());
                                                                    const baseDate = new Date(baseStr);
                                                                    baseDate.setHours(baseDate.getHours() + hours);
                                                                    sessionForm.setData("closes_at", formatToLocalDateTime(baseDate));
                                                                    setShowClosesQuick(false);
                                                                }}
                                                                role="menuitem"
                                                                className="min-h-11 rounded-lg border border-slate-700 bg-white/5 px-3 py-2 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
                                                            >
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <p className="mb-2 text-[11px] text-slate-400">Durasi dihitung dari waktu mulai yang dipilih.</p>
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
