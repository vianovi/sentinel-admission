# Documentation and Context Policy

## Durable state

Chat history is not the source of truth.

Minimum resumable state:

- current task/slice;
- branch/worktree;
- baseline/latest commit;
- status/classification;
- blockers;
- last verification;
- uncommitted changes;
- next exact action.

Store it in `CURRENT.md` and `HANDOFF.md`.

## Update frequency

Update state:

- before a slice;
- after meaningful findings;
- before/after commits;
- after promotion;
- before stopping;
- near context limits.

## Writing rules

- Separate facts, inferences, assumptions, and decisions.
- Use file paths and symbols.
- Do not claim broader coverage than performed.
- Keep `CURRENT.md` short.
- Put detail in audit/evidence.
- Preserve superseded records in `archive/`.
- Use ISO dates.
- Never store secrets or production user data.

## Contradictions

When docs contradict code:

1. verify behavior;
2. record contradiction;
3. update durable docs if safe;
4. do not rewrite historical evidence;
5. stop if it reflects unresolved business policy.

Update existing project docs only when materially outdated; avoid duplicating the same fact across many files.
