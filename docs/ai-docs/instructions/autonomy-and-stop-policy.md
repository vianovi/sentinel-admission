# Autonomy and Stop Policy

## Execution mode

Read `state/CURRENT.md`.

Supported modes:

- `autonomous_until_blocker`
- `one_slice_per_run`
- `checkpoint_each_slice`

Initial default: `autonomous_until_blocker`.

## Continue autonomously when

- scope is supported by source evidence;
- no policy decision is required;
- changes are reversible;
- relevant tests can run;
- no secret or production access is needed;
- Git operations are safe;
- release gates can be evaluated.

## Mandatory stop conditions

Stop, update state, create a blocker, and ask one focused question when:

- working tree is unexpectedly dirty;
- branch ancestry is ambiguous enough to risk loss;
- a schema change is required but not authorized;
- a production dependency is required but not authorized;
- business policy is contradictory or missing;
- payment/financial behavior would change;
- authentication or authorization policy would change;
- original user data could be modified or lost;
- a secret is required or exposed;
- a destructive Git operation appears necessary;
- a required test cannot run;
- a release gate cannot be proven;
- a merge/cherry-pick conflict is not mechanically safe;
- visual judgment is required;
- only production can prove the finding;
- context is near exhaustion and state is not safely persisted.

## Context exhaustion procedure

Before stopping:

1. Finish or revert the current atomic edit.
2. Run the smallest relevant check.
3. Update `CURRENT.md`.
4. Update `HANDOFF.md`.
5. Record uncommitted state.
6. Record the next exact action.
7. Do not claim the slice complete.

## Background execution

Do not simulate rest by sleeping inside reasoning.

For background execution, process durable work units and rely on state files. A fresh run must resume from `CURRENT.md` and `HANDOFF.md`.

## Questions

Ask only questions that change safety, business policy, schema, dependencies, or release decisions. Resolve routine implementation details from source conventions.
