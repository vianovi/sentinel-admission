# Blueprint: Staff & Admin Auth
> Sentinel Admission — Branch: `feat/auth-staff-admin`
> Dev Mode · April 2026
> **Panduan build untuk Livi. Kerjakan Phase 1 sampai bersih sebelum lanjut Phase 2.**

---

## Overview & Tujuan

Fitur autentikasi terpisah untuk Staff dan Admin. Kandidat tetap pakai `/login`, staff/admin pakai `/staff/login`. Salah pintu → tampil halaman WrongPortal. Semua session idle 30 menit → auto-logout.

| | |
|---|---|
| **Branch** | `feat/auth-staff-admin` (checkout dari `develop`) |
| **Dev Mode** | `localhost:8080` / `npm run dev` |
| **Scope** | Staff login page, Wrong Portal page, Auto-Logout Idle |
| **Tidak diubah** | `Login.tsx` kandidat, `RoleMiddleware`, semua route existing |

### Keputusan Arsitektur
- **Opsi B** dipilih: halaman login terpisah
- `/login` → kandidat saja
- `/staff/login` → staff & admin saja
- Single guard `web`, satu tabel `users`, role dibedakan via kolom `role`
- **WrongPortal** di-render langsung via `Inertia::render()` — bukan redirect ke URL baru (agar tidak expose endpoint)
- **Auto-logout idle** di frontend saja — tidak perlu backend baru

---

## PHASE 1 — BACKEND

> Selesaikan seluruh Phase 1 dan pastikan tidak ada error sebelum lanjut ke Phase 2.

---

### 1.1 Tambah Routes — `routes/auth.php`

Tambahkan di dalam blok `Route::middleware('guest')->group(...)`:

```php
// Staff & Admin Login
Route::get('staff/login',  [AuthenticatedSessionController::class, 'createStaff'])
    ->name('staff.login');

Route::post('staff/login', [AuthenticatedSessionController::class, 'storeStaff'])
    ->name('staff.login.post');
```

**Catatan:**
- Harus di dalam `middleware('guest')` agar staff yang sudah login tidak bisa akses lagi
- Named route: `staff.login` dan `staff.login.post`
- Tidak perlu route `/wrong-portal` — WrongPortal di-handle sebagai Inertia response dari controller

---

### 1.2 Edit `AuthenticatedSessionController.php`

Tambah dua method baru dan modifikasi `store()` yang sudah ada.

#### Method `createStaff()` — baru

```php
public function createStaff(Request $request): Response
{
    return Inertia::render('Auth/StaffLogin', [
        'status' => session('status'),
    ]);
}
```

#### Method `storeStaff()` — baru

Logic: authenticate dulu, baru cek role. Jika role = candidate → logout paksa, render WrongPortal.

```php
public function storeStaff(LoginRequest $request): Response|RedirectResponse
{
    $request->authenticate();
    Auth::logoutOtherDevices($request->password);
    $request->session()->regenerate();

    $role = Auth::user()->role;

    // Candidate nyasar ke portal staff
    if ($role === 'candidate') {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Inertia::render('Errors/WrongPortal', [
            'from'         => 'staff',
            'correctRoute' => route('login'),
        ]);
    }

    return match ($role) {
        'admin' => redirect()->intended(route('admin.dashboard')),
        'staff' => redirect()->intended(route('staff.dashboard')),
    };
}
```

#### Modifikasi `store()` — method existing

Tambah pengecekan jika staff/admin nyasar ke `/login` kandidat:

```php
public function store(LoginRequest $request): Response|RedirectResponse
{
    $request->authenticate();
    Auth::logoutOtherDevices($request->password);
    $request->session()->regenerate();

    $role = Auth::user()->role;

    // Staff/admin nyasar ke portal kandidat
    if (in_array($role, ['staff', 'admin'])) {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Inertia::render('Errors/WrongPortal', [
            'from'         => 'candidate',
            'correctRoute' => route('staff.login'),
        ]);
    }

    return redirect()->intended(route('dashboard.index'));
}
```

**Catatan penting:**
- Selalu `logout()` + `invalidate()` sebelum render WrongPortal — user tidak boleh ter-auth walau salah pintu
- `Inertia::render()` langsung, bukan redirect — URL tidak berubah, tidak expose endpoint
- Return type berubah jadi `Response|RedirectResponse` — update type hint di kedua method
- Jangan lupa pastikan `use Inertia\Response;` sudah ada di import

---

### 1.3 Checklist Phase 1

Verifikasi semua poin ini sebelum lanjut ke Phase 2:

```
[ ] Route staff.login dan staff.login.post terdaftar
[ ] php artisan route:list | grep staff → tampil 2 routes
[ ] Login akun staff (staff@spmb.com) via /staff/login → redirect ke /dashboard/staff
[ ] Login akun admin (admin@spmb.com) via /staff/login → redirect ke /dashboard/admin
[ ] Login akun kandidat (silvia@spmb.com) via /staff/login → tampil WrongPortal (from=staff)
[ ] Login akun staff via /login kandidat → tampil WrongPortal (from=candidate)
[ ] Tidak ada error 500 di semua skenario di atas
[ ] Session ter-invalidate dengan benar setelah WrongPortal ditampilkan
```

---

## PHASE 2 — FRONTEND

> Kerjakan Phase 2 hanya setelah seluruh checklist Phase 1 bersih.

---

### 2.1 `Pages/Auth/StaffLogin.tsx` — baru

Halaman login khusus staff & admin. Vibe **"Command Center"** — berbeda jelas dari kandidat.

#### Left Panel
- Background: `bg-gradient-to-b from-slate-950 via-[#0a1628] to-slate-950`
- Orbs ambient: **biru dan cyan** — bukan gold/amber seperti kandidat
- Logo area: sama dengan `Login.tsx`, link ke `route('home')`
- Heading besar: `"Portal Staff & Tenaga Pendidik"`
- Sub-text: `"Akses terbatas untuk tenaga pendidik dan administrasi."`
- Feature list diganti **Stat Preview** (static/placeholder):
  - `fa-users-line` → `"XX Kandidat Aktif"`
  - `fa-file-check` → `"XX Dokumen Menunggu Verifikasi"`
  - `fa-circle-check` → `"Sistem Online"`
- Bottom link: `"← Portal Kandidat"` → `route('login')`

#### Right Panel
- Background: `bg-slate-50` (sama dengan `Login.tsx`)
- Form card: `bg-white` solid — **TIDAK** pakai glassmorphism/backdrop-blur
- Border radius card: `rounded-2xl` (lebih sharp dari `rounded-[2rem]` kandidat)
- Header form: `"Masuk ke Portal Staff"`
- Sub-header: `"Khusus tenaga pendidik dan administrasi sekolah."`
- Field email & password: identik `Login.tsx`
- Show/hide password: ada
- Remember me: ada
- Lupa password: ada → `route('password.request')` — satu flow reset untuk semua
- Tombol submit: `bg-blue-600 hover:bg-blue-700` — **BUKAN** gold/slate seperti kandidat
- Submit label: `"Masuk ke Dashboard"`
- **TIDAK ada** link "Daftar sekarang"
- Tombol kembali ke beranda: ada di top-left (identik `Login.tsx`)
- Security badge bawah: ada

#### Animasi
- Identik `Login.tsx`: left panel fade+slide, fields stagger opacity+translateY
- Error shake pada tombol submit saat kredensial salah
- Gunakan class `login-field` dan `login-btn` yang sama

#### Form Submit
```tsx
post(route('staff.login.post'), {
    onFinish: () => reset('password'),
    onError: () => {
        animate('.login-btn', {
            translateX: [0, -8, 8, -6, 6, 0],
            duration: 420,
            ease: 'outExpo',
        })
    },
})
```

---

### 2.2 `Pages/Errors/WrongPortal.tsx` — baru

Halaman standalone tanpa navbar/layout. Muncul ketika user login di portal yang salah.

#### Props dari Controller
```tsx
interface WrongPortalProps {
    from: 'staff' | 'candidate'
    correctRoute: string
}
```

#### Konten Dinamis

| `from` | Judul | Sub | Tombol |
|---|---|---|---|
| `staff` | "Kamu Terdaftar sebagai Kandidat" | "Halaman ini hanya untuk Staff & Admin." | "Bawa Saya ke Portal Kandidat" → `correctRoute` |
| `candidate` | "Kamu Terdaftar sebagai Staff / Admin" | "Halaman ini hanya untuk Kandidat." | "Bawa Saya ke Portal Staff" → `correctRoute` |

#### Design
- Full screen `bg-slate-950`, content di-center
- Warning icon besar: `fa-triangle-exclamation`, `text-amber-400`, ukuran `w-16 h-16`
- Judul: `text-white text-3xl font-bold`
- Sub: `text-slate-400`
- Tombol CTA warna sesuai portal tujuan:
  - Menuju `/login` (kandidat) → `bg-slate-800 hover:bg-slate-700`
  - Menuju `/staff/login` (staff) → `bg-blue-600 hover:bg-blue-700`
- Entrance animation: fade + scale dengan anime.js
- **TIDAK** ada link lain, **TIDAK** ada navbar

---

### 2.3 `hooks/useIdleLogout.ts` — baru

Hook auto-logout ketika user tidak aktif di dalam dashboard.

#### Behavior
- Idle timeout: **30 menit** (1800 detik) — configurable via parameter
- Warning modal muncul: **2 menit sebelum logout** (sisa 120 detik)
- Warning modal: countdown timer live, tombol "Saya Masih Di Sini" untuk reset timer
- Timeout habis: `POST` ke `route('logout')` otomatis via Inertia
- Events yang di-listen: `mousemove`, `keydown`, `scroll`, `touchstart`, `click`
- Timer di-reset setiap kali ada event di atas

#### Mounting
- Mount di `DashboardLayout.tsx`
- Mount di `DashboardSplitLayout.tsx`
- Covers semua role: kandidat, staff, admin
- **TIDAK** di-mount di halaman publik atau auth pages

#### Warning Modal
- Overlay gelap di atas semua konten
- Card warning: judul `"Sesi Hampir Berakhir"`, countdown detik live
- Tombol `"Saya Masih Di Sini"` → reset timer, tutup modal
- Tombol `"Logout Sekarang"` → langsung POST logout
- Gunakan SweetAlert2 atau custom modal — konsisten dengan sistem yang sudah ada

---

### 2.4 Checklist Phase 2

```
[ ] StaffLogin.tsx tampil dengan benar di /staff/login
[ ] Left panel navy + orbs biru/cyan (BUKAN gold)
[ ] Tombol submit biru, bukan gold/slate
[ ] Tidak ada link "Daftar sekarang" di StaffLogin
[ ] Animasi entrance bekerja (left panel + field stagger)
[ ] Error shake bekerja saat kredensial salah
[ ] WrongPortal.tsx tampil saat kandidat coba login di /staff/login
[ ] WrongPortal.tsx tampil saat staff/admin coba login di /login
[ ] Konten WrongPortal sesuai prop from (pesan berbeda per skenario)
[ ] Tombol CTA WrongPortal mengarah ke portal yang benar
[ ] Auto-logout idle aktif setelah 30 menit tidak ada aktivitas
[ ] Warning modal muncul 2 menit sebelum logout
[ ] Tombol "Saya Masih Di Sini" mereset timer dengan benar
[ ] useIdleLogout tidak aktif di halaman publik/auth
[ ] Test di mobile 375px — semua touch target minimum 44px
```

---

## Risks & Anti-Pattern

```
⚠️  storeStaff() WAJIB logout + invalidate session sebelum render WrongPortal
⚠️  Jangan expose role detail di URL — cukup "salah portal", tidak perlu detail teknis
⚠️  useIdleLogout HANYA aktif di dalam DashboardLayout / DashboardSplitLayout
⚠️  Dark mode classes harus hardcoded — tidak boleh dynamic string
⚠️  Return type store() dan storeStaff() harus diupdate ke Response|RedirectResponse
⚠️  Pastikan use Inertia\Response ada di import controller setelah modifikasi
```

---

## Ringkasan File yang Disentuh

| Phase | File | Aksi |
|---|---|---|
| 1 | `routes/auth.php` | Edit — tambah 2 route |
| 1 | `app/Http/Controllers/Auth/AuthenticatedSessionController.php` | Edit — tambah 2 method, modif `store()` |
| 2 | `resources/js/Pages/Auth/StaffLogin.tsx` | Baru |
| 2 | `resources/js/Pages/Errors/WrongPortal.tsx` | Baru |
| 2 | `resources/js/hooks/useIdleLogout.ts` | Baru |
| 2 | `resources/js/Layouts/DashboardLayout.tsx` | Edit — mount `useIdleLogout` |
| 2 | `resources/js/Layouts/DashboardSplitLayout.tsx` | Edit — mount `useIdleLogout` |

---

*Sentinel Admission · Blueprint oleh Livi · Jangan execute sebelum semua poin disepakati*
