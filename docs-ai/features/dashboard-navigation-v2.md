# Dashboard Navigation V2

## Scope

Dashboard Navigation V2 updates the shared dashboard shell for candidate, staff, and admin. It changes information architecture, sidebar interaction, minimized sidebar behavior, and topbar presentation only.

No business logic, database schema, route middleware, candidate lifecycle rules, payment logic, document verification logic, exam engine behavior, auth/session behavior, or role model was changed.

## Source Files

- `resources/js/config/navigation.ts`
- `resources/js/Components/Dashboard/Shared/Sidebar.tsx`
- `resources/js/Components/Dashboard/Shared/Topbar.tsx`
- `resources/js/context/SidebarContext.tsx`
- `resources/js/Layouts/DashboardLayout.tsx`
- `resources/js/Layouts/DashboardSplitLayout.tsx`

## Navigation Config

The config remains centralized in `resources/js/config/navigation.ts`.

It now supports:

- role groups
- optional parent `href`
- child items
- disabled/ComingSoon metadata
- query-aware active rules
- active prefixes
- candidate detail section metadata for staff/admin candidate review pages

Parents with children do not pretend to be links. They render as accessible submenu buttons. Child rows are the navigation links.

## Sidebar Behavior

- Expanded width: full navigation labels and groups.
- Minimized width: icon-only.
- Full sidebar submenu behavior: click parent row to expand/collapse.
- Full sidebar hover behavior: visual hover state only.
- Active parent behavior: stays expanded while the current route is inside that group.
- Active child behavior: gold-accent child state.
- Minimized sidebar behavior: parent hover/focus opens a compact flyout preview to the right.
- Sidebar toggle is the only control that expands/collapses the sidebar width.
- Removed the old shared hover-expanded state from sidebar context/layouts so hover cannot widen the dashboard shell.

## Topbar Behavior

- Fixed/sticky dashboard topbar remains shared by all roles.
- Left side: sidebar toggle, English time-based greeting, and current date.
- Right side: search icon, theme control, notification control, and profile dropdown.
- Search icon opens a compact static input popover.
- Notifications no longer show a fake unread count.
- Profile dropdown keeps the existing role-aware profile route and logout action.

## Route Decisions

- Candidate `Status Pendaftaran` is now active because the real `/dashboard/status-pendaftaran` page exists.
- Candidate `Bantuan`, `Riwayat Pembayaran`, `Status Seleksi`, and `Hasil Seleksi` are now active because real pages and routes exist.
- Staff `Sesi Ujian` and `Peserta Seleksi` are omitted because there are no staff top-level routes for those workflows.
- Staff/admin final status filters are split into `Diterima` and `Ditolak` because the backend candidate list supports a single `status` query at a time.
- Staff/admin document/payment review links reuse existing selected-candidate section behavior. Without a selected candidate, they fall back to the real candidate list route.
- Existing ComingSoon routes remain visible only where they already represent intentional future pages for staff/admin navigation, such as `Laporan`, `Program / Jalur`, calendar placeholders, and other intentionally deferred internal tools.

## Known Limitations

- Search popover is presentational only; no global search API or routing was added.
- Minimized flyout is a compact preview for child navigation. It does not create persistent submenu state.
- Staff does not expose exam session or participant management until real staff routes exist.
- Candidate menu items should only stay visible when backed by real routes/pages or intentionally marked Coming Soon.

## Manual QA

- Validate candidate, staff, and admin accounts separately.
- Click each expandable parent and confirm hover alone does not open submenus in full mode.
- Collapse the sidebar, hover parent icons, and confirm flyouts are readable and do not resize the sidebar.
- Open search, notification, and profile dropdowns; confirm outside click and Escape close them.
- Check `/dashboard/staff/candidates?status=...` and `/dashboard/admin/candidates?status=...` active states.
- Confirm the dashboard build and `php artisan route:list --path=dashboard` still pass.
