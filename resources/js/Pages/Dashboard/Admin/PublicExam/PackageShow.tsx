import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import DashboardLayout from "@/Layouts/DashboardLayout";
import RichExamText from "@/Components/Exam/Shared/RichExamText";
import { EmptyState, ExamWorkspace, FlashMessage, StatusPill } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { confirmAction, showSuccessToast } from "@/utils/swal";

type Props = {
    examPackage: { id: number; title: string; code: string; subject_name: string; status: string; duration_minutes: number; passing_score: number | null; allow_retry: boolean | number | null; show_result_to_participant: boolean | number | null };
    questions: { id: number; question_text: string; options: string; correct_answer: string; point: number; is_active: boolean | number }[];
    sessions: { id: number; title: string; status: string }[];
    imports: { id: number; actor_name: string; created_at: string; metadata: { filename: string; status: string; imported: number; active: number; errors: Record<string, string[]> } }[];
};

/* Hallmark · pre-emit critique: P4 H4 E3 S4 R4 V4
 * Macrostructure: Narrative Workflow · Sentinel amber/slate · existing dashboard shell
 * Audience: exam administrators · tone: calm, functional · no decorative motion
 */
const panel = "min-w-0 rounded-xl border border-slate-200 bg-white p-5 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:p-6";
const secondaryButtonClass = "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700 dark:focus-visible:outline-amber-400";
const primaryButtonClass = "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-amber-400 px-4 text-sm font-bold text-slate-950 hover:bg-amber-500 active:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:outline-amber-400";
const inputClass = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";
const labelClass = "block text-sm font-semibold text-slate-900 dark:text-slate-100";
const muted = "text-sm leading-6 text-slate-600 dark:text-slate-400";
const checkboxClass = "mt-1 h-5 w-5 shrink-0 rounded border-slate-400 bg-white text-amber-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none dark:border-slate-500 dark:bg-slate-950 dark:text-amber-400";
const dangerButtonClass = "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-rose-300 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 active:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950 dark:active:bg-rose-900 dark:focus-visible:outline-rose-400";

export default function PublicPackageShow({ examPackage: pkg, questions, sessions, imports }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const busy = pendingAction !== null;
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<{ imported: number; active: number } | null>(null);
    const activeCount = questions.filter(q => Boolean(q.is_active)).length;
    const complete = pkg.passing_score !== null && pkg.allow_retry !== null && pkg.show_result_to_participant !== null;
    const savedSettings = { passing_score: pkg.passing_score === null ? "" : String(pkg.passing_score), allow_retry: Boolean(pkg.allow_retry), show_result_to_participant: Boolean(pkg.show_result_to_participant) };
    const [settingsDraft, setSettings] = useState<typeof savedSettings | null>(null);
    const settings = settingsDraft ?? savedSettings;
    const settingsChanged = settings.passing_score !== savedSettings.passing_score || settings.allow_retry !== savedSettings.allow_retry || settings.show_result_to_participant !== savedSettings.show_result_to_participant;
    const needsSave = settingsChanged || !complete;
    const [settingsError, setSettingsError] = useState<string | null>(null);

    const importQuestions = async (event: FormEvent) => {
        event.preventDefault();
        if (!file || busy) return;
        setPendingAction("import");
        setError(null);
        setReport(null);
        try {
            const data = new FormData();
            data.append("file", file);
            const response = await axios.post<{ imported: number; active: number }>(route("admin.exams.public-bank.packages.import", { package: pkg.id }), data);
            setReport(response.data);
            setFile(null);
            if (fileInput.current) fileInput.current.value = "";
            showSuccessToast("Import selesai. Periksa soal dan konfigurasi sebelum menerbitkan paket.");
            router.reload({ onSuccess: () => setSettings(null) });
        } catch (err) {
            setError(axios.isAxiosError(err) ? err.response?.data?.errors?.file?.[0] ?? err.response?.data?.message ?? "Import gagal. Silakan coba lagi." : "File gagal diproses.");
            router.reload({ only: ["imports"] });
        } finally {
            setPendingAction(null);
        }
    };

    const publish = async () => {
        if (busy || needsSave) return;
        if (!await confirmAction("Terbitkan Paket Ujian?", `Pastikan soal dan kunci jawaban paket “${pkg.title}” sudah diperiksa.`, "Ya, Terbitkan")) return;
        setPendingAction("publish");
        setError(null);
        try {
            await axios.post(route("admin.exams.public-bank.packages.publish", { package: pkg.id }));
            showSuccessToast("Paket diterbitkan. Lanjutkan ke pengaturan sesi.");
            router.reload();
        } catch (err) {
            setError(axios.isAxiosError(err) ? err.response?.data?.message ?? "Paket gagal diterbitkan." : "Paket gagal diterbitkan.");
        } finally {
            setPendingAction(null);
        }
    };

    const saveSettings = async (event: FormEvent) => {
        event.preventDefault();
        if (busy) return;
        setPendingAction("settings");
        setSettingsError(null);
        try {
            await axios.put(route("admin.exams.public-bank.packages.settings.update", { package: pkg.id }), { ...settings, passing_score: Number(settings.passing_score) });
            showSuccessToast("Konfigurasi paket diperbarui.");
            router.reload({ onSuccess: () => setSettings(null), onFinish: () => setPendingAction(null) });
        } catch (err) {
            setSettingsError(axios.isAxiosError(err) ? err.response?.data?.errors?.passing_score?.[0] ?? err.response?.data?.message ?? "Konfigurasi gagal disimpan. Coba lagi." : "Konfigurasi gagal disimpan. Coba lagi.");
            setPendingAction(null);
        }
    };

    const revertDraft = async () => {
        if (!await confirmAction("Kembalikan ke Draft?", "Paket dan sesi terkait akan kembali draft; token sesi akan dicabut.", "Ya, Kembalikan")) return;
        setPendingAction("draft"); setError(null); try { const response = await axios.post<{ sessions_reset: number }>(route("admin.exams.public-bank.packages.draft", { package: pkg.id })); showSuccessToast(`Paket kembali draft. ${response.data.sessions_reset} sesi ikut di-reset.`); router.reload(); } catch (err) { setError(axios.isAxiosError(err) ? err.response?.data?.message ?? "Paket tidak dapat dikembalikan." : "Paket tidak dapat dikembalikan."); } finally { setPendingAction(null); }
    };

    const toggleQuestion = async (question: (typeof questions)[number]) => {
        setPendingAction(`toggle-${question.id}`); setError(null); try { await axios.patch(route("admin.exams.public-bank.questions.toggle", { question: question.id }), { is_active: !question.is_active }); router.reload(); } catch (err) { setError(axios.isAxiosError(err) ? err.response?.data?.message ?? "Status soal gagal diubah." : "Status soal gagal diubah."); } finally { setPendingAction(null); }
    };

    const deleteQuestion = async (question: (typeof questions)[number]) => {
        if (!await confirmAction("Hapus Soal?", "Soal akan dinonaktifkan permanen dari paket ini.", "Ya, Hapus Soal")) return;
        setPendingAction(`delete-${question.id}`); setError(null); try { await axios.delete(route("admin.exams.public-bank.questions.destroy", { question: question.id })); showSuccessToast("Soal dihapus dari paket."); router.reload(); } catch (err) { setError(axios.isAxiosError(err) ? err.response?.data?.message ?? "Soal tidak dapat dihapus." : "Soal tidak dapat dihapus."); } finally { setPendingAction(null); }
    };

    return <>
        <Head title={`Paket Publik · ${pkg.title}`} />
        <ExamWorkspace active="packages">
            <header className="flex min-w-0 flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
                <Link href={route("admin.public-exams.packages.index")} className="inline-flex min-h-11 w-fit items-center gap-2 rounded text-sm font-semibold text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 dark:text-slate-400 dark:hover:text-slate-100"><i aria-hidden="true" className="fa-solid fa-arrow-left" /> Paket Soal</Link>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2"><StatusPill value={pkg.status} /><span className="break-all text-xs font-semibold text-slate-600 dark:text-slate-400">{pkg.code}</span></div>
                        <h1 className="break-words font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">{pkg.title}</h1>
                        <p className={muted}>{pkg.subject_name}</p>
                    </div>
                    <Link href={route("admin.public-exams.media.index")} className={secondaryButtonClass}><i aria-hidden="true" className="fa-solid fa-photo-film" /> Bank Media</Link>
                </div>
                <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                    <div className="flex gap-2"><dt className="text-slate-600 dark:text-slate-400">Durasi</dt><dd className="font-semibold text-slate-900 dark:text-slate-100">{pkg.duration_minutes} menit</dd></div>
                    <div className="flex gap-2"><dt className="text-slate-600 dark:text-slate-400">Soal aktif</dt><dd className="font-semibold text-slate-900 dark:text-slate-100">{activeCount} / {questions.length}</dd></div>
                    <div className="flex gap-2"><dt className="text-slate-600 dark:text-slate-400">Sesi terkait</dt><dd className="font-semibold text-slate-900 dark:text-slate-100">{sessions.length}</dd></div>
                </dl>
            </header>
            <FlashMessage value={error} />
            {error && <div role="alert" className="mb-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 shadow-sm dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-100"><div className="flex items-start gap-3"><i aria-hidden="true" className="fa-solid fa-circle-exclamation mt-0.5 text-rose-600 dark:text-rose-300" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">Import ditolak</p><span className="rounded-full border border-rose-300 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-rose-700 dark:border-rose-800 dark:text-rose-200">Perlu diperbaiki</span></div><div className="mt-3 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]"><div className="rounded-lg bg-rose-100 px-3 py-2 text-xs font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-200">Lokasi di Excel</div><p className="min-w-0 rounded-lg border border-rose-200 bg-white/70 px-3 py-2 font-mono text-xs leading-5 break-words dark:border-rose-900 dark:bg-slate-950/40">{error.match(/Sheet .*? · Baris Excel \d+/)?.[0] ?? "Lihat rincian validasi"}</p></div><p className="mt-3 leading-6">{error}</p><p className="mt-2 text-xs leading-5 text-rose-700 dark:text-rose-200">Nomor baris adalah nomor baris worksheet, termasuk baris judul kolom; bukan nomor soal.</p></div></div></div>}
            <section aria-label="Alur pengelolaan paket publik" className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                {[
                    ["1", "Buat Paket", "Paket publik sudah dibuat", "fa-solid fa-box-archive", true],
                    ["2", "Unduh Template", "Template khusus paket", "fa-solid fa-file-arrow-down", true],
                    ["3", "Isi Template", "Guru mengisi XLSX", "fa-solid fa-pen-to-square", Boolean(questions.length)],
                    ["4", "Import Soal", `${questions.length} soal tersimpan`, "fa-solid fa-file-import", Boolean(questions.length)],
                    ["5", "Review & Terbitkan", complete && !needsSave ? "Siap ditinjau" : "Perlu konfigurasi", "fa-solid fa-clipboard-check", pkg.status === "published"],
                    ["6", "Masuk Sesi", `${sessions.length} sesi terkait`, "fa-solid fa-calendar-check", Boolean(sessions.length)],
                ].map(([step, title, description, icon, done]) => <article key={String(step)} className={`min-w-0 rounded-lg border p-3 ${done ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20" : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"}`}><div className="flex items-start gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>{done ? <i aria-label="Selesai" className="fa-solid fa-check" /> : step}</span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Langkah {step}</p><h2 className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">{title}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{description}</p></div><i aria-hidden="true" className={`${icon} ml-auto hidden text-slate-400 sm:block`} /></div></article>)}
            </section>
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <section aria-labelledby="package-settings-heading" className={panel}>
                    <h2 id="package-settings-heading" className="font-display text-base font-semibold">Konfigurasi ujian</h2>
                    <p className={muted}>Atur penilaian dan pengalaman peserta untuk paket ini.</p>
                    <form onSubmit={saveSettings} className="mt-5" aria-busy={pendingAction === "settings"}>
                        <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
                            <legend className="sr-only">Pengaturan paket soal</legend>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="package-passing-score" className={labelClass}>Ambang lulus (%)</label>
                                    <input id="package-passing-score" type="number" required min="0" max="100" step="any" value={settings.passing_score} onChange={e => { setSettings({ ...settings, passing_score: e.target.value }); setSettingsError(null); }} aria-describedby="passing-score-help" className={inputClass + " mt-2"} />
                                    <p id="passing-score-help" className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">Nilai mapel harus lebih besar dari ambang ini. Nilai yang sama belum lulus.</p>
                                </div>
                                <div>
                                    <p className={labelClass}>Durasi pengerjaan</p>
                                    <p className="mt-2 flex min-h-11 items-center gap-2 rounded-lg bg-slate-50 px-3 text-sm font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-300"><i aria-hidden="true" className="fa-solid fa-clock text-slate-500 dark:text-slate-400" />{pkg.duration_minutes} menit</p>
                                    <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">Durasi mengikuti konfigurasi berkas XLSX saat import.</p>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                                <label className="flex cursor-pointer items-start gap-3 py-4">
                                    <input type="checkbox" checked={settings.allow_retry} onChange={e => { setSettings({ ...settings, allow_retry: e.target.checked }); setSettingsError(null); }} aria-describedby="retry-help" className={checkboxClass} />
                                    <span className="min-w-0"><span className={labelClass}>Izinkan remedial</span><span id="retry-help" className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-400">Peserta mendapat kesempatan mengerjakan maksimal 2 kali: 1 kali pengerjaan utama dan 1 kali remedial.</span></span>
                                </label>
                                <label className="flex cursor-pointer items-start gap-3 py-4">
                                    <input type="checkbox" checked={settings.show_result_to_participant} onChange={e => { setSettings({ ...settings, show_result_to_participant: e.target.checked }); setSettingsError(null); }} aria-describedby="result-help" className={checkboxClass} />
                                    <span className="min-w-0"><span className={labelClass}>Tampilkan nilai peserta</span><span id="result-help" className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-400">Peserta dapat melihat hasil nilai setelah menyelesaikan pengerjaan.</span></span>
                                </label>
                            </div>
                        </fieldset>
                        {settingsError && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{settingsError}</p>}
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p role="status" className={needsSave ? "text-sm text-amber-800 dark:text-amber-300" : "text-sm text-slate-600 dark:text-slate-400"}>{settingsChanged ? "Ada perubahan belum disimpan." : !complete ? "Konfigurasi belum lengkap." : "Konfigurasi tersimpan."}</p>
                            <button disabled={busy || !needsSave} className={primaryButtonClass}>{pendingAction === "settings" ? "Menyimpan…" : "Simpan konfigurasi"}</button>
                        </div>
                        <p className="mt-4 text-xs leading-5 text-slate-600 dark:text-slate-400">Konfigurasi tidak dapat diubah setelah peserta masuk ke sesi terkait atau mulai mengerjakan paket.</p>
                    </form>
                </section>
                <aside className="min-w-0 space-y-5">
                    <section className={panel} aria-labelledby="publication-heading">
                        <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="publication-heading" className="font-display text-base font-semibold">Publikasi paket</h2><StatusPill value={pkg.status} /></div>
                        <p className={muted}>{pkg.status === "draft" ? "Lengkapi paket sebelum digunakan dalam sesi ujian." : "Paket telah diterbitkan dan dapat dipilih pada sesi ujian."}</p>
                        <ul className="my-5 space-y-3 text-sm">
                            <li className="flex items-start gap-2"><i aria-hidden="true" className={complete && !settingsChanged ? "fa-solid fa-circle-check mt-1 text-emerald-700 dark:text-emerald-400" : "fa-regular fa-circle mt-1 text-slate-500 dark:text-slate-400"} /><span>{complete && !settingsChanged ? "Konfigurasi tersimpan" : "Simpan konfigurasi terlebih dahulu"}</span></li>
                            <li className="flex items-start gap-2"><i aria-hidden="true" className={activeCount ? "fa-solid fa-circle-check mt-1 text-emerald-700 dark:text-emerald-400" : "fa-regular fa-circle mt-1 text-slate-500 dark:text-slate-400"} /><span>{activeCount ? activeCount + " soal aktif tersedia" : "Tambahkan minimal satu soal aktif"}</span></li>
                        </ul>
                        <p className="mb-4 text-xs leading-5 text-slate-600 dark:text-slate-400">Periksa isi soal dan kunci jawaban di Bank Soal sebelum menerbitkan.</p>
                        {pkg.status === "draft" ? <button disabled={busy || activeCount === 0 || needsSave} onClick={publish} className={primaryButtonClass + " w-full"}>{pendingAction === "publish" ? "Menerbitkan…" : "Terbitkan paket"}</button> : <Link href={route("admin.public-exams.sessions.index")} className={primaryButtonClass + " w-full"}>Buka sesi ujian<i aria-hidden="true" className="fa-solid fa-arrow-right" /></Link>}
                    </section>
                    {pkg.status !== "draft" && <section className={panel} aria-labelledby="draft-heading">
                        <h2 id="draft-heading" className="text-sm font-semibold">Perlu revisi paket?</h2>
                        <p className={muted}>Mengembalikan paket ke draft juga mengubah sesi terkait menjadi draft dan mencabut tokennya. Tindakan ditolak jika peserta sudah masuk atau mengerjakan paket.</p>
                        <button disabled={busy} onClick={revertDraft} className={secondaryButtonClass + " mt-4 w-full"}>{pendingAction === "draft" ? "Memproses…" : "Kembalikan ke draft"}</button>
                    </section>}
                </aside>
            </div>
            <section className={panel} aria-labelledby="import-heading">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><h2 id="import-heading" className="font-display text-base font-semibold">Import soal</h2><p className={muted}>Isi template khusus paket ini, lalu unggah untuk menambahkan soal.</p></div>
                    <a href={route("admin.exams.public-bank.packages.template.download", { package: pkg.id })} download className={secondaryButtonClass}><i aria-hidden="true" className="fa-solid fa-download" /> Unduh template XLSX</a>
                </div>
                <details className="my-4 text-sm text-slate-600 dark:text-slate-400"><summary className="min-h-11 cursor-pointer rounded py-3 font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 dark:text-slate-200">Panduan import</summary><ol className="mt-2 list-decimal space-y-2 pl-5"><li>Gunakan template paket ini; jenis mapel, judul, dan kode sudah terisi.</li><li>Isi durasi, ambang lulus, pilihan remedial, dan tampilan nilai. Jika remedial diizinkan, peserta memiliki maksimal 2 kali kesempatan mengerjakan.</li><li>Isi pertanyaan, pilihan jawaban, kunci, poin, dan status aktif.</li><li>Unggah XLSX maksimal 5 MB dan 2.000 baris. Jika ada baris tidak valid, seluruh import ditolak tanpa menyimpan soal.</li><li>Periksa hasil import dan konfigurasi, lalu terbitkan paket.</li></ol></details>
                {pkg.status === "draft" && questions.length === 0 ? <form onSubmit={importQuestions} className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-950">
                    <label htmlFor="public-package-file" className={labelClass}>Berkas soal terisi</label>
                    <p id="file-help" className="mb-3 mt-1 text-xs text-slate-600 dark:text-slate-400">Format .xlsx · Maksimal 5 MB · 2.000 baris</p>
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"><input ref={fileInput} id="public-package-file" type="file" accept=".xlsx" required disabled={busy} aria-describedby="file-help" onChange={event => setFile(event.target.files?.[0] ?? null)} className={inputClass + " min-w-0 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-700 dark:file:bg-slate-800 dark:file:text-slate-200"} /><button disabled={busy || !file} className={primaryButtonClass + " shrink-0"}>{pendingAction === "import" ? "Mengimpor…" : "Validasi & import"}</button></div>
                </form> : <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-950 dark:text-slate-400">{pkg.status !== "draft" ? "Paket telah diterbitkan; import tidak tersedia." : "Soal sudah tersedia. Import ulang tidak tersedia agar soal tidak tertimpa atau terduplikasi."}</p>}
                {report && <div role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Import selesai: {report.imported} soal tersimpan, {report.active} aktif. Periksa soal dan konfigurasi sebelum menerbitkan.</div>}
            </section>
            <section className={panel}>
                <div className="mb-5"><h2 className="font-display text-base font-semibold">Bank Soal <span className="text-sm font-normal text-slate-600 dark:text-slate-400">· {questions.length} butir</span></h2><p className={muted}>Periksa pertanyaan, opsi jawaban, dan kunci. Hanya soal aktif yang digunakan dalam ujian.</p></div>
                {questions.length === 0 ? <EmptyState icon="fa-solid fa-list-ol" title="Belum ada butir soal" description="Upload paket soal terisi untuk mulai review." /> : <div className="space-y-4">{questions.map((question, index) => <article key={question.id} className="min-w-0 rounded-lg border border-slate-200 p-4 text-sm dark:border-white/10">
                    <div className="mb-3 flex flex-wrap items-center gap-2"><span className="font-bold text-slate-900 dark:text-white">Soal {index + 1}</span><StatusPill value={question.is_active ? "active" : "inactive"} /><span className="text-slate-600 dark:text-slate-400">{question.point} poin · Kunci: {question.correct_answer}</span><button type="button" disabled={busy} onClick={() => void toggleQuestion(question)} className={secondaryButtonClass}>{pendingAction === `toggle-${question.id}` ? "Memproses…" : question.is_active ? "Nonaktifkan" : "Aktifkan"}</button><button type="button" disabled={busy} onClick={() => void deleteQuestion(question)} className={dangerButtonClass}>{pendingAction === `delete-${question.id}` ? "Menghapus…" : "Hapus"}</button></div>
                    <div className="break-words text-slate-900 dark:text-white"><RichExamText text={question.question_text} /></div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(JSON.parse(question.options) as Record<string, string>).map(([letter, text]) => <div key={letter} className={`flex min-w-0 gap-2 rounded-lg border p-3 ${letter === question.correct_answer ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-300"}`}><span className="font-bold">{letter}.</span><div className="min-w-0 break-words"><RichExamText text={text} /></div></div>)}</div>
                </article>)}</div>}
            </section>
            <div className="grid items-start gap-5 lg:grid-cols-2">
                <section className={panel}>
                    <h2 className="font-display text-base font-semibold">Riwayat import</h2>
                    {imports.length === 0 ? <p className={muted + " mt-3"}>Belum ada riwayat import tercatat. Import sebelum fitur ini tersedia tidak memiliki laporan.</p> : <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">{imports.map(batch => <details key={batch.id} className="py-3 text-sm">
                        <summary className="min-h-11 cursor-pointer break-all rounded py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500">{batch.metadata.filename} <span className={batch.metadata.status === "completed" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}>· {batch.metadata.status === "completed" ? "Berhasil" : "Ditolak"}</span></summary>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{batch.actor_name} · {new Date(batch.created_at).toLocaleString("id-ID")}</p>
                        <p className={muted + " mt-2"}>{batch.metadata.imported} soal disimpan · {batch.metadata.active} aktif</p>
                        {Object.values(batch.metadata.errors).flat().map((message, index) => <p key={index} className="mt-2 text-rose-700 dark:text-rose-300">{message}</p>)}
                    </details>)}</div>}
                </section>
                <section className={panel}>
                    <h2 className="font-display text-base font-semibold">Sesi terkait</h2>
                    <p className={muted}>Sesi ujian yang menggunakan paket ini.</p>
                    {sessions.length ? <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">{sessions.map(session => <li key={session.id}><Link href={route("admin.public-exams.sessions.show", { session: session.id })} className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded py-3 text-sm font-semibold text-amber-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 dark:text-amber-300"><span className="min-w-0 break-words">{session.title}</span><StatusPill value={session.status} /></Link></li>)}</ul> : <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Belum digunakan dalam sesi.</p>}
                </section>
            </div>
        </ExamWorkspace>
    </>;
}

PublicPackageShow.layout = (page: ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
