<?php

use App\Http\Controllers\Candidate\DashboardController        as CandidateDashboard;
use App\Http\Controllers\Candidate\ProfileController          as CandidateProfile;
use App\Http\Controllers\Candidate\DataDiriController         as CandidateDataDiri;
use App\Http\Controllers\Candidate\HealthRecordController     as CandidateHealthRecord;
use App\Http\Controllers\Candidate\GuardianController         as CandidateGuardian;
use App\Http\Controllers\Candidate\DocumentController         as CandidateDocument;
use App\Http\Controllers\Candidate\PaymentController          as CandidatePayment;
use App\Http\Controllers\Webhook\MidtransController;
use App\Http\Controllers\Staff\DashboardController            as StaffDashboard;
use App\Http\Controllers\Admin\DashboardController            as AdminDashboard;
use App\Http\Controllers\Admission\FormWizardController;
use App\Http\Controllers\Admission\RegisterController;
use App\Http\Controllers\Public\WelcomeController;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────────────────────

Route::get('/', [WelcomeController::class, 'index'])->name('home');

// ─────────────────────────────────────────────────────────────────────────────
// ADMISSION — Form Wizard & Register (guest only)
// ─────────────────────────────────────────────────────────────────────────────

Route::middleware('guest')->group(function () {

    Route::get('/daftar', [FormWizardController::class, 'show'])
        ->name('daftar');
    Route::post('/daftar/check-draft', [FormWizardController::class, 'checkDraft'])
        ->name('daftar.check-draft');
    Route::post('/daftar/check-duplicate', [FormWizardController::class, 'checkDuplicate'])
        ->name('daftar.check-duplicate');
    Route::post('/daftar/resume', [FormWizardController::class, 'resume'])
        ->name('daftar.resume');
    Route::post('/daftar/step1', [FormWizardController::class, 'storeStep1'])
        ->name('daftar.step1');
    Route::put('/daftar/step2/{draft}', [FormWizardController::class, 'updateStep2'])
        ->name('daftar.step2');

    // ⚠️ initStep3 HARUS sebelum step3 agar Laravel tidak salah tangkap {draft}
    Route::put('/daftar/step3/init/{draft}', [FormWizardController::class, 'initStep3'])
        ->name('daftar.step3.init');
    Route::put('/daftar/step3/{draft}', [FormWizardController::class, 'updateStep3'])
        ->name('daftar.step3');

});

// ─────────────────────────────────────────────────────────────────────────────
// CANDIDATE DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

Route::middleware(['auth', RoleMiddleware::class . ':candidate'])
    ->prefix('dashboard')
    ->name('dashboard.')
    ->group(function () {

        // ── Index ─────────────────────────────────────────────────────────
        Route::get('/', [CandidateDashboard::class, 'index'])
            ->name('index');

        // ── Profile ───────────────────────────────────────────────────────
        Route::get('/profile', [CandidateProfile::class, 'show'])
            ->name('profile');
        Route::put('/profile', [CandidateProfile::class, 'update'])
            ->name('profile.update');
        Route::get('/profile/avatar', [CandidateProfile::class, 'serveAvatar'])
            ->name('profile.avatar');
        Route::post('/profile/avatar', [CandidateProfile::class, 'updateAvatar'])
            ->name('profile.avatar.update');
        Route::post('/profile/email', [CandidateProfile::class, 'requestEmailChange'])
            ->name('profile.email.request');
        Route::delete('/profile/email', [CandidateProfile::class, 'cancelEmailChange'])
            ->name('profile.email.cancel');

        // ── Data Diri ─────────────────────────────────────────────────────
        Route::get('/data-diri', [CandidateDataDiri::class, 'show'])
            ->name('data-diri');
        Route::put('/data-diri', [CandidateDataDiri::class, 'update'])
            ->name('data-diri.update');
        Route::post('/data-diri/change-request', [CandidateDataDiri::class, 'requestDataChange'])
            ->name('data-diri.change-request');
        Route::delete('/data-diri/change-request', [CandidateDataDiri::class, 'cancelDataChange'])
            ->name('data-diri.change-request.cancel');

        // ── Data Kesehatan ────────────────────────────────────────────────
        Route::get('/data-kesehatan', [CandidateHealthRecord::class, 'show'])
            ->name('data-kesehatan');
        Route::post('/data-kesehatan', [CandidateHealthRecord::class, 'save'])
            ->name('data-kesehatan.save');
        Route::post('/data-kesehatan/dokumen/{docType}', [CandidateHealthRecord::class, 'uploadDocument'])
            ->name('data-kesehatan.upload');
        Route::delete('/data-kesehatan/dokumen/{docType}', [CandidateHealthRecord::class, 'deleteDocument'])
            ->name('data-kesehatan.delete-doc');

        // ── Data Wali ─────────────────────────────────────────────────────
        Route::get('/data-wali', [CandidateGuardian::class, 'index'])
            ->name('data-wali');
        Route::put('/data-wali', [CandidateGuardian::class, 'update'])
            ->name('data-wali.update');

        // ── Data Dokumen ──────────────────────────────────────────────────
        Route::get('/data-dokumen', [CandidateDocument::class, 'index'])
            ->name('data-dokumen.index');

        // ⚠️ download HARUS sebelum store/{docType} — cegah 'download' tertangkap sebagai docType
        Route::get('/data-dokumen/download/{document}', [CandidateDocument::class, 'download'])
            ->name('data-dokumen.download');

        Route::post('/data-dokumen/{docType}', [CandidateDocument::class, 'store'])
            ->name('data-dokumen.store')
            ->middleware('throttle:upload');

        Route::delete('/data-dokumen/{document}', [CandidateDocument::class, 'destroy'])
            ->name('data-dokumen.destroy');

        // ── Pembayaran ────────────────────────────────────────────────
        Route::get('/pembayaran', [CandidatePayment::class, 'show'])
            ->name('pembayaran');
        Route::post('/pembayaran', [CandidatePayment::class, 'create'])
            ->name('pembayaran.create');
        Route::delete('/pembayaran/{payment}', [CandidatePayment::class, 'cancel'])
            ->name('pembayaran.cancel');

    });

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK — Midtrans (no auth, no CSRF)
// ─────────────────────────────────────────────────────────────────────────────

Route::post('/payment/webhook', [MidtransController::class, 'handle'])
    ->name('payment.webhook')
    ->withoutMiddleware(['web', \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);

// ─────────────────────────────────────────────────────────────────────────────
// STAFF DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

Route::middleware(['auth', RoleMiddleware::class . ':staff'])
    ->prefix('dashboard/staff')
    ->name('staff.')
    ->group(function () {

        Route::get('/', [StaffDashboard::class, 'index'])
            ->name('dashboard');
        Route::get('/candidates/{candidate}', [StaffDashboard::class, 'show'])
            ->name('candidates.show');
        Route::post('/documents/{document}/verify', [StaffDashboard::class, 'verifyDocument'])
            ->name('documents.verify');
        Route::post('/candidates/{candidate}/status', [StaffDashboard::class, 'updateStatus'])
            ->name('candidates.status');

    });

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

Route::middleware(['auth', RoleMiddleware::class . ':admin'])
    ->prefix('dashboard/admin')
    ->name('admin.')
    ->group(function () {

        Route::get('/', [AdminDashboard::class, 'index'])
            ->name('dashboard');
        Route::post('/staff/{user}/toggle', [AdminDashboard::class, 'toggleStaff'])
            ->name('staff.toggle');
        Route::delete('/candidates/{candidate}', [AdminDashboard::class, 'deleteCandidate'])
            ->name('candidates.delete');
        Route::post('/waves/{wave}/toggle', [AdminDashboard::class, 'toggleWave'])
            ->name('waves.toggle');

    });

require __DIR__ . '/auth.php';