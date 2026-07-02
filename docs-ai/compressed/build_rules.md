# Build Rules & Performance Guidelines
> Global build/performance rules for this Laravel + Inertia + React project.
> Read this when adding pages, changing assets, importing libraries, tuning Vite/Tailwind, or touching frontend delivery.

---

## Purpose

This file is not a feature map. It is a global rulebook for keeping the application fast, stable, and maintainable.

Feature-specific architecture belongs in project/feature docs. Build rules here should apply across landing pages, auth/admission pages, and dashboards.

---

## 1. Build Source Of Truth

Check these before changing build behavior:

```txt
vite.config.js
tailwind.config.js
resources/views/app.blade.php
resources/js/app.tsx
resources/css/app.css
package.json
```

Current baseline:

```txt
Backend/bridge: Laravel 12 + Inertia.js v2
Frontend: React 18 + TypeScript
Styling: Tailwind CSS 3
Bundler: Vite 7
Vite input: resources/css/app.css + resources/js/app.tsx
```

Rules:

```txt
Do not introduce a second bundler/build pipeline without explicit approval.
Keep Vite entrypoints minimal.
Add manual chunks only for libraries with real cache/performance benefit.
Do not change Tailwind content scanning without checking generated CSS impact.
```

---

## 2. Images & Media

### Above The Fold

Any image that is likely to become LCP must be eager and high priority.

```tsx
<picture>
    <source media="(max-width: 768px)" srcSet="/assets/path/hero-mobile.webp" type="image/webp" />
    <source media="(min-width: 769px)" srcSet="/assets/path/hero-desktop.webp" type="image/webp" />
    <img
        src="/assets/path/hero-desktop.webp"
        alt="Descriptive alt text"
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="h-full w-full object-cover"
    />
</picture>
```

If the page owns the LCP image, preload it through Inertia `<Head>`.

```tsx
<Head title="Page Title">
    <link
        rel="preload"
        as="image"
        href="/assets/path/hero-desktop.webp"
        fetchPriority="high"
    />
</Head>
```

Use React prop casing in TSX: `fetchPriority`, not `fetchpriority`.

### Below The Fold

Images below the first viewport should be lazy and async.

```tsx
<img
    src="/assets/path/image.webp"
    alt="Descriptive alt text"
    loading="lazy"
    decoding="async"
/>
```

### Format Rules

| Asset | Preferred Format |
|---|---|
| Photos / complex raster images | WebP |
| Simple icons | Existing icon font/class system or inline SVG when needed |
| Favicons / app icons | Existing favicon formats are allowed |
| User documents/templates | Keep required original formats such as PDF, DOCX, XLSX |

Size guidance:

```txt
Hero desktop: <= 1920px wide
Hero mobile: <= 768px wide
Cards/gallery: close to rendered dimensions
Large decorative assets: avoid if they do not carry meaning
```

Video rules:

```txt
Do not eager-load video unless it is essential to the first viewport.
Use preload="none" for modal/user-triggered video.
Use preload="metadata" only when duration/thumbnail metadata is useful.
```

---

## 3. External Resources & Third-Party Scripts

External fonts/CDNs should use connection hints where appropriate:

```html
<link rel="preconnect" href="https://example-cdn.com">
<link rel="dns-prefetch" href="//example-cdn.com">
```

Font rules:

```txt
Use display=swap for web fonts.
Avoid adding additional font families unless the design system requires it.
Do not block first render with icon/font stylesheets when async loading is practical.
Keep noscript fallback when async stylesheet loading is used.
```

Third-party script rules:

```txt
Load scripts only on pages that use them.
Never place transactional, analytics, chat, map, embed, or verification scripts globally by default.
Keep API/client keys in config/env-backed templates, never hardcoded in React.
If a script is only needed after user action, prefer loading it on demand.
```

---

## 4. Code Splitting & Lazy Loading

Lazy-load expensive UI, not tiny always-visible components.

Good lazy-load candidates:

```txt
charts and visualizations
large data tables
rich editors
file/PDF/image preview modals
calendar, scheduler, or timeline widgets
wizard steps that are not immediately shown
inactive dashboard tabs
rarely opened modals or drawers
operations tools that are not part of first paint
```

Use `lazy` + `Suspense` with a stable fallback that preserves layout size.

```tsx
import { lazy, Suspense } from "react";

const HeavyPanel = lazy(() => import("@/Components/Feature/HeavyPanel"));

<Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-content-muted" />}>
    <HeavyPanel />
</Suspense>
```

Rules:

```txt
Fallbacks must not cause layout shift.
Do not lazy-load core shell components that appear on every dashboard page.
Do not split so aggressively that normal workflows feel slower.
Prefer route/page-level split points and heavy component split points.
```

---

## 5. Data Fetching & Payload Size

Backend controllers should send only the data needed by the rendered page.

```php
return Inertia::render('Feature/Index', [
    'items' => ItemResource::collection($query->paginate(15)),
    'filters' => $request->only(['search', 'status']),
]);
```

Rules:

```txt
Use backend pagination for growing datasets.
Use backend search/filter/sort for operational lists.
Avoid sending entire model graphs to Inertia.
Avoid loading all rows just to count/filter client-side.
Use resources/arrays to shape payloads deliberately.
Keep sensitive/internal fields out of frontend props.
```

For filter interactions:

```tsx
router.get(route("feature.index"), filters, {
    preserveState: true,
    preserveScroll: true,
});
```

---

## 6. Heavy UI Components

### Charts

Charts should live in isolated components and receive compact prepared data.

```tsx
<div className="h-[260px]">
    <ResponsiveContainer width="100%" height="100%">
        {/* chart */}
    </ResponsiveContainer>
</div>
```

Rules:

```txt
Give charts fixed/min heights.
Avoid rendering large raw datasets directly in chart props.
Lazy-load dashboard charts unless they are small and immediately important.
Keep empty/loading states visually stable.
```

### Tables

Rules:

```txt
Backend pagination first.
Stable columns and row heights where practical.
Avoid rendering thousands of rows in React.
Use empty/loading/error states that do not resize the whole layout unexpectedly.
```

### File & Document Preview

Rules:

```txt
Render preview UI only when requested.
Fetch protected files through secure preview/download routes.
Do not expose storage paths directly.
Throttle sensitive preview/download endpoints.
Prefer modal/overlay rendering that unmounts after close.
```

### Complex Widgets

Rules:

```txt
Keep widget-specific libraries inside widget-specific components.
Do not import heavy libraries into shared layouts.
Keep event/item payloads compact.
Render modals/popovers conditionally.
```

---

## 7. Transactional & Time-Sensitive Flows

For workflows that involve transactions, submissions, verification, timed sessions, uploads, assessments, or irreversible actions:

```txt
Preserve layout stability during loading/saving.
Show clear pending/success/failure states without exposing technical errors.
Avoid duplicate submissions with disabled/pending states.
Persist or sync state incrementally when data loss would hurt users.
Do not depend only on frontend timers or frontend validation.
Keep backend authorization and validation as the source of truth.
```

---

## 8. Animation

Use CSS transitions for simple interactions:

```txt
hover
focus
toggle
small opacity/transform changes
```

Use animation libraries only for higher-value motion:

```txt
page/section entrance when it improves perception
modal entrance/exit
wizard transitions
global progress indicators
cinematic landing moments
```

Rules:

```txt
Do not animate hundreds of elements on mount.
Prefer scoped refs/selectors over broad global selectors.
Avoid running animation repeatedly on every render.
Animation must not cause content overlap or layout instability.
For below-fold animation-heavy sections, consider dynamic import.
```

---

## 9. CSS, Tailwind & Layout Stability

Tailwind rules:

```txt
Dark mode classes must be literal static strings.
Do not build class names dynamically, especially `dark:${value}`.
Use existing CSS variables/design tokens before adding new ones.
Avoid introducing one-off palette systems.
Do not put large amounts of generated class text in runtime strings.
```

Layout rules:

```txt
Use fixed/min dimensions for controls, counters, grids, tabs, and icon buttons.
Avoid text overflow inside buttons/cards.
Use responsive constraints instead of viewport-scaled font sizes.
Keep dashboard screens dense and operational, not landing-page styled.
Do not nest cards inside cards unless the existing design system clearly does so.
```

---

## 10. Folder & Ownership Rules

General structure:

```txt
resources/js/
├── Components/
│   ├── Landing/
│   ├── Dashboard/
│   ├── UI/
│   └── Wizard/
├── Layouts/
└── Pages/
```

Rules:

```txt
Pages are orchestration boundaries.
Business/UI details live in domain components, hooks, services, or backend classes.
Shared layout should not import feature-heavy libraries.
Reusable UI components must stay small and dependency-light.
Avoid moving feature-specific code into global/shared folders prematurely.
```

---

## 11. Build & Verification

Use the smallest verification that proves the change:

| Change Type | Minimum Check |
|---|---|
| Docs only | No build required; run text sanity checks if useful |
| TS/React UI | `npm run build` |
| Lint-only cleanup | `npm run lint`; build if behavior changed |
| Backend logic | Focused Pest/PHPUnit test |
| Routes/controllers | `php artisan route:list` or focused feature test |
| Security/upload/transactional/time-sensitive flow | Focused feature/security test, then broader regression if needed |

In demo/public mode, prefer the established build/deploy flow instead of a dev server.

---

## 12. Pre-Push Checklist

```txt
[ ] LCP image eager/high-priority only when truly above the fold
[ ] Below-fold images lazy + async
[ ] Third-party scripts are page-scoped or on-demand
[ ] Controller payload is minimal and shaped
[ ] Growing datasets use backend pagination/filtering
[ ] Heavy UI is lazy-loaded or conditionally rendered
[ ] Layout dimensions are stable on mobile and desktop
[ ] Dark mode classes are static
[ ] Sensitive files/routes do not expose internals
[ ] Transactional flows handle pending/error/success safely
[ ] Required build/tests were run or explicitly skipped with reason
```

---

## 13. Performance Targets

Use these as targets, not as a reason to fake metrics:

| Metric | Mobile | Desktop |
|---|---:|---:|
| Performance | >= 80 | >= 90 |
| Accessibility | >= 90 | >= 90 |
| Best Practices | >= 90 | >= 90 |
| SEO | >= 90 | >= 90 |

Core Web Vitals targets:

| Metric | Target |
|---|---:|
| LCP mobile | < 4.0s |
| LCP desktop | < 2.5s |
| FCP | < 2.0s |
| TBT | < 200ms |
| CLS | < 0.1 |

---

Update this file only with rules that are broadly reusable across features.
