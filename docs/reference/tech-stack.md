# Tech Stack & Dependency Specification

Dokumen ini merupakan Single Source of Truth (SSOT) untuk tumpukan teknologi, versi runtime, dan dependensi resmi Sentinel Admission (diverifikasi per codebase aktual).

---

## 1. Core Platform Architecture

| Layer | Komponen / Versi | Fungsi Utama | Sumber Kebenaran |
|---|---|---|---|
| **Backend Framework** | Laravel 12.62.x | Routing, auth, validation, service layer, queue & event dispatching | `composer.json` |
| **PHP Runtime** | PHP ^8.2 (Local 8.5.8) | Runtime backend | `composer.json` |
| **Database** | MariaDB 10.11+ / 11.x | Storage relasional untuk seluruh data pendaftaran, kuota, & CBT | `config/database.php` |
| **Frontend Framework** | React 18.2.x | Komponen antarmuka pengguna | `package.json` |
| **SPA Bridge** | Inertia.js v2 (`inertia-laravel` 2.0.x, `@inertiajs/react` 2.3.x) | Routing client-side SPA tanpa API boilerplate terpisah | `composer.json`, `package.json` |
| **Language** | TypeScript 5.x (`strict: true`) | Type safety pada seluruh antarmuka React dan model props | `tsconfig.json` |
| **Styling** | Tailwind CSS 3.2.x (`darkMode: 'class'`) | Utilitas styling dengan palet brand Amber dan Deep Slate | `tailwind.config.js` |
| **Bundler & Build Tool** | Vite 7.0.x | Module bundler, hot module replacement, manual chunk splitting | `vite.config.js` |
| **Realtime WebSockets** | Laravel Reverb 1.11.x + Laravel Echo | Push event kuota gelombang dan metrik dashboard live | `config/reverb.php`, `resources/js/echo.ts` |

---

## 2. Key Libraries & Integrations

### Backend Libraries
- **Payment Gateway:** `midtrans/midtrans-php` (^2.6) — Pembuatan token Snap, QRIS/VA, dan penanganan webhook status transaksi.
- **Spreadsheet Processing:** `openspout/openspout` (^5.7) — Streaming import paket soal ujian CBT dan export rekapitulasi kandidat memory-efficient.
- **Route Bridging:** `tightenco/ziggy` (^2.6) — Konsumsi named route Laravel langsung di komponen TypeScript.
- **Developer & Audit Tools:**
  - `pestphp/pest` (^4.4) — Framework automated testing unit dan feature.
  - `laravel/boost` (^2.5) — Konvensi dan developer assistance.
  - `laravel/pint` (^1.27) — Auto-formatting style PHP sesuai standar Laravel.
  - `laravel/pail` (^1.2) — Log tailing real-time.

### Frontend UI Libraries
- **Motion & Animasi:** `animejs` (^4.4) — Transisi state entrance, page tabs, dan micro-interactions.
- **Modal & Alert:** `sweetalert2` (^11.26) — Dialog konfirmasi tindakan destruktif dan notifikasi feedback.
- **Kalender SPMB:** `@fullcalendar/*` (^6.1) — Grid agenda pendaftaran dan kalender kegiatan SPMB.
- **Visualisasi Data:** `recharts` (^3.8) — Grafik statistik pendaftar dan tren metrik dashboard.
- **Form Controls:** `react-select` (^5.10), `flatpickr` (^4.6) — Custom dropdown dark-mode dan pemilih tanggal.
- **Media Preview:** `react-pdf` (^10.4), `yet-another-react-lightbox` (^3.29) — Pratinjau aman berkas dokumen dan kartu identitas.
- **Matematika Ujian:** `katex` & `react-katex` (^3.1) — Render formula matematika pada modul soal CBT.

---

## 3. Environment & Runtime Profiles

| Parameter | Lingkungan Lokal | Lingkungan Demo / Staging | Lingkungan Produksi |
|---|---|---|---|
| **Web Server** | Apache 2.4 (Docker) / `artisan serve` | Apache 2.4 (Docker) | Apache / Nginx Reverse Proxy |
| **APP_DEBUG** | `true` | `false` | `false` |
| **Database** | MariaDB `sentinel_admission_db` | MariaDB | MariaDB (Dedicated / Managed) |
| **Asset Serving** | Vite Dev Server (`npm run dev`) | Pre-built Vite (`npm run build`) | Pre-built Vite (`npm run build`) |
| **WebSockets** | `ws://localhost:8085` | `wss://spmb.playground-ku.my.id:443` | `wss://domain.com:443` |
| **Mail Provider** | Mailtrap Sandbox | Resend SMTP | Resend / Transactional SMTP |
| **Storage Driver** | `local` (`storage/app/private/`) | `local` (Private) | `local` Private / S3 Private |
