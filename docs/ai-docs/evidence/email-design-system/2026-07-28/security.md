# Security Evidence

- Laravel `VerifyEmail` and `ResetPassword` notification classes remain in use.
- Verification signing, password reset token generation, routes, throttles, and security responses are unchanged.
- `MAIL_FROM_ADDRESS` remains the address; `MAIL_FROM_NAME` is applied as the sender display name.
- Verification resend is limited to one attempt per ten minutes per account and ten attempts per minute per IP.
- Domains without MX/A/AAAA records are rejected before registration draft persistence when `EMAIL_VALIDATE_MX=true`.
- Registration delivery failures are caught and surfaced to the dashboard without exposing transport details.
- Dynamic content and action URLs are escaped in Blade.
- No secrets, tokens, passwords, private records, schema, or security policy were persisted in evidence.

Residual risk: remote image loading, client rendering, link scanning, and SMTP deliverability require manual Gmail/Outlook and target-environment verification.
