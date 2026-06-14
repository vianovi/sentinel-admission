<?php
// routes/web.php

use App\Http\Controllers\Dashboard\Candidate\IndexController      as CandidateDashboard;
use App\Http\Controllers\Dashboard\Candidate\ProfileController    as CandidateProfile;
use App\Http\Controllers\Dashboard\Candidate\DataDiriController   as CandidateDataDiri;
use App\Http\Controllers\Dashboard\Candidate\HealthRecordController as CandidateHealthRecord;
use App\Http\Controllers\Dashboard\Candidate\GuardianController   as CandidateGuardian;
use App\Http\Controllers\Dashboard\Candidate\DocumentController   as CandidateDocument;
use App\Http\Controllers\Dashboard\Candidate\PaymentController    as CandidatePayment;
use App\Http\Controllers\Dashboard\ChangeRequestController;
use App\Http\Controllers\Dashboard\SecureFileController;
use App\Http\Controllers\Dashboard\Staff\IndexController          as StaffDashboard;
use App\Http\Controllers\Dashboard\Staff\ProfileController        as StaffProfile;
use App\Http\Controllers\Dashboard\Admin\IndexController          as AdminDashboard;
use App\Http\Controllers\Dashboard\Admin\ProfileController        as AdminProfile;
use App\Http\Controllers\Dashboard\Admin\CandidateController      as AdminCandidate;
use App\Http\Controllers\Dashboard\Admin\WaveController           as AdminWave;
use App\Http\Controllers\Dashboard\Admin\StaffController          as AdminStaffCtrl;
use App\Http\Controllers\Webhook\MidtransController;
use App\Http\Controllers\Admission\FormWizardController;
use App\Http\Controllers\Admission\RegisterController;
use App\Http\Controllers\Public\WelcomeController;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────────────────────

Route::get('/', [WelcomeController::class, 'index'])->name('home');

Route::get('/media/gallery/{filename}', [WelcomeController::class, 'serveGallery'])
    ->name('media.gallery')
    ->where('filename', '.+');

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
        Route::post('/profile/email/apply', [CandidateProfile::class, 'applyApprovedEmailChange'])
            ->name('profile.email.apply');

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
        Route::get('/data-kesehatan/dokumen/{docType}/preview', [SecureFileController::class, 'candidateHealthDocumentPreview'])
            ->where('docType', 'chronic_disease|chronic-disease|surat_sehat|surat-sehat|bpjs_card|bpjs-card|vaccine_card|vaccine-card')
            ->middleware('throttle:sensitive-file')
            ->name('data-kesehatan.preview');
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
        Route::get('/data-dokumen/download/{document}', [SecureFileController::class, 'candidateDocumentDownload'])
            ->middleware('throttle:sensitive-file')
            ->name('data-dokumen.download');

        // ⚠️preview HARUS sebelum store/{docType} — cegah 'preview' tertangkap sebagai docType
        Route::get('/data-dokumen/preview/{document}', [SecureFileController::class, 'candidateDocumentPreview'])
            ->middleware('throttle:sensitive-file')
            ->name('data-dokumen.preview');

        Route::post('/data-dokumen/{docType}', [CandidateDocument::class, 'store'])
            ->name('data-dokumen.store')
            ->middleware('throttle:upload');

        Route::delete('/data-dokumen/{document}', [CandidateDocument::class, 'destroy'])
            ->name('data-dokumen.destroy');

        // ── Pembayaran ────────────────────────────────────────────────────
        Route::get('/pembayaran', [CandidatePayment::class, 'show'])
            ->name('pembayaran');
        Route::post('/pembayaran', [CandidatePayment::class, 'create'])
            ->name('pembayaran.create');
        Route::delete('/pembayaran/{payment}', [CandidatePayment::class, 'cancel'])
            ->name('pembayaran.cancel');
        Route::post('/pembayaran/snap-token', [CandidatePayment::class, 'snapToken'])
            ->name('pembayaran.snap-token');
        Route::get('/pembayaran/proof/{payment}', [SecureFileController::class, 'candidatePaymentProofPreview'])
            ->middleware('throttle:sensitive-file')
            ->name('pembayaran.proof');
        Route::post('/pembayaran/upload-proof', [CandidatePayment::class, 'uploadProof'])
            ->name('pembayaran.upload-proof')
            ->middleware('throttle:upload');
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

        // ── Dashboard index ───────────────────────────────────────────────
        Route::get('/', [StaffDashboard::class, 'index'])
            ->name('dashboard');

        // ── Candidates ───────────────────────────────────────────────────
        Route::get('/candidates', [StaffDashboard::class, 'candidates'])
            ->name('candidates.index');
        Route::get('/candidates/{candidate}', [StaffDashboard::class, 'show'])
            ->name('candidates.show');
        Route::get('/candidates/{candidate}/health-documents/{docType}', [SecureFileController::class, 'staffHealthDocumentPreview'])
            ->where('docType', 'chronic-disease|surat-sehat|bpjs-card|vaccine-card')
            ->middleware('throttle:sensitive-file')
            ->name('health-documents.preview');
        Route::get('/candidates/{candidate}/{section}', [StaffDashboard::class, 'show'])
            ->where('section', 'data-diri|data-kesehatan|data-wali|dokumen|pembayaran')
            ->name('candidates.section');
        Route::post('/candidates/{candidate}/status', [StaffDashboard::class, 'updateStatus'])
            ->name('candidates.status');

        // ── Change requests ──────────────────────────────────────────────
        Route::get('/change-requests', [ChangeRequestController::class, 'index'])
            ->name('change-requests.index');
        Route::post('/change-requests/data/{candidate}/approve', [ChangeRequestController::class, 'approveData'])
            ->name('change-requests.data.approve');
        Route::post('/change-requests/data/{candidate}/reject', [ChangeRequestController::class, 'rejectData'])
            ->name('change-requests.data.reject');
        Route::post('/change-requests/email/{candidate}/approve', [ChangeRequestController::class, 'approveEmail'])
            ->name('change-requests.email.approve');
        Route::post('/change-requests/email/{candidate}/reject', [ChangeRequestController::class, 'rejectEmail'])
            ->name('change-requests.email.reject');

        // ── Documents ────────────────────────────────────────────────────
        Route::post('/documents/{document}/verify', [StaffDashboard::class, 'verifyDocument'])
            ->name('documents.verify');
        Route::get('/documents/{document}/preview', [SecureFileController::class, 'staffDocumentPreview'])
            ->middleware('throttle:sensitive-file')
            ->name('documents.preview');

        // ── Payments ─────────────────────────────────────────────────────
        Route::post('/payments/{payment}/verify', [StaffDashboard::class, 'verifyPayment'])
            ->name('payments.verify');
        Route::get('/payments/{payment}/proof', [SecureFileController::class, 'staffPaymentProofPreview'])
            ->middleware('throttle:sensitive-file')
            ->name('payments.proof');

        // ── Profile ───────────────────────────────────────────────────────
        Route::get('/profile', [StaffProfile::class, 'show'])
            ->name('profile');
        Route::put('/profile', [StaffProfile::class, 'update'])
            ->name('profile.update');
        Route::post('/profile/avatar', [StaffProfile::class, 'updateAvatar'])
            ->name('profile.avatar.update');

    });

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

Route::middleware(['auth', RoleMiddleware::class . ':admin'])
    ->prefix('dashboard/admin')
    ->name('admin.')
    ->group(function () {

        // ── Dashboard index ───────────────────────────────────────────────
        Route::get('/', [AdminDashboard::class, 'index'])
            ->name('dashboard');

        // ── Candidates ───────────────────────────────────────────────────
        Route::get('/candidates', [AdminCandidate::class, 'index'])
            ->name('candidates.index');
        Route::get('/candidates/{candidate}/health-documents/{docType}', [SecureFileController::class, 'adminHealthDocumentPreview'])
            ->where('docType', 'chronic-disease|surat-sehat|bpjs-card|vaccine-card')
            ->middleware('throttle:sensitive-file')
            ->name('health-documents.preview');
        Route::delete('/candidates/{candidate}', [AdminDashboard::class, 'deleteCandidate'])
            ->name('candidates.delete');

        // ── Sensitive file access ────────────────────────────────────────
        Route::get('/documents/{document}/preview', [SecureFileController::class, 'adminDocumentPreview'])
            ->middleware('throttle:sensitive-file')
            ->name('documents.preview');
        Route::get('/payments/{payment}/proof', [SecureFileController::class, 'adminPaymentProofPreview'])
            ->middleware('throttle:sensitive-file')
            ->name('payments.proof');

        // ── Waves ─────────────────────────────────────────────────────────
        Route::get('/waves', [AdminWave::class, 'index'])
            ->name('waves.index');
        Route::post('/waves/{wave}/toggle', [AdminDashboard::class, 'toggleWave'])
            ->name('waves.toggle');

        // ── Staff management ──────────────────────────────────────────────
        Route::get('/staff-list', [AdminStaffCtrl::class, 'index'])
            ->name('staff.index');
        Route::post('/staff/{user}/toggle', [AdminDashboard::class, 'toggleStaff'])
            ->name('staff.toggle');

        // ── Change requests ──────────────────────────────────────────────
        Route::get('/change-requests', [ChangeRequestController::class, 'index'])
            ->name('change-requests.index');
        Route::post('/change-requests/data/{candidate}/approve', [ChangeRequestController::class, 'approveData'])
            ->name('change-requests.data.approve');
        Route::post('/change-requests/data/{candidate}/reject', [ChangeRequestController::class, 'rejectData'])
            ->name('change-requests.data.reject');
        Route::post('/change-requests/email/{candidate}/approve', [ChangeRequestController::class, 'approveEmail'])
            ->name('change-requests.email.approve');
        Route::post('/change-requests/email/{candidate}/reject', [ChangeRequestController::class, 'rejectEmail'])
            ->name('change-requests.email.reject');

        // ── Profile ───────────────────────────────────────────────────────
        Route::get('/profile', [AdminProfile::class, 'show'])
            ->name('profile');
        Route::put('/profile', [AdminProfile::class, 'update'])
            ->name('profile.update');
        Route::post('/profile/avatar', [AdminProfile::class, 'updateAvatar'])
            ->name('profile.avatar.update');

    });

require __DIR__ . '/auth.php';
