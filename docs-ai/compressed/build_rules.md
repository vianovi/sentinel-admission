# Build Rules & Performance Guidelines
> Global rulebook for Laravel 12 + Inertia.js v2 + React 18 + TypeScript projects.
> Load when adding pages, components, assets, libraries, or touching build/performance config.

---

## Stack Reference

```
Backend/bridge : Laravel 12 + Inertia.js v2
Frontend       : React 18 + TypeScript (strict)
Styling        : Tailwind CSS 3
Bundler        : Vite 7
Entry points   : resources/css/app.css + resources/js/app.tsx
```

Config files to check before changing build behavior:
```
vite.config.ts
tailwind.config.js
tsconfig.json
resources/views/app.blade.php
resources/js/app.tsx
package.json
```

---

## 1. TypeScript Enforcement

```json
// tsconfig.json — minimum required settings
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Rules:
```
Zero type errors allowed before any commit or deploy.
No `any` — use `unknown` for uncertain types and narrow with guards.
No `as` casting unless accompanied by a comment explaining why it is safe.
All Inertia page props must be typed — define an interface for every page's props.
API response shapes must be typed — never assume the structure at runtime.
```

### Typing Inertia Page Props
```tsx
// Always type the Inertia page component explicitly
interface Props {
  user: User;
  items: PaginatedResponse<Item>;
  filters: { search: string; status: string };
}

export default function ItemIndex({ user, items, filters }: Props) {
  // ...
}
```

---

## 2. React Component Rules

### Performance Hooks — When to Use
```tsx
// useMemo: expensive derived/computed values
const sortedItems = useMemo(
  () => items.slice().sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// useCallback: functions passed as props to children or in effect deps
const handleDelete = useCallback((id: string) => {
  router.delete(route('items.destroy', id));
}, []);

// React.memo: component that receives stable props but parent re-renders often
const ItemRow = React.memo(({ item, onDelete }: ItemRowProps) => {
  return <tr>...</tr>;
});
```

Do not wrap everything in memo/useMemo as default — profile first, optimize where measured.

### Dependency Arrays
```tsx
// ✅ All deps listed — lint warning-free
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ❌ Empty array hiding a real dependency — will silently use stale value
useEffect(() => {
  fetchData(userId);
}, []);
```

Rules:
```
Dependency arrays must be exhaustive — never suppress eslint-plugin-react-hooks warnings.
Separate logic from UI: business logic lives in custom hooks (useXxx.ts),
  components stay as pure presentational units.
Always handle loading, empty, and error states for every async data source.
key in lists: always unique and stable — never use array index for reorderable data.
Never create new functions or objects inline in JSX props if they cause child re-renders.
```

---

## 3. Error Boundaries

Every route entry and every async-loaded section must be wrapped in an error boundary.

```tsx
// app.tsx or layout
import { ErrorBoundary } from 'react-error-boundary';

function AppErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert" className="p-8 text-center">
      <p>Something went wrong. Please refresh the page.</p>
    </div>
  );
}

// Usage
<ErrorBoundary FallbackComponent={AppErrorFallback}>
  <Suspense fallback={<PageSkeleton />}>
    <PageComponent />
  </Suspense>
</ErrorBoundary>
```

Rules:
```
Error fallback must show a recoverable UI — never a blank screen.
Boundaries must not catch errors they cannot meaningfully recover from (let those bubble up).
Log boundary errors to your error tracking service (Sentry, Flare, etc.).
```

---

## 4. Code Splitting & Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const HeavyPanel = lazy(() => import('@/Components/Feature/HeavyPanel'));

<Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
  <HeavyPanel />
</Suspense>
```

Good candidates for lazy loading:
```
Chart and visualization components
Rich text / markdown editors
File, PDF, or image preview modals
Calendar and scheduler widgets
Wizard steps not visible on initial load
Inactive dashboard tabs
Operations tools not part of first paint
```

Rules:
```
Do not lazy-load components visible on first paint — it delays LCP.
Fallback must preserve layout dimensions — zero layout shift.
Prefer route-level and heavy-component splits over micro-splitting small UI pieces.
Do not split so aggressively that normal navigation feels slow.
```

---

## 5. Inertia Data Fetching & Payload

```php
// Controller — send only what the page needs
return Inertia::render('Feature/Index', [
    'items'   => ItemResource::collection($query->paginate(15)),
    'filters' => $request->only(['search', 'status']),
]);
```

```tsx
// Frontend — preserve state on filter/sort interactions
router.get(route('feature.index'), filters, {
    preserveState:  true,
    preserveScroll: true,
});
```

Rules:
```
Controllers send only the data the rendered page actually needs.
Use Inertia resources (PHP Resource classes) to shape and limit payload fields.
Never load all rows client-side to filter or sort — do it on the backend.
Never expose internal fields, sensitive data, or other users' data in page props.
Use backend pagination for any list that can grow.
```

---

## 6. Images & Media

### Above the Fold (LCP candidates)
```tsx
<picture>
  <source media="(max-width: 768px)" srcSet="/assets/hero-mobile.webp" type="image/webp" />
  <source media="(min-width: 769px)" srcSet="/assets/hero-desktop.webp" type="image/webp" />
  <img
    src="/assets/hero-desktop.webp"
    alt="Descriptive alt text"
    fetchPriority="high"
    loading="eager"
    decoding="async"
    className="h-full w-full object-cover"
  />
</picture>
```

Preload LCP image via Inertia `<Head>`:
```tsx
<Head title="Page Title">
  <link rel="preload" as="image" href="/assets/hero-desktop.webp" fetchPriority="high" />
</Head>
```

Note: Use React prop casing — `fetchPriority` not `fetchpriority`.

### Below the Fold
```tsx
<img
  src="/assets/gallery.webp"
  alt="Descriptive alt text"
  loading="lazy"
  decoding="async"
/>
```

### Format & Size Rules
| Asset Type | Format |
|---|---|
| Photos / complex raster | WebP |
| Icons | Existing icon system or inline SVG |
| User documents | Keep original (PDF, DOCX, XLSX) |

```
Hero desktop  : ≤ 1920px wide
Hero mobile   : ≤ 768px wide
Cards/gallery : close to actual rendered dimensions
Video         : preload="none" by default
              : preload="metadata" only if duration/thumbnail is needed on load
              : never eager-load video unless it is the LCP element
```

---

## 7. Bundle Size & Dependencies

Rules:
```
Before adding a new library: check its gzipped size on bundlephobia.com.
Prefer smaller alternatives: date-fns over moment, lucide-react over @fortawesome.
Import only what is used — never import an entire library for one function.
Run npm run build and check chunk sizes before merging large dependency additions.
```

Vite manual chunks (add only for libraries with real cache benefit):
```ts
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-inertia': ['@inertiajs/react'],
      }
    }
  }
}
```

Size guidance (adjust to project scale):
```
Initial JS   : < 250 KB gzipped
Per-route    : < 100 KB gzipped
CSS          : < 50 KB gzipped
```

---

## 8. Dependency Hygiene

```
Run npm audit in CI — block merge on HIGH or CRITICAL vulnerabilities.
Always commit package-lock.json — never .gitignore it.
Review and update dependencies monthly — do not auto-merge major version bumps.
Remove unused packages — they are both bundle weight and attack surface.
```

---

## 9. Security Headers (configure in Laravel or reverse proxy)

Middleware or nginx config must include:
```
Content-Security-Policy   : define allowed origins per resource type
X-Frame-Options           : SAMEORIGIN
X-Content-Type-Options    : nosniff
Referrer-Policy           : strict-origin-when-cross-origin
Permissions-Policy        : camera=(), microphone=(), geolocation=()
Strict-Transport-Security : max-age=31536000; includeSubDomains  (HTTPS only)
```

Rules:
```
Never use unsafe-inline or unsafe-eval in CSP on production.
Never hardcode API keys in React components or Vite config constants.
Never expose stack traces or internal error messages to the browser.
Sanitize all user-generated HTML before rendering — never dangerouslySetInnerHTML on raw input.
```

---

## 10. Third-Party Scripts

```
Load scripts only on pages that use them — never globally by default.
Analytics, chat, map, payment, and embed scripts: page-scoped only.
If a script is needed only after user action: load it on demand, not at page load.
Keep payment/API keys in Laravel config backed by .env — never in React code.
Add dns-prefetch / preconnect hints for external domains that are always loaded.
```

---

## 11. Transactional & Time-Sensitive Flows

For forms, payments, submissions, uploads, and irreversible actions:
```
Show clear pending state — disable submit button while processing.
Prevent duplicate submissions — debounce or disable after first click.
Show success and failure states without exposing technical error details.
Backend authorization and validation is always the source of truth.
Never rely solely on frontend validation for security-sensitive operations.
```

---

## 12. CSS, Tailwind & Layout Stability

```
Dark mode classes must be literal static strings — never built dynamically at runtime.
Do not concatenate class names at runtime: dark:${variable} will be purged by Tailwind.
Use existing design tokens and CSS variables before adding new ones.
```

Layout rules:
```
Use fixed/min dimensions on buttons, tabs, icon containers, and count badges.
Avoid text overflow in cards and buttons — test with long/translated strings.
Responsive constraints over viewport-scaled font sizes (avoid vw units for text).
Keep dashboard screens dense and operational — do not apply landing-page styling to admin UI.
Do not nest cards inside cards unless the existing design system clearly supports it.
```

---

## 13. Folder Structure

```
resources/js/
├── Components/
│   ├── Landing/       # public-facing marketing components
│   ├── Dashboard/     # authenticated app components
│   ├── UI/            # reusable primitives (Button, Modal, Badge, etc.)
│   └── Wizard/        # multi-step flow components
├── Hooks/             # custom hooks (usePagination, useDebounce, etc.)
├── Layouts/           # Inertia layouts (AppLayout, GuestLayout)
├── Pages/             # Inertia page components (one per route)
├── types/             # TypeScript interfaces and shared types
└── utils/             # pure utility functions
```

Rules:
```
Pages are orchestration layers only — logic belongs in hooks, services, or backend.
Shared UI components (UI/) must stay small and dependency-light.
Feature-specific code must not be moved into shared/global folders prematurely.
Shared layouts must not import heavy feature-specific libraries.
```

---

## 14. Animation

Use CSS transitions for simple interactions (hover, focus, toggle, opacity, transform).

Use animation libraries only for:
```
Page/section entrance that meaningfully improves perceived performance
Modal enter/exit transitions
Wizard step transitions
Global progress indicators
```

Rules:
```
Do not animate large numbers of elements simultaneously on mount.
Animation must never cause content overlap or layout shift.
For heavy animation sections below the fold, consider dynamic import.
Avoid re-triggering animations on every re-render.
```

---

## 15. Pre-Ship Checklist

```
[ ] TypeScript: zero errors, no `any`, all Inertia props typed
[ ] Dependency arrays: exhaustive, no suppressed lint warnings
[ ] Async data: loading, empty, and error states all handled
[ ] list key props: unique and stable
[ ] LCP image: eager + high priority only if truly above fold
[ ] Below-fold images: lazy + async
[ ] Error boundaries: wrap all route entries and lazy sections
[ ] No console.log or debug flags left in code
[ ] Controller payload: minimal, no sensitive fields leaked
[ ] Backend pagination: applied to all growing datasets
[ ] Third-party scripts: page-scoped, not global
[ ] Dark mode Tailwind classes: static strings only
[ ] Layout: stable dimensions on mobile and desktop
[ ] Transactional flows: duplicate submission prevented
[ ] npm audit: no HIGH/CRITICAL unresolved
[ ] Bundle size: checked if new library was added
[ ] Security headers: confirmed in middleware or reverse proxy config
[ ] npm run build: passes with no errors or warnings
```

---

## 16. Performance Targets

Measured via Lighthouse CI on staging — a failing score blocks merge to main.

| Metric | Mobile | Desktop |
|---|---:|---:|
| Performance | ≥ 80 | ≥ 90 |
| Accessibility | ≥ 90 | ≥ 90 |
| Best Practices | ≥ 90 | ≥ 90 |
| SEO | ≥ 90 | ≥ 90 |

| Core Web Vital | Target |
|---|---:|
| LCP | < 4.0s mobile / < 2.5s desktop |
| FCP | < 2.0s |
| TBT | < 200ms |
| CLS | < 0.1 |
| INP | < 200ms |