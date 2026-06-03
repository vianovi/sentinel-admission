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
    label:  string;
    href:   string;
    icon:   string;    // Font Awesome class — contoh: "fa-solid fa-house"
    exact?: boolean;   // true = match exact URL, false/undefined = startsWith
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
                { label: "Kalender SPMB", href: "/dashboard/calendar", icon: "fa-solid fa-calendar-days" }, // ⏳ belum aktif
                { label: "Informasi",     href: "/dashboard/info",     icon: "fa-solid fa-circle-info" },   // ⏳ belum aktif
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
                { label: "Status",         href: "/dashboard/status",         icon: "fa-solid fa-clock-rotate-left" }, // ⏳ belum aktif
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
            group: "Menu",
            items: [
                { label: "Dashboard", href: "/dashboard/staff",            icon: "fa-solid fa-house",  exact: true },
                {
                    label: "Kandidat",
                    href:  "/dashboard/staff/candidates",
                    icon:  "fa-solid fa-users",
                    children: [
                        { label: "Data Diri",      icon: "fa-solid fa-id-card",      staffCandidateSection: "data-diri" },
                        { label: "Data Kesehatan", icon: "fa-solid fa-heart-pulse",   staffCandidateSection: "data-kesehatan" },
                        { label: "Data Wali",      icon: "fa-solid fa-people-roof",   staffCandidateSection: "data-wali" },
                        { label: "Dokumen",        icon: "fa-solid fa-file-lines",    staffCandidateSection: "dokumen" },
                        { label: "Pembayaran",     icon: "fa-solid fa-credit-card",   staffCandidateSection: "pembayaran" },
                    ],
                },
            ],
        },
        {
            group: "Akun",
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
            group: "Menu",
            items: [
                { label: "Dashboard", href: "/dashboard/admin",            icon: "fa-solid fa-house",       exact: true },
                { label: "Kandidat",  href: "/dashboard/admin/candidates", icon: "fa-solid fa-users" },
                { label: "Gelombang", href: "/dashboard/admin/waves",      icon: "fa-solid fa-layer-group" },
                { label: "Staff",     href: "/dashboard/admin/staff-list", icon: "fa-solid fa-user-tie" },
            ],
        },
        {
            group: "Akun",
            items: [
                { label: "Profil", href: "/dashboard/admin/profile", icon: "fa-solid fa-circle-user" },
            ],
        },
    ],
};
