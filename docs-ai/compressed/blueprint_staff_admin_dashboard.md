# Blueprint: Staff & Admin Dashboard
> Sentinel Admission — Branch: `feat/staff-admin-dashboard`
> Dev Mode · April 2026
> **Panduan build untuk Livi. Kerjakan Phase 1 (fixes) → Phase 2 (Staff) → Phase 3 (Admin).**

---

## Overview & Tujuan

Build halaman dashboard untuk role Staff dan Admin. Menggunakan shared layout
(`DashboardLayout`) yang sudah ada — tidak ada layout baru. Sidebar sudah role-aware,
navigation sudah ada skeleton, tinggal isi pages & fix inkonsistensi yang ditemukan saat audit.

| | |
|---|---|
| **Branch** | `feat/staff-admin-dashboard` |
| **Dev Mode** | `localhost:8080` / `npm run dev` |
| **Prioritas** | Staff Dashboard dulu, Admin belakangan |
| **Layout** | Reuse `DashboardLayout` + `DashboardSplitLayout` — zero layout baru |

### Keputusan Arsitektur
- **Opsi B**: Staff `/dashboard/staff/*`, Admin `/dashboard/admin/*` — terpisah penuh
- Staff scope kandidat: **semua gelombang** (filter UI ada, bukan pembatas akses)
- Menu Verifikasi di navigation Staff: **dihapus** — diganti filter di halaman Kandidat
- Profile page: **terpisah per role** — konten berbeda untuk kandidat/staff/admin
- Accent color Staff: **emerald-500** · Admin: **rose-500**

---

## PHASE 1 — FIXES WAJIB (Selesaikan Dulu Sebelum Build Apapun)

> Semua ini adalah bug/inkonsistensi yang ditemukan saat audit. Harus bersih sebelum Phase 2.

---

### 1.1 Fix `Staff/DashboardController.php`

#### Method `show()` — field salah

```php
// ❌ SEKARANG (salah semua):
'document_type'  => $d->document_type,
'document_owner' => $d->document_owner,
'admin_note'     => $d->admin_note,

// ✅ GANTI JADI:
'doc_type'         => $d->doc_type,
'doc_group'        => $d->doc_group,
'rejection_reason' => $d->rejection_reason,
'verified_by'      => $d->verified_by,
'verified_at'      => $d->verified_at?->format('d M Y H:i'),
```

#### Method `show()` — guardian section salah

```php
// ❌ SEKARANG:
'whatsapp_number' => $candidate->guardian->whatsapp_number,

// ✅ GANTI JADI:
'father_name'   => $candidate->guardian->father_name,
'father_phone'  => $candidate->guardian->father_phone,
'mother_name'   => $candidate->guardian->mother_name,
'mother_phone'  => $candidate->guardian->mother_phone,
'guardian_name' => $candidate->guardian->guardian_name,
'guardian_phone'=> $candidate->guardian->guardian_phone,
'no_kk'         => $candidate->guardian->no_kk,
```

#### Method `verifyDocument()` — enum & field salah

```php
// ❌ SEKARANG:
$request->validate([
    'status'     => ['required', 'in:valid,invalid'],
    'admin_note' => ['nullable', 'string', 'max:500'],
]);

$document->update([
    'status'     => $request->status,
    'admin_note' => $request->admin_note,
]);

$allValid = $candidate->documents->every(fn ($d) => $d->status === 'valid');

// ✅ GANTI JADI:
$request->validate([
    'status'           => ['required', 'in:verified,rejected'],
    'rejection_reason' => ['nullable', 'required_if:status,rejected', 'string', 'max:500'],
]);

$document->update([
    'status'           => $request->status,
    'rejection_reason' => $request->status === 'rejected' ? $request->rejection_reason : null,
    'verified_by'      => Auth::id(),
    'verified_at'      => now(),
]);

$allVerified = $candidate->documents()->where('status', '!=', 'verified')->doesntExist();

if ($allVerified && $candidate->documents()->count() > 0) {
    $candidate->update(['status' => 'verified']);
}
```

> ⚠️ Tambahkan `use Illuminate\Support\Facades\Auth;` di import jika belum ada.

---

### 1.2 Fix `Topbar.tsx` — Profile Link Hardcoded

```tsx
// ❌ SEKARANG:
<Link href="/dashboard/profile" ...>
    Profil Saya
</Link>

// ✅ GANTI JADI:
// Tambah di dalam component, setelah deklarasi const yang ada:
const { auth } = usePage<PageProps>().props;
const role = auth.user.role ?? 'candidate';
const profileHref =
    role === 'staff' ? '/dashboard/staff/profile' :
    role === 'admin' ? '/dashboard/admin/profile' :
    '/dashboard/profile';

// Lalu ganti href:
<Link href={profileHref} ...>
    Profil Saya
</Link>
```

---

### 1.3 Fix `navigation.ts` — Staff Section

```ts
// ❌ SEKARANG:
staff: [
    {
        group: "Menu",
        items: [
            { label: "Dashboard",  href: "/dashboard/staff",            icon: "fa-solid fa-house",        exact: true },
            { label: "Kandidat",   href: "/dashboard/staff/candidates", icon: "fa-solid fa-users" },
            { label: "Verifikasi", href: "/dashboard/staff/verify",     icon: "fa-solid fa-shield-halved" },
        ],
    },
    ...
]

// ✅ GANTI JADI:
staff: [
    {
        group: "Menu",
        items: [
            { label: "Dashboard", href: "/dashboard/staff",            icon: "fa-solid fa-house",  exact: true },
            { label: "Kandidat",  href: "/dashboard/staff/candidates", icon: "fa-solid fa-users" },
        ],
    },
    {
        group: "Akun",
        items: [
            { label: "Profil", href: "/dashboard/staff/profile", icon: "fa-solid fa-circle-user" },
        ],
    },
],
```

> Alasan: menu "Verifikasi" dihapus — verifikasi dilakukan via filter di halaman Kandidat.
> "Profil" href sudah diupdate dari `/dashboard/staff/profile` → sudah benar di file asli ✅.

---

### 1.4 Tambah Routes di `web.php`

Tambahkan di dalam blok Staff:

```php
// Staff Profile
Route::get('/profile',  [StaffProfile::class, 'show'])   ->name('profile');
Route::put('/profile',  [StaffProfile::class, 'update']) ->name('profile.update');

// Staff Candidates Index
Route::get('/candidates', [StaffDashboard::class, 'candidates']) ->name('candidates.index');
```

Tambahkan di dalam blok Admin:

```php
// Admin Profile
Route::get('/profile',  [AdminProfile::class, 'show'])   ->name('profile');
Route::put('/profile',  [AdminProfile::class, 'update']) ->name('profile.update');

// Admin Candidates
Route::get('/candidates', [AdminCandidate::class, 'index']) ->name('candidates.index');

// Admin Waves
Route::get('/waves', [AdminWave::class, 'index']) ->name('waves.index');

// Admin Staff
Route::get('/staff-list', [AdminStaffCtrl::class, 'index']) ->name('staff.index');
```

Tambahkan import di atas file:

```php
use App\Http\Controllers\Staff\ProfileController     as StaffProfile;
use App\Http\Controllers\Admin\ProfileController     as AdminProfile;
use App\Http\Controllers\Admin\CandidateController   as AdminCandidate;
use App\Http\Controllers\Admin\WaveController        as AdminWave;
use App\Http\Controllers\Admin\StaffController       as AdminStaffCtrl;
```

---

### 1.5 Checklist Phase 1

```
[ ] Staff DashboardController show() — field doc_type, rejection_reason, guardian fixed
[ ] Staff DashboardController verifyDocument() — enum verified/rejected, verified_by/at fixed
[ ] Topbar.tsx — profileHref dinamis per role
[ ] navigation.ts — Staff: hapus Verifikasi, tambah Profil dengan href benar
[ ] web.php — semua route baru terdaftar
[ ] php artisan route:list | grep staff → semua routes muncul
[ ] php artisan route:list | grep admin → semua routes muncul
[ ] Tidak ada error 500 saat akses /dashboard/staff atau /dashboard/admin
```

---

## PHASE 2 — STAFF DASHBOARD

> Kerjakan Phase 2 hanya setelah seluruh checklist Phase 1 bersih.

---

### 2.1 Controller Baru: `Staff/ProfileController.php`

```php
namespace App\Http\Controllers\Staff;

// Index: return data user yang login (staff)
// Update: nama, email, password (optional), avatar
// Tidak ada candidate-specific data
// Gunakan Auth::user() langsung
```

Props yang dikirim ke Inertia:
```php
'user' => [
    'id', 'name', 'email', 'role', 'is_active',
    'avatar_url', 'initials', 'whatsapp_number',
    'created_at' → format('d F Y'),
]
```

---

### 2.2 Method Baru di `Staff/DashboardController.php`: `candidates()`

```php
public function candidates(Request $request): Response
{
    $search = $request->input('search', '');
    $status = $request->input('status', '');
    $wave   = $request->input('wave', '');

    $query = Candidate::with(['user', 'admissionWave', 'documents'])
        ->when($search, fn ($q) => $q
            ->where('full_name', 'like', "%{$search}%")
            ->orWhere('nisn',    'like', "%{$search}%")
            ->orWhere('candidate_code', 'like', "%{$search}%")
        )
        ->when($status, fn ($q) => $q->where('status', $status))
        ->when($wave,   fn ($q) => $q->where('admission_wave_id', $wave))
        ->latest();

    return Inertia::render('Dashboard/Staff/Candidates', [
        'candidates' => $query->paginate(20)->through(fn ($c) => [
            'id'             => $c->id,
            'candidate_code' => $c->candidate_code,
            'full_name'      => $c->full_name,
            'nisn'           => $c->nisn,
            'gender_label'   => $c->genderLabel(),
            'school_origin'  => $c->school_origin,
            'status'         => $c->status,
            'admission_wave' => $c->admissionWave?->title,
            'doc_total'      => $c->documents->count(),
            'doc_pending'    => $c->documents->where('status', 'pending')->count(),
            'doc_rejected'   => $c->documents->where('status', 'rejected')->count(),
            'created_at'     => $c->created_at->format('d M Y'),
        ]),
        'waves' => AdmissionWave::select('id', 'title')->get(),
        'filters' => compact('search', 'status', 'wave'),
        'stats' => [
            'total'     => Candidate::count(),
            'submitted' => Candidate::where('status', 'submitted')->count(),
            'verified'  => Candidate::where('status', 'verified')->count(),
            'pending_docs' => CandidateDocument::where('status', 'pending')->count(),
        ],
    ]);
}
```

> Tambahkan `use App\Models\AdmissionWave;` dan `use App\Models\CandidateDocument;` di import.

---

### 2.3 Pages — Staff

#### `Pages/Dashboard/Staff/Index.tsx`

Layout: `DashboardLayout` (tanpa aside)
Accent: `emerald-500`

Konten:
```
┌─ Header ────────────────────────────────────────────────────┐
│  Icon fa-shield-halved emerald · "Dashboard Staff"          │
│  Sub: "Selamat datang, {nama}. Sistem berjalan normal."     │
└─────────────────────────────────────────────────────────────┘
┌─ Stats Cards (4 cards, grid 2x2 mobile / 4x1 desktop) ─────┐
│  Total Kandidat · Menunggu Verifikasi · Terverifikasi       │
│  Dokumen Pending                                            │
│  Warna cards: emerald untuk highlight, slate untuk lainnya  │
└─────────────────────────────────────────────────────────────┘
┌─ Recent Submissions (5 terbaru status=submitted) ───────────┐
│  Tabel ringkas: nama · gelombang · tanggal · badge status   │
│  Tombol "Lihat Semua" → /dashboard/staff/candidates         │
└─────────────────────────────────────────────────────────────┘
┌─ Dokumen Menunggu (quick overview) ─────────────────────────┐
│  Counter per kelompok dokumen (identity/academic/dll)       │
└─────────────────────────────────────────────────────────────┘
```

#### `Pages/Dashboard/Staff/Candidates.tsx`

Layout: `DashboardLayout` (tanpa aside)
Accent: `emerald-500`

Konten:
```
┌─ Header + Filter Bar (sticky) ──────────────────────────────┐
│  Search input · Filter status (pill/select) · Filter wave   │
└─────────────────────────────────────────────────────────────┘
┌─ Stats mini (inline, bukan cards besar) ────────────────────┐
│  "X total · X submitted · X verified"                       │
└─────────────────────────────────────────────────────────────┘
┌─ Tabel Kandidat ────────────────────────────────────────────┐
│  Kolom: Nama · NISN · Asal Sekolah · Gelombang · Dokumen   │
│         Status badge · Aksi (Lihat Detail)                  │
│  Klik baris → /dashboard/staff/candidates/{id}             │
│  Paginate 20, Inertia preserveScroll                        │
└─────────────────────────────────────────────────────────────┘
```

Filter status pills: Semua · Draft · Menunggu Verifikasi · Terverifikasi · Diterima · Ditolak

#### `Pages/Dashboard/Staff/Show.tsx`

Layout: `DashboardLayout` (tanpa aside)
Accent: `emerald-500`

Konten:
```
┌─ Header + Back Button ──────────────────────────────────────┐
│  ← Kembali ke Daftar     Nama Kandidat + badge status       │
└─────────────────────────────────────────────────────────────┘
┌─ Tab Bar (sticky) ──────────────────────────────────────────┐
│  Identitas · Wali · Dokumen · Pembayaran                    │
└─────────────────────────────────────────────────────────────┘

Tab Identitas:
  Grid 2 kolom: semua data kandidat (read-only InfoRow style)
  Full name, NISN, NIK, gender, TTL, asal sekolah, program, dll

Tab Wali:
  Data ayah, ibu, wali — read-only

Tab Dokumen: (ini tab terpenting untuk staff)
  Per dokumen:
    - Label doc_type · Badge status (pending/verified/rejected)
    - Tombol "Lihat File" (preview — pakai route serve)
    - Jika pending:
        Tombol "Verifikasi ✓" → modal konfirmasi → POST verify
        Tombol "Tolak ✗" → modal dengan textarea rejection_reason
    - Jika rejected: tampilkan rejection_reason
    - Jika verified: tampilkan verified_by nama + verified_at

Tab Pembayaran:
  Info pembayaran: status · channel · bukti (jika manual)
  Tombol approve/reject pembayaran manual

┌─ Action Bar bawah ──────────────────────────────────────────┐
│  Status saat ini: badge besar                               │
│  Jika status=verified:                                      │
│    [Terima Kandidat]  [Tolak Kandidat] — 2-step confirm     │
└─────────────────────────────────────────────────────────────┘
```

#### `Pages/Dashboard/Staff/Profile.tsx`

Layout: `DashboardLayout` (tanpa aside)
Accent: `emerald-500`

Konten:
```
┌─ Avatar section ────────────────────────────────────────────┐
│  Avatar besar · tombol ganti foto · nama · badge role Staff │
└─────────────────────────────────────────────────────────────┘
┌─ Form Edit ─────────────────────────────────────────────────┐
│  Nama lengkap · Email · Nomor WhatsApp                      │
│  Section Keamanan: Ganti Password (current + new + confirm) │
└─────────────────────────────────────────────────────────────┘
┌─ Info Read-Only ────────────────────────────────────────────┐
│  Role: Staff · Bergabung sejak: {created_at}               │
│  Status akun: Aktif / Suspended                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.4 Checklist Phase 2

```
[ ] Staff/Index.tsx tampil di /dashboard/staff dengan stats benar
[ ] Staff/Candidates.tsx — search, filter status, filter wave bekerja
[ ] Staff/Candidates.tsx — paginate 20 bekerja
[ ] Staff/Show.tsx — 4 tab tampil dengan benar
[ ] Staff/Show.tsx — Tab Dokumen: verify flow bekerja (status berubah ke verified)
[ ] Staff/Show.tsx — Tab Dokumen: reject flow bekerja (rejection_reason tersimpan)
[ ] Staff/Show.tsx — verified_by terisi nama staff yang login
[ ] Staff/Show.tsx — verified_at terisi timestamp
[ ] Staff/Show.tsx — tombol Terima/Tolak kandidat bekerja (2-step confirm)
[ ] Staff/Profile.tsx — edit nama, email, WA bekerja
[ ] Staff/Profile.tsx — ganti password bekerja
[ ] Sidebar Staff menampilkan menu yang benar (Dashboard · Kandidat · Profil)
[ ] Topbar profile link → /dashboard/staff/profile ✅
[ ] Test di mobile 375px — touch target minimum 44px
[ ] Tidak ada console error TypeScript
```

---

## PHASE 3 — ADMIN DASHBOARD

> Kerjakan Phase 3 setelah Phase 2 selesai & tested.

---

### 3.1 Controllers Baru

#### `Admin/ProfileController.php`
Identik dengan Staff/ProfileController — beda namespace & route saja.

#### `Admin/CandidateController.php`

```php
// index() — list semua kandidat dengan filter lengkap
// Mirip Staff candidates() tapi tambah aksi delete
// Props: candidates (paginate), waves, filters, stats
```

#### `Admin/WaveController.php`

```php
// index() — list semua gelombang
// Props:
'waves' => AdmissionWave::withCount('candidates')
    ->latest()->get()
    ->map(fn ($w) => [
        'id', 'title', 'academic_year', 'start_date', 'end_date',
        'quota_target', 'is_active', 'majors_enabled',
        'candidates_count',
        'quota_filled' => $w->candidates()->where('status', 'accepted')->count(),
    ])
```

#### `Admin/StaffController.php`

```php
// index() — list semua user role=staff
// Props:
'staff_list' => User::where('role', 'staff')->latest()->get()->map(fn ($s) => [
    'id', 'name', 'email', 'is_active', 'whatsapp_number',
    'created_at' → format('d M Y'),
    'candidates_handled' → (future, skip dulu)
])
```

---

### 3.2 Pages — Admin

#### `Pages/Dashboard/Admin/Index.tsx`

Layout: `DashboardLayout` (tanpa aside)
Accent: `rose-500`

Konten:
```
┌─ Header ────────────────────────────────────────────────────┐
│  Icon fa-gauge rose · "Dashboard Admin"                     │
│  Sub: "Kontrol penuh sistem pendaftaran"                    │
└─────────────────────────────────────────────────────────────┘
┌─ Stats Cards (grid 2x2 mobile / 4x1 desktop) ──────────────┐
│  Total Kandidat · Kuota Terisi · Pending Verifikasi         │
│  Total Staff Aktif                                          │
└─────────────────────────────────────────────────────────────┘
┌─ Gelombang Aktif (card highlight) ──────────────────────────┐
│  Nama gelombang · Periode · Progress bar kuota              │
│  quota_filled / quota_target dengan visual progress         │
└─────────────────────────────────────────────────────────────┘
┌─ Grid 2 kolom ──────────────────────────────────────────────┐
│  Kiri: Recent Candidates (5 terbaru)                        │
│  Kanan: Staff List + toggle aktif/suspend                   │
└─────────────────────────────────────────────────────────────┘
```

#### `Pages/Dashboard/Admin/Candidates.tsx`

Layout: `DashboardLayout`
Accent: `rose-500`

Identik dengan `Staff/Candidates.tsx` tapi tambah:
- Kolom aksi: tombol Hapus (soft delete, 2-step confirm SweetAlert2)
- Filter lebih: per program, per jurusan

#### `Pages/Dashboard/Admin/Waves.tsx`

Layout: `DashboardLayout`
Accent: `rose-500`

Konten:
```
┌─ Header ──────────────────────────────────────────────────┐
│  "Gelombang Pendaftaran" · info gelombang aktif sekarang  │
└───────────────────────────────────────────────────────────┘
┌─ Cards per Gelombang ─────────────────────────────────────┐
│  Tiap card:                                               │
│    Title · Tahun Ajaran · Periode buka-tutup             │
│    Progress bar: quota_filled / quota_target              │
│    Badge: AKTIF / TUTUP                                   │
│    Tombol toggle Buka/Tutup (2-step confirm)              │
└───────────────────────────────────────────────────────────┘
```

> ⚠️ Toggle gelombang: nonaktifkan semua dulu baru aktifkan yang dipilih
> (logic sudah ada di AdminDashboardController::toggleWave ✅)

#### `Pages/Dashboard/Admin/Staff.tsx`

Layout: `DashboardLayout`
Accent: `rose-500`

Konten:
```
┌─ Header ──────────────────────────────────────────────────┐
│  "Manajemen Staff" · total aktif / total terdaftar        │
└───────────────────────────────────────────────────────────┘
┌─ Tabel Staff ─────────────────────────────────────────────┐
│  Nama · Email · WA · Bergabung · Status badge             │
│  Toggle Aktif/Suspend — inline switch                     │
└───────────────────────────────────────────────────────────┘
```

#### `Pages/Dashboard/Admin/Profile.tsx`

Layout: `DashboardLayout`
Accent: `rose-500`

Identik dengan `Staff/Profile.tsx` — beda badge role = "Administrator".

---

### 3.3 Checklist Phase 3

```
[ ] Admin/Index.tsx tampil di /dashboard/admin dengan stats benar
[ ] Progress bar kuota gelombang aktif akurat
[ ] Admin/Candidates.tsx — delete kandidat bekerja (soft delete)
[ ] Admin/Waves.tsx — toggle gelombang bekerja, hanya 1 aktif sekaligus
[ ] Admin/Staff.tsx — toggle aktif/suspend bekerja
[ ] Admin/Profile.tsx — edit profil bekerja
[ ] Sidebar Admin menampilkan menu yang benar
[ ] Topbar profile link → /dashboard/admin/profile ✅
[ ] Admin tidak bisa akses /dashboard/staff/* (middleware block)
[ ] Staff tidak bisa akses /dashboard/admin/* (middleware block)
[ ] Test di mobile 375px
[ ] Tidak ada console error TypeScript
```

---

## Ringkasan Semua File yang Disentuh

| Phase | File | Aksi |
|---|---|---|
| 1 | `app/Http/Controllers/Staff/DashboardController.php` | Edit — fix field names, enum, verified_by/at |
| 1 | `resources/js/Components/Dashboard/Shared/Topbar.tsx` | Edit — profileHref dinamis per role |
| 1 | `resources/js/config/navigation.ts` | Edit — hapus Verifikasi dari Staff menu |
| 1 | `routes/web.php` | Edit — tambah routes Staff & Admin baru |
| 2 | `app/Http/Controllers/Staff/ProfileController.php` | Baru |
| 2 | `app/Http/Controllers/Staff/DashboardController.php` | Edit — tambah method candidates() |
| 2 | `resources/js/Pages/Dashboard/Staff/Index.tsx` | Baru |
| 2 | `resources/js/Pages/Dashboard/Staff/Candidates.tsx` | Baru |
| 2 | `resources/js/Pages/Dashboard/Staff/Show.tsx` | Baru |
| 2 | `resources/js/Pages/Dashboard/Staff/Profile.tsx` | Baru |
| 3 | `app/Http/Controllers/Admin/ProfileController.php` | Baru |
| 3 | `app/Http/Controllers/Admin/CandidateController.php` | Baru |
| 3 | `app/Http/Controllers/Admin/WaveController.php` | Baru |
| 3 | `app/Http/Controllers/Admin/StaffController.php` | Baru |
| 3 | `resources/js/Pages/Dashboard/Admin/Index.tsx` | Baru |
| 3 | `resources/js/Pages/Dashboard/Admin/Candidates.tsx` | Baru |
| 3 | `resources/js/Pages/Dashboard/Admin/Waves.tsx` | Baru |
| 3 | `resources/js/Pages/Dashboard/Admin/Staff.tsx` | Baru |
| 3 | `resources/js/Pages/Dashboard/Admin/Profile.tsx` | Baru |

**Total: 19 file** (7 edit · 12 baru)

---

## Future Features (Catat, Tidak Dibangun Sekarang)

```
- Notifikasi WA otomatis via Fonnte
- Auto-hitung & alert kuota gelombang mendekati penuh
- Halaman Reports/Laporan Admin (grafik, export PDF/Excel)
- Halaman Settings Admin (konfigurasi payment, gelombang baru)
- Kandidat bisa re-upload dokumen setelah rejected
- Staff filter kandidat per tanggal daftar
```

---

*Sentinel Admission · Blueprint oleh Livi · Jangan execute sebelum Silvia konfirmasi ✅*
