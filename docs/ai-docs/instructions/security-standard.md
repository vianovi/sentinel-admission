# Security Audit Standard

Use the current stable OWASP ASVS as a control catalog and stable OWASP WSTG as a testing guide. Record versions consulted.

This is source-code and safe local/test-environment auditing, not aggressive testing against public production.

## Mandatory domains

### Authentication/accounts

- registration, login, logout;
- password reset/change;
- email verification;
- account enumeration;
- lockout/rate limiting;
- session invalidation and remember-me.

### Authorization/ownership

- exact role middleware;
- policies/gates;
- object ownership;
- IDOR;
- staff/admin separation;
- final-status protections;
- secure file access.

### Input/output

- request validation;
- conditional validation;
- mass assignment;
- SQL/query grouping;
- XSS/output encoding;
- unsafe HTML;
- server-side trust boundaries;
- frontend props/network leakage.

### Sessions/CSRF

- CSRF;
- cookie settings;
- session fixation/timeout;
- sensitive caching;
- state-changing HTTP methods.

### Files/storage

- extension/MIME/magic-byte checks;
- size limits;
- filename/path safety;
- private storage;
- secure previews/downloads;
- authorization on every access;
- deletion/retention;
- error sanitization;
- malicious/polyglot considerations where supported.

### Payment/webhooks

- server-generated amount/order identity;
- signature/authenticity;
- idempotency/replay;
- transaction-state mapping;
- duplicate notifications;
- amount/currency consistency;
- pending/settlement/expiry/cancel/refund paths;
- safe logs;
- no client-controlled paid status;
- no secret disclosure.

### Exam

- candidate ownership;
- session eligibility;
- server-owned timer;
- answer-key leakage;
- autosave validation;
- server-side scoring;
- attempt locking/expiry;
- protected staff/admin review.

### Errors/logs/secrets

- sanitized user-facing errors;
- safe technical logs;
- no credentials/tokens/PII in logs;
- no committed secrets;
- production debug disabled;
- source maps/diagnostics reviewed.

### Dependencies/configuration

- Composer/npm advisories;
- unsupported runtime/dependencies;
- PHP extensions;
- web root;
- security headers where controlled;
- health endpoints;
- worker/scheduler assumptions.

## Severity

- Critical: direct compromise, broad sensitive-data exposure, payment/account takeover, destructive data risk.
- High: significant exploitable authorization, integrity, or secret issue.
- Medium: meaningful weakness with constraints/lower impact.
- Low: hardening or limited-risk issue.
- Informational: observation without demonstrated security impact.

Critical and High block promotion.
