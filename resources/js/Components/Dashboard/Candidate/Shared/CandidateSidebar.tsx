// resources/js/Components/Dashboard/Candidate/Shared/CandidateSidebar.tsx

import { animate, stagger } from "animejs";
import { useEffect }        from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type UserData = {
    name:       string;
    avatar_url: string | null;
    initials:   string;
};

type CandidateSnippet = {
    full_name:           string;
    nisn:                string;
    nik:                 string;
    gender_label:        string;
    date_of_birth_label: string;
    school_origin:       string;
    status:              string;
    program_choice:      string | null;
    admission_wave:      { title: string } | null;
};

type Props = {
    user:       UserData;
    candidate:  CandidateSnippet;
    completion: number;
    tips?:      string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; clsDark: string; clsLight: string; dotDark: string; dotLight: string }> = {
    draft:     { label: "Draft",               clsDark: "bg-slate-700/50 text-slate-300",       clsLight: "bg-slate-100 text-slate-600",         dotDark: "bg-slate-400",   dotLight: "bg-slate-500" },
    submitted: { label: "Menunggu Verifikasi", clsDark: "bg-blue-500/20 text-blue-300",         clsLight: "bg-blue-50 text-blue-700",            dotDark: "bg-blue-400",    dotLight: "bg-blue-500" },
    verified:  { label: "Terverifikasi",       clsDark: "bg-amber-500/20 text-amber-300",       clsLight: "bg-amber-50 text-amber-700",          dotDark: "bg-amber-400",   dotLight: "bg-amber-500" },
    accepted:  { label: "Diterima",            clsDark: "bg-emerald-500/20 text-emerald-300",   clsLight: "bg-emerald-50 text-emerald-700",      dotDark: "bg-emerald-400", dotLight: "bg-emerald-500" },
    rejected:  { label: "Ditolak",             clsDark: "bg-red-500/20 text-red-300",           clsLight: "bg-red-50 text-red-700",              dotDark: "bg-red-400",     dotLight: "bg-red-500" },
};

const DEFAULT_TIPS = [
    "Pastikan data sesuai dokumen resmi (KK, Akta)",
    "Email harus Gmail aktif",
    "Nomor HP harus aktif dan bisa dihubungi",
    "Lengkapi semua data untuk mempercepat verifikasi",
];

const TOTAL_FIELDS = 12;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Warna progress bar berdasarkan persentase — sama di dark & light
const progressBarCls = (pct: number): string => {
    if (pct < 50)  return "[background:linear-gradient(to_right,#c0392b,#e74c3c)]";
    if (pct < 75)  return "[background:linear-gradient(to_right,#d35400,#f39c12)]";
    if (pct < 100) return "[background:linear-gradient(to_right,#2980b9,#7aa2f7)]";
    return "[background:linear-gradient(to_right,#1e8449,#27ae60)]";
};

// Warna teks persen — dark vs light
const pctColorDark = (pct: number): string => {
    if (pct < 50)  return "text-red-400";
    if (pct < 75)  return "text-orange-400";
    if (pct < 100) return "text-blue-400";
    return "text-emerald-400";
};

const pctColorLight = (pct: number): string => {
    if (pct < 50)  return "text-red-600";
    if (pct < 75)  return "text-orange-600";
    if (pct < 100) return "text-blue-600";
    return "text-emerald-600";
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CandidateSidebar({ user, candidate, completion, tips }: Props) {
    const status     = STATUS_MAP[candidate.status] ?? STATUS_MAP.draft;
    const activeTips = tips ?? DEFAULT_TIPS;
    const remaining  = TOTAL_FIELDS - Math.round(completion / 100 * TOTAL_FIELDS);

    useEffect(() => {
        animate(".sidebar-fade", {
            opacity: [0, 1], translateY: [8, 0],
            duration: 400, delay: stagger(60), ease: "outExpo",
        });
    }, []);

    return (
        <div className="flex flex-col gap-3">

            {/* ── Profile card ─────────────────────────────────────────────
                Dark:  deep blue fog dari pojok kanan atas
                Light: warm gold fog dari pojok kanan atas
            ─────────────────────────────────────────────────────────────── */}
            <div className="sidebar-fade opacity-0 relative rounded-2xl overflow-hidden border
                            border-blue-900/20 dark:border-blue-900/20
                            bg-[#faf7f0] dark:bg-[#0a0f1e]">

                {/* ── Fog layer 1 — large radial ── */}
                <div className="absolute -top-10 -right-10 w-56 h-56 pointer-events-none z-0
                                dark:[background:radial-gradient(circle_at_top_right,rgba(30,100,255,0.4)_0%,rgba(20,60,180,0.18)_35%,transparent_70%)]
                                [background:radial-gradient(circle_at_top_right,rgba(190,140,50,0.28)_0%,rgba(200,160,80,0.12)_35%,transparent_70%)]">
                </div>
                {/* ── Fog layer 2 — tight radial ── */}
                <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none z-0
                                dark:[background:radial-gradient(circle_at_top_right,rgba(80,140,255,0.32)_0%,transparent_65%)]
                                [background:radial-gradient(circle_at_top_right,rgba(200,155,60,0.22)_0%,transparent_65%)]">
                </div>
                {/* ── Accent lines ── */}
                <div className="absolute top-0 right-0 w-px h-28 pointer-events-none z-0
                                dark:[background:linear-gradient(to_bottom,rgba(100,160,255,0.7),transparent)]
                                [background:linear-gradient(to_bottom,rgba(180,130,40,0.45),transparent)]">
                </div>
                <div className="absolute top-0 right-0 h-px w-28 pointer-events-none z-0
                                dark:[background:linear-gradient(to_left,rgba(100,160,255,0.7),transparent)]
                                [background:linear-gradient(to_left,rgba(180,130,40,0.45),transparent)]">
                </div>

                {/* ── Banner area ── */}
                <div className="h-20 relative z-10">
                    {/* Badge status */}
                    <div className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold
                                    dark:${status.clsDark} ${status.clsLight}
                                    dark:bg-opacity-100 border dark:border-blue-900/30 border-amber-200/50`}>
                        <span className={`w-1.5 h-1.5 rounded-full dark:${status.dotDark} ${status.dotLight}`}></span>
                        {status.label}
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="px-4 pb-4 relative z-10">
                    {/* Avatar — margin negatif ke atas */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden -mt-7 mb-2.5
                                    border-[3px] dark:border-[#0a0f1e] border-[#faf7f0]
                                    dark:outline dark:outline-2 dark:outline-blue-400/40
                                    outline outline-2 outline-amber-400/30
                                    flex items-center justify-center
                                    dark:bg-[#1a2440] bg-[#f0e8d0]">
                        {user.avatar_url
                            ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                            : <span className="text-lg font-display font-bold dark:text-blue-400 text-amber-700">{user.initials}</span>
                        }
                    </div>

                    <p className="text-sm font-semibold dark:text-slate-100 text-slate-800 leading-snug truncate">
                        {candidate.full_name}
                    </p>
                    <p className="text-xs dark:text-[#7a92b0] text-amber-800/70 mt-0.5 mb-3">
                        {candidate.admission_wave ? candidate.admission_wave.title : "Belum ada gelombang"}
                    </p>

                    {/* Progress */}
                    <div className="border-t dark:border-white/5 border-black/5 pt-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[11px] dark:text-[#8aa4c0] text-amber-900/60">Kelengkapan Data</p>
                            <p className={`text-[11px] font-bold dark:${pctColorDark(completion)} ${pctColorLight(completion)}`}>
                                {completion}%
                            </p>
                        </div>
                        <div className="h-1.5 dark:bg-white/[0.06] bg-black/[0.07] rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${progressBarCls(completion)}`}
                                style={{ width: `${completion}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] dark:text-[#506070] text-amber-800/50 mt-1.5">
                            {completion === 100 ? "✅ Data sudah lengkap!" : `${remaining} field lagi perlu diisi`}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Ringkasan ───────────────────────────────────────────────── */}
            <div className="sidebar-fade opacity-0 rounded-2xl border dark:border-white/[0.07] border-black/[0.07]
                            dark:bg-[#0f172a] bg-[#f5f0e8] p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] font-bold dark:text-[#4a6480] text-amber-800/60 mb-2.5">
                    Ringkasan
                </p>
                <div className="flex flex-col">
                    {[
                        { label: "NISN",          value: candidate.nisn },
                        { label: "NIK",           value: candidate.nik },
                        { label: "Jenis Kelamin", value: candidate.gender_label },
                        { label: "Tgl. Lahir",    value: candidate.date_of_birth_label },
                        { label: "Asal Sekolah",  value: candidate.school_origin },
                    ].map(item => (
                        <div key={item.label} className="flex items-baseline justify-between py-1">
                            <p className="text-[11px] dark:text-[#5a7898] text-amber-900/60 shrink-0">{item.label}</p>
                            <p className="text-[11px] font-medium dark:text-[#c8daf0] text-slate-700 text-right truncate max-w-[130px]">
                                {item.value ?? "—"}
                            </p>
                        </div>
                    ))}
                    {candidate.program_choice && (
                        <div className="flex items-baseline justify-between pt-2 mt-1 border-t dark:border-white/5 border-black/5">
                            <p className="text-[11px] dark:text-[#5a7898] text-amber-900/60 shrink-0">Program</p>
                            <p className="text-[11px] font-bold dark:text-blue-400 text-amber-700">{candidate.program_choice}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tips ────────────────────────────────────────────────────── */}
            <div className="sidebar-fade opacity-0 rounded-2xl border dark:border-gold/10 border-amber-200/60
                            dark:bg-gold/[0.06] bg-[#fdf5e0] p-4">
                <div className="flex items-start gap-2">
                    <i className="fa-solid fa-lightbulb dark:text-gold text-amber-600 text-xs mt-0.5 shrink-0"></i>
                    <div>
                        <p className="text-xs font-bold dark:text-gold text-amber-800 mb-2">Tips Pengisian</p>
                        <ul className="space-y-1.5">
                            {activeTips.map((tip, i) => (
                                <li key={i} className="text-[11px] dark:text-[#8aa0b8] text-amber-900/70 flex items-start gap-1.5">
                                    <span className="dark:text-gold/50 text-amber-600 mt-0.5 shrink-0">•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
}