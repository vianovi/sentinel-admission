import { Link } from "@inertiajs/react";
import type { ReactNode } from "react";

type ExamWorkspaceActive = "overview" | "subjects" | "packages" | "template" | "import" | "questions" | "sessions" | "participants" | "results";

export const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white";

export const labelClass =
    "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";

export function PageHeader({
    title,
    description,
    icon,
    actions,
}: {
    title: string;
    description: string;
    icon: string;
    actions?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white shadow-sm shadow-rose-500/25">
                    <i className={`${icon} text-sm`} />
                </div>
                <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                </div>
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
    );
}

export function StatusPill({ value }: { value: string | null | undefined }) {
    const normalized = (value ?? "-").toString();
    const tone = ["published", "completed", "submitted", "auto_submitted", "eligible"].includes(normalized)
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : ["failed", "closed", "expired", "invalidated", "blocked", "cancelled"].includes(normalized)
            ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
            : ["draft", "pending", "in_progress"].includes(normalized)
                ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";

    return (
        <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${tone}`}>
            {normalized.replaceAll("_", " ")}
        </span>
    );
}

export function BooleanPill({ value, trueLabel = "Aktif", falseLabel = "Nonaktif" }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
    return <StatusPill value={value ? trueLabel : falseLabel} />;
}

export function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-5 py-10 text-center dark:border-white/10 dark:bg-slate-900">
            <i className={`${icon} text-3xl text-slate-300 dark:text-slate-600`} />
            <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
    );
}

export function StatCard({ label, value, icon, tone = "text-rose-500" }: { label: string; value: string | number; icon: string; tone?: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 dark:bg-white/5">
                    <i className={`${icon} ${tone} text-sm`} />
                </div>
            </div>
        </div>
    );
}

export function FlashMessage({ value, type = "error" }: { value?: string | null; type?: "error" | "success" }) {
    if (!value) return null;

    const tone = type === "success"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
        : "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-200";

    return <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${tone}`}>{value}</div>;
}

export function BackLink({ href, label = "Kembali" }: { href: string; label?: string }) {
    return (
        <Link href={href} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-200">
            <i className="fa-solid fa-arrow-left text-xs" />
            {label}
        </Link>
    );
}

export function ExamWorkspace({
    active,
    packageId,
    sessionId,
    children,
}: {
    active: ExamWorkspaceActive;
    packageId?: number;
    sessionId?: number;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-5 pb-8 xl:grid-cols-[286px_minmax(0,1fr)]">
            <ExamContextSidebar active={active} packageId={packageId} sessionId={sessionId} />
            <main className="min-w-0 space-y-5">{children}</main>
        </div>
    );
}

function ExamContextSidebar({
    active,
    packageId,
    sessionId,
}: {
    active: ExamWorkspaceActive;
    packageId?: number;
    sessionId?: number;
}) {
    const packageItems: SidebarItem[] = [
        {
            key: "overview",
            label: "Ringkasan Ujian",
            description: "Status paket, sesi, import, dan pengerjaan.",
            icon: "fa-solid fa-gauge-high",
            href: "/dashboard/admin/exams",
        },
        {
            key: "subjects",
            label: "Kategori Ujian",
            description: "Mapel atau kelompok seleksi untuk paket.",
            icon: "fa-solid fa-layer-group",
            href: "/dashboard/admin/exams/subjects",
        },
        {
            key: "packages",
            label: "Paket Ujian",
            description: "Metadata paket dan kesiapan bank soal.",
            icon: "fa-solid fa-box-archive",
            href: "/dashboard/admin/exams/packages",
        },
        {
            key: "template",
            label: "Template Soal",
            description: packageId ? "Unduh XLSX khusus paket terpilih." : "Pilih paket sebelum mengunduh template.",
            icon: "fa-solid fa-file-arrow-down",
            href: packageId ? `/dashboard/admin/exams/packages/${packageId}/template` : "/dashboard/admin/exams/packages",
            download: Boolean(packageId),
        },
        {
            key: "import",
            label: "Import Soal",
            description: "Upload XLSX dari guru dan review hasilnya.",
            icon: "fa-solid fa-file-import",
            href: packageId ? `/dashboard/admin/exams/packages/${packageId}#import-soal` : "/dashboard/admin/exams/packages",
        },
        {
            key: "questions",
            label: "Bank Soal",
            description: "Preview soal yang sudah masuk ke paket.",
            icon: "fa-solid fa-list-ol",
            href: packageId ? `/dashboard/admin/exams/packages/${packageId}#bank-soal` : "/dashboard/admin/exams/packages",
        },
    ];

    const sessionItems: SidebarItem[] = [
        {
            key: "sessions",
            label: "Sesi Ujian",
            description: "Jadwal, paket aktif, dan aturan akses.",
            icon: "fa-solid fa-calendar-check",
            href: "/dashboard/admin/exams/sessions",
        },
        {
            key: "participants",
            label: "Peserta",
            description: "Tugaskan kandidat ke sesi yang tepat.",
            icon: "fa-solid fa-users",
            href: sessionId ? `/dashboard/admin/exams/sessions/${sessionId}` : "/dashboard/admin/exams/sessions",
        },
        {
            key: "results",
            label: "Hasil Ujian",
            description: "Pantau attempt, skor, dan kelulusan.",
            icon: "fa-solid fa-square-poll-vertical",
            href: "/dashboard/admin/exams/results",
        },
    ];

    return (
        <aside className="xl:sticky xl:top-24 xl:self-start" aria-label="Navigasi workspace ujian seleksi">
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-2 pb-3 dark:border-white/10">
                    <p className="text-[11px] font-black uppercase tracking-wide text-rose-500">Workspace Ujian</p>
                    <h2 className="mt-1 text-sm font-black text-slate-900 dark:text-white">Ruang Kerja Ujian</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Pisahkan apa yang diuji dari kapan ujian dibuka dan siapa pesertanya.</p>
                </div>

                <SidebarGroup title="Pengaturan Paket" items={packageItems} active={active} />
                <SidebarGroup title="Pengaturan Sesi" items={sessionItems} active={active} />

                <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-800 dark:text-amber-200">
                    Template dan import hanya berlaku untuk paket yang sedang dipilih. Sesi memakai paket yang sudah siap.
                </div>
            </div>
        </aside>
    );
}

type SidebarItem = {
    key: ExamWorkspaceActive;
    label: string;
    description: string;
    icon: string;
    href: string;
    download?: boolean;
};

function SidebarGroup({ title, items, active }: { title: string; items: SidebarItem[]; active: ExamWorkspaceActive }) {
    return (
        <div className="mt-4">
            <p className="px-2 text-[11px] font-black uppercase tracking-wide text-slate-400">{title}</p>
            <div className="mt-2 grid gap-1.5">
                {items.map((item) => (
                    <SidebarLink key={item.key} item={item} active={active === item.key} />
                ))}
            </div>
        </div>
    );
}

function SidebarLink({ item, active }: { item: SidebarItem; active: boolean }) {
    const className = `group flex min-h-[58px] items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
        active
            ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
            : "text-slate-600 hover:bg-slate-50 hover:text-rose-500 dark:text-slate-300 dark:hover:bg-white/5"
    }`;

    const content = (
        <>
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/15" : "bg-slate-100 text-slate-500 group-hover:text-rose-500 dark:bg-white/5"}`}>
                <i className={`${item.icon} text-xs`} />
            </span>
            <span className="min-w-0">
                <span className="block text-sm font-black">{item.label}</span>
                <span className={`mt-0.5 block text-xs leading-4 ${active ? "text-white/75" : "text-slate-500 dark:text-slate-400"}`}>{item.description}</span>
            </span>
        </>
    );

    if (item.download) {
        return (
            <a href={item.href} download className={className}>
                {content}
            </a>
        );
    }

    if (item.href.includes("#")) {
        return (
            <a href={item.href} className={className}>
                {content}
            </a>
        );
    }

    return (
        <Link href={item.href} className={className}>
            {content}
        </Link>
    );
}
