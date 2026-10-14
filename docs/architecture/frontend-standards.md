# Frontend Standards, UI States & Motion Design System

Dokumen ini merupakan Single Source of Truth (SSOT) untuk standar antarmuka pengguna (UI), sistem token warna, state visual, dan animasi pada Sentinel Admission.

---

## 1. Color Palette & Token Keys

Sentinel Admission menggunakan tema **Dark Mode First** dengan identitas visual formal, modern, dan bernuansa islami kontemporer.

| Token Role | Nilai / Utility Tailwind | Penggunaan |
|---|---|---|
| **Primary Brand Accent** | `amber-500` (`#f59e0b`), `amber-400` (`#fbbf24`), `#d4a017` | Tombol CTA utama, status aktif, border sorotan, icon aktif |
| **Accent Hover Glow** | `amber-500/20`, `amber-500/10` | Box-shadow, ambient light background, subtle pill badge |
| **Base Background** | `slate-950` (`#020617` / `#080d18`) | Root page background |
| **Panel & Card Background** | `slate-900` (`#0f172a`), `slate-900/90` | Card container, sidebar, modal dialog, header |
| **Card Border** | `slate-800` (`#1e293b`), `white/10` | Separator, outline card, tab border |
| **Primary Text** | `slate-100` (`#f1f5f9`), `white` | Judul, label penting, nilai formulir |
| **Muted Text** | `slate-400` (`#94a3b8`), `slate-500` | Deskripsi bantuan, timestamp, subtitle |

### Aturan Penulisan Kelas Tailwind:
- **Dilarang kelas dinamis runtime:** Jangan menulis interpolasi string seperti `bg-${color}-500`. Tailwind compiler tidak dapat mendeteksinya saat build. Selalu gunakan nama kelas statis.
- **Dilarang inline styling acak:** Seluruh warna harus merujuk token utilitas semantic Tailwind (`border-amber-500/30`, `focus:ring-amber-500/20`).
- **Signature Focus Ring:** Semua elemen input (`input`, `select`, `textarea`) wajib menggunakan focus ring khas Sentinel:
  ```css
  focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none
  ```

---

## 2. Empat State Wajib Antarmuka (4 Mandatory UI States)

Setiap halaman dan komponen data wajib menangani 4 state siklus hidup antarmuka tanpa celah blank screen:

| State | Visual Feedback | Ketentuan Implementasi |
|---|---|---|
| **1. Loading** | Skeleton shimmer atau pulsing card | Dilarang menampilkan layar kosong/putih saat data memuat |
| **2. Empty** | Ilustrasi / ikon + teks panduan tindakan | Jelaskan mengapa data kosong dan berikan tombol aksi (misal: "Belum ada dokumen, upload sekarang") |
| **3. Error** | Kotak peringatan jelas + tombol coba lagi (*retry*) | Pesan ramah pengguna; detail error teknis/trace hanya dicatat di konsol/log |
| **4. Success** | Toast notifikasi / centang hijau visual | Konfirmasi seketika atas tindakan simpan/update (tidak boleh hening) |

---

## 3. Lima State Unggah Dokumen (5 Document Upload States)

Komponen upload berkas pendaftaran kandidat (`DocumentCard`) memiliki 5 state visual yang merefleksikan alur verifikasi berkas:

| State | Indikator Visual | Deskripsi Perilaku |
|---|---|---|
| `empty` | Muted Gray (`slate-700` border, `slate-400` text) | Berkas belum diunggah. Tampilan tenang, tidak merah/mengkhawatirkan. |
| `uploading` | Blue bar + spinner + persentase progress | Proses transmisi berkas ke storage privat sedang berjalan. Input dinonaktifkan. |
| `pending` | Gold / Amber (`amber-500/20` bg, `amber-400` badge) | Berkas telah terunggah dan tersimpan aman, sedang menunggu review staf. |
| `verified` | Green (`emerald-500/20` bg, `emerald-400` icon) | Berkas diverifikasi dan disetujui staf. Mode terkunci (hanya preview & download). |
| `rejected` | Red (`rose-500/20` bg, `rose-400` text) | Berkas ditolak staf. Wajib menampilkan alasan penolakan dan tombol upload ulang. |

---

## 4. Standar Form Controls & Komponen Interaktif

### Custom Select Dropdown
- Elemen `<select>` HTML standar bawaan OS **dilarang** pada panel administrasi utama.
- Gunakan `react-select` dengan helper `makeSelectStyles`:
  ```tsx
  import { makeSelectStyles } from "@/Components/UI/selectStyles";
  import { useTheme } from "@/context/ThemeContext";

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const selectStyles = makeSelectStyles(hasError, isDark);
  ```

### SweetAlert2 Theme Configuration (`swalDark`)
- Dialog konfirmasi tindakan destruktif wajib selaras dengan tema gelap:
  ```tsx
  import Swal from "sweetalert2";
  export const swalDark = Swal.mixin({
      background: "#0f172a",
      color: "#e2e8f0",
      confirmButtonColor: "#d4a017",
      cancelButtonColor: "#334155",
      customClass: {
          popup: "!rounded-2xl !border !border-white/10",
          confirmButton: "!rounded-xl !px-6",
          cancelButton: "!rounded-xl !px-6",
      }
  });
  ```

### Pewarisan Parameter Ujian CBT
- Form pembuatan sesi ujian admin wajib otomatis menurunkan nilai `duration_minutes` dan `passing_score` dari paket soal (`ExamPackage`) yang dipilih, tanpa memaksa admin mengisi ulang angka yang sama.

---

## 5. Standar Animasi & Motion (Anime.js)

Animasi ditujukan untuk memandu fokus pengguna (*intentional motion*), bukan dekorasi berlebihan.

### A. Entrance Animation (Mount Halaman / Tab)
```tsx
import { animate, stagger } from "animejs";

animate(".animate-item", {
    opacity: [0, 1],
    translateY: [16, 0],
    duration: 450,
    delay: stagger(60),
    ease: "outExpo"
});
```

### B. Tab / Step Transition (Dua Fase: Exit lalu Enter)
```tsx
// Fase 1: Exit cepat (inQuad, 180ms)
animate(containerRef.current, {
    opacity: [1, 0],
    translateX: [0, direction * -20],
    duration: 180,
    ease: "inQuad"
});

// Fase 2: Enter setelah jeda (outExpo, 350ms)
setTimeout(() => {
    setActiveTab(newTab);
    animate(containerRef.current, {
        opacity: [0, 1],
        translateX: [direction * 20, 0],
        duration: 350,
        ease: "outExpo"
    });
}, 190);
```

### C. Error Shake
```tsx
animate(".input-error", {
    translateX: [0, -6, 6, -4, 4, 0],
    duration: 380,
    ease: "outExpo"
});
```

### D. Tombol State Submitting
```tsx
<button disabled={isSubmitting} className="btn-primary">
    {isSubmitting ? (
        <><i className="fa-solid fa-spinner fa-spin mr-2" /> Memproses...</>
    ) : (
        <><i className="fa-solid fa-check mr-2" /> Simpan Perubahan</>
    )}
</button>
```
