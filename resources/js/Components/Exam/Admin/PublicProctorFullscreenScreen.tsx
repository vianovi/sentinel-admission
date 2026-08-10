type Props = {
    show: boolean;
    onClose: () => void;
    activeToken: string | undefined;
    sessionTitle: string;
    copyToClipboard: (text: string, label: string) => void;
};

export default function PublicProctorFullscreenScreen({
    show,
    onClose,
    activeToken,
    sessionTitle,
    copyToClipboard,
}: Props) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950 p-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">MODE PROKTOR ANBK / PROYEKSI RUANGAN</span>
                    <h2 className="text-2xl font-black text-white">{sessionTitle}</h2>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-xl bg-slate-900 border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                    <i className="fa-solid fa-compress mr-2" /> Keluar Fullscreen
                </button>
            </div>

            <div className="my-auto text-center space-y-6">
                <span className="text-sm font-extrabold uppercase tracking-widest text-slate-400 block">KODE TOKEN UJIAN PUBLIK</span>
                <div className="inline-block rounded-3xl border-4 border-amber-500/50 bg-slate-900 px-12 py-8 shadow-2xl shadow-amber-500/20">
                    <span className="text-7xl sm:text-9xl font-black tracking-widest text-amber-300 font-mono select-all">
                        {activeToken ?? "======="}
                    </span>
                </div>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Masukkan token ini pada halaman portal ujian publik untuk memulai pengerjaan.
                </p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => copyToClipboard(`${window.location.origin}/exam/p/${activeToken}`, "Link Direct Ujian")}
                        className="rounded-xl bg-amber-500 px-6 py-3 text-xs font-black text-slate-950 hover:bg-amber-400"
                    >
                        <i className="fa-solid fa-link mr-2" /> Salin Link Direct Ujian
                    </button>
                </div>
            </div>

            <div className="text-center text-xs text-slate-500 border-t border-white/10 pt-4">
                Sentinel Admissions Exam Control System &bull; ANBK Style Proctor Display
            </div>
        </div>
    );
}
