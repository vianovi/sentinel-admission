# Audit Reports

Create one folder per slice:

```txt
audit/
├── 00-foundation/
├── 01-public-shared-runtime/
├── 02-auth-registration/
└── ...
```

Each report includes:

- scope/baseline commit;
- files audited;
- dependency map;
- findings by severity;
- fixes;
- tests/evidence;
- gate result;
- residual risks;
- human review requirements;
- classification.

Historical reports are evidence. Corrections must be appended or explicitly superseded.
