# Foundation Runtime and Dependency Evidence

## Runtime

- PHP 8.5.8; application requirement `^8.2`.
- Composer 2.8.12.
- Laravel 12.62.0.
- Node 22.22.2.
- npm 10.9.7.
- Required local PHP modules include PDO SQLite/MySQL, fileinfo, OpenSSL, XML reader, and ZIP.

`composer check-platform-reqs --no-dev` passed for the installed production packages. This validates the local host, not the Docker image or future production host.

## Manifests and advisories

- `composer validate --strict`: PASS.
- `composer audit --locked`: PASS; no security advisories reported on 2026-07-14.
- `npm audit --audit-level=low`: PASS; zero vulnerabilities reported on 2026-07-14.
- `npm ls --depth=0`: PASS; installed top-level packages resolved without an invalid/extraneous error.

Advisory results are time-bound. They must be rerun on the final release-candidate commit.
