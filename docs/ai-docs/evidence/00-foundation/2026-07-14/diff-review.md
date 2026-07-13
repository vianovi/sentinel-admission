# Foundation Diff Review

## Intended changes

- Pure rename of the 45-file audit workspace from `docs-ai/docs/ai-docs/` to `docs/ai-docs/`.
- New Task 00 audit/evidence files.
- Durable state, queue, decisions, context, and release metadata.

## Excluded changes

- No application code.
- No migrations or schema.
- No Composer/npm manifest or lockfile.
- No environment or secret file.
- No generated build output.
- No production/deployment operation.

## Review result

- Whitespace check: to be rerun immediately before checkpoint commit.
- Rename/content review: expected audit documentation only.
- `main`: unchanged.
