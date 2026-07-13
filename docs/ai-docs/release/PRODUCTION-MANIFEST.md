# Production Candidate Manifest

- Strategy: `Strategy A — Full integrated release candidate`
- Source baseline: `develop@1113160ebee605ebad439f53f3322f9deb060711`
- Release candidate branch: `release/production-candidate` (initially at the source baseline)
- Protected branch: `main@8d5efe5f910b324d0b7fd4b293256a0675af0f77` — human-controlled and unchanged

| Slice | Source SHA | Audit SHA | Promoted SHA | Code Status | Human Visual Review | Notes |
|---|---|---|---|---|---|---|
| Foundation | `1113160` | pending checkpoint | not yet promoted | verifying; baseline gates pass | n/a | Documentation-only Task 00; not a feature-slice pass |
| Public/shared runtime | - | - | - | pending | pending | |
| Auth/registration | - | - | - | pending | pending | |
| Candidate lifecycle/profile | - | - | - | pending | pending | |
| Documents/storage | - | - | - | pending | pending | |
| Payment/Midtrans | - | - | - | pending | pending | |
| Selection exam | - | - | - | pending | pending | |
| Staff operations | - | - | - | pending | pending | |
| Admin operations | - | - | - | pending | pending | |
| Reporting/export | - | - | - | pending | pending | |
| Infrastructure/deployment | - | - | - | pending | n/a | |
| Integration regression | - | - | - | pending | pending | |

Only `PASS` is eligible for release-candidate promotion.

The source baseline is local and currently 70 commits ahead of `origin/develop`. Remote reproducibility remains a release coordination requirement; the auditor performed no push.
