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
    staffCandidateSection?: CandidateSection;
    adminCandidateHome?: boolean;
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
    staffCandidateSection?: CandidateSection;
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
                { label: "Kalender SPMB", href: "/dashboard/calendar", icon: "fa-solid fa-calendar-days" },
                { label: "Pengumuman", href: "/dashboard/pengumuman", icon: "fa-solid fa-bullhorn", comingSoon: true },
                { label: "Bantuan", href: "/dashboard/bantuan", icon: "fa-solid fa-headset", comingSoon: true },
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
                        { label: "Riwayat Pembayaran", href: "/dashboard/pembayaran/riwayat", icon: "fa-solid fa-receipt", comingSoon: true },
                    ],
                },
                {
                    label: "Seleksi",
                    icon: "fa-solid fa-file-pen",
                    children: [
                        { label: "Ujian Seleksi", href: "/dashboard/seleksi", icon: "fa-solid fa-clipboard-question" },
                        { label: "Status Seleksi", href: "/dashboard/seleksi/status", icon: "fa-solid fa-clock-rotate-left", comingSoon: true },
                        { label: "Hasil Seleksi", href: "/dashboard/seleksi/hasil", icon: "fa-solid fa-square-poll-vertical", comingSoon: true },
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
                {
                    label: "Kandidat",
                    icon: "fa-solid fa-users",
                    activeRules: [{ path: "/dashboard/staff/candidates" }],
                    children: [
                        {
                            label: "Semua Kandidat",
                            href: "/dashboard/staff/candidates",
                            icon: "fa-solid fa-list",
                            activeRules: [{ path: "/dashboard/staff/candidates", exact: true, absentQuery: ["status"] }],
                        },
                        {
                            label: "Draft",
                            href: "/dashboard/staff/candidates?status=draft",
                            icon: "fa-regular fa-pen-to-square",
                            activeRules: [{ path: "/dashboard/staff/candidates", exact: true, query: { status: "draft" } }],
                        },
                        {
                            label: "Submitted",
                            href: "/dashboard/staff/candidates?status=submitted",
                            icon: "fa-solid fa-inbox",
                            activeRules: [{ path: "/dashboard/staff/candidates", exact: true, query: { status: "submitted" } }],
                        },
                        {
                            label: "Verified",
                            href: "/dashboard/staff/candidates?status=verified",
                            icon: "fa-solid fa-circle-check",
                            activeRules: [{ path: "/dashboard/staff/candidates", exact: true, query: { status: "verified" } }],
                        },
                        {
                            label: "Diterima",
                            href: "/dashboard/staff/candidates?status=accepted",
                            icon: "fa-solid fa-user-check",
                            activeRules: [{ path: "/dashboard/staff/candidates", exact: true, query: { status: "accepted" } }],
                        },
                        {
                            label: "Ditolak",
                            href: "/dashboard/staff/candidates?status=rejected",
                            icon: "fa-solid fa-user-xmark",
                            activeRules: [{ path: "/dashboard/staff/candidates", exact: true, query: { status: "rejected" } }],
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
                        {
                            label: "Perlu Tindakan",
                            href: "/dashboard/staff/change-requests",
                            icon: "fa-solid fa-triangle-exclamation",
                        },
                    ],
                },
                {
                    label: "Seleksi",
                    icon: "fa-solid fa-file-pen",
                    children: [
                        { label: "Hasil Ujian", href: "/dashboard/staff/exams/results", icon: "fa-solid fa-list-check" },
                    ],
                },
                { label: "Laporan", href: "/dashboard/staff/reports", icon: "fa-solid fa-chart-line", comingSoon: true },
            ],
        },
        {
            group: "ADMINISTRASI",
            items: [
                { label: "Dokumen", href: "/dashboard/staff/candidates", icon: "fa-solid fa-file-lines", staffCandidateSection: "dokumen" },
                { label: "Pembayaran", href: "/dashboard/staff/candidates", icon: "fa-solid fa-credit-card", staffCandidateSection: "pembayaran" },
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
                {
                    label: "Kandidat",
                    icon: "fa-solid fa-users",
                    activeRules: [{ path: "/dashboard/admin/candidates" }],
                    children: [
                        {
                            label: "Semua Kandidat",
                            href: "/dashboard/admin/candidates",
                            icon: "fa-solid fa-list",
                            activeRules: [{ path: "/dashboard/admin/candidates", exact: true, absentQuery: ["status"] }],
                        },
                        {
                            label: "Draft",
                            href: "/dashboard/admin/candidates?status=draft",
                            icon: "fa-regular fa-pen-to-square",
                            activeRules: [{ path: "/dashboard/admin/candidates", exact: true, query: { status: "draft" } }],
                        },
                        {
                            label: "Submitted",
                            href: "/dashboard/admin/candidates?status=submitted",
                            icon: "fa-solid fa-inbox",
                            activeRules: [{ path: "/dashboard/admin/candidates", exact: true, query: { status: "submitted" } }],
                        },
                        {
                            label: "Verified",
                            href: "/dashboard/admin/candidates?status=verified",
                            icon: "fa-solid fa-circle-check",
                            activeRules: [{ path: "/dashboard/admin/candidates", exact: true, query: { status: "verified" } }],
                        },
                        {
                            label: "Diterima",
                            href: "/dashboard/admin/candidates?status=accepted",
                            icon: "fa-solid fa-user-check",
                            activeRules: [{ path: "/dashboard/admin/candidates", exact: true, query: { status: "accepted" } }],
                        },
                        {
                            label: "Ditolak",
                            href: "/dashboard/admin/candidates?status=rejected",
                            icon: "fa-solid fa-user-xmark",
                            activeRules: [{ path: "/dashboard/admin/candidates", exact: true, query: { status: "rejected" } }],
                        },
                        {
                            label: "Permintaan Perubahan",
                            href: "/dashboard/admin/change-requests",
                            icon: "fa-solid fa-arrows-rotate",
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
                        {
                            label: "Perlu Tindakan",
                            href: "/dashboard/admin/change-requests",
                            icon: "fa-solid fa-triangle-exclamation",
                        },
                    ],
                },
                {
                    label: "Ujian Seleksi",
                    icon: "fa-solid fa-file-pen",
                    activeRules: [{ path: "/dashboard/admin/exams" }],
                    children: [
                        {
                            label: "Pengaturan Paket",
                            href: "/dashboard/admin/exams/packages",
                            icon: "fa-solid fa-box-archive",
                            activePrefixes: [
                                "/dashboard/admin/exams/packages",
                                "/dashboard/admin/exams/subjects",
                                "/dashboard/admin/exams/imports",
                            ],
                        },
                        {
                            label: "Pengaturan Sesi",
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
                { label: "Laporan", href: "/dashboard/admin/reports", icon: "fa-solid fa-chart-line", comingSoon: true },
            ],
        },
        {
            group: "ADMINISTRASI",
            items: [
                { label: "Dokumen", href: "/dashboard/admin/candidates", icon: "fa-solid fa-file-lines", adminCandidateSection: "dokumen" },
                { label: "Pembayaran", href: "/dashboard/admin/candidates", icon: "fa-solid fa-credit-card", adminCandidateSection: "pembayaran" },
            ],
        },
        {
            group: "PENGATURAN",
            items: [
                { label: "Gelombang", href: "/dashboard/admin/waves", icon: "fa-solid fa-layer-group" },
                { label: "Program / Jalur", href: "/dashboard/admin/programs", icon: "fa-solid fa-diagram-project", comingSoon: true },
                { label: "Staff", href: "/dashboard/admin/staff-list", icon: "fa-solid fa-user-tie" },
                { label: "Sistem", href: "/dashboard/admin/settings", icon: "fa-solid fa-sliders", comingSoon: true },
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
