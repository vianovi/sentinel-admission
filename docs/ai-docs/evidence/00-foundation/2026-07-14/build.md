# Foundation Build and Cache Evidence

## Frontend production build

- Command: `npm run build`
- Toolchain: TypeScript 5.9.3 and Vite 7.3.6
- Result: PASS
- Modules transformed: 2,558
- Reported build time: 6.89 seconds
- Generated `public/build` output is ignored and was not added to the audit diff.

Several generated JavaScript assets are large, including calendar/chart/vendor chunks. No performance or visual approval is inferred from a successful build.

## Laravel production optimization

- Real environment file: temporarily excluded and never read/copied.
- Runtime values: synthetic non-secret production settings, SQLite memory driver, array cache/session/mail, synchronous queue.
- `php artisan optimize`: PASS for config, events, routes, and views.
- Route boot while optimized: PASS after removing an unsupported audit-command flag.
- Cached environment metadata confirmed production mode and debug off.
- `php artisan optimize:clear`: PASS.
- Post-check cache inventory contains only the tracked/normal `.gitignore`, `packages.php`, and `services.php` files.
