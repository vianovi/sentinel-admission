import { useEffect, useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import Swal from "sweetalert2";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    DataRequestCard,
    EmailRequestCard,
    EmptyRequestState,
    type DataRequestItem,
    type EmailRequestItem,
    type RequestScope,
    StatCard,
    TabButton,
} from "@/Components/Dashboard/ChangeRequests/RequestPanels";

type Flash = {
    success?: string;
    error?: string;
};

type Props = {
    scope: RequestScope;
    data_requests: DataRequestItem[];
    email_requests: EmailRequestItem[];
    flash?: Flash;
};

type TabId = "data" | "email";

const THEME = {
    staff: {
        title: "Permintaan Perubahan",
        subtitle: "Inbox operasional untuk review perubahan data diri dan email kandidat.",
        iconWrap: "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/25",
        icon: "fa-solid fa-arrows-rotate",
        badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        button: "bg-gradient-to-r from-emerald-500 to-teal-500",
        buttonGhost: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25",
        iconTone: "text-emerald-500 dark:text-emerald-300",
        mutedBorder: "border-emerald-100 dark:border-emerald-500/10",
        mutedSurface: "bg-emerald-50/60 dark:bg-emerald-500/5",
        stats: [
            { label: "Pending Data Diri", icon: "fa-solid fa-id-card", accent: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" },
            { label: "Pending Email", icon: "fa-solid fa-envelope", accent: "border-cyan-500/20 bg-cyan-500/10 text-cyan-500" },
            { label: "Total Pending", icon: "fa-solid fa-inbox", accent: "border-amber-500/20 bg-amber-500/10 text-amber-500" },
        ],
    },
    admin: {
        title: "Permintaan Perubahan Admin",
        subtitle: "Admin dapat memproses permintaan perubahan kandidat saat staff operasional membutuhkan backup.",
        iconWrap: "bg-gradient-to-br from-rose-500 to-orange-500 shadow-rose-500/25",
        icon: "fa-solid fa-user-shield",
        badge: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
        button: "bg-gradient-to-r from-rose-500 to-orange-500",
        buttonGhost: "bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 shadow-lg shadow-rose-500/25",
        iconTone: "text-rose-500 dark:text-rose-300",
        mutedBorder: "border-rose-100 dark:border-rose-500/10",
        mutedSurface: "bg-rose-50/60 dark:bg-rose-500/5",
        stats: [
            { label: "Pending Data Diri", icon: "fa-solid fa-id-card", accent: "border-rose-500/20 bg-rose-500/10 text-rose-500" },
            { label: "Pending Email", icon: "fa-solid fa-envelope", accent: "border-orange-500/20 bg-orange-500/10 text-orange-500" },
            { label: "Total Pending", icon: "fa-solid fa-inbox", accent: "border-sky-500/20 bg-sky-500/10 text-sky-500" },
        ],
    },
} as const;

function createSwal(buttonColor: string) {
    return Swal.mixin({
        background: "#0f172a",
        color: "#e2e8f0",
        confirmButtonColor: buttonColor,
        cancelButtonColor: "#334155",
        customClass: {
            popup: "!rounded-2xl !border !border-white/10",
            confirmButton: "!rounded-xl !px-6",
            cancelButton: "!rounded-xl !px-6",
        },
    });
}

export default function ChangeRequestsPage({ scope, data_requests, email_requests, flash }: Props) {
    const [activeTab, setActiveTab] = useState<TabId>("data");
    const theme = THEME[scope];
    const swalDark = useMemo(() => createSwal(scope === "staff" ? "#10b981" : "#f43f5e"), [scope]);
    const basePath = scope === "staff" ? "/dashboard/staff" : "/dashboard/admin";
    const totalPending = data_requests.length + email_requests.length;

    useEffect(() => {
        animate(".change-request-header", {
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 520,
            ease: "outExpo",
        });

        animate(".change-request-card", {
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 500,
            delay: stagger(70, { start: 140 }),
            ease: "outExpo",
        });

        animate(".change-request-block", {
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 520,
            delay: stagger(80, { start: 240 }),
            ease: "outExpo",
        });
    }, [activeTab]);

    useEffect(() => {
        if (flash?.success) {
            swalDark.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: flash.success,
                showConfirmButton: false,
                timer: 2400,
                timerProgressBar: true,
            });
        }

        if (flash?.error) {
            swalDark.fire({
                icon: "error",
                title: "Gagal",
                text: flash.error,
            });
        }
    }, [flash, swalDark]);

    const submitAction = (url: string, payload: Record<string, string> = {}) => {
        router.post(url, payload, {
            preserveScroll: true,
        });
    };

    const handleApproveData = async (item: DataRequestItem) => {
        const confirmed = await swalDark.fire({
            title: "Setujui perubahan data?",
            html: `<p class="text-sm text-slate-300">${item.field_label} akan diperbarui untuk kandidat <strong>${item.candidate_name}</strong>.</p>`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, setujui",
            cancelButtonText: "Batal",
        });

        if (!confirmed.isConfirmed) return;

        submitAction(`${basePath}/change-requests/data/${item.candidate_id}/approve`);
    };

    const handleRejectData = async (item: DataRequestItem) => {
        const result = await swalDark.fire({
            title: "Tolak perubahan data?",
            input: "textarea",
            inputLabel: `Alasan penolakan untuk ${item.candidate_name}`,
            inputPlaceholder: "Tulis alasan penolakan yang jelas...",
            inputAttributes: {
                autocapitalize: "sentences",
            },
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Tolak Permintaan",
            cancelButtonText: "Batal",
            inputValidator: (value) => {
                if (!value || !value.trim()) {
                    return "Alasan penolakan wajib diisi.";
                }

                return null;
            },
        });

        if (!result.isConfirmed) return;

        submitAction(`${basePath}/change-requests/data/${item.candidate_id}/reject`, {
            reason: result.value.trim(),
        });
    };

    const handleApproveEmail = async (item: EmailRequestItem) => {
        const confirmed = await swalDark.fire({
            title: "Setujui dan verifikasi manual email?",
            html: `<p class="text-sm text-slate-300">Pastikan email <strong>${item.pending_email}</strong> untuk <strong>${item.candidate_name}</strong> sudah diperiksa manual oleh staff/admin. Setelah disetujui, kandidat dapat menerapkan email baru dari profil.</p>`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, sudah diverifikasi",
            cancelButtonText: "Batal",
        });

        if (!confirmed.isConfirmed) return;

        submitAction(`${basePath}/change-requests/email/${item.candidate_id}/approve`);
    };

    const handleRejectEmail = async (item: EmailRequestItem) => {
        const result = await swalDark.fire({
            title: "Tolak perubahan email?",
            input: "textarea",
            inputLabel: `Alasan penolakan untuk ${item.candidate_name}`,
            inputPlaceholder: "Tulis alasan penolakan yang jelas...",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Tolak Permintaan",
            cancelButtonText: "Batal",
            inputValidator: (value) => {
                if (!value || !value.trim()) {
                    return "Alasan penolakan wajib diisi.";
                }

                return null;
            },
        });

        if (!result.isConfirmed) return;

        submitAction(`${basePath}/change-requests/email/${item.candidate_id}/reject`, {
            reason: result.value.trim(),
        });
    };

    return (
        <DashboardLayout>
            <Head title={theme.title} />

            <div className="flex flex-col gap-6 pb-8">
                <div className="change-request-header opacity-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${theme.iconWrap} shadow-lg`}>
                            <i className={`${theme.icon} text-sm text-white`} />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold leading-tight text-slate-800 dark:text-white">
                                {theme.title}
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {theme.subtitle}
                            </p>
                        </div>
                    </div>

                    <div className={`inline-flex items-center gap-2 self-start rounded-2xl border px-4 py-2.5 text-sm font-semibold ${theme.badge}`}>
                        <i className="fa-solid fa-bell-concierge text-xs" />
                        {totalPending} pending
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatCard label={theme.stats[0].label} value={data_requests.length} icon={theme.stats[0].icon} accent={theme.stats[0].accent} />
                    <StatCard label={theme.stats[1].label} value={email_requests.length} icon={theme.stats[1].icon} accent={theme.stats[1].accent} />
                    <StatCard label={theme.stats[2].label} value={totalPending} icon={theme.stats[2].icon} accent={theme.stats[2].accent} />
                </div>

                <div className="change-request-card opacity-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft dark:border-white/5 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <TabButton
                            active={activeTab === "data"}
                            count={data_requests.length}
                            icon="fa-solid fa-id-card"
                            label="Data Diri"
                            onClick={() => setActiveTab("data")}
                            tone={theme}
                        />
                        <TabButton
                            active={activeTab === "email"}
                            count={email_requests.length}
                            icon="fa-solid fa-envelope"
                            label="Email"
                            onClick={() => setActiveTab("email")}
                            tone={theme}
                        />
                    </div>
                </div>

                {activeTab === "data" ? (
                    data_requests.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {data_requests.map((item) => (
                                <DataRequestCard
                                    key={`${item.candidate_id}-${item.field}-${item.requested_at}`}
                                    item={item}
                                    scope={scope}
                                    tone={{
                                        badge: theme.badge,
                                        button: theme.button,
                                        buttonGhost: theme.buttonGhost,
                                        icon: theme.iconTone,
                                        mutedBorder: theme.mutedBorder,
                                        mutedSurface: theme.mutedSurface,
                                    }}
                                    onApprove={handleApproveData}
                                    onReject={handleRejectData}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyRequestState
                            icon="fa-solid fa-id-card"
                            title="Tidak ada permintaan perubahan data diri"
                            description="Inbox data diri sedang kosong. Permintaan baru dari kandidat akan muncul di sini selama statusnya masih pending."
                        />
                    )
                ) : (
                    email_requests.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {email_requests.map((item) => (
                                <EmailRequestCard
                                    key={`${item.candidate_id}-${item.pending_email}-${item.requested_at}`}
                                    item={item}
                                    scope={scope}
                                    tone={{
                                        badge: theme.badge,
                                        button: theme.button,
                                        buttonGhost: theme.buttonGhost,
                                        icon: theme.iconTone,
                                        mutedBorder: theme.mutedBorder,
                                        mutedSurface: theme.mutedSurface,
                                    }}
                                    onApprove={handleApproveEmail}
                                    onReject={handleRejectEmail}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyRequestState
                            icon="fa-solid fa-envelope"
                            title="Tidak ada permintaan perubahan email"
                            description="Inbox email sedang kosong. Permintaan ganti email kandidat yang masih pending akan ditampilkan di tab ini."
                        />
                    )
                )}
            </div>
        </DashboardLayout>
    );
}
