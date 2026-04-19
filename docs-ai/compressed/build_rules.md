# Build Rules & Performance Guidelines
> Stack: Laravel 12 + React + Inertia.js
> Tujuan: Menjaga performa tinggi di semua halaman, baik landing page maupun dashboard.

---

## 🖼️ 1. Gambar (Images)

### Above the Fold (Hero / Banner)
```tsx
// ✅ Hero image — WAJIB fetchPriority high + eager
<img
    src="/assets/hero-background.webp"
    alt="Deskripsi gambar"
    fetchPriority="high"
    loading="eager"
    decoding="async"
    className="w-full h-full object-cover"
/>
```

```tsx
// ✅ Kalau ada versi mobile, pakai <picture> + srcSet
<picture>
    <source media="(max-width: 768px)" srcSet="/assets/hero-mobile.webp" type="image/webp" />
    <source media="(min-width: 769px)" srcSet="/assets/hero-desktop.webp" type="image/webp" />
    <img
        src="/assets/hero-desktop.webp"
        alt="Deskripsi gambar"
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="w-full h-full object-cover"
    />
</picture>
```

### Below the Fold (Galeri, Fasilitas, dll)
```tsx
// ✅ Semua gambar di bawah fold — WAJIB lazy
<img
    src="/assets/foto.webp"
    alt="Deskripsi"
    loading="lazy"
    decoding="async"
/>
```

### Preload di Head (Inertia)
```tsx
// ✅ Di Page component (Welcome.tsx, dll) — preload hero image
<Head title="Nama Halaman">
    <link
        rel="preload"
        as="image"
        href="/assets/hero-background.webp"
        fetchpriority="high"
    />
</Head>
```

### Aturan Format
| Kondisi | Format |
|---|---|
| Foto / gambar kompleks | WebP |
| Icon sederhana | SVG inline |
| Jangan pakai | PNG / JPG (kecuali terpaksa) |

### Ukuran Gambar
- Hero desktop: maks **1920px** lebar
- Hero mobile: maks **768px** lebar
- Kompres dulu di [Squoosh.app](https://squoosh.app) sebelum upload

---

## 📦 2. Code Splitting & Lazy Loading Component

### Landing Page
Component landing page tidak perlu lazy load karena sudah di-bundle per page oleh Inertia.

### Dashboard — WAJIB Lazy Load
Semua component berat di dashboard harus di-lazy load:

```tsx
// ❌ Jangan begini
import HeavyChart from '@/Components/Charts/RevenueChart'
import DataTable from '@/Components/Tables/CandidateTable'

// ✅ Lazy load — hanya di-load saat dibutuhkan
import { lazy, Suspense } from 'react'

const RevenueChart = lazy(() => import('@/Components/Charts/RevenueChart'))
const CandidateTable = lazy(() => import('@/Components/Tables/CandidateTable'))

// Pakenya wajib dibungkus Suspense
<Suspense fallback={<div className="animate-pulse h-64 bg-slate-100 rounded-xl" />}>
    <RevenueChart />
</Suspense>
```

### Yang WAJIB di-lazy load di dashboard
- Semua chart (grafik, diagram)
- Semua tabel data besar
- Modal / popup yang tidak langsung muncul
- Component yang ada di tab yang tidak aktif

---

## 📡 3. Data Fetching (Inertia + Laravel)

### Kirim data seperlunya dari Controller
```php
// ❌ Jangan kirim semua data
return Inertia::render('Dashboard/Index', [
    'candidates' => Candidate::all(), // bisa ribuan row!
]);

// ✅ Kirim yang dibutuhkan saja + pagination
return Inertia::render('Dashboard/Index', [
    'candidates' => Candidate::paginate(15),
    'stats'      => CandidateService::getSummaryStats(),
]);
```

### Pagination — selalu dari backend
```tsx
// ❌ Jangan filter / paginate di frontend
const displayed = candidates.filter(...).slice(0, 10)

// ✅ Request page baru ke server via Inertia
import { router } from '@inertiajs/react'

router.get(route('dashboard.candidates'), { page: 2 }, {
    preserveState: true,
    preserveScroll: true,
})
```

---

## ⚡ 4. Animasi

### Prinsip
- Gunakan **CSS transition/animation** untuk interaksi sederhana (hover, toggle)
- Gunakan **animejs** hanya untuk animasi kompleks (hero entrance, cinematic effect)
- Jangan animasi semua element sekaligus di `useEffect` mount

```tsx
// ❌ Terlalu banyak animasi di mount — block rendering
useEffect(() => {
    animate('.card', { opacity: [0, 1], ... }) // puluhan element sekaligus
}, [])

// ✅ Batasi hanya element above the fold
useEffect(() => {
    animate('.hero-animate', {
        opacity: [0, 1],
        translateY: [40, 0],
        duration: 1200,
        delay: stagger(180, { start: 200 }),
    })
}, [])

// ✅ Untuk hover & toggle — pakai CSS Tailwind saja
className="transition duration-300 hover:-translate-y-1"
```

---

## 🔤 5. Font & External Resources

```html
{{-- Di resources/views/app.blade.php --}}
{{-- WAJIB preconnect sebelum load font --}}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdnjs.cloudflare.com">

{{-- Load font dengan display=swap agar tidak block render --}}
<link href="https://fonts.googleapis.com/css2?family=...&display=swap" rel="stylesheet">
```

---

## 🗂️ 6. Struktur Folder

```
resources/js/
├── Components/
│   ├── Landing/        ← component landing page (tidak perlu lazy)
│   ├── Dashboard/
│   │   ├── Shared/     ← Sidebar, Topbar (load sekali, ringan)
│   │   ├── Charts/     ← SEMUA chart → wajib lazy load
│   │   ├── Tables/     ← SEMUA tabel → wajib lazy load + pagination
│   │   └── [Feature]/  ← komponen spesifik per fitur
│   └── UI/             ← komponen kecil reusable (Button, Field, dll)
├── Pages/
│   ├── Landing/        ← 1 file per halaman landing
│   └── Dashboard/      ← 1 file per halaman dashboard
```

---

## ✅ 7. Checklist Sebelum Push

### Setiap halaman baru:
- [ ] Hero/banner image pakai `fetchPriority="high"` + `loading="eager"`
- [ ] `<Head>` sudah ada `<link rel="preload">` untuk hero image
- [ ] Semua gambar di bawah fold pakai `loading="lazy"` + `decoding="async"`
- [ ] Gambar format WebP, ada versi mobile kalau ukurannya besar
- [ ] Controller hanya kirim data yang dibutuhkan halaman itu
- [ ] Pagination dari backend, bukan filter di frontend

### Khusus halaman dashboard:
- [ ] Chart di-lazy load dengan `Suspense`
- [ ] Tabel besar di-lazy load dengan `Suspense`
- [ ] Component di tab tidak aktif di-lazy load
- [ ] Modal tidak di-render sampai dibuka (conditional render atau lazy)

---

## 🎯 8. Target Score PageSpeed

| | Mobile | Desktop |
|---|---|---|
| Performance | ≥ 80 | ≥ 90 |
| Accessibility | ≥ 90 | ≥ 90 |
| Best Practices | ≥ 90 | ≥ 90 |
| SEO | ≥ 90 | ≥ 90 |

### Metrik LCP Target
| Metrik | Target |
|---|---|
| LCP (mobile) | < 4.0s |
| LCP (desktop) | < 2.5s |
| FCP | < 2.0s |
| TBT | < 200ms |
| CLS | < 0.1 |

---

> 📌 File ini di-update setiap ada pattern baru yang ditemukan saat development.
