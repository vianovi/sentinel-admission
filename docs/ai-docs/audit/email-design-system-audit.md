# Audit Email Design System — Sentinel Admission

## Scope

- Slice: Email Design System, presentation-only.
- Branch: `feature/email-design-system`.
- Date: 2026-07-28.
- Entry points: Laravel verification/password reset notification callbacks, `EmailDesignSystem`, mail configuration, shared Blade components, email tests, and public brand assets.
- Out of scope: authentication redesign, verification/reset token generation, routes, database/schema, business policy, email-change workflow behavior, production infrastructure, and frontend application code.

## Architecture finding

Framework notification classes `VerifyEmail` dan `ResetPassword` tetap dipakai. `AppServiceProvider` hanya mengarahkan presentation melalui callback. `EmailDesignSystem` mengembalikan `MailMessage` dengan HTML dan plain-text view yang sama untuk semua transactional email.

Blade system terpisah menjadi layout, header, footer, button, panel, transactional HTML, dan transactional text. Konfigurasi brand dipusatkan di `config/email.php`, termasuk PNG logo khusus email, program, tahun ajaran, kontak, website, dan copyright.

## Findings and disposition

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| EMAIL-001 | Medium | Verification dan password reset memakai presentasi generic/framework. | Fixed dengan shared layout dan callback framework. |
| EMAIL-002 | Low | Tidak ada surface transactional reusable untuk future notifications. | Fixed dengan `EmailDesignSystem` dan Blade components. |
| EMAIL-003 | Informational | Email-change approval belum mengirim notifikasi. | Sengaja tidak diubah agar business behavior tetap sama. |
| EMAIL-004 | Low | Logo WebP berisiko tidak tampil konsisten pada email client. | Fixed dengan asset PNG khusus `/assets/icons/brand/logo-email.png`; remote image loading tetap perlu diuji manual. |

## Security and compatibility review

- Verification class, signed URL, reset class, token, route, throttle, dan controller tetap memakai flow yang sama.
- `MailMessage` menggunakan alamat dari `MAIL_FROM_ADDRESS` dan nama dari `MAIL_FROM_NAME`/`APP_NAME` fallback.
- Dynamic content dan URL di-escape oleh Blade.
- HTML memakai table layout, inline styles, CTA table-backed, fixed PNG dimensions, responsive media rules, dan plain-text alternative.
- Logo tetap merupakan asset HTTPS publik sehingga Gmail/Outlook dapat memblokirnya sesuai kebijakan gambar client.
- Tidak ada secret, token, password, PII, schema, atau security policy yang ditulis oleh perubahan ini.

## Self-audit result

- Tidak ada transactional layout duplikat.
- Tidak ada default Laravel mail template pada application mail scope.
- Palette dan spacing konsisten di shared components.
- CTA memiliki label, signed/reset URL tetap dipakai, dan fallback URL tersedia.
- Footer memuat WhatsApp, placeholder email, website, dan copyright.
- Plain text dan HTML keduanya menampilkan struktur inti yang sama.

## Classification

`PASS WITH NOTES` untuk code verification, dengan `HUMAN VISUAL REVIEW REQUIRED` di Gmail dan Outlook.
