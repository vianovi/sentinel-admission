export type NavItem = {
    label: string;
    href:  string;
    icon:  string;     // Font Awesome class e.g. "fa-solid fa-house"
    exact?: boolean;   // match exact path for isActive check
};

export type NavGroup = {
    group: string;
    items: NavItem[];
};

export const navigationConfig: Record<string, NavGroup[]> = {

    // =========================================================================
    // CANDIDATE
    // =========================================================================
    candidate: [
        {
            group: "Menu",
            items: [
                { label: "Dashboard",       href: "/dashboard",             icon: "fa-solid fa-house",              exact: true },
                { label: "Kalender SPMB",   href: "/dashboard/calendar",    icon: "fa-solid fa-calendar-days" },
                { label: "Informasi",       href: "/dashboard/info",        icon: "fa-solid fa-circle-info" },
            ],
        },
        {
            group: "Pendaftaran",
            items: [
                { label: "Data Diri",       href: "/dashboard/data-diri",       icon: "fa-solid fa-id-card" },
                { label: "Data Kesehatan",  href: "/dashboard/data-kesehatan",  icon: "fa-solid fa-heart-pulse" },
                { label: "Data Wali",       href: "/dashboard/data-wali",       icon: "fa-solid fa-people-roof" },
                { label: "Dokumen",         href: "/dashboard/documents",   icon: "fa-solid fa-file-lines" },
                { label: "Pembayaran",      href: "/dashboard/payment",     icon: "fa-solid fa-credit-card" },
                { label: "Status",          href: "/dashboard/status",      icon: "fa-solid fa-clock-rotate-left" },
            ],
        },
        {
            group: "Akun",
            items: [
                { label: "Profil",          href: "/dashboard/profile",     icon: "fa-solid fa-circle-user" },
            ],
        },
    ],

    // =========================================================================
    // STAFF
    // =========================================================================
    staff: [
        {
            group: "Menu",
            items: [
                { label: "Dashboard",   href: "/dashboard/staff",               icon: "fa-solid fa-house",          exact: true },
                { label: "Kandidat",    href: "/dashboard/staff/candidates",    icon: "fa-solid fa-users" },
                { label: "Verifikasi",  href: "/dashboard/staff/verify",        icon: "fa-solid fa-shield-halved" },
            ],
        },
        {
            group: "Akun",
            items: [
                { label: "Profil",      href: "/dashboard/staff/profile",       icon: "fa-solid fa-circle-user" },
            ],
        },
    ],

    // =========================================================================
    // ADMIN
    // =========================================================================
    admin: [
        {
            group: "Menu",
            items: [
                { label: "Dashboard",   href: "/dashboard/admin",               icon: "fa-solid fa-house",          exact: true },
                { label: "Kandidat",    href: "/dashboard/admin/candidates",    icon: "fa-solid fa-users" },
                { label: "Gelombang",   href: "/dashboard/admin/waves",         icon: "fa-solid fa-layer-group" },
                { label: "Staff",       href: "/dashboard/admin/staff",         icon: "fa-solid fa-user-tie" },
                { label: "Laporan",     href: "/dashboard/admin/reports",       icon: "fa-solid fa-chart-line" },
            ],
        },
        {
            group: "Sistem",
            items: [
                { label: "Pengaturan",  href: "/dashboard/admin/settings",      icon: "fa-solid fa-gear" },
            ],
        },
    ],
};