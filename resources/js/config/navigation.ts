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
    children?: NavSubItem[];
};

export type NavSubItem = {
    label: string;
    icon:  string;
    href?: string;
    staffCandidateSection?: "data-diri" | "data-kesehatan" | "data-wali" | "dokumen" | "pembayaran";
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
                { label: "Kalender SPMB", href: "/dashboard/calendar", icon: "fa-solid fa-calendar-days", disabled: true, comingSoon: true },
                { label: "Informasi",     href: "/dashboard/info",     icon: "fa-solid fa-circle-info",   disabled: true, comingSoon: true },
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
                { label: "Status",         href: "/dashboard/status",         icon: "fa-solid fa-clock-rotate-left", disabled: true, comingSoon: true },
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
                { label: "Seleksi & Status", href: "/dashboard/staff/selection-status", icon: "fa-solid fa-list-check", disabled: true, comingSoon: true },
                { label: "Laporan Umum", href: "/dashboard/staff/reports", icon: "fa-solid fa-chart-line", disabled: true, comingSoon: true },
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
                { label: "Rekap Pembayaran", href: "/dashboard/staff/payment-recap", icon: "fa-solid fa-receipt", disabled: true, comingSoon: true },
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
                { label: "Kandidat",  href: "/dashboard/admin/candidates", icon: "fa-solid fa-users", disabled: true, comingSoon: true },
                { label: "Permintaan Perubahan", href: "/dashboard/admin/change-requests", icon: "fa-solid fa-arrows-rotate" },
                { label: "Seleksi & Status", href: "/dashboard/admin/selection-status", icon: "fa-solid fa-list-check", disabled: true, comingSoon: true },
                { label: "Laporan Umum", href: "/dashboard/admin/reports", icon: "fa-solid fa-chart-line", disabled: true, comingSoon: true },
            ],
        },
        {
            group: "ADMINISTRASI",
            items: [
                { label: "Dokumen", href: "/dashboard/admin/documents", icon: "fa-solid fa-file-lines", disabled: true, comingSoon: true },
            ],
        },
        {
            group: "PEMBAYARAN",
            items: [
                { label: "Pembayaran", href: "/dashboard/admin/payments", icon: "fa-solid fa-credit-card", disabled: true, comingSoon: true },
                { label: "Rekap Pembayaran", href: "/dashboard/admin/payment-recap", icon: "fa-solid fa-receipt", disabled: true, comingSoon: true },
            ],
        },
        {
            group: "PENGATURAN ADMIN",
            items: [
                { label: "Gelombang", href: "/dashboard/admin/waves", icon: "fa-solid fa-layer-group", disabled: true, comingSoon: true },
                { label: "Program / Jalur", href: "/dashboard/admin/programs", icon: "fa-solid fa-diagram-project", disabled: true, comingSoon: true },
                { label: "Staff", href: "/dashboard/admin/staff-list", icon: "fa-solid fa-user-tie", disabled: true, comingSoon: true },
                { label: "Pengaturan Sistem", href: "/dashboard/admin/settings", icon: "fa-solid fa-sliders", disabled: true, comingSoon: true },
            ],
        },
        {
            group: "AKUN",
            items: [
                { label: "Profil", href: "/dashboard/admin/profile", icon: "fa-solid fa-circle-user", disabled: true, comingSoon: true },
            ],
        },
    ],
};
