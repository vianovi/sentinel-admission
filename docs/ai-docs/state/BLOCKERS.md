# Audit Blockers

## B-001 — Public production content is unverified and contradictory

- ID: B-001
- Date: 2026-07-14
- Slice: 01 Public/shared runtime
- Severity: release-blocking business/content integrity
- State: open
- Evidence: `audit/01-public-shared-runtime/public-shared-runtime-audit.md` and `evidence/01-public-shared-runtime/2026-07-14/public-contract.md`
- Why autonomous progress is unsafe: The landing page is explicitly configured to publish placeholder third-party media and unrelated claims. Footer address/map/legal/brochure contracts conflict. The repository contains no authoritative approved values, and the auditor must not invent production data or silently remove owner-required content.
- Question requiring owner decision: Should the release candidate use an owner-supplied verified public-content manifest, or should all unverified showcase/contact/map/legal elements be removed/disabled until verified content is available?
- Safe options: (A) provide/identify approved address, map, contacts, social/legal URLs, brochure format, showcase assets, and claims; (B) authorize temporary removal/disabled states for every unverified element.
- Temporary containment: Do not promote Task 01 and do not deploy the current public landing surface.
- Next action after decision: Implement the chosen content boundary, fix the confirmed technical findings, add focused public tests, run build/regression, and reclassify Task 01.

## Template

- ID:
- Date:
- Slice:
- Severity:
- State:
- Evidence:
- Why autonomous progress is unsafe:
- Question requiring owner decision:
- Safe options:
- Temporary containment:
- Next action after decision:
