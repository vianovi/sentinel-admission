# Task 09 — Reporting and Export

## Scope

Audit report summaries, candidate status aggregation, payment/selection reports, export placeholders, and any implemented export generator.

## Audit focus

- query correctness/aggregation;
- pagination/memory behavior;
- filter consistency;
- role authorization;
- sensitive versus non-sensitive formats;
- approved column definitions;
- spreadsheet injection prevention;
- private temporary files;
- filename/content type;
- large-export strategy;
- data minimization;
- disabled placeholders must not imply working actions;
- no leakage through props/URLs.

Do not activate full sensitive export without approved format/access policy.

## General constraints

- Verify actual source before relying on task hints.
- No schema, production dependency, business-policy, or production-operation change without authority.
- No visual approval claim.
- Store detailed evidence and update durable state.
- Apply all relevant release gates.
