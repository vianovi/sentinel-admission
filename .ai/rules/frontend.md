# Frontend & Sentinel Design System Rules

## 1. Color Palette & Token Keys
- **Primary Brand Accent**: Amber / Gold (`amber-400`, `amber-500`, `#d4a017`, `amber-500/20` for subtle glows).
- **Background & Panels**: Deep Dark Slate (`slate-950`, `slate-900`, `#080d18`).
- **Forbidden Colors**: Do NOT use default browser purple/indigo focus rings or hardcoded random hex codes scattered in inline styles. Always use semantic Tailwind color utility tokens (`border-amber-500/30`, `focus:border-amber-500`, `focus:ring-amber-500/20`).

## 2. Form Inputs & Custom Dropdowns
- **Form Controls**: Native unstyled `<select>` elements with default OS dropdown arrows are forbidden in primary admin panels. Use custom styled dropdown components with dark glassmorphism styling, amber highlight on active item, and custom caret icons.
- **Focus Rings**: All input controls (`input`, `select`, `textarea`) must feature Sentinel's signature amber focus ring (`focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none`).

## 3. Exam Package Parameter Inheritance
- Exam session parameters like `duration_minutes` and `passing_score` should be automatically derived from the selected `ExamPackage`. Do not force administrators to re-enter duration or passing score manually in creation forms when they are already defined in the package.
