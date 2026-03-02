# Styling Guide — Sentinel Admission System

> Panduan ini untuk semua developer yang ikut bangun UI dashboard.
> Kita pakai **Tailwind CSS** — tidak ada file `.css` baru.
> Semua styling ditulis langsung sebagai `className` di dalam file `.tsx`.

---

## Tech Stack UI

| Tools       | Fungsi                          |
|-------------|---------------------------------|
| Tailwind CSS | Utility-first styling           |
| animejs      | Animasi & transisi halaman      |
| Font Awesome | Icon (via CDN di `app.blade.php`) |
| Sora         | Font heading (`font-display`)   |
| DM Sans      | Font body (default, otomatis)   |

---

## Color Palette

### Custom Tokens (langsung pakai nama ini)

| Token          | Warna     | Hex       | Contoh Pakai                        |
|----------------|-----------|-----------|-------------------------------------|
| `navy`         | Gelap     | `#0f172a` | `bg-navy`, `text-navy`              |
| `gold`         | Emas      | `#d4a017` | `bg-gold`, `text-gold`, `border-gold` |
| `goldhover`    | Emas gelap| `#b5850b` | `hover:bg-goldhover`                |
| `light`        | Abu terang| `#f1f5f9` | `bg-light`                          |

### Slate Scale (Tailwind default — untuk teks & border)

| Class           | Kegunaan                          |
|-----------------|-----------------------------------|
| `text-slate-900`| Heading utama (paling gelap)      |
| `text-slate-700`| Label form, teks penting          |
| `text-slate-600`| Teks body normal                  |
| `text-slate-500`| Teks sekunder, placeholder        |
| `text-slate-400`| Teks subtle, caption              |
| `text-slate-300`| Teks di atas background gelap     |
| `border-slate-200`| Border card, input (bg putih)   |
| `border-white/10` | Border di atas background gelap |

---

## Typography

```tsx
// Heading halaman
<h1 className="text-3xl font-display font-bold text-slate-900">Judul</h1>

// Heading section
<h2 className="text-xl font-display font-semibold text-slate-800">Section</h2>

// Subheading / label
<h3 className="text-sm font-semibold text-slate-700">Label</h3>

// Body text
<p className="text-sm text-slate-600 leading-relaxed">Paragraf biasa</p>

// Caption / keterangan kecil
<span className="text-xs text-slate-500">Keterangan</span>

// Label uppercase (badge section)
<p className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold">
    Sistem SPMB
</p>
```

---

## Spacing & Layout

```tsx
// Container halaman dashboard
<div className="p-6 sm:p-8 max-w-7xl mx-auto">

// Grid 3 kolom stat cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Grid 2 kolom konten
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// Stack vertikal dengan gap
<div className="flex flex-col gap-4">

// Row horizontal dengan gap
<div className="flex items-center gap-3">
```

---

## Card

```tsx
// Card standar (background terang)
<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-soft">

// Card dark (untuk sidebar / dark section)
<div className="bg-slate-900/80 border border-white/5 rounded-2xl p-6">

// Card dengan hover effect
<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-soft
                hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer">

// Stat card
<div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-soft">
    <p className="text-xs text-slate-500 font-medium">Total Pendaftar</p>
    <p className="text-3xl font-display font-bold text-slate-900 mt-1">128</p>
</div>
```

---

## Button

```tsx
// Primary (navy)
<button className="bg-navy hover:bg-navy/90 text-white px-5 py-2.5 rounded-xl
                   font-semibold text-sm transition hover:-translate-y-0.5 active:scale-95">
    Simpan
</button>

// Primary (gold) — untuk aksi utama yang menonjol
<button className="bg-gold hover:bg-goldhover text-slate-900 px-5 py-2.5 rounded-xl
                   font-semibold text-sm shadow-glow transition hover:-translate-y-0.5">
    Verifikasi
</button>

// Secondary / outline
<button className="border border-slate-300 text-slate-700 hover:border-slate-400
                   px-5 py-2.5 rounded-xl font-semibold text-sm transition">
    Batal
</button>

// Danger (hapus)
<button className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl
                   font-semibold text-sm transition">
    Hapus
</button>

// Ghost / link style
<button className="text-gold hover:text-goldhover font-semibold text-sm transition">
    Lihat Detail →
</button>

// Disabled state (tambahkan di semua button)
disabled:opacity-50 disabled:cursor-not-allowed
```

---

## Badge / Status

```tsx
// Fungsi helper status — pakai ini di semua halaman
const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        draft:     'bg-slate-100 text-slate-600',
        submitted: 'bg-blue-50 text-blue-600',
        verified:  'bg-amber-50 text-amber-600',
        accepted:  'bg-emerald-50 text-emerald-700',
        rejected:  'bg-red-50 text-red-600',
        pending:   'bg-orange-50 text-orange-600',
        valid:     'bg-emerald-50 text-emerald-700',
        invalid:   'bg-red-50 text-red-600',
    }
    return map[status] ?? 'bg-slate-100 text-slate-500'
}

const statusLabel = (status: string) => {
    const map: Record<string, string> = {
        draft:     'Draft',
        submitted: 'Menunggu Verifikasi',
        verified:  'Terverifikasi',
        accepted:  'Diterima',
        rejected:  'Ditolak',
        pending:   'Pending',
        valid:     'Valid',
        invalid:   'Tidak Valid',
    }
    return map[status] ?? status
}

// Cara pakai:
<span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold
                  ${statusBadge(candidate.status)}`}>
    {statusLabel(candidate.status)}
</span>
```

---

## Form Input

```tsx
// Label
<label className="block text-xs font-semibold text-slate-700 mb-1.5">
    Nama Lengkap <span className="text-red-500">*</span>
</label>

// Input normal
<input
    type="text"
    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm
               text-slate-800 placeholder:text-slate-400 outline-none
               focus:border-gold transition bg-white"
/>

// Input error
<input className="w-full border border-red-400 rounded-xl px-4 py-3 text-sm
                  text-slate-800 outline-none focus:border-red-500 transition bg-white" />

// Error message
<span className="text-xs text-red-500 mt-1 flex items-center gap-1">
    <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
    Kolom ini wajib diisi.
</span>

// Select
<select className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm
                   text-slate-800 outline-none focus:border-gold transition bg-white">
    <option>Pilih status</option>
</select>

// Textarea
<textarea className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm
                     text-slate-800 placeholder:text-slate-400 outline-none
                     focus:border-gold transition bg-white resize-none" rows={3} />
```

---

## Icon (Font Awesome)

```tsx
// Cara pakai
<i className="fa-solid fa-user"></i>
<i className="fa-solid fa-shield-halved text-gold"></i>
<i className="fa-solid fa-spinner fa-spin"></i>  // loading

// Icon dengan ukuran
<i className="fa-solid fa-check text-xs"></i>
<i className="fa-solid fa-check text-lg"></i>

// Icon di dalam button
<button>
    <i className="fa-solid fa-check mr-2"></i>
    Verifikasi
</button>

// Icon wrapper (bulat)
<div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20
                flex items-center justify-center">
    <i className="fa-solid fa-graduation-cap text-gold"></i>
</div>
```

---

## Alert & Notification

```tsx
// Success
<div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3
                text-sm text-emerald-700 flex items-center gap-2.5">
    <i className="fa-solid fa-circle-check text-emerald-500 flex-shrink-0"></i>
    <span>Data berhasil disimpan.</span>
</div>

// Error
<div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3
                text-sm text-red-700 flex items-center gap-2.5">
    <i className="fa-solid fa-triangle-exclamation text-red-500 flex-shrink-0"></i>
    <span>Terjadi kesalahan.</span>
</div>

// Warning
<div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3
                text-sm text-amber-700 flex items-center gap-2.5">
    <i className="fa-solid fa-circle-info text-amber-500 flex-shrink-0"></i>
    <span>Email belum diverifikasi.</span>
</div>

// Info (dark — untuk di atas background gelap)
<div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3
                text-sm text-slate-300 flex items-center gap-2.5">
    <i className="fa-solid fa-circle-info text-gold flex-shrink-0"></i>
    <span>Info penting.</span>
</div>
```

---

## Animasi (animejs)

```tsx
import { animate, stagger } from 'animejs'
import { useEffect } from 'react'

// Entrance — fade + slide dari bawah (paling sering dipakai)
useEffect(() => {
    animate('.card-item', {
        opacity:    [0, 1],
        translateY: [20, 0],
        duration:   600,
        delay:      stagger(80),
        ease:       'outExpo',
    })
}, [])

// Tambahkan class 'card-item' ke elemen yang mau dianimasikan
<div className="card-item opacity-0"> ... </div>

// Entrance — fade + slide dari kiri (untuk sidebar/panel)
animate('.panel', {
    opacity:    [0, 1],
    translateX: [-20, 0],
    duration:   500,
    ease:       'outExpo',
})

// Shake — untuk error
animate('.btn', {
    translateX: [0, -8, 8, -6, 6, 0],
    duration:   420,
    ease:       'outExpo',
})
```

---

## Do & Don't

### ✅ Do
- Pakai token custom (`text-gold`, `bg-navy`, `font-display`) — konsisten
- Rounded selalu `rounded-xl` atau `rounded-2xl` — tidak ada `rounded-md`
- Gap selalu `gap-4` atau `gap-6` untuk card grid
- Semua animasi pakai animejs — tidak pakai `transition-all` untuk animasi kompleks

### ❌ Don't
- Jangan buat file `.css` baru
- Jangan pakai warna hardcode (`text-[#d4a017]`) — pakai `text-gold`
- Jangan pakai `rounded-full` untuk card/button — hanya untuk avatar/badge bulat
- Jangan pakai `Inter` atau font lain — sudah ada `DM Sans` dan `Sora`
- Jangan pakai `shadow-lg` bawaan Tailwind untuk card — pakai `shadow-soft`
