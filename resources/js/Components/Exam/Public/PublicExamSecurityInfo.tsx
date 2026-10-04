import { useState } from "react";

type Props = {
    isDark: boolean;
};

export default function PublicExamSecurityInfo({ isDark }: Props) {
    const [activeTab, setActiveTab] = useState<"flow" | "backup" | "security">("flow");

    return (
        <div className="lg:col-span-5 w-full space-y-4">
            <div className={`rounded-3xl border p-6 shadow-xl backdrop-blur-xl transition-all duration-300 ${
                isDark ? "border-white/10 bg-slate-900/60 text-slate-300" : "border-slate-200 bg-white text-slate-800"
            }`}>
                <h3 className={`text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 border-b pb-3.5 mb-4 ${
                    isDark ? "border-white/10 text-white" : "border-slate-200 text-slate-950"
                }`}>
                    <i className="fa-solid fa-circle-question text-amber-500 text-base" /> Panduan Mengerjakan Ujian
                </h3>

                {/* Tab Selector */}
                <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950/70 mb-5 border border-slate-200 dark:border-white/5">
                    <button
                        type="button"
                        onClick={() => setActiveTab("flow")}
                        className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === "flow"
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                        <i className="fa-solid fa-route text-sm" />
                        <span>Alur</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("backup")}
                        className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === "backup"
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                        <i className="fa-solid fa-floppy-disk text-sm" />
                        <span>Jawaban</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("security")}
                        className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === "security"
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                        <i className="fa-solid fa-shield-halved text-sm" />
                        <span>Tertib</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-4 min-h-[200px] flex flex-col justify-start">
                    {activeTab === "flow" && (
                        <div className="space-y-3.5 animate-fadeIn">
                            <p className="text-xs leading-relaxed text-slate-400">
                                Ikuti 3 langkah mudah berikut untuk memulai ujian:
                            </p>
                            <div className="relative pl-6 border-l-2 border-amber-500/30 space-y-4 mt-2">
                                <div className="relative">
                                    <div className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-slate-950 shadow-sm">1</div>
                                    <h4 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Tempel / Ketik Token</h4>
                                    <p className="text-xs text-slate-400 mt-1">Dapatkan 6 karakter token dari pengawas ujian lalu tempel di kotak formulir.</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-slate-950 shadow-sm">2</div>
                                    <h4 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Lengkapi Nama & Sekolah</h4>
                                    <p className="text-xs text-slate-400 mt-1">Ketik nama lengkap santri dan asal sekolah dengan jelas dan benar.</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-slate-950 shadow-sm">3</div>
                                    <h4 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Kerjakan dengan Tenang</h4>
                                    <p className="text-xs text-slate-400 mt-1">Layar akan masuk mode penuh. Kerjakan soal satu persatu sampai selesai.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "backup" && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="flex gap-3.5 items-start">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                    <i className="fa-solid fa-cloud-arrow-up text-sm" />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Jawaban Langsung Tersimpan</h4>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Begitu kamu mengklik pilihan jawaban (A, B, C, atau D), jawabanmu otomatis tersimpan aman di server.</p>
                                </div>
                            </div>
                            <div className="flex gap-3.5 items-start">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                    <i className="fa-solid fa-wifi text-sm" />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Aman Jika Internet Terputus</h4>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Jika koneksi internet sempat terganggu, jawaban tetap tersimpan di browsermu dan akan otomatis terkirim saat online kembali.</p>
                                </div>
                            </div>
                            <div className="flex gap-3.5 items-start">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                    <i className="fa-solid fa-rotate-right text-sm" />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Bisa Dilanjutkan Kembali</h4>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Jika laptop atau HP mati mendadak, kamu bisa masuk kembali dan melanjutkan ujian tanpa kehilangan jawaban sebelumnya.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="flex gap-3.5 items-start">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                    <i className="fa-solid fa-expand text-sm" />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Mode Layar Penuh</h4>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Ujian dikerjakan dalam layar penuh agar santri bisa fokus tanpa terganggu notifikasi aplikasi lain.</p>
                                </div>
                            </div>
                            <div className="flex gap-3.5 items-start">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                    <i className="fa-solid fa-hand-holding-heart text-sm" />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Kejujuran Santri</h4>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Jangan membuka tab lain atau mencari contekan ya. Kejujuran adalah cerminan akhlak santri yang mulia.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Technical Requirements Info */}
            <div className={`rounded-2xl border p-4.5 text-xs leading-relaxed transition-colors ${
                isDark ? "bg-slate-900/30 border-white/5 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
            }`}>
                <p className="font-bold text-amber-500 mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-lightbulb" /> Tips Ujian Lancar:
                </p>
                <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px] sm:text-xs">
                    <li>Gunakan browser Google Chrome, Microsoft Edge, atau Safari terbaru.</li>
                    <li>Pastikan baterai perangkat terisi penuh atau terhubung ke charger.</li>
                    <li>Awali pengerjaan dengan membaca <i>Basmalah</i> dan berdoa.</li>
                </ul>
            </div>
        </div>
    );
}
