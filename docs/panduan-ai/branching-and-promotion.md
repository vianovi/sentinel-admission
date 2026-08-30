# Branching & Promotion Policy

## 1. Protected Destination (`main`)
`main` is strictly human-controlled. The AI auditor must never:
- Commit or merge directly into `main`.
- Push any build or deployment to remote `main`.
- Perform any destructive history rewrite.

## 2. Branch Roles & Naming
- `develop`: Primary integrated development source.
- `release/production-candidate`: Audited staging branch awaiting human review.
- `fix/*` or `audit/*`: Isolated slice audit and repair branches.

## 3. Promotion Strategies (Recorded in `docs/state-aktif/DECISIONS.md`)
- **Strategy A — Full Integrated Release Candidate (Default for this project):** Used when the codebase is an integrated whole. Slices are audited as sequential gates over the full tree.
- **Strategy B — Selective Commit Promotion:** Used when independent, atomic commits can be cherry-picked onto a clean release branch.
- **Strategy C — Reconstructed Slice:** Used when specific feature closures must be reconstructed cleanly.

## 4. Promotion Criteria
- Only slices classified as **`PASS`** are eligible for promotion into the release candidate.
- Slices with UI modifications carry a mandatory **`HUMAN VISUAL REVIEW REQUIRED`** tag.
- Every promotion must update:
  - `docs/persiapan-deploy/PRODUCTION-MANIFEST.md`
  - `docs/persiapan-deploy/PROMOTION-LEDGER.md`
  - `docs/state-aktif/CURRENT.md`
