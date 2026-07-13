# Environment-Aware Email Delivery

## Scope and architecture

Sentinel Admission continues to use Laravel's standard mail and notification architecture. No controller, notification, or service selects a provider directly. `MAIL_MAILER` and the SMTP values in the active environment determine the transport for every existing email flow.

| Operating mode | Source environment file | Transport | Delivery target | Queue |
|---|---|---|---|---|
| Development | `.env.local` | Mailtrap Email Sandbox SMTP | Captured by the sandbox; never delivered to the real recipient | `sync` |
| Demo | `.env.tunnel` | Resend SMTP | Real recipient from application data | `sync` |
| Initial production | Server-managed `.env` | Resend SMTP | Real recipient from application data | `sync` initially |
| Automated tests | `phpunit.xml` | Laravel `array` mailer | No external delivery | `sync` |

The Fish functions select development and demo by copying `.env.local` or `.env.tunnel` to `.env`, then clearing Laravel caches. `dev-mode` refuses to activate unless the source file uses an HTTP local URL and Mailtrap Sandbox. `demo-mode` refuses to activate unless the source file uses HTTPS, Resend SMTP, and a non-empty Resend API key. The tracked `.env.example`, `.env.tunnel.example`, and `.env.production.example` files are safe templates only. Actual environment files remain ignored by Git.

## Development: Mailtrap Email Sandbox

Use the SMTP credentials from the Integration tab of the intended Mailtrap sandbox:

```dotenv
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8080
QUEUE_CONNECTION=sync

MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_ENCRYPTION=tls
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-sandbox-username
MAIL_PASSWORD=your-mailtrap-sandbox-password
MAIL_TIMEOUT=10
MAIL_FROM_ADDRESS="noreply@sentinel-admission.test"
MAIL_FROM_NAME="${APP_NAME}"
```

Mailtrap Email Sandbox captures outbound messages instead of delivering them to the destination mailbox. This is the development safety boundary. Mailtrap documents port `2525` with STARTTLS as the recommended compatible sandbox configuration: <https://docs.mailtrap.io/email-sandbox/setup>.

## Demo and initial production: Resend SMTP

Demo and initial production use Laravel's existing SMTP transport; no Resend SDK is required:

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_ENCRYPTION=tls
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=your-resend-api-key
MAIL_TIMEOUT=10
MAIL_FROM_ADDRESS="noreply@mail.your-verified-domain.example"
MAIL_FROM_NAME="${APP_NAME}"
```

Port `587` uses STARTTLS. `config/mail.php` maps `MAIL_ENCRYPTION=tls` to Symfony Mailer's `require_tls` SMTP option, so a plaintext SMTP session is not accepted. Resend's current SMTP reference lists `smtp.resend.com`, username `resend`, an API key as the password, and port `587` for STARTTLS: <https://resend.com/docs/send-with-smtp>.

Before enabling real delivery:

1. Add a domain or dedicated sending subdomain in Resend.
2. Publish the exact SPF and DKIM DNS records shown by Resend.
3. Wait until the sending domain is shown as verified.
4. Set `MAIL_FROM_ADDRESS` to an address under that verified domain.
5. Create a restricted Resend API key and store it only in the real `.env`/secret manager.
6. Consider adding DMARC after SPF and DKIM are stable.

Resend recommends a subdomain to isolate sending reputation and requires SPF and DKIM for domain verification: <https://resend.com/docs/dashboard/domains/introduction>. The example sender is deliberately a placeholder; it must not be used until the matching domain has been verified.

## Demo URL and synchronous delivery

Demo must use its public HTTPS origin in `APP_URL`, for example:

```dotenv
APP_ENV=demo
APP_DEBUG=false
APP_URL=https://demo.example.com
SESSION_SECURE_COOKIE=true
FORCE_HTTPS=true
QUEUE_CONNECTION=sync
```

Do not place the real tunnel hostname in mail templates or PHP source. Laravel's built-in password-reset and email-verification notifications generate routes through the URL generator. During an HTTP request the trusted proxy headers provide the public HTTPS origin; `APP_URL` is the canonical fallback for console or worker-generated URLs.

The current notifications do not implement `ShouldQueue`, so they are sent synchronously today even if another application queue connection is configured. Demo and initial production templates explicitly use `QUEUE_CONNECTION=sync` to prevent a future queued mail notification from waiting for a worker that demo mode does not start. A managed queue worker may be introduced later, with an explicit deployment and monitoring strategy.

## Existing email flows

| Flow | Current Laravel mechanism | Recipient |
|---|---|---|
| Registration | `Registered` event and Laravel email-verification notification | Newly created user's validated draft email |
| Resend verification | `sendEmailVerificationNotification()` | Authenticated user's stored email |
| Password reset | Laravel password broker and reset notification | Stored email of the resolved account |

Login sends no email. There are currently no implemented candidate status or staff/admin-triggered mail senders. Candidate email-change requests remain a manual staff/admin approval flow and do not gain a new email step in this task.

No notification forces a named mailer, sender, or fixed recipient. The global sender comes from `MAIL_FROM_ADDRESS`/`MAIL_FROM_NAME`; recipients come from validated application records.

## Failure and validation behavior

- Registration, reset-password, and email-change inputs use server-side RFC email syntax validation.
- Registration revalidates the draft email and uniqueness immediately before account creation.
- Transport/configuration exceptions are logged internally with a generic user-facing message.
- Successful UI copy says the message was sent and asks the user to check inbox and spam; it does not guarantee inbox delivery.
- Password reset uses the same generic response for registered, unregistered, throttled, and transport-failure cases to avoid account enumeration. The wording confirms only that the request was processed, not that inbox delivery is guaranteed.
- Registration continues safely when its first verification send fails and directs the candidate to the existing resend path.
- SMTP acceptance does not prove mailbox existence or inbox placement. No unreliable mailbox probing is performed.

## Secret handling and cache refresh

Never commit `.env`, `.env.local`, `.env.tunnel`, `.env.production`, Mailtrap credentials, or Resend API keys. After changing the active environment, clear cached configuration:

```bash
docker compose exec app php artisan config:clear
docker compose exec app php artisan route:clear
docker compose exec app php artisan view:clear
docker compose exec app php artisan cache:clear
```

Inspect configuration without exposing secrets:

```bash
docker compose exec app php artisan about --only=environment
docker compose exec app php artisan tinker
```

Then inspect only non-secret values in Tinker:

```php
config('app.url');
config('mail.default');
config('mail.mailers.smtp.host');
config('mail.mailers.smtp.port');
config('mail.mailers.smtp.require_tls');
config('mail.from.address');
config('queue.default');
```

Do not dump the entire mail configuration because it contains the SMTP password.

## Controlled manual delivery test

Automated tests never send external email. Perform one real demo delivery only after the Resend domain is verified, the API key and sender are installed, cached configuration is cleared, and the chosen recipient explicitly consents. Use the application's normal registration, verification-resend, or password-reset UI rather than an arbitrary hardcoded recipient.

Confirm all of the following:

- the Resend dashboard records the send;
- the real destination address matches the candidate/user account;
- the From address uses the verified domain;
- the action URL starts with the demo HTTPS origin;
- the message appears in inbox or spam;
- Laravel logs contain no transport failure.

Do not report real delivery unless this controlled test was actually completed.

## Deferred production enhancement

Bounce/complaint webhook tracking, suppression management, DMARC enforcement tuning, and a monitored background queue are intentionally deferred. They require operational ownership and, for bounce state, likely persistence/schema decisions beyond this task.
