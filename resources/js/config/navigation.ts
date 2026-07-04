// resources/js/config/navigation.ts
//
// Konfigurasi navigasi sidebar per role.
// Digunakan oleh Sidebar.tsx untuk merender menu berdasarkan role user yang login.
//
// Aturan:
// - `exact: true`  → isActive hanya match jika URL persis sama (untuk Dashboard index)
// - `exact` tidak diset → isActive match jika URL startsWith href (untuk halaman dengan sub-path)
// - Icon menggunakan kelas Font Awesome 6 (fa-solid, fa-regular, dll)
// - href selalu dimulai dengan "/" dan tidak diakhiri "/" (kecuali root)

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type CandidateSection = "data-diri" | "data-kesehatan" | "data-wali" | "dokumen" | "pembayaran";

export type NavActiveRule = {
    path?: string;
    exact?: boolean;
    query?: Record<string, string>;
    absentQuery?: string[];
    prefixes?: string[];
};

export type NavItem = {
    label: string;
    href?: string;
    icon: string;    // Font Awesome class — contoh: "fa-solid fa-house"
    exact?: boolean; // true = match exact URL, false/undefined = startsWith
    disabled?: boolean;
    comingSoon?: boolean;
    activeRules?: NavActiveRule[];
    staffCandidateHome?: boolean;
    staffCandidateStatus?: boolean;
    staffCandidateSection?: CandidateSection;
    adminCandidateHome?: boolean;
    adminCandidateStatus?: boolean;
    adminCandidateSection?: CandidateSection;
    children?: NavSubItem[];
};

export type NavSubItem = {
    label: string;
    icon:  string;
    href?: string;
    exact?: boolean;
    disabled?: boolean;
    comingSoon?: boolean;
    activePrefixes?: string[];
    activeRules?: NavActiveRule[];
    staffCandidateStatus?: boolean;
    staffCandidateSection?: CandidateSection;
    adminCandidateStatus?: boolean;
    adminCandidateSection?: CandidateSection;
};

export type NavGroup = {
    group: string;     // Judul group (tampil di sidebar sebagai label kecil)
    items: NavItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export const navigationConfig: Record<string, NavGroup[]> = {

    // =========================================================================
    // CANDIDATE — Pendaftar / Siswa
    // =========================================================================
    candidate: [
        {
            group: "Menu",
            items: [
                { label: "Dashboard", href: "/dashboard", icon: "fa-solid fa-house", exact: true },
                { label: "Status Pendaftaran", href: "/dashboard/status-pendaftaran", icon: "fa-solid fa-list-check" },
                { label: "Kalender SPMB", href: "/dashboard/calendar", icon: "fa-solid fa-calendar-days" },
                { label: "Bantuan", href: "/dashboard/bantuan", icon: "fa-solid fa-headset" },
            ],
        },
        {
            group: "Pendaftaran",
            items: [
                {
                    label: "Data Pendaftaran",
                    icon: "fa-solid fa-folder-open",
                    children: [
                        { label: "Data Diri", href: "/dashboard/data-diri", icon: "fa-solid fa-id-card" },
                        { label: "Data Wali", href: "/dashboard/data-wali", icon: "fa-solid fa-people-roof" },
                        { label: "Data Kesehatan", href: "/dashboard/data-kesehatan", icon: "fa-solid fa-heart-pulse" },
                    ],
                },
                {
                    label: "Berkas & Pembayaran",
                    icon: "fa-solid fa-file-shield",
                    children: [
                        { label: "Dokumen", href: "/dashboard/data-dokumen", icon: "fa-solid fa-file-lines" },
                        { label: "Pembayaran", href: "/dashboard/pembayaran", icon: "fa-solid fa-credit-card" },
                        { label: "Riwayat Pembayaran", href: "/dashboard/pembayaran/riwayat", icon: "fa-solid fa-receipt" },
                    ],
                },
                {
                    label: "Seleksi",
                    icon: "fa-solid fa-file-pen",
                    children: [
                        { label: "Ujian Seleksi", href: "/dashboard/seleksi", icon: "fa-solid fa-clipboard-question" },
                        { label: "Status Seleksi", href: "/dashboard/seleksi/status", icon: "fa-solid fa-clock-rotate-left" },
                        { label: "Hasil Seleksi", href: "/dashboard/seleksi/hasil", icon: "fa-solid fa-square-poll-vertical" },
                    ],
                },
            ],
        },
        {
            group: "Akun",
            items: [
                { label: "Profil", href: "/dashboard/profile", icon: "fa-solid fa-circle-user" },
            ],
        },
    ],

    // =========================================================================
    // STAFF — Petugas verifikasi
    // =========================================================================
    staff: [
        {
            group: "MENU",
            items: [
                { label: "Dashboard", href: "/dashboard/staff",            icon: "fa-solid fa-house",  exact: true },
                { label: "Staff Kalender", href: "/dashboard/staff/calendar", icon: "fa-solid fa-calendar-days", comingSoon: true },
                {
                    label: "Kandidat",
                    icon: "fa-solid fa-users",
                    activeRules: [
                        { path: "/dashboard/staff/candidates" },
                        { path: "/dashboard/staff/change-requests" },
                    ],
                    children: [
                        {
                            label: "Semua Kandidat",
                            href: "/dashboard/staff/candidates",
                            icon: "fa-solid fa-list",
                            activeRules: [{ path: "/dashboard/staff/candidates", exact: true, absentQuery: ["status"] }],
                        },
                        {
                            label: "Data Diri",
                            href: "/dashboard/staff/candidates",
                            icon: "fa-solid fa-id-card",
                            staffCandidateSection: "data-diri",
                        },
                        {
                            label: "Data Wali",
                            href: "/dashboard/staff/candidates",
                            icon: "fa-solid fa-people-roof",
                            staffCandidateSection: "data-wali",
                        },
                        {
                            label: "Data Kesehatan",
                            href: "/dashboard/staff/candidates",
                            icon: "fa-solid fa-heart-pulse",
                            staffCandidateSection: "data-kesehatan",
                        },
                        {
                            label: "Perlu Tindakan",
                            href: "/dashboard/staff/change-requests",
                            icon: "fa-solid fa-triangle-exclamation",
                        },
                    ],
                },
                {
                    label: "Verifikasi",
                    icon: "fa-solid fa-clipboard-check",
                    children: [
                        {
                            label: "Review Dokumen",
                            href: "/dashboard/staff/candidates",
                            icon: "fa-solid fa-file-circle-check",
                            staffCandidateSection: "dokumen",
                        },
                        {
                            label: "Review Pembayaran",
                            href: "/dashboard/staff/candidates",
                            icon: "fa-solid fa-money-check-dollar",
                            staffCandidateSection: "pembayaran",
                        },
                    ],
                },
                {
                    label: "Seleksi",
                    icon: "fa-solid fa-file-pen",
                    children: [
                        { label: "Hasil Ujian", href: "/dashboard/staff/exams/results", icon: "fa-solid fa-list-check" },
                        { label: "Sesi Ujian", href: "/dashboard/staff/exams/sessions", icon: "fa-solid fa-calendar-check", comingSoon: true },
                    ],
                },
                { label: "Rekap / Laporan", href: "/dashboard/staff/reports", icon: "fa-solid fa-chart-line", comingSoon: true },
            ],
        },
        {
            group: "AKUN",
            items: [
                { label: "Profil", href: "/dashboard/staff/profile", icon: "fa-solid fa-circle-user" },
            ],
        },
    ],

    // =========================================================================
    // ADMIN — Administrator sistem
    // =========================================================================
    admin: [
        {
            group: "MENU",
            items: [
                { label: "Dashboard", href: "/dashboard/admin",            icon: "fa-solid fa-house",       exact: true },
                { label: "Kalender SPMB", href: "/dashboard/admin/calendar", icon: "fa-solid fa-calendar-days", comingSoon: true },
                {
                    label: "Kandidat",
                    icon: "fa-solid fa-users",
                    activeRules: [
                        { path: "/dashboard/admin/candidates" },
                        { path: "/dashboard/admin/change-requests" },
                    ],
                    children: [
                        {
                            label: "Semua Kandidat",
                            href: "/dashboard/admin/candidates",
                            icon: "fa-solid fa-list",
                            activeRules: [{ path: "/dashboard/admin/candidates", exact: true, absentQuery: ["status"] }],
                        },
                        {
                            label: "Status Pendaftaran",
                            href: "/dashboard/admin/candidates",
                            icon: "fa-solid fa-list-check",
                            adminCandidateStatus: true,
                        },
                        {
                            label: "Data Diri",
                            href: "/dashboard/admin/candidates",
                            icon: "fa-solid fa-id-card",
                            adminCandidateSection: "data-diri",
                        },
                        {
                            label: "Data Wali",
                            href: "/dashboard/admin/candidates",
                            icon: "fa-solid fa-people-roof",
                            adminCandidateSection: "data-wali",
                        },
                        {
                            label: "Data Kesehatan",
                            href: "/dashboard/admin/candidates",
                            icon: "fa-solid fa-heart-pulse",
                            adminCandidateSection: "data-kesehatan",
                        },
                        {
                            label: "Permintaan Perubahan",
                            href: "/dashboard/admin/change-requests",
                            icon: "fa-solid fa-arrows-rotate",
                            activeRules: [{ path: "/dashboard/admin/change-requests", exact: true, absentQuery: ["focus"] }],
                        },
                        {
                            label: "Perlu Tindakan",
                            href: "/dashboard/admin/change-requests?focus=action-required",
                            icon: "fa-solid fa-triangle-exclamation",
                            activeRules: [{ path: "/dashboard/admin/change-requests", exact: true, query: { focus: "action-required" } }],
                        },
                    ],
                },
                {
                    label: "Verifikasi",
                    icon: "fa-solid fa-clipboard-check",
                    children: [
                        {
                            label: "Review Dokumen",
                            href: "/dashboard/admin/candidates",
                            icon: "fa-solid fa-file-circle-check",
                            adminCandidateSection: "dokumen",
                        },
                        {
                            label: "Review Pembayaran",
                            href: "/dashboard/admin/candidates",
                            icon: "fa-solid fa-money-check-dollar",
                            adminCandidateSection: "pembayaran",
                        },
                    ],
                },
                {
                    label: "Seleksi",
                    icon: "fa-solid fa-file-pen",
                    activeRules: [{ path: "/dashboard/admin/exams" }],
                    children: [
                        {
                            label: "Paket Soal",
                            href: "/dashboard/admin/exams/packages",
                            icon: "fa-solid fa-box-archive",
                            activePrefixes: [
                                "/dashboard/admin/exams/packages",
                                "/dashboard/admin/exams/subjects",
                                "/dashboard/admin/exams/imports",
                            ],
                        },
                        {
                            label: "Sesi Ujian",
                            href: "/dashboard/admin/exams/sessions",
                            icon: "fa-solid fa-calendar-check",
                            activePrefixes: [
                                "/dashboard/admin/exams/sessions",
                            ],
                        },
                        {
                            label: "Hasil Ujian",
                            href: "/dashboard/admin/exams/results",
                            icon: "fa-solid fa-list-check",
                        },
                    ],
                },
                { label: "Rekap / Laporan", href: "/dashboard/admin/reports", icon: "fa-solid fa-chart-line", comingSoon: true },
            ],
        },
        {
            group: "MANAJEMEN",
            items: [
                { label: "Staff", href: "/dashboard/admin/staff-list", icon: "fa-solid fa-user-tie" },
                { label: "Pengguna", href: "/dashboard/admin/users", icon: "fa-solid fa-users-gear", comingSoon: true },
            ],
        },
        {
            group: "KONFIGURASI SPMB",
            items: [
                { label: "Gelombang", href: "/dashboard/admin/waves", icon: "fa-solid fa-layer-group" },
                { label: "Program / Jalur", href: "/dashboard/admin/programs", icon: "fa-solid fa-diagram-project", comingSoon: true },
            ],
        },
        {
            group: "AKUN",
            items: [
                { label: "Profil", href: "/dashboard/admin/profile", icon: "fa-solid fa-circle-user" },
            ],
        },
    ],
};
