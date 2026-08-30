# Task 01 — Shared Runtime, Public Surface, and Frontend Code

## Scope

Audit shared application boot/runtime and public routes/pages, including landing/home and shared frontend shell used by public/auth flows.

## Audit focus

- route exposure/middleware;
- server/client contracts;
- public data leakage;
- shared layouts/components;
- dead actions/broken links;
- code-detectable error/loading/empty states;
- asset/build configuration;
- code-detectable accessibility;
- SEO/meta/security exposure where implemented;
- shared service duplication;
- production build;
- no visual-quality claim.

## Tests

Use existing feature tests and add focused coverage for critical public routes, safe props, and broken action regressions.

Mark affected pages `HUMAN VISUAL REVIEW REQUIRED`.

## General constraints

- Verify actual source before relying on task hints.
- No schema, production dependency, business-policy, or production-operation change without authority.
- No visual approval claim.
- Store detailed evidence and update durable state.
- Apply all relevant release gates.
