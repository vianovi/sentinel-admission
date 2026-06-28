import { Link } from "@inertiajs/react";
// reresources/js/Components/Dashboard/Staff/Shared/StaffSidebar.tsx
type UserMini = {
    name:       string;
    avatar_url: string | null;
    initials:   string;
};

type StaffSidebarCandidate = {
    full_name:      string;
    candidate_code: string;
    status:         string;
    admission_wave: string | null;
};

type Props = {
    user: UserMini;
    scope?: "staff" | "admin";
    basePath?: string;
    candidate: StaffSidebarCandidate;
    completion: number;
    tips?: string[];
};

const statusClass: Record<string, string> = {
    draft:     "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
    submitted: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    verified:  "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    accepted:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    rejected:  "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

export default function StaffSidebar({
    user,
    scope = "staff",
    basePath = "/dashboard/staff",
    candidate,
    completion,
    tips = [],
}: Props) {
    const roleLabel = scope === "admin" ? "Admin Panel" : "Staff Panel";
    const roleDescription = scope === "admin" ? "Administrator" : "Staff Verifikasi";
    const dashboardLabel = scope === "admin" ? "Dashboard Admin" : "Dashboard Staff";
    const accentText = scope === "admin" ? "text-rose-500" : "text-emerald-500";
    const accentBorder = scope === "admin" ? "hover:border-rose-500 hover:text-rose-500" : "hover:border-emerald-500 hover:text-emerald-500";
    const avatarTone = scope === "admin" ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400";

    return (
        <div className="h-full flex flex-col gap-4 p-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
                <p className={`text-[11px] uppercase tracking-[0.2em] ${accentText} font-semibold`}>
                    {roleLabel}
                </p>
                <div className="mt-3 flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl overflow-hidden border flex items-center justify-center ${avatarTone}`}>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-bold">{user.initials}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{roleDescription}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Ringkasan Kandidat</p>
                <div className="mt-3 space-y-2">
                    <Info label="Nama" value={candidate.full_name} />
                    <Info label="Kode" value={candidate.candidate_code} />
                    <Info label="Gelombang" value={candidate.admission_wave ?? "-"} />
                    <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Status</p>
                        <span className={`inline-flex mt-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${statusClass[candidate.status] ?? statusClass.draft}`}>
                            {candidate.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Progress Verifikasi</p>
                    <span className="text-xs font-semibold text-emerald-500">{completion}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: `${completion}%`,
                            background: "linear-gradient(to right, #059669, #10b981)",
                        }}
                    />
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Quick Action</p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                    <Link
                        href={`${basePath}/candidates`}
                        className={`h-11 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300 inline-flex items-center justify-center gap-2 transition ${accentBorder}`}
                    >
                        <i className="fa-solid fa-list-check text-xs" />
                        Daftar Kandidat
                    </Link>
                    <Link
                        href={basePath}
                        className={`h-11 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300 inline-flex items-center justify-center gap-2 transition ${accentBorder}`}
                    >
                        <i className="fa-solid fa-chart-line text-xs" />
                        {dashboardLabel}
                    </Link>
                </div>
            </div>

            {tips.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Catatan Operasional</p>
                    <ul className="mt-2 space-y-2">
                        {tips.map((tip, i) => (
                            <li key={i} className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 flex gap-2">
                                <i className="fa-solid fa-circle text-[6px] mt-1.5 text-emerald-500 shrink-0" />
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">{value}</p>
        </div>
    );
}
