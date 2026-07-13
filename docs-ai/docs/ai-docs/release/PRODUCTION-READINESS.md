# Production Readiness Checklist

## Code/tests

- [ ] All required slices PASS
- [ ] Full regression suite passes
- [ ] Frontend production build passes
- [ ] Route inventory passes
- [ ] Dependency audits reviewed
- [ ] No unresolved critical/high finding
- [ ] Release candidate working tree clean

## Data/migrations

- [ ] Migration plan reviewed
- [ ] Backup prerequisite documented
- [ ] Roll-forward/rollback implications documented
- [ ] Production data never used in tests
- [ ] Dynamic fee/payment integrity reviewed

## Runtime

- [ ] PHP/runtime/extensions match requirements
- [ ] Web root is `public`
- [ ] Storage/cache permissions planned
- [ ] `APP_DEBUG=false`
- [ ] Cache/optimize compatibility verified
- [ ] Worker/scheduler/reload plan documented
- [ ] Health check reviewed
- [ ] Logs/monitoring plan reviewed
- [ ] Secrets injection plan reviewed

## Security

- [ ] Authentication/session review
- [ ] Authorization/ownership review
- [ ] File upload/private storage review
- [ ] Payment/webhook review
- [ ] Exam integrity/leakage review
- [ ] Sensitive report/export review
- [ ] Error/log/secret review

## Human review

- [ ] Desktop visual review
- [ ] Mobile/responsive review where required
- [ ] Critical business flows reviewed
- [ ] Release candidate browser smoke test
- [ ] Deployment owner approval
- [ ] Rollback owner approval

## Final

- [ ] Explicit human approval to promote to `main`
