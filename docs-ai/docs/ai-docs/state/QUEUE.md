# Production Audit Queue

Task 00 may reorder this queue after a real dependency map.

| Order | Slice | Task | Status | Dependencies | Classification |
|---:|---|---|---|---|---|
| 0 | Foundation/discovery | task-00 | queued | none | pending |
| 1 | Shared runtime/public | task-01 | queued | task-00 | pending |
| 2 | Auth/registration | task-02 | queued | task-01 | pending |
| 3 | Candidate lifecycle/profile | task-03 | queued | task-02 | pending |
| 4 | Documents/storage | task-04 | queued | task-03 | pending |
| 5 | Payment/Midtrans | task-05 | queued | task-03 | pending |
| 6 | Selection exam | task-06 | queued | task-03 | pending |
| 7 | Staff operations | task-07 | queued | task-03,04,05,06 | pending |
| 8 | Admin operations | task-08 | queued | task-00 | pending |
| 9 | Reporting/export | task-09 | queued | task-03,05,06,07 | pending |
| 10 | Infrastructure/deployment | task-10 | queued | task-00,01 | pending |
| 11 | Integration regression | task-11 | queued | all required slices | pending |

Statuses:

`queued`, `mapping`, `auditing`, `fixing`, `verifying`, `classified`, `promoted`, `blocked`, `complete`.
