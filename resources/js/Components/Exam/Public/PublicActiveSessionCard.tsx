type ActiveExamSession = {
    attemptId: number;
    guestName: string;
    guestSchool: string;
    sessionTitle: string;
    subjectName?: string;
    startedAt: string;
    expiresAt: string;
    recoveryToken: string;
};

type Props = {
    activeSession: ActiveExamSession;
    isDark: boolean;
    handleResumeSession: () => void;
    handleDismissActiveSession: () => void;
};

export default function PublicActiveSessionCard({
    activeSession,
    isDark,
    handleResumeSession,
    handleDismissActiveSession,
}: Props) {
    return (
        <div className={`rounded-2xl border p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
            isDark ? "border-amber-500/30 bg-slate-900/80 text-slate-200" : "border-amber-400 bg-white text-slate-800"
        }`}>
            <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                        Sesi Ujian Aktif Terdeteksi Pada Browser Ini
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleDismissActiveSession}
                    className="text-xs text-slate-400 hover:text-rose-500 underline transition-colors"
                >
                    Bukan Saya / Hapus Sesi
                </button>
            </div>

            <div className="mt-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                        <div className="text-xs font-semibold uppercase text-amber-500">Peserta Ujian</div>
                        <h3 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>
                            {activeSession.guestName}
                        </h3>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            Asal Sekolah: <span className="font-semibold">{activeSession.guestSchool}</span>
                        </p>
                    </div>
                    <div className={`text-left sm:text-right p-3 rounded-xl border ${
                        isDark ? "border-white/10 bg-slate-800/60" : "border-slate-200 bg-slate-50"
                    }`}>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Judul Ujian</div>
                        <div className="text-xs font-extrabold text-amber-500">{activeSession.sessionTitle}</div>
                        {activeSession.subjectName && (
                            <div className="text-[11px] text-slate-400">{activeSession.subjectName}</div>
                        )}
                    </div>
                </div>

                <div className={`rounded-xl border p-4 text-xs flex items-start gap-3 ${
                    isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-900"
                }`}>
                    <i className="fa-solid fa-triangle-exclamation text-amber-500 text-base shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">Perangkat ini mendeteksi sesi pengerjaan ujian yang belum selesai.</p>
                        <p className="mt-1 opacity-90">Sistem Sentinel menyimpan status pengerjaan secara lokal dan real-time di browser Anda. Klik tombol di bawah untuk langsung kembali ke lembar soal tanpa memasukkan token kembali.</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleResumeSession}
                    className="w-full py-4 px-6 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xl shadow-amber-500/25 active:scale-[0.99] transition-all duration-200 text-center flex items-center justify-center gap-3 text-sm tracking-wide"
                >
                    <i className="fa-solid fa-play text-xs" />
                    Lanjutkan Sesi Ujian Saya Sekarang
                </button>
            </div>
        </div>
    );
}
