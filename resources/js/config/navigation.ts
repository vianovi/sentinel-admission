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

export type NavItem = {
    label: string;
    href: string;
    icon: string;    // Font Awesome class — contoh: "fa-solid fa-house"
    exact?: boolean; // true = match exact URL, false/undefined = startsWith
    disabled?: boolean;
    comingSoon?: boolean;
    staffCandidateHome?: boolean;
    staffCandidateSection?: "data-diri" | "data-kesehatan" | "data-wali" | "dokumen" | "pembayaran";
    adminCandidateHome?: boolean;
    adminCandidateSection?: "data-diri" | "data-kesehatan" | "data-wali" | "dokumen" | "pembayaran";
    children?: NavSubItem[];
};

export type NavSubItem = {
    label: string;
    icon:  string;
    href?: string;
    activePrefixes?: string[];
    staffCandidateSection?: "data-diri" | "data-kesehatan" | "data-wali" | "dokumen" | "pembayaran";
    adminCandidateSection?: "data-diri" | "data-kesehatan" | "data-wali" | "dokumen" | "pembayaran";
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
    // Halaman bertanda ⏳ belum memiliki route/halaman aktif,
    // sidebar akan tetap merender link-nya tapi belum bisa diakses.
    // =========================================================================
    candidate: [
        {
            group: "Menu",
            items: [
                { label: "Dashboard",     href: "/dashboard",          icon: "fa-solid fa-house",          exact: true },
                { label: "Kalender SPMB", href: "/dashboard/calendar", icon: "fa-solid fa-calendar-days" },
                { label: "Informasi",     href: "/dashboard/info",     icon: "fa-solid fa-circle-info",   comingSoon: true },
            ],
        },
        {
            group: "Pendaftaran",
            items: [
                { label: "Data Diri",      href: "/dashboard/data-diri",      icon: "fa-solid fa-id-card" },
                { label: "Data Kesehatan", href: "/dashboard/data-kesehatan", icon: "fa-solid fa-heart-pulse" },
                { label: "Data Wali",      href: "/dashboard/data-wali",      icon: "fa-solid fa-people-roof" },
                { label: "Dokumen",        href: "/dashboard/data-dokumen",   icon: "fa-solid fa-file-lines" },
                { label: "Pembayaran",     href: "/dashboard/pembayaran",     icon: "fa-solid fa-credit-card" },
                { label: "Ujian Seleksi",  href: "/dashboard/seleksi",        icon: "fa-solid fa-file-pen" },
                { label: "Status",         href: "/dashboard/status",         icon: "fa-solid fa-clock-rotate-left", comingSoon: true },
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
    // Verifikasi dilakukan via filter di halaman Kandidat — tidak ada menu terpisah.
    // =========================================================================
    staff: [
        {
            group: "MENU",
            items: [
                { label: "Dashboard", href: "/dashboard/staff",            icon: "fa-solid fa-house",  exact: true },
                {
                    label: "Kandidat",
                    href: "/dashboard/staff/candidates",
                    icon: "fa-solid fa-users",
                    staffCandidateHome: true,
                    children: [
                        { label: "Data Diri", icon: "fa-solid fa-id-card", staffCandidateSection: "data-diri" },
                        { label: "Data Kesehatan", icon: "fa-solid fa-heart-pulse", staffCandidateSection: "data-kesehatan" },
                        { label: "Data Wali", icon: "fa-solid fa-people-roof", staffCandidateSection: "data-wali" },
                    ],
                },
                { label: "Permintaan Perubahan", href: "/dashboard/staff/change-requests", icon: "fa-solid fa-arrows-rotate" },
                { label: "Hasil Ujian", href: "/dashboard/staff/exams/results", icon: "fa-solid fa-list-check" },
                { label: "Laporan Umum", href: "/dashboard/staff/reports", icon: "fa-solid fa-chart-line", comingSoon: true },
            ],
        },
        {
            group: "ADMINISTRASI",
            items: [
                { label: "Dokumen", href: "/dashboard/staff/candidates", icon: "fa-solid fa-file-lines", staffCandidateSection: "dokumen" },
            ],
        },
        {
            group: "PEMBAYARAN",
            items: [
                { label: "Pembayaran", href: "/dashboard/staff/candidates", icon: "fa-solid fa-credit-card", staffCandidateSection: "pembayaran" },
                { label: "Rekap Pembayaran", href: "/dashboard/staff/payment-recap", icon: "fa-solid fa-receipt", comingSoon: true },
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
                    href: "/dashboard/admin/candidates",
                    icon: "fa-solid fa-users",
                    adminCandidateHome: true,
                    children: [
                        { label: "Data Diri", icon: "fa-solid fa-id-card", adminCandidateSection: "data-diri" },
                        { label: "Data Kesehatan", icon: "fa-solid fa-heart-pulse", adminCandidateSection: "data-kesehatan" },
                        { label: "Data Wali", icon: "fa-solid fa-people-roof", adminCandidateSection: "data-wali" },
                    ],
                },
                { label: "Permintaan Perubahan", href: "/dashboard/admin/change-requests", icon: "fa-solid fa-arrows-rotate" },
                {
                    label: "Ujian Seleksi",
                    href: "/dashboard/admin/exams",
                    icon: "fa-solid fa-file-pen",
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
                                "/dashboard/admin/exams/results",
                            ],
                        },
                    ],
                },
                { label: "Laporan Umum", href: "/dashboard/admin/reports", icon: "fa-solid fa-chart-line", comingSoon: true },
            ],
        },
        {
            group: "ADMINISTRASI",
            items: [
                { label: "Dokumen", href: "/dashboard/admin/candidates", icon: "fa-solid fa-file-lines", adminCandidateSection: "dokumen" },
            ],
        },
        {
            group: "PEMBAYARAN",
            items: [
                { label: "Pembayaran", href: "/dashboard/admin/candidates", icon: "fa-solid fa-credit-card", adminCandidateSection: "pembayaran" },
                { label: "Rekap Pembayaran", href: "/dashboard/admin/payment-recap", icon: "fa-solid fa-receipt", comingSoon: true },
            ],
        },
        {
            group: "PENGATURAN ADMIN",
            items: [
                { label: "Gelombang", href: "/dashboard/admin/waves", icon: "fa-solid fa-layer-group" },
                { label: "Program / Jalur", href: "/dashboard/admin/programs", icon: "fa-solid fa-diagram-project", comingSoon: true },
                { label: "Staff", href: "/dashboard/admin/staff-list", icon: "fa-solid fa-user-tie" },
                { label: "Pengaturan Sistem", href: "/dashboard/admin/settings", icon: "fa-solid fa-sliders", comingSoon: true },
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
