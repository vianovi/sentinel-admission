# Diff Review

The change is scoped to email presentation, email brand configuration, the email PNG asset, tests, and durable audit evidence.

- No route, controller, auth flow, token, schema, migration, security policy, or business logic change was introduced.
- Shared Blade components prevent duplicated transactional HTML.
- Existing framework notifications are extended through presentation callbacks.
- Registration domain preflight and resend rate limiting are explicit delivery-safety changes; token and route semantics remain unchanged.
- The current manual staff approval behavior for change-email requests remains unchanged.
- `HUMAN VISUAL REVIEW REQUIRED` remains open for Gmail and Outlook.
