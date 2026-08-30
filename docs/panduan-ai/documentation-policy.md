# Documentation & Evidence Policy

## 1. Durable State Over Ephemeral Context
- Chat logs are transient; the file system is the single source of truth.
- Audit progress and coordinates must be persisted in `docs/state-aktif/CURRENT.md` and `docs/state-aktif/HANDOFF.md`.

## 2. Evidence Requirements Per Audit Slice
For every completed audit slice, record verifiable evidence under `docs/laporan-audit/evidence/<slice-name>/<date>/`:
- **Environment & Commit:** Branch, baseline commit, and head commit.
- **Commands Executed:** Exact CLI commands with exit codes and execution summaries.
- **Verification Outputs:** Test assertion totals (`Tests: X passed (Y assertions)`), Vite build outputs, and route lists.
- **Findings Log:** Standard findings schema with file references and verification statuses.

## 3. Privacy & Sanitization Rules
- **No Secrets:** Never commit `.env` contents, API keys, private tokens, or webhooks secrets.
- **No Real User PII:** Use synthetic fixtures or obfuscated hashes for logs.
- **No Bloat Logs:** Do not store massive multi-megabyte log files; store command inputs and concise summaries.

## 4. Discrepancy Resolution Protocol
When code and documentation contradict:
1. Ground truth belongs to executable code and test assertions.
2. Record the discrepancy in `docs/state-aktif/DECISIONS.md`.
3. Update outdated documentation to match current reality.
4. Stop and escalate if the contradiction reflects unresolved business logic or policy.
