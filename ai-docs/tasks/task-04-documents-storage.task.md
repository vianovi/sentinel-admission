# Task 04 — Documents, Uploads, and Private Storage

## Scope

Audit candidate uploads, health/BPJS files, staff/admin preview/verification, rejection/deletion, private storage, download authorization, and retention.

## Audit focus

- extension/MIME/magic-byte checks;
- size/count limits;
- filename/path safety;
- private storage/public exposure;
- ownership/role checks on every preview/download;
- required/conditional documents;
- upload/delete/review lifecycle sync;
- rejection/resubmission;
- orphan files;
- sanitized errors/safe logs;
- malicious/polyglot defenses supported by the project;
- IDOR/unsupported-file tests.

Do not test public infrastructure unsafely.

## General constraints

- Verify actual source before relying on task hints.
- No schema, production dependency, business-policy, or production-operation change without authority.
- No visual approval claim.
- Store detailed evidence and update durable state.
- Apply all relevant release gates.
