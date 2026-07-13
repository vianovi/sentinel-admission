# Foundation Tests and Migration Evidence

## Full automated suite

- Command: `php artisan test`
- Result: PASS
- Tests: 71 passed
- Assertions: 580
- Duration reported by runner: 3.60 seconds

Covered suites include candidate gates and lifecycle, verification checklist, environment mail delivery, registration-draft ownership/expiry, exam imports and security, candidate status exposure, and staff operations. This is an inventory statement, not a claim that every critical path is tested.

## Migration execution

- Command: `DB_CONNECTION=sqlite DB_DATABASE=<temporary-file> php artisan migrate:fresh --force --no-interaction`
- Result: PASS
- Migration files: 28
- Created tables/structures: 29
- Isolation: a new `/tmp` SQLite file; removed automatically after the command
- No seeders ran.
- No configured MariaDB/demo/production database was contacted.

Residual: MariaDB-specific behavior, existing-data migrations, backup prerequisites, and rollback behavior remain for Tasks 10 and 11.
