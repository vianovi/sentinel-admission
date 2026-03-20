// resources/js/Components/Dashboard/Candidate/DataKesehatan/TabTimKesehatan.tsx

import { useEffect } from "react";
import { animate }   from "animejs";

export default function TabTimKesehatan() {

    useEffect(() => {
        animate(".tim-content", {
            opacity:    [0, 1],
            translateY: [16, 0],
            duration:   500,
            ease:       "outExpo",
        });
    }, []);

    return (
        <div className="flex flex-col items-center justify-center py-16 gap-5 tim-content opacity-0">

            {/* Icon */}
            <div className="relative">
                <div className="w-20 h-20 rounded-2xl
                                dark:bg-slate-800/60 bg-slate-100
                                border dark:border-white/[0.08] border-black/[0.07]
                                flex items-center justify-center">
                    <i className="fa-solid fa-user-doctor text-3xl dark:text-slate-600 text-slate-300"></i>
                </div>
                {/* Lock badge */}
                <div className="absolute -bottom-2 -right-2
                                w-7 h-7 rounded-lg
                                dark:bg-slate-700 bg-slate-200
                                border dark:border-white/[0.08] border-black/[0.07]
                                flex items-center justify-center">
                    <i className="fa-solid fa-lock text-xs dark:text-slate-400 text-slate-500"></i>
                </div>
            </div>

            {/* Text */}
            <div className="text-center max-w-sm">
                <p className="text-sm font-semibold dark:text-slate-300 text-slate-600 mb-2">
                    Fitur Belum Tersedia
                </p>
                <p className="text-xs dark:text-slate-500 text-slate-400 leading-relaxed">
                    Tab ini akan digunakan oleh tim kesehatan sekolah untuk mencatat
                    kondisi dan perkembangan kesehatan siswa selama berada di lingkungan sekolah.
                </p>
            </div>

            {/* Info chip */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                            dark:bg-white/[0.03] bg-slate-50
                            border dark:border-white/[0.06] border-black/[0.06]">
                <i className="fa-solid fa-clock text-xs dark:text-slate-500 text-slate-400"></i>
                <p className="text-[11px] dark:text-slate-500 text-slate-400">
                    Akan dibuka setelah proses penerimaan selesai
                </p>
            </div>

        </div>
    );
}
