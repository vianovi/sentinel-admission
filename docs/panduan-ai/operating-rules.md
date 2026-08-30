# Auditor Operating Rules

## 1. Pre-Audit Discipline
- **Verify Clean State:** Confirm current branch, clean working tree, and match against `state-aktif/CURRENT.md`.
- **Delineate Scope:** Clearly define which controllers, routes, models, views, and migrations are in-scope. Note out-of-scope files.
- **Baseline Snapshot:** Record the starting commit SHA before applying any modifications.

## 2. Deep Audit Execution
- **State Tracing:** Trace all mutation paths (insert, update, delete, status transitions) for critical models.
- **Contract Verification:** Ensure backend Inertia/JSON props match frontend TypeScript interfaces.
- **Edge & Failure Paths:** Audit error handling, input validation bounds, empty states, and unauthorized attempts.
- **Async & Background Jobs:** Audit queue dispatching, Webhook listeners (Midtrans), retries, and scheduled commands.
- **Idempotency & Concurrency:** Ensure atomic transactions (`DB::transaction`) prevent race conditions on shared states (quota, payment status, exam attempts).

## 3. Patching & Code Modification
- **Fix Confirmed Bugs Only:** Do not perform unsolicited refactoring or stylistic rewrites.
- **Targeted Scope:** Keep edits surgical and localized. Reuse established helpers and services.
- **Preserve Compatibility:** Maintain existing interface contracts unless authorized to introduce breaking changes.

## 4. Verification Standard
- **Focused Check First:** Run the exact unit/feature test corresponding to the altered code.
- **Broad Regression Check:** Run `php artisan test --compact` to verify zero regression.
- **Frontend Compilation:** Execute `npm run build` after modifying any JSX/TSX/CSS files.
- **Route & Boot Validation:** Check `php artisan route:list` for route registration and middleware accuracy.
- **Record Evidence:** Save raw output of commands in `docs/laporan-audit/evidence/`.

## 5. Git & Commit Hygiene
- **Milestone Commits:** Commit only clean, verified changes with descriptive commit messages.
- **Never Mix Concerns:** Do not combine layout refactoring with business logic fixes in a single commit.
- **No Direct Push to Protected Branches:** All work stays on feature/audit branches until human sign-off.
