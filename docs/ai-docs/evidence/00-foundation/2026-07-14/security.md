# Foundation Security Evidence

## Catalog baseline

- OWASP ASVS 5.0.0, verified from the official OWASP project page on 2026-07-14.
- OWASP WSTG stable 4.2, verified from the official OWASP project page on 2026-07-14; WSTG 5.0 remains the development version.
- References: `https://owasp.org/www-project-application-security-verification-standard/` and `https://owasp.org/www-project-web-security-testing-guide/`.

## Baseline checks

- Composer and npm advisory audits reported no vulnerabilities.
- `.env`, `.env.*`, `vendor`, `node_modules`, generated builds, and logs are ignored; no real environment value was copied to evidence.
- A tracked-file heuristic searched sensitive assignment names, private-key headers, and certificate/key filename extensions without printing matched values.
- Assignment matches were restricted to known environment examples, `config/midtrans.php`, and documentation. Existing mail-template tests also assert placeholder/no-secret behavior.
- No tracked private-key/certificate filename or private-key header was found.
- No dedicated gitleaks/trufflehog/detect-secrets executable was available. Git history was not exhaustively entropy-scanned.

## Attack-surface inventory

- 162 authenticated routes split across exact candidate/staff/admin role middleware.
- Private file paths use authenticated controllers/services and sensitive-file throttles.
- The public Midtrans webhook bypasses web/CSRF middleware by design and requires signature/idempotency review in Task 05.
- Registration/draft endpoints use guest, throttle, and draft ownership middleware.
- Candidate exam, payment, document, profile, staff/admin state mutation, and XLSX import routes are assigned to dedicated slices.
- `bootstrap/app.php` trusts all proxies; deployment-context validation is required in Task 10.
- `DocumentSecurityService` security layers are active by default. Dormant `sentinel.* = false` bypass branches have no active config/override and are assigned to Task 04 hardening review.

Result: PASS for Task 00 security discovery only. This is not a whole-application security pass.
