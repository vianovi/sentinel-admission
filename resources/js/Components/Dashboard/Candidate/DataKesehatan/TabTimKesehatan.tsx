// resources/js/Components/Dashboard/Candidate/DataKesehatan/TabTimKesehatan.tsx

import { useEffect } from "react";
import { animate, stagger } from "animejs";

export default function TabTimKesehatan() {

    useEffect(() => {
        animate(".tim-item", {
            opacity:    [0, 1],
            translateY: [16, 0],
            duration:   500,
            delay:      stagger(70),
            ease:       "outExpo",
        });
    }, []);

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 gap-6">

            {/* ── Icon utama ─────────────────────────────────────────────── */}
            <div className="tim-item opacity-0 relative">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-3xl dark:bg-cyan-500/10 bg-cyan-100
                                scale-110 blur-xl" />
                <div className="relative w-24 h-24 rounded-3xl
                                dark:bg-slate-800/80 bg-white
                                border dark:border-white/[0.08] border-black/[0.07]
                                flex items-center justify-center shadow-sm">
                    <i className="fa-solid fa-user-doctor text-4xl dark:text-slate-600 text-slate-300"></i>

                    {/* Lock badge */}
                    <div className="absolute -bottom-2.5 -right-2.5
                                    w-8 h-8 rounded-xl
                                    dark:bg-slate-700 bg-slate-100
                                    border dark:border-white/[0.08] border-black/[0.07]
                                    flex items-center justify-center shadow-sm">
                        <i className="fa-solid fa-lock text-xs dark:text-slate-400 text-slate-500"></i>
                    </div>
                </div>
            </div>

            {/* ── Teks utama ─────────────────────────────────────────────── */}
            <div className="tim-item opacity-0 text-center max-w-sm">
                <p className="text-base font-bold dark:text-slate-200 text-slate-700 mb-2">
                    Fitur Belum Tersedia
                </p>
                <p className="text-xs dark:text-slate-500 text-slate-400 leading-relaxed">
                    Tab ini akan digunakan oleh tim kesehatan sekolah untuk mencatat
                    kondisi dan perkembangan kesehatan siswa selama berada di lingkungan sekolah.
                </p>
            </div>

            {/* ── Info chip ──────────────────────────────────────────────── */}
            <div className="tim-item opacity-0 flex items-center gap-2 px-4 py-2.5 rounded-xl
                            dark:bg-white/[0.03] bg-slate-50
                            border dark:border-white/[0.06] border-black/[0.06]">
                <i className="fa-solid fa-clock text-xs dark:text-slate-500 text-slate-400"></i>
                <p className="text-[11px] dark:text-slate-500 text-slate-400">
                    Akan dibuka setelah proses penerimaan selesai
                </p>
            </div>

            {/* ── Preview fitur ──────────────────────────────────────────── */}
            <div className="tim-item opacity-0 w-full max-w-sm">
                <p className="text-[10px] font-semibold uppercase tracking-widest
                              dark:text-slate-600 text-slate-400 text-center mb-3">
                    Fitur yang akan hadir
                </p>
                <div className="flex flex-col gap-2">
                    {[
                        { icon: "fa-solid fa-stethoscope",    label: "Rekap pemeriksaan berkala"          },
                        { icon: "fa-solid fa-pills",           label: "Riwayat pemberian obat & tindakan"  },
                        { icon: "fa-solid fa-chart-line",      label: "Grafik perkembangan kesehatan"      },
                        { icon: "fa-solid fa-notes-medical",   label: "Catatan dari perawat sekolah"       },
                    ].map(item => (
                        <div key={item.label}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                                       dark:bg-white/[0.02] bg-white
                                       border dark:border-white/[0.05] border-black/[0.05]">
                            <div className="w-7 h-7 rounded-lg
                                            dark:bg-white/[0.04] bg-slate-100
                                            flex items-center justify-center shrink-0">
                                <i className={`${item.icon} text-[11px] dark:text-slate-500 text-slate-400`}></i>
                            </div>
                            <p className="text-xs dark:text-slate-500 text-slate-400">
                                {item.label}
                            </p>
                            <i className="fa-solid fa-lock text-[9px] dark:text-slate-700 text-slate-300 ml-auto"></i>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}