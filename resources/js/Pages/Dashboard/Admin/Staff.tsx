import { useEffect, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import Swal from "sweetalert2";
import DashboardLayout from "@/Layouts/DashboardLayout";
import type { PageProps } from "@/types";

type StaffMember = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    whatsapp_number: string | null;
    created_at: string;
};

type Props = {
    staff_list: StaffMember[];
    total_active: number;
    total: number;
};

const swalDark = Swal.mixin({
    background: "#0f172a",
    color: "#e2e8f0",
    confirmButtonColor: "#f43f5e",
    cancelButtonColor: "#334155",
    customClass: {
        popup: "!rounded-2xl !border !border-white/10",
        confirmButton: "!rounded-xl !px-6",
        cancelButton: "!rounded-xl !px-6",
    },
});

export default function AdminStaff({ staff_list, total_active, total }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [processingId, setProcessingId] = useState<number | null>(null);
    const inactive = total - total_active;

    useEffect(() => {
        animate(".admin-staff-item", {
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 460,
            delay: stagger(45),
            ease: "outExpo",
        });
    }, [staff_list]);

    useEffect(() => {
        if (flash.success) {
            swalDark.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: flash.success,
                showConfirmButton: false,
                timer: 2200,
                timerProgressBar: true,
            });
        }
    }, [flash.success]);

    const toggleStaff = async (member: StaffMember) => {
        const confirmed = await swalDark.fire({
            title: member.is_active ? "Suspend akun staff?" : "Aktifkan akun staff?",
            text: member.is_active
                ? `${member.name} tidak bisa masuk dashboard selama akun disuspend.`
                : `${member.name} akan bisa mengakses dashboard staff kembali.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, lanjutkan",
            cancelButtonText: "Batal",
        });

        if (!confirmed.isConfirmed) return;

        setProcessingId(member.id);
        router.post(`/dashboard/admin/staff/${member.id}/toggle`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    return (
        <DashboardLayout>
            <Head title="Staff - Admin" />

            <div className="flex flex-col gap-6 pb-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/25">
                        <i className="fa-solid fa-user-tie text-sm text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold leading-tight text-slate-800 dark:text-white">
                            Staff Dashboard
                        </h1>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Monitoring akun staff operasional penerimaan
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <SummaryCard label="Total Staff" value={total} icon="fa-solid fa-users-gear" tone="text-rose-500 border-rose-500/20 bg-rose-500/10" />
                    <SummaryCard label="Aktif" value={total_active} icon="fa-solid fa-user-check" tone="text-emerald-500 border-emerald-500/20 bg-emerald-500/10" />
                    <SummaryCard label="Suspend" value={inactive} icon="fa-solid fa-user-lock" tone="text-amber-500 border-amber-500/20 bg-amber-500/10" />
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-white/5 dark:bg-slate-900">
                    <div className="hidden grid-cols-[1fr_160px_130px_120px] border-b border-slate-100 bg-slate-50 px-5 py-3.5 dark:border-white/5 dark:bg-white/[0.02] lg:grid">
                        {["Staff", "WhatsApp", "Status", "Aksi"].map((header) => (
                            <p key={header} className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {header}
                            </p>
                        ))}
                    </div>

                    {staff_list.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                            <i className="fa-solid fa-user-slash text-3xl text-slate-300 dark:text-slate-600" />
                            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Belum ada akun staff
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Akun staff akan muncul setelah dibuat di sistem.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/5">
                            {staff_list.map((member) => (
                                <li
                                    key={member.id}
                                    className="admin-staff-item grid gap-3 px-5 py-4 opacity-0 transition hover:bg-slate-50 dark:hover:bg-white/[0.03] lg:grid-cols-[1fr_160px_130px_120px] lg:items-center"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
                                            <span className="text-sm font-bold text-rose-600 dark:text-rose-300">
                                                {member.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                {member.name}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                                {member.email} - sejak {member.created_at}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {member.whatsapp_number ?? "-"}
                                    </p>

                                    <span className={`inline-flex w-fit rounded-lg px-2.5 py-1 text-[11px] font-semibold ${member.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-amber-500/10 text-amber-600 dark:text-amber-300"}`}>
                                        {member.is_active ? "Aktif" : "Suspend"}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => toggleStaff(member)}
                                        disabled={processingId === member.id}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-rose-500 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300"
                                    >
                                        {processingId === member.id ? (
                                            <><i className="fa-solid fa-spinner fa-spin" /> Proses</>
                                        ) : (
                                            <><i className={`fa-solid ${member.is_active ? "fa-user-lock" : "fa-user-check"}`} /> {member.is_active ? "Suspend" : "Aktifkan"}</>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}

function SummaryCard({ label, value, icon, tone }: { label: string; value: number; icon: string; tone: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-white/5 dark:bg-slate-900">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl border ${tone}`}>
                <i className={`${icon} text-sm`} />
            </div>
            <p className="text-2xl font-display font-bold leading-none text-slate-800 dark:text-white">
                {value.toLocaleString("id-ID")}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    );
}
