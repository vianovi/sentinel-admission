# Rollback Notes

Complete before production promotion.

## Release

- Release candidate SHA:
- Target main SHA:
- Deployment version/tag:
- Migration set:
- Asset build identifier:

## Rollback triggers

- authentication failure;
- broad authorization failure;
- payment status corruption;
- document exposure;
- exam integrity failure;
- migration/data integrity failure;
- severe runtime error rate;
- owner-defined threshold.

## Code rollback

- Previous known-good SHA:
- Revert/cherry-pick strategy:
- Asset rollback:
- Worker reload:
- Cache clear/rebuild:

## Database rollback

Complete only after reviewing actual migrations.

- Backup location/owner:
- Forward-fix preference:
- Reversible migrations:
- Irreversible migrations:
- Data restoration:
- Estimated impact:

## Post-rollback verification

- health route;
- authentication;
- candidate dashboard;
- file access;
- payment status;
- staff/admin access;
- logs/error rate.

The auditor does not execute production rollback.
