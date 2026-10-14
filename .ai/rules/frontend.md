# Frontend & Sentinel Design System Rules

> Single Source of Truth: [`docs/architecture/frontend-standards.md`](../../docs/architecture/frontend-standards.md)

- **Colors & Tokens**: Primary Amber/Gold (`amber-500`, `#d4a017`, `amber-500/20`), Background Deep Dark Slate (`slate-950`, `slate-900`). No unstyled default purple rings or inline colors.
- **Form Controls & Focus**: Native `<select>` forbidden in admin panels; use custom styled dropdowns (`makeSelectStyles`). Mandatory focus ring: `focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none`.
- **States**: 4 mandatory UI states (loading, empty, error, success) & 5 document upload states (empty, uploading, pending, verified, rejected).
- **Exam Parameters**: `duration_minutes` and `passing_score` automatically derived from selected `ExamPackage`.

