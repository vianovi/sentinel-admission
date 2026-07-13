# Evidence Policy

## Purpose

Evidence must let another engineer reproduce conclusions without relying on confidence.

## Required per slice

- repository commit/branch;
- timestamp;
- scope/dependency map;
- files inspected;
- commands executed;
- exit status or result summary;
- tests/assertion counts when available;
- route/build/dependency results;
- confirmed findings with file references;
- fixes/commit hashes;
- residual risks;
- classification/gate outcome.

## Storage

```txt
docs/ai-docs/evidence/<slice>/<YYYY-MM-DD>/
```

Suggested files:

- `evidence-index.md`
- `commands.md`
- `tests.md`
- `routes.md`
- `build.md`
- `security.md`
- `diff-review.md`

## Privacy

Never store:

- `.env` contents;
- keys/tokens/passwords;
- private certificates;
- full sensitive user records;
- raw sensitive payment payloads;
- production database dumps.

Redact sensitive values. Record safe metadata, hashes, counts, or synthetic examples.

## Integrity

Do not rewrite failed commands as successful. Preserve failure summaries and record reruns after fixes.

## Economy

Do not commit huge logs. Capture commands, relevant summaries, and local log locations.
