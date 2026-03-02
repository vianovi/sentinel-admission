# Dashboard Blueprint — Sentinel Admission System

## Overview

Dashboard dibagi 3 role, masing-masing punya route, layout, dan fitur sendiri.
Tidak ada overlap — setiap role benar-benar terisolasi.

```
/dashboard          → Candidate
/dashboard/staff    → Staff
/dashboard/admin    → Admin
```

---

## Struktur Folder (Target Akhir)

```
resources/js/
├── Components/
│   ├── Dashboard/
│   │   ├── Shared/
│   │   │   ├── Sidebar.tsx          ← navigasi sidebar (beda per role)
│   │   │   ├── Topbar.tsx           ← header atas (notif, avatar, logout)
│   │   │   ├── StatCard.tsx         ← kartu statistik reusable
│   │   │   └── EmptyState.tsx       ← tampilan kosong reusable
│   │   ├── Candidate/
│   │   │   ├── StatusTimeline.tsx   ← timeline status pendaftaran
│   │   │   ├── DocumentList.tsx     ← daftar dokumen & status verifikasi
│   │   │   └── PaymentCard.tsx      ← info pembayaran
│   │   ├── Staff/
│   │   │   ├── CandidateTable.tsx   ← tabel daftar kandidat
│   │   │   └── VerifyModal.tsx      ← modal verifikasi dokumen
│   │   └── Admin/
│   │       ├── WaveManager.tsx      ← kelola gelombang pendaftaran
│   │       ├── StaffTable.tsx       ← tabel akun staff
│   │       └── ReportChart.tsx      ← grafik statistik pendaftaran
├── Layouts/
│   └── DashboardLayout.tsx          ← layout wrapper (sidebar + topbar)
└── Pages/
    └── Dashboard/
        ├── Index.tsx                ← candidate dashboard
        ├── Staff/
        │   └── Index.tsx            ← staff dashboard
        └── Admin/
            └── Index.tsx            ← admin dashboard
```

---

## Backend Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Dashboard/
│   │       ├── CandidateDashboardController.php
│   │       ├── StaffDashboardController.php
│   │       └── AdminDashboardController.php
│   └── Middleware/
│       └── RoleMiddleware.php       ← sudah ada ✅
└── Models/                          ← semua sudah ada ✅
    ├── User.php
    ├── Candidate.php
    ├── Guardian.php
    ├── CandidateDocument.php
    ├── Payment.php
    └── AdmissionWave.php
```

---

## Route Plan

```php
// Candidate
Route::middleware(['auth', 'role:candidate'])
    ->prefix('dashboard')->name('dashboard')
    ->group(function () {
        Route::get('/', [CandidateDashboardController::class, 'index']);
    });

// Staff
Route::middleware(['auth', 'role:staff'])
    ->prefix('dashboard/staff')->name('staff.')
    ->group(function () {
        Route::get('/', [StaffDashboardController::class, 'index']);
        Route::get('/candidates', [StaffDashboardController::class, 'candidates']);
        Route::post('/verify/{candidate}', [StaffDashboardController::class, 'verify']);
    });

// Admin
Route::middleware(['auth', 'role:admin'])
    ->prefix('dashboard/admin')->name('admin.')
    ->group(function () {
        Route::get('/', [AdminDashboardController::class, 'index']);
        Route::get('/waves', [AdminDashboardController::class, 'waves']);
        Route::get('/staff', [AdminDashboardController::class, 'staff']);
        Route::get('/reports', [AdminDashboardController::class, 'reports']);
    });
```

---

## Data Per Role

### Candidate Dashboard
Data yang dikirim dari `CandidateDashboardController`:
```php
return Inertia::render('Dashboard/Index', [
    'candidate' => [
        'full_name'         => $candidate->full_name,
        'nisn'              => $candidate->nisn,
        'registration_code' => $draft->registration_code,
        'status'            => $candidate->status,
        'admission_wave'    => $candidate->admissionWave->title,
        'school_origin'     => $candidate->school_origin,
    ],
    'documents' => $candidate->documents->map(fn($d) => [
        'type'   => $d->document_type,
        'status' => $d->status,        // pending | valid | invalid
        'note'   => $d->admin_note,
    ]),
    'payment' => $candidate->payments->last() ? [
        'status'          => $payment->status,
        'transaction_code'=> $payment->transaction_code,
        'amount'          => $payment->expected_amount,
    ] : null,
    'email_verified' => auth()->user()->hasVerifiedEmail(),
]);
```

**Fitur Candidate:**
```
✅ Lihat status pendaftaran (timeline)
✅ Lihat & upload dokumen
✅ Lihat info pembayaran
✅ Banner verifikasi email (kalau belum verified)
✅ Info gelombang aktif
❌ Tidak bisa edit data (hanya lihat)
❌ Tidak bisa akses data orang lain
```

### Staff Dashboard
```php
return Inertia::render('Dashboard/Staff/Index', [
    'stats' => [
        'total'    => Candidate::count(),
        'pending'  => Candidate::where('status', 'draft')->count(),
        'verified' => Candidate::where('status', 'verified')->count(),
    ],
    'candidates' => Candidate::with(['user', 'documents'])
        ->latest()->paginate(20),
]);
```

**Fitur Staff:**
```
✅ Lihat semua kandidat + status
✅ Verifikasi dokumen (valid/invalid + catatan)
✅ Filter kandidat by status
✅ Lihat detail data kandidat
❌ Tidak bisa edit data kandidat
❌ Tidak bisa akses menu admin
❌ Tidak bisa hapus data
```

### Admin Dashboard
```php
return Inertia::render('Dashboard/Admin/Index', [
    'stats' => [
        'total_candidates' => Candidate::count(),
        'total_staff'      => User::where('role', 'staff')->count(),
        'active_wave'      => AdmissionWave::where('is_active', true)->first(),
        'quota_filled'     => Candidate::where('status', 'accepted')->count(),
    ],
    'recent_candidates' => Candidate::with('user')->latest()->take(5)->get(),
    'waves'             => AdmissionWave::latest()->get(),
]);
```

**Fitur Admin:**
```
✅ Semua fitur staff
✅ Kelola gelombang pendaftaran (buat, edit, tutup)
✅ Kelola akun staff (suspend, hapus)
✅ Lihat laporan & statistik pendaftaran
✅ Edit & hapus data kandidat
✅ Export data (CSV/Excel) — fase berikutnya
```

---

## Shared: DashboardLayout

Layout wrapper yang dipakai semua role:

```tsx
// Cara pakai di setiap halaman dashboard
export default function CandidateDashboard({ candidate, documents }: Props) {
    return (
        <DashboardLayout role="candidate" user={auth.user}>
            {/* konten */}
        </DashboardLayout>
    )
}
```

DashboardLayout berisi:
- `Sidebar` — navigasi kiri, menu berbeda per role
- `Topbar` — nama user, avatar, notifikasi, tombol logout
- `<main>` — slot konten halaman

---

## Status Pendaftaran (Timeline Candidate)

```
draft      → Data awal tersimpan
submitted  → Semua dokumen sudah diupload
verified   → Dokumen lolos verifikasi admin/staff
accepted   → Diterima
rejected   → Ditolak
```

---

## Urutan Pengerjaan (Rekomendasi)

```
Phase 1 — Backend (sekarang):
  1. Buat DashboardLayout.tsx (skeleton dulu)
  2. CandidateDashboardController → kirim data ke Index.tsx
  3. Test: login candidate → data muncul di dashboard

Phase 2 — UI Candidate (setelah rancang dengan teman):
  4. Design & implement Index.tsx candidate
  5. StatusTimeline, DocumentList, PaymentCard components

Phase 3 — Staff & Admin (setelah candidate selesai):
  6. StaffDashboardController + UI
  7. AdminDashboardController + UI
  8. Export data, laporan
```

---

## Catatan Penting

- `DashboardLayout` harus bisa terima prop `role` untuk render menu yang berbeda
- Semua data kandidat di-load server-side via Inertia props — tidak ada fetch client-side
- Pagination kandidat (staff/admin) pakai Inertia `paginate()` bawaan Laravel
- Email verification banner hanya muncul kalau `email_verified_at === null`
- Sidebar mobile menggunakan drawer/overlay, bukan hidden

