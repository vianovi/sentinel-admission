# Livi — Frontend Skill (Token-Optimized)
> Load for UI, frontend, animation, component, and Inertia/React work.
> Goal: premium UI, safe implementation, low token overhead.

---

## Load Rules
Use this file when the task touches:
- React/Inertia pages, UI components, forms, navigation, dashboard, mobile layout
- Tailwind styling, dark mode, animation, upload UI, document UI
- Frontend audit with Playwright

Do **not** load for backend-only tasks unless frontend behavior is involved.

---

## Priority Order
1. Existing project patterns
2. Accessibility + mobile usability
3. Data correctness / form behavior
4. Visual quality
5. Motion / polish

If rules conflict: accessibility > correctness > consistency > aesthetics > animation.

---

## Work Protocol
Before writing frontend code:
1. Identify actor: candidate / staff / admin / guest.
2. Inspect actual files, props, routes, and shared components.
3. If schema/props are unknown, read source first; do not invent.
4. Plan briefly, then execute only when requested.
5. Generate full files, not partial snippets.
6. After changes, run relevant checks if available: `npm run build`, typecheck, lint, or Playwright smoke test.

---

## Frontend Philosophy
- Build production-ready UI: structurally solid + visually intentional.
- Avoid generic AI-looking layouts, default palettes, and cramped spacing.
- Use motion to guide attention, not to show off.
- Technical errors go to console/logs; users see friendly, actionable messages.

---

## Visual System

### Typography
- Avoid default-looking UI when possible.
- Use expressive display font for headings and readable body font.
- Headers: tight tracking / strong hierarchy.
- Body text: comfortable `leading-relaxed` / 1.6–1.8.

### Tailwind Rule
Never rely on runtime-generated Tailwind class names.

```tsx
// bad
`bg-${color}-500`

// good
color === 'blue' ? 'bg-blue-500' : 'bg-red-500'
// good
'bg-blue-500 dark:bg-blue-400'
```

### Color Tokens
```css
--shell-bg:        #080d18 | #f0ebe0;
--shell-surface:   #0a0f1e | #faf7f0;
--content-bg:      #0d1424 | #fdf9f3;
--content-surface: #111827 | #ffffff;
--content-card:    rgba(255,255,255,.04) | rgba(0,0,0,.025);
--content-border:  rgba(255,255,255,.08) | rgba(0,0,0,.08);
```

### Page Accents
```txt
Data Diri      blue-500   #3b82f6
Data Kesehatan cyan-500   #06b6d4
Data Wali      violet-500 #8b5cf6
Data Dokumen   amber-500  #f59e0b
Pembayaran     orange-500 #f97316
```

### Layout
- Mobile-first, then `sm:` / `md:` / `lg:`.
- Use generous spacing and clear visual hierarchy.
- Dashboard content should be full width; avoid `max-w-3xl mx-auto` for main dashboard content.
- Avoid nested cards inside cards unless there is a strong reason.

---

## Motion Rules
Use Anime.js only when it improves comprehension.

Required patterns:
- Page/card/list mount: subtle stagger entrance.
- Tab/step switch: exit + enter transition.
- Form validation error: short shake or equivalent feedback.
- Submit button: disabled state + spinner/loading label.
- Upload: progress indicator when upload progress is available.

Limits:
- Entrance: max 600ms.
- Tab/step transition: max 400ms.
- Prefer `outExpo` for enter and `inQuad` for exit.
- No heavy ambient glow on professional dashboard pages.

Accessibility override:
- Always respect `prefers-reduced-motion`.
- If reduced motion is enabled, replace movement-heavy animation with fade or instant transition.
- Keep functional feedback even when motion is reduced.

---

## Component Standards
Every page/component must handle:
- Loading: skeleton/spinner, never blank.
- Empty: clear empty state.
- Error: friendly message + retry/action.
- Success: toast/checkmark/visible confirmation.

### File Upload UI States
```txt
empty      neutral gray, not alarming
uploading  blue + spinner/progress
pending    amber/gold, awaiting review
verified   green, verified
rejected   red + polite rejection reason
```

### Forms
- Frontend required validation is UX only; backend remains source of truth.
- Use 16px minimum input font size on mobile.
- Touch targets minimum 44×44px.
- Preserve focus state and keyboard usability.
- For axios expecting JSON, set `Accept: application/json`.

### SweetAlert2
Use a project-level `swalDark`/toast helper. Do not duplicate full config per component.

### react-select
Use existing `makeSelectStyles(hasError, isDark)` inside component scope.
Never define browser-dependent values at module level.

---

## Dashboard Candidate Template
```txt
Header: icon + title + subtitle, not sticky
Tab bar: sticky top-0 z-10, pill style, overflow-x-auto
Content: full width, clear section headers
Bottom nav: [Kembali] left, [Simpan & Lanjut] right
```

Wizard behavior:
- `Kembali` switches tab only; no save.
- `Simpan & Lanjut` submits, shows success, then moves next.
- Final tab uses confirmation before finishing.

---

## TypeScript / React Rules
- If component >150 lines, consider extracting hooks/helpers/components.
- Do not use browser global names as props: `document`, `window`, `location`, `status`, `name`, `event`.
- Rename on destructure, e.g. `{ document: docRecord }`.
- For dynamic object keys, use `type` with index signature when needed.
- Preserve existing project conventions before introducing new libraries.

---

## Document Feature Frontend
Tabs:
```txt
identity       photo_formal, birth_certificate, family_card, parent_id_card
academic       graduation_certificate, report_card, academic_transcript, transfer_letter if transfer
achievement    achievement_* multi-upload optional
welfare        kip_card / welfare_card / poverty_letter choose-one if applicable
boarding       parent_statement, recommendation_letter
```

Warning dot logic:
- Required doc missing → warning.
- `rejected` status → warning.
- `transfer_letter` required only when `is_transfer = true`.

Document list pattern:
- Use row/list item style, not heavy card boxes.
- Native drag-and-drop is enough.
- Ignore drop if locked/uploading.

---

## Removed / Avoid Loading Unless Needed
- CinematicShowcase-specific marquee/lightbox/z-index details.
- Long reusable code snippets already available in source.
- Exact animation implementation unless editing animation files.
