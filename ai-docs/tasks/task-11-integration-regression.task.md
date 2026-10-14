# Task 11 — Full Integration Regression and Release Candidate

## Scope

Validate the integrated release candidate after required slices pass.

## Minimum flow matrix

- registration/authentication;
- email verification boundaries;
- candidate core completion;
- document upload/review;
- dynamic payment creation/status;
- candidate verification;
- exam assignment/start/autosave/submit/result;
- staff operations;
- admin configuration;
- reports/status aggregation;
- authorization denial;
- error/recovery paths.

## Required checks

- full feature suite;
- focused security suites;
- frontend production build;
- routes;
- dependency audits;
- optimization/cache compatibility;
- migration plan/pretend or isolated test migration;
- evidence completeness;
- manifest consistency;
- rollback notes;
- human visual review checklist.

Do not merge to `main`. End with release candidate and owner review instructions.

## General constraints

- Verify actual source before relying on task hints.
- No schema, production dependency, business-policy, or production-operation change without authority.
- No visual approval claim.
- Store detailed evidence and update durable state.
- Apply all relevant release gates.
