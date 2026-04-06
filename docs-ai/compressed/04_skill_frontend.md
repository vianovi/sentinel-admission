# Livi — Frontend Skill
> Load this file for UI, frontend, animation, and component work sessions.
> Covers: design philosophy, animation patterns, component standards, dark mode, mobile-first.

---

## Core Frontend Philosophy

```
Production-Ready Art: every component must be structurally sound AND visually striking.
Zero generic "AI slop" aesthetics — no predictable layouts, no default palettes.
Static is dead — motion guides the user's eye and makes interfaces feel alive.
Silent & graceful degradation — errors go to console, never to the user's face.
```

### Before Writing Any Frontend Code
```
1. Analyze Context   → Who is using this? (candidate, staff, admin, guest?)
2. Design Blueprint  → What is the aesthetic tone? Which motion patterns apply?
3. Check Props       → If data structure is unknown, STOP and ask for actual file
4. Execute           → Only after Silvia says "Execute, Livi!"
```

---

## Aesthetic Directives

### Typography
```
BANNED: Inter, Roboto, Arial, sans-serif defaults (unless forced by framework)
USE:    Distinctive display font (Clash Display, Playfair, Space Grotesk, Syne)
        paired with readable body font

Rules:
- Tighten display headers: letter-spacing negative or tight
- Loosen body text: line-height 1.6–1.8
- Use tracking and leading intentionally — not at default
```

### Color & Dark Mode
```
Dark mode is NOT just black:
  background  → bg-slate-900 / #0d1424 (content-bg)
  cards       → bg-slate-800 / rgba(255,255,255,0.04) (content-card)
  borders     → border-white/10 / rgba(255,255,255,0.08)

STRICT RULE: Never dynamic Tailwind class interpolation
  ❌ `dark:${color}-500`
  ✅ isDark ? 'bg-blue-500' : 'bg-red-500'
  ✅ 'dark:bg-blue-500 bg-red-500' (hardcoded literal)

Project color tokens:
  --shell-bg:       #080d18  (dark) | #f0ebe0  (light)
  --shell-surface:  #0a0f1e  (dark) | #faf7f0  (light)
  --content-bg:     #0d1424  (dark) | #fdf9f3  (light)
  --content-surface:#111827  (dark) | #ffffff  (light)
  --content-card:   rgba(255,255,255,0.04) (dark) | rgba(0,0,0,0.025) (light)
  --content-border: rgba(255,255,255,0.08) (dark) | rgba(0,0,0,0.08)  (light)
```

### Spatial Composition
```
- Generous negative space — let elements breathe
- Break boring grid: use slight asymmetry, overlapping elements, floating cards
- Never cramped — padding is not wasted space, it's visual hierarchy
- High-end feel = restraint + intentional placement
```

### Page Accent Colors (FINAL — do not change without discussion)
```
Data Diri      → blue-500   #3b82f6
Data Kesehatan → cyan-500   #06b6d4
Data Wali      → violet-500 #8b5cf6
Data Dokumen   → amber-500  #f59e0b
Pembayaran     → orange-500 #f97316
Flow: cool → warm — no sharp jumps, pleasant top-to-bottom
```

---

## Animation Patterns (Anime.js)

### Stagger Entrance (every page/tab mount)
```tsx
animate('.item', {
    opacity: [0, 1], translateY: [20, 0],
    duration: 500, delay: stagger(80), ease: 'outExpo'
})
// Max entrance duration: 600ms. Standard ease-in: outExpo
```

### Tab / Step Transition (always 2 phases)
```tsx
// Phase 1 — Exit (fast, inQuad)
animate(ref.current, {
    opacity: [1, 0], translateX: [0, dir * -20],
    duration: 180, ease: 'inQuad'
})
// Phase 2 — Enter (after 190ms, outExpo)
setTimeout(() => {
    setActiveTab(newTab)
    animate(ref.current, {
        opacity: [0, 1], translateX: [dir * 20, 0],
        duration: 350, ease: 'outExpo'
    })
}, 190)
```

### Error Shake
```tsx
animate('.input-error', {
    translateX: [0, -6, 6, -4, 4, 0],
    duration: 380, ease: 'outExpo'
})
```

### Button Loading State
```tsx
<button disabled={isSubmitting}>
    {isSubmitting
        ? <><i className="fa-solid fa-spinner fa-spin mr-2"/>Memproses...</>
        : <><i className="fa-solid fa-arrow-right mr-2"/>Simpan</>
    }
</button>
```

### Upload Progress
```tsx
const [uploadProgress, setUploadProgress] = useState(0)
axios.post(url, formData, {
    onUploadProgress: (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total))
    }
})
```

### Progress Bar — Dynamic Color (inline style, NOT Tailwind arbitrary)
```tsx
const getProgressGradient = (pct: number): string => {
    if (pct < 50)  return 'linear-gradient(to right, #c0392b, #e74c3c)'
    if (pct < 75)  return 'linear-gradient(to right, #d35400, #f39c12)'
    if (pct < 100) return 'linear-gradient(to right, #2980b9, #7aa2f7)'
    return 'linear-gradient(to right, #1e8449, #27ae60)'
}
// Usage: style={{ width: `${pct}%`, background: getProgressGradient(pct) }}
```

### Glow Ambient Effects (dark pages only)
```tsx
// Use on: Landing, FormWizard, Register — NOT dashboard professional pages
<div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72
               rounded-full bg-amber-500/10 blur-3xl"
     style={{ animation: 'glow-move 14s ease-in-out infinite alternate' }} />
// Top-right: amber/rose/sky | Bottom-left: emerald/cyan/amber
```

### Animation Rules
```
All tab/step/page transitions  → must have transition (never instant snap)
All form errors                → must have shake animation
All card/list mount            → must have stagger entrance
All submit buttons             → must have loading state + spinner
Max entrance duration: 600ms   Max transition duration: 400ms
Standard ease-in: outExpo      Standard ease-out: inQuad
```

---

## Component Standards

### 4 Mandatory States (every page and component)
```
Loading → skeleton shimmer or spinner — never blank screen
Empty   → illustration + informative text — never blank page
Error   → clear message + retry button — never raw error code to user
Success → visual confirmation (toast/checkmark) — never silent
```

### File Upload — 5 States
```
empty     → neutral/muted gray — NOT red, not alarming
uploading → blue + spinner + progress bar
pending   → gold/amber — uploaded, awaiting staff review
verified  → green — verified by staff
rejected  → red + rejection reason (polite language)
```

### SweetAlert2 — swalDark Config
```tsx
import Swal from 'sweetalert2'
const swalDark = Swal.mixin({
    background: '#0f172a', color: '#e2e8f0',
    confirmButtonColor: '#d4a017', cancelButtonColor: '#334155',
    customClass: {
        popup: '!rounded-2xl !border !border-white/10',
        confirmButton: '!rounded-xl !px-6',
        cancelButton: '!rounded-xl !px-6',
    }
})

// Toast (success/warning notification):
swalDark.fire({ toast: true, position: 'top-end', icon: 'success',
    title: 'Tersimpan!', showConfirmButton: false,
    timer: 2000, timerProgressBar: true })

// Confirm (destructive action):
const result = await swalDark.fire({
    title: 'Hapus?', icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Ya, hapus', cancelButtonText: 'Batal'
})
```

### react-select — makeSelectStyles()
```tsx
// CORRECT export name: makeSelectStyles (not selectStyles)
// ALWAYS call inside component, ALWAYS pass isDark from useTheme()
import { makeSelectStyles } from '@/Components/UI/selectStyles'
import { useTheme } from '@/context/ThemeContext'

// Inside the component function (NOT module level):
const { theme } = useTheme()
const isDark = theme === 'dark'
const portalProps = (hasError = false) => ({
    styles: makeSelectStyles(hasError, isDark),
    menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
    menuPosition: 'fixed' as const,
    menuPlacement: 'auto' as const,
})
```

### Wizard-Style Navigation Pattern
```
← Kembali (left)    → switch tab only, NO save
Simpan & Lanjut → (right) → POST → toast success → auto handleTabChange(nextTab)
Last tab right button → "Kirim & Selesaikan" with 2-step confirmation
```

### GlobalProgressBar
```
Mounted in app.tsx — auto-triggers on Inertia navigation
Color: gold #d4a017
createInertiaApp: progress: false (uses custom GlobalProgressBar)
Wizard step transition: trigger manually via data-wizard-bar / data-wizard-glow DOM attributes
```

---

## Dashboard Page Template (Follow for ALL candidate pages)

```
┌─ Header (not sticky) ──────────────────────────────────────────┐
│  Icon w-9 h-9 rounded-xl + Title text-xl + Subtitle text-xs   │
└────────────────────────────────────────────────────────────────┘
┌─ Tab Bar (STICKY top-0 z-10) ──────────────────────────────────┐
│  Pill style, overflow-x-auto, dark bg rounded-2xl              │
└────────────────────────────────────────────────────────────────┘
┌─ Content (full width) ─────────────────────────────────────────┐
│  Section headers: icon w-9 h-9 + bold title + subtitle         │
└────────────────────────────────────────────────────────────────┘
┌─ Bottom Navigation ────────────────────────────────────────────┐
│  [← Kembali]                        [Simpan & Lanjut →]        │
└────────────────────────────────────────────────────────────────┘

NEVER use: max-w-3xl mx-auto in main content
           progress bar inside content (sidebar only)
           nested cards inside cards
```

---

## Mobile-First Standards

```
Touch targets minimum: 44×44px
Input font-size minimum: 16px (prevent iOS auto-zoom)
Write mobile styles first, then sm: / lg: for desktop
Test at: 375px (iPhone SE) and 390px (iPhone 14)
Primary breakpoints: sm (640px) · md (768px) · lg (1024px)
Form wizard = most critical page — must be flawless on mobile
```

---

## TypeScript & Component Rules

```
Component separation: if component >150 lines → separate hooks from UI rendering
Prop naming: NEVER use browser globals as prop names
  → document, window, location, status, name, event
  → Rename on destructure: { document: docRecord }
Dynamic property access: use type with index signature, not interface
  → type Data = { [key: string]: unknown; specificField: string }
Always generate FULL files — never snippets with "// ... rest of code"
```

---

## CinematicShowcase — Specific Patterns

```
Marquee: pure CSS @keyframes translateX(-50%) on width: max-content
         NOT ResizeObserver (has timing bugs on resize)
         Gap between set-A and set-B must equal gap between cards: marginLeft: ${gap}px

Video cards: preload="metadata" · controls={false} · disablePictureInPicture
             On mouse leave: pause() + currentTime = 0 (restores first frame naturally)

GalleryCard shimmer:
  - One global @keyframes CSS (injected once, not per card)
  - Triggered via setTimeout with different stagger delay per card
  - Stop on hover, resume on mouse leave
  - Interval: 4.5s + random 0-2s (prevents synchronized shimmer)
  - No setInterval — very lightweight

Lightbox blurred backdrop:
  filter: 'blur(32px) saturate(0.6) brightness(0.3)' + transform: scale(1.1)
  + dark overlay rgba(4,8,20,0.75)
  Video: no blur backdrop — use solid dark gradient instead

Origin-based lightbox animation:
  const dx = originCX - window.innerWidth / 2
  const dy = originCY - window.innerHeight / 2
  animate(panel, { translateX:[dx,0], translateY:[dy,0], scale:[initScale,1] })
  Close: animate(panel, { translateX:[0,dx], translateY:[0,dy], scale:[1,0.08] })
```

### Z-Index Layering in Card Components
```
Always define explicit z-index and document the hierarchy:
z-5  → loading placeholder (only while not loaded)
z-6  → permanent gradient overlay
z-7  → hover panel + title
z-8  → badge + corner accents
z-9  → custom cursor
z-99 → ripple (temporary, removed immediately)
```

---

## Document Feature — Frontend Specifics

### Tab Structure
```
DataDokumen/
├── TabIdentitas.tsx   → Group identity (4 docs)
├── TabAkademik.tsx    → Group academic (3 docs)
├── TabPrestasi.tsx    → Group achievement (multi-upload, 3 categories)
├── TabBantuan.tsx     → Group welfare (choose-one UI)
└── TabBoarding.tsx    → Group boarding (transfer_letter conditional)
```

### Warning Dot Per Tab (frontend-only logic)
```tsx
const REQUIRED_BY_TAB: Record<string, string[]> = {
    identity:       ['photo_formal', 'birth_certificate', 'family_card', 'parent_id_card'],
    academic:       ['graduation_certificate', 'report_card'],
    achievement:    [],
    welfare:        [],
    administration: ['parent_statement'],
}
// Also show dot for transfer_letter if isTransfer === true
// Status 'rejected' also counts as warning (needs re-upload)
```

### DocumentCard Design
```
Row style (list item) — NOT card boxes
Reason: documents are a list, not standalone objects. Card boxes = heavy and boxy.
Pattern: DocList wrapper with border-b per item

Drag & Drop: native HTML5 (onDragOver, onDragLeave, onDrop) — no library
State isDragOver → visual feedback (amber subtle bg)
Guard: if isLocked || isUploading → ignore drop

Prop naming: { document: docRecord } — never use 'document' as prop name directly
```
