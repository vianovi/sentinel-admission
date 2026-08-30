# Slice Checklist — <Name>

## Scope

- [ ] Baseline recorded
- [ ] Dependency map complete
- [ ] Out-of-scope recorded

## Correctness

- [ ] Happy paths traced
- [ ] Failure paths traced
- [ ] State transitions traced
- [ ] Async/retry/idempotency reviewed
- [ ] Duplicate business logic reviewed

## Security

- [ ] Authentication
- [ ] Authorization/ownership
- [ ] Validation/output
- [ ] CSRF/session
- [ ] Sensitive data/logging
- [ ] Integration-specific controls

## Data integrity

- [ ] Writes/deletes
- [ ] Concurrency/idempotency
- [ ] Migration impact
- [ ] Rollback implications

## Verification

- [ ] Focused tests
- [ ] Regression tests
- [ ] Build
- [ ] Routes/config
- [ ] Dependency audit
- [ ] Diff review

## Documentation

- [ ] Audit report
- [ ] Evidence
- [ ] State
- [ ] Handoff
- [ ] Manifest

## Result

- [ ] PASS
- [ ] PASS WITH NOTES
- [ ] BLOCKED
- [ ] FAILED
- [ ] HUMAN VISUAL REVIEW REQUIRED
