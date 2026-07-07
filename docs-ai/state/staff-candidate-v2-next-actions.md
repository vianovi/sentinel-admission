# Staff Candidate V2 Next Actions

## Recommended Next Task

1. Build a backend-backed, paginated operational queue/reporting query for `Perlu Tindakan`.
2. Define real export requirements and implement Excel/report exports in a separate reporting task.
3. Add browser-level visual QA for the staff list, detail overview, and action queue at desktop/mobile sizes.

## Known Boundaries

- Do not build real Excel export.
- Do not add schema changes.
- Do not build payment recap or report center.
- Do not fake queues that are not backed by existing data.

## Task-7 Completion Notes

- Staff Candidate V2 now has a data-center list, staff-first detail overview, and operational action queue foundation.
- Search/filter grouping is covered by a focused feature test.
- The broader Feature suite, staff route list, frontend build, and diff hygiene checks passed.
