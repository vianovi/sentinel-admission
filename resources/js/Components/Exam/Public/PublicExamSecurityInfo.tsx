import { useState } from "react";

type Props = {
    isDark: boolean;
};

export default function PublicExamSecurityInfo({ isDark }: Props) {
    const [activeTab, setActiveTab] = useState<"flow" | "backup" | "security">("security");

    return (
        <div className="lg:col-span-5 w-full space-y-4">
            <div className={`rounded-2xl border p-5 shadow-xl backdrop-blur-xl transition-all duration-300 ${
                isDark ? "border-white/10 bg-slate-900/40 text-slate-300" : "border-slate-200 bg-white text-slate-800"
            }`}>
                <h3 className={`text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 border-b pb-3 mb-4 ${
                    isDark ? "border-white/10 text-white" : "border-slate-200 text-slate-950"
                }`}>
                    <i className="fa-solid fa-circle-info text-amber-500" /> Panduan & Sistem Ujian
                </h3>

                {/* Tab Selector */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950/60 mb-4 border border-slate-200 dark:border-white/5">
                    <button
                        type="button"
                        onClick={() => setActiveTab("flow")}
                        className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                            activeTab === "flow"
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                        <i className="fa-solid fa-route text-xs" />
                        <span>Alur</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("backup")}
                        className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                            activeTab === "backup"
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                        <i className="fa-solid fa-rotate text-xs" />
                        <span>Backup</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("security")}
                        className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                            activeTab === "security"
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                        <i className="fa-solid fa-shield-halved text-xs" />
                        <span>Keamanan</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-4 min-h-[190px] flex flex-col justify-start">
                    {activeTab === "flow" && (
                        <div className="space-y-3 animate-fadeIn">
                            <p className="text-[10px] leading-relaxed text-slate-500">
                                Alur pengerjaan ujian mandiri dirancang secara linier dan terstruktur:
                            </p>
                            <div className="relative pl-5 border-l border-amber-500/20 space-y-3.5 mt-2">
                                <div className="relative">
                                    <div className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">1</div>
                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Masuk dengan Token</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Dapatkan token ujian dari admin/proktor dan verifikasi di halaman ini.</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">2</div>
                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Isi Identitas</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Isi nama lengkap, sekolah/instansi, dan info opsional lainnya secara benar.</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">3</div>
                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Konfirmasi & Mulai</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Kunci layar penuh (fullscreen) diaktifkan, dan timer ujian mulai berjalan.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "backup" && (
                        <div className="space-y-3.5 animate-fadeIn">
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <i className="fa-solid fa-rotate text-xs" />
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Sinkronisasi Cepat (400ms)</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Setiap kali Anda memilih atau mengubah opsi jawaban, sistem mengirimkannya ke cloud dalam waktu kurang dari 400 milidetik.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <i className="fa-solid fa-hard-drive text-xs" />
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Proteksi Offline (Local Storage)</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Jika koneksi internet putus, jawaban Anda tetap tersimpan di browser dan akan disinkronkan kembali secara otomatis saat online.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <i className="fa-solid fa-power-off text-xs" />
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Auto-Resume Ujian</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Apabila perangkat mati mendadak atau browser tertutup, Anda dapat masuk kembali ke portal untuk melanjutkan ujian dari sisa waktu terakhir.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="space-y-3.5 animate-fadeIn">
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                                    <i className="fa-solid fa-expand text-xs" />
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Layar Penuh Wajib</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Ujian berjalan otomatis dalam mode fullscreen. Keluar dari fullscreen dicatat sebagai pelanggaran.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                                    <i className="fa-solid fa-eye text-xs" />
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Deteksi Blur & Ganti Tab</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Membuka tab baru, beralih aplikasi, atau memindahkan fokus kursor di luar ujian akan memicu sanksi pelanggaran.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                                    <i className="fa-solid fa-desktop text-xs" />
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>Deteksi Screen Sharing</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Sistem mendeteksi dan mencegah penggunaan screen sharing atau monitor tambahan saat ujian berlangsung.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Technical Requirements Info */}
            <div className={`rounded-xl border p-4 text-[10px] leading-relaxed transition-colors ${
                isDark ? "bg-slate-900/20 border-white/5 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-600"
            }`}>
                <p className="font-bold mb-1">Syarat Teknis Ujian:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                    <li>Gunakan browser modern (Chrome, Edge, Firefox, Safari terupdate).</li>
                    <li>Pastikan koneksi internet stabil sepanjang pengerjaan.</li>
                    <li>Matikan ekstensi penerjemah bahasa atau perekam layar.</li>
                </ul>
            </div>
        </div>
    );
}
