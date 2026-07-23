# Test Evidence

## Focused design-system tests

`tests/Feature/EmailDesignSystemTest.php`

- Verification email renders the shared HTML/plain-text design, brand, CTA, panels, placeholders, and website.
- Password reset email renders the same system and retains the reset token in the action URL.
- Recipient name is escaped in the HTML output.
- Result: 3 passed, 23 assertions.

## Existing mail delivery tests

`tests/Feature/EnvironmentMailDeliveryTest.php`

- Registration verification recipient remains the validated stored email.
- Verification resend still uses the default mailer and signed route.
- Password reset still targets the stored account email and remains enumeration-safe.
- Delivery failure handling and logging behavior remain unchanged.
- Manual email-change approval path still dispatches no notification.
- Result: 13 passed, 70 assertions.

## Full suite

- Result: 74 passed, 603 assertions.
- No unrelated regression was observed in candidate gates, lifecycle, exam, registration security, staff operations, or status flows.
