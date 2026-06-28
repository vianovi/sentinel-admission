import { useEffect, useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import Swal from "sweetalert2";
import DashboardLayout from "@/Layouts/DashboardLayout";
import type { PageProps } from "@/types";

type Wave = {
    id: number;
    title: string;
    academic_year: string;
    start_date: string | null;
    end_date: string | null;
    quota_target: number;
    is_active: boolean;
    majors_enabled: boolean;
    candidates_count: number;
    quota_filled: number;
};

type Props = {
    waves: Wave[];
};

const swalDark = Swal.mixin({
    background: "#0f172a",
    color: "#e2e8f0",
    confirmButtonColor: "#f43f5e",
    cancelButtonColor: "#334155",
    customClass: {
        popup: "!rounded-2xl !border !border-white/10",
        confirmButton: "!rounded-xl !px-6",
        cancelButton: "!rounded-xl !px-6",
    },
});

export default function AdminWaves({ waves }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [processingId, setProcessingId] = useState<number | null>(null);
    const activeWave = useMemo(() => waves.find((wave) => wave.is_active) ?? null, [waves]);

    useEffect(() => {
        animate(".admin-wave-item", {
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 480,
            delay: stagger(55),
            ease: "outExpo",
        });
    }, [waves]);

    useEffect(() => {
        if (flash.success) {
            swalDark.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: flash.success,
                showConfirmButton: false,
                timer: 2200,
                timerProgressBar: true,
            });
        }
    }, [flash.success]);

    const toggleWave = async (wave: Wave) => {
        const confirmed = await swalDark.fire({
            title: wave.is_active ? "Tutup gelombang ini?" : "Aktifkan gelombang ini?",
            text: wave.is_active ? "Pendaftaran pada gelombang ini akan ditandai tidak aktif." : "Gelombang aktif lain akan otomatis ditutup.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, lanjutkan",
            cancelButtonText: "Batal",
        });

        if (!confirmed.isConfirmed) return;

        setProcessingId(wave.id);
        router.post(`/dashboard/admin/waves/${wave.id}/toggle`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    return (
        <DashboardLayout>
            <Head title="Gelombang - Admin" />

            <div className="flex flex-col gap-6 pb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/25">
                            <i className="fa-solid fa-layer-group text-sm text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold leading-tight text-slate-800 dark:text-white">
                                Gelombang Pendaftaran
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {waves.length} gelombang terdata{activeWave ? ` - aktif: ${activeWave.title}` : ""}
                            </p>
                        </div>
                    </div>
                </div>

                {waves.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-soft dark:border-white/10 dark:bg-slate-900">
                        <i className="fa-solid fa-calendar-xmark text-3xl text-slate-300 dark:text-slate-600" />
                        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Belum ada gelombang pendaftaran
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Data gelombang akan muncul setelah dibuat dari sumber administrasi.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {waves.map((wave) => {
                            const quotaPct = wave.quota_target > 0
                                ? Math.min(100, Math.round((wave.quota_filled / wave.quota_target) * 100))
                                : 0;

                            return (
                                <section
                                    key={wave.id}
                                    className="admin-wave-item opacity-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/5 dark:bg-slate-900"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-base font-display font-bold text-slate-800 dark:text-white">
                                                    {wave.title}
                                                </h2>
                                                <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${wave.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"}`}>
                                                    {wave.is_active ? "Aktif" : "Nonaktif"}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                TA {wave.academic_year} - {wave.start_date ?? "Mulai belum diset"} sampai {wave.end_date ?? "Akhir belum diset"}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => toggleWave(wave)}
                                            disabled={processingId === wave.id}
                                            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white shadow-sm shadow-rose-500/20 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processingId === wave.id ? (
                                                <><i className="fa-solid fa-spinner fa-spin text-xs" /> Menyimpan</>
                                            ) : (
                                                <><i className="fa-solid fa-power-off text-xs" /> {wave.is_active ? "Tutup" : "Aktifkan"}</>
                                            )}
                                        </button>
                                    </div>

                                    <div className="mt-5 grid grid-cols-3 gap-3">
                                        <Metric label="Kandidat" value={wave.candidates_count} />
                                        <Metric label="Diterima" value={wave.quota_filled} />
                                        <Metric label="Kuota" value={wave.quota_target} />
                                    </div>

                                    <div className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-white/10">
                                        <div className="mb-2 flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Kuota diterima</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{quotaPct}%</span>
                                        </div>
                                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                            <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500" style={{ width: `${quotaPct}%` }} />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <i className={`fa-solid ${wave.majors_enabled ? "fa-circle-check text-emerald-500" : "fa-circle-minus text-slate-400"}`} />
                                        Jurusan {wave.majors_enabled ? "aktif" : "tidak aktif"} pada gelombang ini
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center dark:bg-white/[0.03]">
            <p className="text-lg font-display font-bold text-slate-800 dark:text-white">{value.toLocaleString("id-ID")}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{label}</p>
        </div>
    );
}
