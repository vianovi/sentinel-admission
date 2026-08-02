import { memo } from "react";
import { Link, router } from "@inertiajs/react";
import { EmptyState, StatusPill, dangerButtonClass, secondaryButtonClass } from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import type { PackageRow } from "./PackageFormCard";

type Props = {
    packages: PackageRow[];
};

export const PackageListCard = memo(function PackageListCard({ packages }: Props) {
    const publish = (item: PackageRow) => {
        router.post(`/dashboard/admin/exams/packages/${item.id}/publish`, {}, { preserveScroll: true });
    };

    const close = (item: PackageRow) => {
        if (!window.confirm(`Tutup paket "${item.title}"?`)) return;
        router.post(`/dashboard/admin/exams/packages/${item.id}/close`, {}, { preserveScroll: true });
    };

    const destroy = (item: PackageRow) => {
        if (!window.confirm(`Hapus paket "${item.title}"?`)) return;
        router.delete(`/dashboard/admin/exams/packages/${item.id}`, { preserveScroll: true });
    };

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daftar Paket Ujian</h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Unduh template XLSX per paket, lalu import soal agar status paket siap dipakai di sesi.</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">{packages.length.toLocaleString("id-ID")} paket</span>
            </div>

            {packages.length === 0 ? (
                <EmptyState icon="fa-solid fa-box-open" title="Belum ada paket" description="Buat paket baru untuk mulai mengelola bank soal dan konfigurasi ujian." />
            ) : (
                <div className="grid gap-3">
                    {packages.map((item) => (
                        <div key={item.id} className="rounded-lg border border-slate-200 p-4 transition-colors hover:border-gold/60 dark:border-white/10">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                                        <StatusPill value={item.status} />
                                        {item.code ? (
                                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                                {item.code}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Kategori: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.subject_name ?? "Tanpa kategori"}</span> ·
                                        Soal: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.questions_count.toLocaleString("id-ID")}</span> ·
                                        Terpakai di: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.sessions_count.toLocaleString("id-ID")} sesi</span>
                                    </p>
                                    <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{item.description || "Belum ada deskripsi paket."}</p>
                                    <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                                        <span><i className="fa-solid fa-clock mr-1 text-slate-400" />{item.duration_minutes} min</span>
                                        <span>·</span>
                                        <span><i className="fa-solid fa-bullseye mr-1 text-slate-400" />Passing {item.passing_score}%</span>
                                        <span>·</span>
                                        <span><i className="fa-solid fa-repeat mr-1 text-slate-400" />{item.max_attempts} attempt</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                    <a
                                        href={`/dashboard/admin/exams/packages/${item.id}/template`}
                                        className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"
                                    >
                                        <i className="fa-solid fa-file-excel" /> Download Template
                                    </a>

                                    <Link href={`/dashboard/admin/exams/packages/${item.id}`} className={secondaryButtonClass}>
                                        <i className="fa-solid fa-file-import text-xs" /> Kelola / Import
                                    </Link>

                                    <Link href={`/dashboard/admin/exams/packages/${item.id}/edit`} className={secondaryButtonClass}>
                                        <i className="fa-solid fa-pen text-xs" /> Edit
                                    </Link>

                                    {item.status === "draft" && item.questions_count > 0 ? (
                                        <button type="button" onClick={() => publish(item)} className={secondaryButtonClass}>
                                            <i className="fa-solid fa-check text-xs text-emerald-500" /> Publish
                                        </button>
                                    ) : null}

                                    {item.status === "published" ? (
                                        <button type="button" onClick={() => close(item)} className={secondaryButtonClass}>
                                            <i className="fa-solid fa-lock text-xs text-amber-500" /> Tutup
                                        </button>
                                    ) : null}

                                    <button type="button" onClick={() => destroy(item)} className={dangerButtonClass}>
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

export default PackageListCard;
