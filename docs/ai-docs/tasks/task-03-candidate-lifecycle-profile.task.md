# Task 03 — Candidate Lifecycle and Profile Data

## Scope

Audit candidate lifecycle, completion evaluators, feature gates, candidate/guardian/health data, conditional requirements, staff-visible status, and final-state protections.

## Audit focus

- `draft -> submitted -> verified -> accepted/rejected`;
- central source of truth;
- idempotency/demotion;
- observer/service loops;
- conditional guardian rules;
- health consistency;
- account verification separation;
- document/payment/exam gates;
- final-status protection;
- frontend props versus backend state;
- missing-requirement reporting;
- alternate event ordering.

Use actual project status names/rules.

## General constraints

- Verify actual source before relying on task hints.
- No schema, production dependency, business-policy, or production-operation change without authority.
- No visual approval claim.
- Store detailed evidence and update durable state.
- Apply all relevant release gates.
