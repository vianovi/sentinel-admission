import { CalendarEventType, CalendarStatus, EventFormState } from "@/Components/Dashboard/Candidate/Calendar/types";

export const EVENT_TYPES: Array<{ value: CalendarEventType | "all"; label: string; icon: string }> = [
    { value: "all", label: "Semua", icon: "fa-layer-group" },
    { value: "registration", label: "Pendaftaran", icon: "fa-clipboard-list" },
    { value: "payment", label: "Pembayaran", icon: "fa-credit-card" },
    { value: "test", label: "Tes", icon: "fa-pen-nib" },
    { value: "announcement", label: "Pengumuman", icon: "fa-bullhorn" },
    { value: "document", label: "Dokumen", icon: "fa-file-lines" },
    { value: "note", label: "Catatan", icon: "fa-note-sticky" },
    { value: "holiday", label: "Tanggal Merah", icon: "fa-calendar-xmark" },
];

export const FORM_TYPES: Array<{ value: EventFormState["type"]; label: string }> = [
    { value: "note", label: "Catatan umum" },
    { value: "test", label: "Agenda tes" },
    { value: "document", label: "Dokumen" },
    { value: "payment", label: "Pembayaran" },
    { value: "announcement", label: "Pengumuman" },
    { value: "registration", label: "Pendaftaran" },
    { value: "meeting", label: "Pertemuan" },
];

export const STATUS_OPTIONS: Array<{ value: CalendarStatus; label: string }> = [
    { value: "scheduled", label: "Terjadwal" },
    { value: "active", label: "Aktif" },
    { value: "urgent", label: "Mendesak" },
    { value: "completed", label: "Selesai" },
    { value: "cancelled", label: "Dibatalkan" },
];

export const typeTheme: Record<CalendarEventType, { label: string; icon: string; pill: string; dot: string }> = {
    registration: {
        label: "Pendaftaran",
        icon: "fa-clipboard-list",
        pill: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
        dot: "bg-blue-500",
    },
    payment: {
        label: "Pembayaran",
        icon: "fa-credit-card",
        pill: "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
        dot: "bg-orange-500",
    },
    test: {
        label: "Tes",
        icon: "fa-pen-nib",
        pill: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
        dot: "bg-violet-500",
    },
    announcement: {
        label: "Pengumuman",
        icon: "fa-bullhorn",
        pill: "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
        dot: "bg-cyan-500",
    },
    document: {
        label: "Dokumen",
        icon: "fa-file-lines",
        pill: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        dot: "bg-amber-500",
    },
    meeting: {
        label: "Pertemuan",
        icon: "fa-users",
        pill: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        dot: "bg-emerald-500",
    },
    note: {
        label: "Catatan",
        icon: "fa-note-sticky",
        pill: "border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-300",
        dot: "bg-slate-500",
    },
    holiday: {
        label: "Tanggal Merah",
        icon: "fa-calendar-xmark",
        pill: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
        dot: "bg-rose-500",
    },
};

export const statusLabel: Record<CalendarStatus, string> = {
    scheduled: "Terjadwal",
    active: "Aktif",
    completed: "Selesai",
    cancelled: "Dibatalkan",
    urgent: "Mendesak",
};
