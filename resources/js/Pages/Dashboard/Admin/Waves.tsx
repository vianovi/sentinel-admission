import { useMemo, useState, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import Swal from "sweetalert2";
import DashboardLayout from "@/Layouts/DashboardLayout";
import WaveFormModal, { type Wave } from "@/Components/Dashboard/Admin/WaveFormModal";
import WaveListCard from "@/Components/Dashboard/Admin/WaveListCard";
import type { PageProps } from "@/types";

type Props = {
    waves: Wave[];
};

const swalDark = Swal.mixin({
    background: "#0f172a",
    color: "#e2e8f0",
    confirmButtonColor: "#d4a017",
    cancelButtonColor: "#334155",
    customClass: {
        popup: "!rounded-2xl !border !border-white/10",
        confirmButton: "!rounded-xl !px-6",
        cancelButton: "!rounded-xl !px-6",
    },
});

export default function AdminWaves({ waves }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [editingWave, setEditingWave] = useState<Wave | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const activeWave = useMemo(() => waves.find((w) => w.is_active) ?? null, [waves]);
    const totalQuota = useMemo(() => waves.reduce((sum, w) => sum + (w.quota_target || 0), 0), [waves]);
    const totalCandidates = useMemo(() => waves.reduce((sum, w) => sum + (w.candidates_count || 0), 0), [waves]);

    useEffect(() => {
        if (!flash.success && !flash.error) return;
        swalDark.fire({
            toast: true,
            position: "top-end",
            icon: flash.success ? "success" : "error",
            title: flash.success ?? flash.error ?? "",
            showConfirmButton: false,
            timer: 2400,
            timerProgressBar: true,
        });
    }, [flash.success, flash.error]);

    const handleCreateNew = () => {
        setEditingWave(null);
        setIsModalOpen(true);
    };

    const handleEdit = (wave: Wave) => {
        setEditingWave(wave);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingWave(null);
    };

    return (
        <>
            <Head title="Gelombang - Admin" />

            <div className="flex flex-col gap-6 pb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold text-navy shadow-lg shadow-gold/20">
                            <i className="fa-solid fa-layer-group text-sm" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold leading-tight text-slate-800 dark:text-white">
                                Gelombang Pendaftaran
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Atur jadwal periode, kuota target, dan kriteria gelombang pendaftaran
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateNew}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-bold text-navy shadow-md shadow-gold/20 transition hover:bg-amber-400"
                    >
                        <i className="fa-solid fa-plus text-xs" />
                        Buat Gelombang Baru
                    </button>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="text-xs font-medium">Total Gelombang</span>
                            <i className="fa-solid fa-layer-group text-xs text-gold" />
                        </div>
                        <p className="mt-2 text-2xl font-bold font-display text-slate-800 dark:text-white">{waves.length}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="text-xs font-medium">Gelombang Aktif</span>
                            <i className="fa-solid fa-circle-check text-xs text-emerald-500" />
                        </div>
                        <p className="mt-2 text-2xl font-bold font-display text-slate-800 dark:text-white">{activeWave ? "1" : "0"}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400 truncate">{activeWave ? activeWave.title : "Tidak ada gelombang aktif"}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="text-xs font-medium">Target Kuota</span>
                            <i className="fa-solid fa-bullseye text-xs text-blue-500" />
                        </div>
                        <p className="mt-2 text-2xl font-bold font-display text-slate-800 dark:text-white">{totalQuota.toLocaleString("id-ID")}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="text-xs font-medium">Total Kandidat</span>
                            <i className="fa-solid fa-users text-xs text-purple-500" />
                        </div>
                        <p className="mt-2 text-2xl font-bold font-display text-slate-800 dark:text-white">{totalCandidates.toLocaleString("id-ID")}</p>
                    </div>
                </div>

                {/* Single-Column Full Width List Card with Search, Filter & Sort */}
                <WaveListCard
                    waves={waves}
                    onEdit={handleEdit}
                    onCreateNew={handleCreateNew}
                />

                {/* Standalone Modal Form */}
                <WaveFormModal
                    show={isModalOpen}
                    onClose={handleCloseModal}
                    editingWave={editingWave}
                />

            </div>
        </>
    );
}

AdminWaves.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
