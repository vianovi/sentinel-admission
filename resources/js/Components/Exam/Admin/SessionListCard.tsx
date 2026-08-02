import { memo } from "react";
import { Link, router } from "@inertiajs/react";
import { EmptyState, StatusPill, dangerButtonClass, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { confirmAction } from "@/utils/swal";
import type { SessionRow } from "./SessionFormCard";

type Props = {
    sessions: SessionRow[];
};

export const SessionListCard = memo(function SessionListCard({ sessions }: Props) {
    const destroy = async (session: SessionRow) => {
        const confirmed = await confirmAction("Hapus Sesi Ujian?", `Apakah Anda yakin ingin menghapus sesi "${session.title}"?`, "Ya, Hapus Sesi");
        if (!confirmed) return;
        router.delete(`/dashboard/admin/exams/sessions/${session.id}`, { preserveScroll: true });
    };

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daftar Sesi Ujian</h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Atur penugasan peserta, pantau pengerjaan real-time, dan buka halaman hasil.</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">{sessions.length.toLocaleString("id-ID")} sesi</span>
            </div>

            {sessions.length === 0 ? (
                <EmptyState icon="fa-solid fa-calendar-xmark" title="Belum ada sesi" description="Buat sesi baru untuk mulai menjadwalkan ujian bagi kandidat." />
            ) : (
                <div className="grid gap-3">
                    {sessions.map((session) => (
                        <div key={session.id} className="rounded-lg border border-slate-200 p-4 transition-colors hover:border-gold/60 dark:border-white/10">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{session.title}</h3>
                                        <StatusPill value={session.status} />
                                        <StatusPill value={session.is_public ? "akses umum aktif" : "akses khusus kandidat"} />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Paket: <span className="font-semibold text-slate-700 dark:text-slate-200">{session.package_title ?? "Tanpa paket"}</span> ·
                                        Gelombang: <span className="font-semibold text-slate-700 dark:text-slate-200">{session.admission_wave ?? "Semua"}</span>
                                    </p>
                                    <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{session.description || "Belum ada deskripsi sesi."}</p>
                                    <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                                        <span><i className="fa-solid fa-door-open mr-1 text-slate-400" />Buka: {session.opens_at ?? "-"}</span>
                                        <span>·</span>
                                        <span><i className="fa-solid fa-door-closed mr-1 text-slate-400" />Tutup: {session.closes_at ?? "-"}</span>
                                        <span>·</span>
                                        <span><i className="fa-solid fa-clock mr-1 text-slate-400" />{session.duration_minutes} min</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                    <Link href={`/dashboard/admin/exams/sessions/${session.id}`} className={secondaryButtonClass}>
                                        <i className="fa-solid fa-user-plus text-xs" /> Atur Kandidat ({session.candidates_count})
                                    </Link>

                                    <Link href={`/dashboard/admin/exams/results?session=${session.id}`} className={secondaryButtonClass}>
                                        <i className="fa-solid fa-chart-simple text-xs" /> Hasil ({session.attempts_count})
                                    </Link>

                                    <Link href={`/dashboard/admin/exams/sessions/${session.id}/edit`} className={secondaryButtonClass}>
                                        <i className="fa-solid fa-pen text-xs" /> Edit
                                    </Link>

                                    <button type="button" onClick={() => destroy(session)} className={dangerButtonClass}>
                                        <i className="fa-solid fa-trash text-xs" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
});

export default SessionListCard;
