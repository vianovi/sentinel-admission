# TASK 6 — Dashboard Shell Navigation V2 for Candidate, Staff, and Admin

## 0. Mission

This task focuses on the dashboard shell/navigation experience for all three dashboard roles:

* Candidate
* Staff
* Admin

The current left sidebar works, but the information architecture and submenu behavior need to be upgraded.

The goal is to build a clean, minimal, workflow-based dashboard navigation system inspired by the Star Admin 2 sidebar/topbar behavior, adapted to the existing Al-Muntaha School project theme.

This is not a feature-domain task.

Do not work on candidate lifecycle logic, exam engine logic, XLSX import, payment logic, document verification logic, database schema, or business process changes in this task.

Focus on:

* left sidebar structure
* role-based menu grouping
* click-based smooth submenus
* minimized sidebar behavior
* top header redesign
* consistent dashboard shell UX
* accessibility and navigation quality
* reusable navigation components
* clean code structure

---

## 1. Required Branch Safety

Before modifying code:

1. Check current branch.
2. Check working tree.
3. If working tree is dirty, stop and report.
4. If clean, create a new branch from the current HEAD.

Branch name:

`ui/dashboard-shell-navigation-v2`

After switching branch, verify the branch is correct.

### Branch Cleanup Rule

The user wants old temporary branches to not pile up.

However, do not delete any branch unsafely.

After creating the new branch, inspect previous local feature branches only if practical.

A previous local branch may be deleted only if:

* its latest commit is already reachable from the new branch/current HEAD;
* `git merge-base --is-ancestor <branch> HEAD` succeeds;
* the branch is local only or safe to delete locally;
* deletion can use safe delete only: `git branch -d <branch>`, never `-D`.

If unsure, do not delete.

Document the branch cleanup decision in the final report.

Never push.

Never merge.

Never rebase.

Never reset.

Never force delete branches.

---

## 2. Required Reading Before Coding

Read first:

* `docs-ai/CORE_CONTEXT.md`
* `docs-ai/compressed/intruction_system.md`
* existing dashboard layout components
* existing navigation config
* existing candidate dashboard layout/pages
* existing staff dashboard layout/pages
* existing admin dashboard layout/pages
* existing role-based route groups
* current `resources/js/config/navigation.ts` or equivalent navigation source

Trust source code over stale docs.

Before coding, inspect current sidebar and topbar implementation.

Identify whether navigation is centralized or duplicated.

The final implementation should reduce duplication, not add more repeated code.

---

## 3. Stitch MCP Requirement

Use Stitch MCP if available.

Use Stitch as a visual/UX assistant, not as a blind source of code.

The agent should use Stitch to generate or refine a dashboard shell/navigation concept for:

1. Candidate dashboard sidebar/topbar
2. Staff dashboard sidebar/topbar
3. Admin dashboard sidebar/topbar

Use the existing Stitch project if helpful:

`Al-Muntaha School Admin Dashboard`

Project ID if needed:

`271540505065919969`

Important:

* Do not copy Stitch colors blindly.
* Do not copy Stitch layout if it conflicts with this project.
* Use Stitch for structure, spacing inspiration, menu behavior, and topbar concept.
* Use the existing project theme for colors and final styling.
* If Stitch MCP is unavailable, stop and report before inventing a full design from scratch.

Create or update:

`docs-ai/design/dashboard-shell-navigation-v2.md`

This file must include:

* Stitch project/screens used
* sidebar behavior adopted
* topbar behavior adopted
* role menu maps
* what was adapted to the project
* what was intentionally not copied
* implementation plan

---

## 4. Design Reference

Use the Star Admin 2 CRM-style dashboard only as behavioral inspiration, not as copied code.

Desired behavior:

* Main left sidebar remains the only sidebar.
* Sidebar items with children expand downward when clicked.
* Submenu must not open merely because the user hovers the full sidebar item.
* Smooth submenu animation is expected.
* Active parent and active child should be visually clear.
* Minimized sidebar shows icons only.
* In minimized mode, hovering an icon may show a right-side flyout submenu preview.
* The sidebar should not auto-expand just because the user hovers it.
* Collapse/expand must be controlled by the sidebar toggle button.
* Top header becomes cleaner and more modern.

Do not copy Star Admin source code or assets.

Only adapt the interaction pattern.

---

## 5. Global Navigation Rules

There must be one main sidebar per dashboard.

Do not create a second left panel.

Do not create an inner module sidebar.

Do not create hover-only navigation for the full sidebar.

Do not create menu items that look clickable but lead nowhere.

Do not add fake inactive menus.

If a feature is not implemented, either:

* do not render it, or
* render it as a disabled/non-clickable item only if this matches the existing project convention.

Avoid `SOON` badges on important workflow items unless the existing project already uses them and the item is intentionally disabled.

Submenus should be opened by click.

Use accessible button semantics for expandable parents:

* `aria-expanded`
* clear chevron state
* keyboard focus state
* visible active state

---

## 6. Candidate Sidebar V2

Candidate sidebar should remain simple and roadmap-oriented.

Target structure:

```txt
MENU
- Dashboard
- Kalender SPMB
- Informasi

PENDAFTARAN
- Data Pendaftaran
  - Data Diri
  - Data Wali
  - Data Kesehatan
- Verifikasi Berkas
  - Dokumen
  - Pembayaran
- Seleksi
  - Ujian Seleksi
  - Status Pendaftaran

AKUN
- Profil
```

Rules:

* If `Status Pendaftaran` route is not implemented, do not create a fake clickable route.
* Candidate locked state must still come from backend gates, not sidebar logic.
* Sidebar may show locked/disabled visual state if gate props already exist, but must not duplicate gate rules.
* Do not change candidate lifecycle/business logic in this task.

---

## 7. Staff Sidebar V2

Staff sidebar should be workflow-based.

Target structure:

```txt
MENU
- Dashboard
- Kandidat
  - Semua Kandidat
  - Draft
  - Submitted
  - Verified
  - Diterima / Ditolak
- Verifikasi
  - Review Dokumen
  - Review Pembayaran
  - Perlu Tindakan
- Seleksi
  - Sesi Ujian
  - Peserta Seleksi
  - Hasil Ujian
- Laporan

ADMINISTRASI
- Dokumen
- Pembayaran

AKUN
- Profil
```

Rules:

* `Kandidat` is the staff’s main data center.
* `Verifikasi` is the staff’s work queue for document/payment review.
* `Seleksi` is the staff’s work queue for exam/session/result flow.
* Do not create fake routes.
* If a submenu route does not exist yet, map it to the closest existing real route with query/filter parameters only if the backend already supports it.
* If not supported, leave it as a documented future item rather than a broken menu.

---

## 8. Admin Sidebar V2

Admin sidebar should be staff-like but with additional settings authority.

Target structure:

```txt
MENU
- Dashboard
- Kandidat
  - Semua Kandidat
  - Draft
  - Submitted
  - Verified
  - Final
  - Permintaan Perubahan
- Verifikasi
  - Review Dokumen
  - Review Pembayaran
  - Perlu Tindakan
- Ujian Seleksi
  - Pengaturan Paket
  - Pengaturan Sesi
  - Hasil Ujian
- Laporan

PENGATURAN
- Gelombang
- Program / Jalur
- Staff
- Sistem

AKUN
- Profil
```

Rules:

* Admin has broader authority, but the sidebar should stay minimal.
* `Ujian Seleksi` must only expose real top-level exam workflows:

  * Pengaturan Paket
  * Pengaturan Sesi
  * Hasil Ujian
* Do not add template/import/bank-soal/peserta as sidebar children unless they are true routes and intentionally part of the main IA.
* Those should normally remain inside package/session/detail pages as actions or workflow sections.

---

## 9. Sidebar Interaction Requirements

Full sidebar mode:

* Parent item click toggles submenu.
* Hover only changes visual background/text color.
* Hover must not open submenu.
* Active parent stays expanded.
* Active child is highlighted.
* Multiple expanded parents may be allowed if current UX supports it, but one-open-at-a-time is also acceptable if cleaner.
* Smooth animation should feel fast and subtle.

Minimized sidebar mode:

* Sidebar width collapses to icon-only.
* Parent item click or sidebar toggle behavior must remain predictable.
* Hovering an icon in minimized mode may show a flyout submenu to the right.
* Flyout should be compact and readable.
* Flyout should not permanently open unless clicked.
* Flyout must not cover critical topbar controls.
* If flyout is too risky to implement cleanly, stop and document the reason rather than shipping broken behavior.

Persistence:

* Preserve sidebar collapsed state if existing project already persists it.
* If not, localStorage persistence is acceptable but not required.
* Do not introduce complex global state management just for sidebar.

---

## 10. Top Header V2

Redesign the fixed top header.

Target behavior:

* Header remains consistent across candidate, staff, and admin dashboards.
* Header should feel cleaner and more modern.
* Replace always-visible search input with a search icon button.
* When search icon is clicked, show a compact search overlay/input.
* Search can be static placeholder for now.
* Do not implement real global search in this task.
* Add a dynamic English greeting based on local time:

  * Good Morning
  * Good Afternoon
  * Good Evening
  * Good Night
* Greeting should use the authenticated user display name or role label if available.
* Add current date display similar to admin templates.
* Keep existing notifications/settings/profile controls if they already exist.
* Do not break profile dropdown behavior.
* Do not add fake notifications logic.
* Do not change auth/session behavior.

Suggested topbar content:

```txt
[Sidebar Toggle] [Greeting + Date]                            [Search Icon] [Notifications] [Settings] [Profile]
```

Desktop-first behavior is the priority.

Mobile behavior should not break, but this task does not require deep mobile redesign.

---

## 11. Code Structure Requirements

Prioritize reusable components.

Avoid copying the same sidebar/topbar code three times.

Suggested structure may include:

```txt
resources/js/Components/Dashboard/Shell/
├── DashboardSidebar.tsx
├── DashboardSidebarGroup.tsx
├── DashboardSidebarItem.tsx
├── DashboardSidebarSubmenu.tsx
├── DashboardSidebarFlyout.tsx
├── DashboardTopbar.tsx
└── DashboardSearchOverlay.tsx
```

Use existing folder conventions if different.

Navigation config should stay centralized.

Suggested config direction:

```txt
resources/js/config/navigation.ts
```

or equivalent existing config.

The config should support:

* role
* group label
* item label
* icon
* route/href
* children
* disabled
* badge
* active matching
* gate/locked metadata if already available

Do not hard-code navigation arrays separately in candidate, staff, and admin layouts if a shared config can handle it cleanly.

Do not over-engineer with a new package or router library.

---

## 12. UI Quality Bar

The final UI must feel:

* clean
* compact
* professional
* modern
* consistent with Al-Muntaha School
* dark navy themed
* gold-accent active state
* not crowded
* not childish
* not overly animated
* not copied blindly from Star Admin
* not generic CRUD admin

Avoid:

* overly large sidebar items
* submenu clutter
* hover-only menus in full sidebar
* fake clickable items
* broken active state
* search input taking too much header space
* header looking empty after search collapse
* repeated navigation logic
* inaccessible icon-only actions with no labels/tooltips

---

## 13. Scope Boundary

Do not work on:

* candidate lifecycle service
* payment business logic
* document verification business logic
* exam engine backend
* XLSX template/download/import logic
* database schema
* auth logic
* email verification logic
* global role model
* dashboard page domain content, except minor spacing adjustments caused by shell changes

Allowed:

* dashboard shell components
* sidebar components
* topbar components
* navigation config
* minimal dashboard layout props
* role-aware menu rendering
* docs/state/audit/design files
* minor route helper usage if required for menu links

---

## 14. Documentation Required

Update or create:

```txt
docs-ai/design/dashboard-shell-navigation-v2.md
docs-ai/features/dashboard-navigation-v2.md
```

Update durable docs:

```txt
docs-ai/state/selection-progress.md
docs-ai/state/selection-known-bugs.md
docs-ai/state/selection-next-actions.md
docs-ai/audit/selection-exam-audit.md
```

Even though this task is not exam-specific, continue using the existing durable state/audit structure so work remains traceable.

Documentation must include:

* branch name
* menu maps for candidate/staff/admin
* Stitch usage summary
* Star Admin-inspired behavior adopted
* what was not copied
* topbar behavior
* minimized sidebar behavior
* routes/submenus that were not implemented and why
* known limitations
* manual review checklist

---

## 15. Verification

Run:

```txt
npm run build
git diff --check
```

Run if routes/navigation helpers are changed:

```txt
php artisan route:list --path=dashboard
```

Run relevant feature tests if dashboard route/access behavior is touched.

If Playwright MCP is available, inspect:

* candidate sidebar expanded/collapsed
* staff sidebar expanded/collapsed
* admin sidebar expanded/collapsed
* minimized icon flyout behavior
* topbar search icon/overlay behavior

If Playwright is unavailable, use static UI audit and provide manual review steps.

Do not claim pixel-perfect visual success without browser review.

---

## 16. Mandatory Audit Loop

Do not commit after the first patch.

Repeat audit until stable:

1. Inspect candidate sidebar menu structure.
2. Inspect staff sidebar menu structure.
3. Inspect admin sidebar menu structure.
4. Inspect submenu click behavior.
5. Inspect minimized sidebar behavior.
6. Inspect topbar greeting/date/search behavior.
7. Check no full-sidebar hover-open behavior remains.
8. Check no fake clickable routes were added.
9. Check navigation logic is not duplicated unnecessarily.
10. Run verification commands.
11. Fix Critical/High and obvious Medium issues.
12. Repeat until clean.

Commit only after audit loop passes.

---

## 17. Commit Rule

If verification passes, create one commit:

```txt
feat(dashboard): add role-based navigation shell v2
```

Do not push.

Do not merge.

Do not rebase.

Do not reset.

Do not amend previous commits unless explicitly instructed.

---

## 18. Final Report

Final report must be in Indonesian.

Include:

* branch created
* Stitch project/tool usage
* sidebar changes for candidate
* sidebar changes for staff
* sidebar changes for admin
* topbar changes
* minimized sidebar behavior
* files changed
* docs created/updated
* verification commands and results
* audit loop result
* branch cleanup result
* commit hash if created
* remaining limitations
* manual review checklist
