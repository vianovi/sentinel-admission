# Public and Shared Runtime Audit — Partial

- Date: 2026-07-14
- Branch/worktree: `audit/01-public-shared-runtime` / `/home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission`
- Slice baseline: `e4373dff71c86cafa516602ce093b9252b4dc443`
- Status: stopped during audit on mandatory business-content decision
- Release candidate promotion: none

## Scope inspected

- Public routes in `routes/web.php`.
- `WelcomeController` landing props and private showcase media route.
- Inertia middleware/global props, Laravel boot/provider configuration, root Blade shell, and error response customization.
- Landing page composition, shared types, navbar/footer/hero/video/cinematic components, public assets, Vite/Tailwind build configuration, and Apache `.htaccess` behavior.
- Existing tests and history relevant to the public surface.

Not completed because of blocker B-001:

- remaining landing/shared components and complete action/asset inventory;
- focused public-route, prop, media, and JSON-error tests;
- safe fixes and regression/build verification;
- final self-review and release-gate classification.

## Dependency map

- `/` queries the active `AdmissionWave`, passes an explicit prop subset through Inertia, and renders `Pages/Landing/Welcome.tsx`.
- The landing page depends on global `auth` and `app` props from `HandleInertiaRequests`, the root Blade shell, static assets, remote fonts/icons/maps, and remote placeholder showcase media.
- `/media/gallery/{filename}` exposes a whitelist-constrained public response from the private cinematic media directory when the component is configured for local media.
- Registration/login/dashboard links cross into Tasks 02 and later role slices.
- Active-wave quota display depends on the candidate status rule in `AdmissionWave::totalFilled()`.
- Midtrans Snap inclusion in the shared Blade shell belongs to Task 05 payment configuration review.
- Proxy/security-header/deployment enforcement crosses into Task 10.

## Confirmed findings

### Critical

None confirmed in the inspected subset.

### High

None assigned before the mandatory stop. Public truthfulness and external-content integrity remain unclassifiable without the owner decision.

### Medium

#### PUB-001 — Production-facing showcase is hard-coded to placeholder third-party content — blocker B-001

`CinematicShowcase.tsx` sets `SHOWCASE_MEDIA_CONFIG.source` to `placeholder`. It loads images from Picsum and videos from an MDN example host, while displaying unrelated/unverified claims such as university/industry facilities, 500+ company partners, 98% satisfaction, and campus/student content. The configured CDN is also `cdn.example.com`; the local private media directory has no tracked release asset manifest.

This is code-detectable placeholder content, not a visual-quality judgment. It must not be represented as verified school content in a production candidate.

#### PUB-002 — Public contact/location/legal content is contradictory or nonfunctional — blocker B-001

`Footer.tsx` displays a “Kota Ilmu, Jawa Tengah” address but embeds a Google map explicitly targeting `Istana Negara` in Jakarta. Its “open map” URL leads only to the generic Google Maps home page. Privacy and terms actions use `href="#"` and have no routes. Contact/social destinations and institutional claims have no verified repository content manifest.

The auditor cannot infer or invent the correct institution address, map, legal URLs, contacts, or social accounts.

#### PUB-003 — Shared runtime reads environment variables outside configuration

`HandleInertiaRequests` calls `env()` for `APP_TAGLINE` and `APP_LOGO`, and `AppServiceProvider` calls `env()` for `FORCE_HTTPS`. After Laravel configuration caching, `.env` is not loaded and application code should consume configuration values. The Task 00 synthetic optimize passed only because these variables were injected into the process environment. A safe code fix is expected after B-001 is resolved.

#### PUB-004 — Public quota count conflicts with the centralized filled-seat rule

`WelcomeController` uses an unfiltered `withCount('candidates')`, while `AdmissionWave::totalFilled()` explicitly excludes `draft` candidates because drafts do not occupy quota. `TopBar` and `WaveCard` calculate remaining seats from the unfiltered public count. A focused regression test and reuse of the model rule are required.

### Low

#### PUB-005 — Non-HTML 404 responses are replaced with an Inertia page

The global exception responder renders `Errors/NotFound` for every 404 without preserving JSON content negotiation. A JSON client can therefore receive an HTML/Inertia response. This requires a focused regression and an `expectsJson()` guard.

#### PUB-006 — Stable public assets receive immutable one-year caching

`public/.htaccess` applies a one-year immutable cache policy to non-fingerprinted landing images, video, and brochure paths as well as Vite assets. Content replacement at a stable path can remain stale for a year. Hashed build assets and stable editorial media require distinct cache policies.

#### PUB-007 — Brochure contract is internally inconsistent

The footer links to `brosur.jpg` but sets a `.pdf` download name, PDF icon, PDF action copy, and PDF accessibility label. Both JPG and PDF are tracked; the intended published format must be confirmed with B-001 or the UI must be made consistent with the approved target.

### Informational

- The root Blade shell loads Google Fonts and Font Awesome from third-party origins without SRI/CSP. A production header/CSP decision belongs to Task 10.
- The shared Blade shell always uses the Midtrans sandbox script URL on the payment page even when `MIDTRANS_IS_PRODUCTION` is true. Task 05 must verify and fix the environment-specific gateway script contract without changing payment policy silently.
- The global TypeScript `PageProps` declares `auth.user` as non-null even though public/auth responses provide `null`; guarded landing usage works, but the shared contract is inaccurate.
- The tracked profile video is approximately 55 MB but is conditionally rendered with `preload="none"`; performance acceptance remains pending.
- Landing SEO metadata is generated client-side without an SSR setup, and Open Graph image values are relative. Search-engine/social-preview behavior is not proven.
- `.htaccess` includes baseline `nosniff`, frame-deny, and referrer-policy headers when Apache permits overrides; other production web servers would need equivalent configuration.

## Changes made

- Durable Task 01 state, blocker, partial audit, and evidence only.
- No application source, public content, schema, dependency, configuration policy, or production environment was changed.

## Verification available

- Inherited Task 00 baseline at the slice start: 71 tests/580 assertions, 183 routes, production frontend build, advisory checks, isolated migrations, and synthetic optimize passed.
- No Task 01 focused tests or post-fix build were run because the mandatory content/business stop occurred before editing.

## Release gates

| Gate | Result | Evidence |
|---|---|---|
| G0 Scope/dependency | PASS for inspected subset | Map above and Task 00 evidence |
| G1 Architecture/correctness | BLOCKED | PUB-001/PUB-002 require verified content decision; other findings remain unfixed |
| G2 Test/build | INCOMPLETE | Baseline passes; focused Task 01 tests not yet added/run |
| G3 Security | INCOMPLETE | Public external dependencies/header/error behavior partially reviewed |
| G4 Data integrity | INCOMPLETE | Active-wave quota contradiction identified; focused proof/fix pending |
| G5 Production configuration | INCOMPLETE | Config-cache and public asset policy findings pending |
| G6 Evidence/documentation | PASS for blocked checkpoint | Audit, evidence, blocker, state, handoff updated |
| G7 Human review | REQUIRED | `HUMAN VISUAL REVIEW REQUIRED`; cannot resolve source-content truth |

## Classification

`BLOCKED`. Task 01 is not eligible for release-candidate promotion.
