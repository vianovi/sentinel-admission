import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import DashboardLayout from "@/Layouts/DashboardLayout";
import RichExamText from "@/Components/Exam/Shared/RichExamText";
import { BackLink, EmptyState, ExamWorkspace, FlashMessage, PageHeader, StatCard, StatusPill, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { confirmAction, showSuccessToast } from "@/utils/swal";

type Props = {
    examPackage: { id: number; title: string; code: string; subject_name: string; status: string; duration_minutes: number; passing_score: number | null; allow_retry: boolean | number | null; show_result_to_participant: boolean | number | null };
    questions: { id: number; question_text: string; options: string; correct_answer: string; point: number; is_active: boolean | number }[];
    sessions: { id: number; title: string; status: string }[];
    imports: { id: number; actor_name: string; created_at: string; metadata: { filename: string; status: string; imported: number; active: number; errors: Record<string, string[]> } }[];
};

const panel = "rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900";

export default function PublicPackageShow({ examPackage: pkg, questions, sessions, imports }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<{ imported: number; active: number } | null>(null);
    const activeCount = questions.filter(q => Boolean(q.is_active)).length;
    const complete = pkg.passing_score !== null && pkg.allow_retry !== null && pkg.show_result_to_participant !== null;

    const importQuestions = async (event: FormEvent) => {
        event.preventDefault();
        if (!file || busy) return;
        setBusy(true);
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
            router.reload();
        } catch (err) {
            setError(axios.isAxiosError(err) ? err.response?.data?.errors?.file?.[0] ?? err.response?.data?.message ?? "Import gagal. Silakan coba lagi." : "File gagal diproses.");
            router.reload({ only: ["imports"] });
        } finally {
            setBusy(false);
        }
    };

    const publish = async () => {
        if (!await confirmAction("Terbitkan Paket Ujian?", `Pastikan soal dan kunci jawaban paket “${pkg.title}” sudah diperiksa.`, "Ya, Terbitkan")) return;
        setBusy(true);
        setError(null);
        try {
            await axios.post(route("admin.exams.public-bank.packages.publish", { package: pkg.id }));
            showSuccessToast("Paket diterbitkan. Lanjutkan ke pengaturan sesi.");
            router.reload();
        } catch (err) {
            setError(axios.isAxiosError(err) ? err.response?.data?.message ?? "Paket gagal diterbitkan." : "Paket gagal diterbitkan.");
        } finally {
            setBusy(false);
        }
    };

    return <>
        <Head title={`Paket Publik · ${pkg.title}`} />
        <ExamWorkspace active="packages">
            <PageHeader title={pkg.title} description={`${pkg.subject_name} · ${pkg.code}`} icon="fa-solid fa-box-archive" actions={<>
                <BackLink href={route("admin.public-exams.packages.index")} label="Kembali ke Paket Soal" />
                <Link href={route("admin.public-exams.media.index")} className={secondaryButtonClass}>Bank Media</Link>
            </>} />
            <FlashMessage value={error} />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2"><StatusPill value={pkg.status} /><span className="text-xs text-slate-600 dark:text-slate-300">Ujian ulang: {pkg.allow_retry === null ? "Belum diatur" : pkg.allow_retry ? "Diizinkan" : "Tidak diizinkan"} · Nilai peserta: {pkg.show_result_to_participant === null ? "Belum diatur" : pkg.show_result_to_participant ? "Ditampilkan" : "Disembunyikan"}</span></div>
                {pkg.status === "draft" ? <button disabled={busy || activeCount === 0 || !complete} onClick={publish} className={primaryButtonClass}>{busy ? "Memproses..." : "Terbitkan Paket"}</button> : <Link href={route("admin.public-exams.sessions.index")} className={primaryButtonClass}>Lanjut ke Sesi Ujian</Link>}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Durasi" value={`${pkg.duration_minutes} menit`} icon="fa-solid fa-clock" />
                <StatCard label="Ambang Lulus" value={pkg.passing_score === null ? "Belum diatur" : `> ${pkg.passing_score}%`} icon="fa-solid fa-bullseye" />
                <StatCard label="Soal Aktif" value={`${activeCount} / ${questions.length}`} icon="fa-solid fa-list-ol" />
                <StatCard label="Sesi Terkait" value={sessions.length} icon="fa-solid fa-calendar-check" />
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <section className={panel}>
                    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold text-slate-900 dark:text-white">Workflow Import Soal</h2><a href={route("admin.exams.public-bank.packages.template.download", { package: pkg.id })} download className={secondaryButtonClass}>Unduh Paket Soal (.xlsx)</a></div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Unduh file khusus paket ini, isi soal serta konfigurasi ujian, lalu unggah dan periksa hasilnya sebelum menerbitkan.</p>
                    <details className="my-4 text-sm text-slate-600 dark:text-slate-300"><summary className="cursor-pointer font-bold">Panduan pengisian & import</summary><ol className="mt-3 list-decimal space-y-2 pl-5"><li>Unduh paket soal; kategori, judul, dan kode sudah terisi.</li><li>Isi durasi, ambang lulus, izin ulang, dan tampilan nilai pada konfigurasi ujian.</li><li>Isi pertanyaan, pilihan jawaban, kunci, poin, dan status aktif.</li><li>Unggah XLSX maksimal 5 MB dan 2.000 baris. Jika ada baris tidak valid, seluruh import ditolak tanpa menyimpan soal.</li><li>Periksa pilihan jawaban dan konfigurasi di bawah, lalu terbitkan paket.</li></ol></details>
                    {pkg.status === "draft" && questions.length === 0 ? <form onSubmit={importQuestions} className="space-y-3">
                        <label htmlFor="public-package-file" className={labelClass}>Upload Paket Soal Terisi (.xlsx)</label>
                        <input ref={fileInput} id="public-package-file" type="file" accept=".xlsx" required disabled={busy} onChange={event => setFile(event.target.files?.[0] ?? null)} className={inputClass} />
                        <button disabled={busy || !file} className={primaryButtonClass}>{busy ? "Memvalidasi & mengimpor..." : "Validasi & Import"}</button>
                    </form> : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">{pkg.status !== "draft" ? "Paket telah diterbitkan; import tidak tersedia." : "Soal sudah tersedia. Import ulang tidak tersedia agar soal tidak tertimpa atau terduplikasi."}</p>}
                </section>
                <aside className={panel}>
                    <h2 className="font-bold text-slate-900 dark:text-white">Riwayat Import</h2>
                    {imports.length === 0 ? <p className="my-3 text-sm text-slate-500">Belum ada riwayat import tercatat. Import sebelum fitur ini tersedia tidak memiliki laporan.</p> : <div className="my-4 max-h-96 space-y-3 overflow-y-auto">{imports.map(batch => <details key={batch.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-white/10">
                        <summary className="cursor-pointer break-words font-bold text-slate-900 dark:text-white">{batch.metadata.filename} · {batch.metadata.status === "completed" ? "Berhasil" : "Ditolak"}</summary>
                        <p className="mt-2 text-xs text-slate-500">{batch.actor_name} · {new Date(batch.created_at).toLocaleString("id-ID")}</p>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">{batch.metadata.imported} soal disimpan · {batch.metadata.active} aktif</p>
                        {Object.values(batch.metadata.errors).flat().map((message, index) => <p key={index} className="mt-2 text-rose-700 dark:text-rose-300">{message}</p>)}
                    </details>)}</div>}
                    <h2 className="font-bold text-slate-900 dark:text-white">Hasil Import & Langkah Berikutnya</h2>
                    {report && <div role="status" className="mt-3 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">Import selesai: {report.imported} soal tersimpan, {report.active} aktif. Semua baris valid.</div>}
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{questions.length ? "Periksa teks soal, seluruh opsi, kunci jawaban, dan status aktif pada Bank Soal di bawah." : "Belum ada soal. Mulai dengan mengunduh dan mengisi paket soal."}</p>
                    {!complete && <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">Konfigurasi penilaian belum lengkap. Isi konfigurasi pada XLSX sebelum import.</p>}
                    <h3 className="mb-2 mt-5 text-sm font-bold text-slate-900 dark:text-white">Sesi yang menggunakan paket</h3>
                    {sessions.length ? <ul className="space-y-2">{sessions.map(session => <li key={session.id}><Link href={route("admin.public-exams.sessions.show", { session: session.id })} className="flex flex-wrap items-center justify-between gap-2 text-sm text-amber-700 hover:underline dark:text-amber-300">{session.title}<StatusPill value={session.status} /></Link></li>)}</ul> : <p className="text-sm text-slate-500">Belum digunakan dalam sesi.</p>}
                </aside>
            </div>
            <section className={panel}>
                <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Bank Soal · {questions.length} Butir</h2>
                {questions.length === 0 ? <EmptyState icon="fa-solid fa-list-ol" title="Belum ada butir soal" description="Upload paket soal terisi untuk mulai review." /> : <div className="space-y-4">{questions.map((question, index) => <article key={question.id} className="min-w-0 rounded-lg border border-slate-200 p-4 text-sm dark:border-white/10">
                    <div className="mb-3 flex flex-wrap items-center gap-2"><span className="font-bold text-slate-900 dark:text-white">Soal {index + 1}</span><StatusPill value={question.is_active ? "active" : "inactive"} /><span className="text-slate-500">{question.point} poin · Kunci: {question.correct_answer}</span></div>
                    <div className="break-words text-slate-900 dark:text-white"><RichExamText text={question.question_text} /></div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(JSON.parse(question.options) as Record<string, string>).map(([letter, text]) => <div key={letter} className={`flex min-w-0 gap-2 rounded-lg border p-3 ${letter === question.correct_answer ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-300"}`}><span className="font-bold">{letter}.</span><div className="min-w-0 break-words"><RichExamText text={text} /></div></div>)}</div>
                </article>)}</div>}
            </section>
        </ExamWorkspace>
    </>;
}

PublicPackageShow.layout = (page: ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
