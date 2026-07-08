<?php
// routes/web.php

use App\Http\Controllers\Dashboard\Candidate\IndexController      as CandidateDashboard;
use App\Http\Controllers\Dashboard\Candidate\ProfileController    as CandidateProfile;
use App\Http\Controllers\Dashboard\Candidate\DataDiriController   as CandidateDataDiri;
use App\Http\Controllers\Dashboard\Candidate\CalendarController   as CandidateCalendar;
use App\Http\Controllers\Dashboard\Candidate\HealthRecordController as CandidateHealthRecord;
use App\Http\Controllers\Dashboard\Candidate\GuardianController   as CandidateGuardian;
use App\Http\Controllers\Dashboard\Candidate\DocumentController   as CandidateDocument;
use App\Http\Controllers\Dashboard\Candidate\PaymentController    as CandidatePayment;
use App\Http\Controllers\Dashboard\Candidate\HelpController       as CandidateHelp;
use App\Http\Controllers\Dashboard\Candidate\PaymentHistoryController as CandidatePaymentHistory;
use App\Http\Controllers\Dashboard\Candidate\SelectionStatusController as CandidateSelectionStatus;
use App\Http\Controllers\Dashboard\Candidate\SelectionResultController as CandidateSelectionResult;
use App\Http\Controllers\Dashboard\Candidate\StatusPendaftaranController as CandidateStatusPendaftaran;
use App\Http\Controllers\Dashboard\ChangeRequestController;
use App\Http\Controllers\Dashboard\ComingSoonController;
use App\Http\Controllers\Dashboard\SecureFileController;
use App\Http\Controllers\Dashboard\StatusPendaftaranController    as InternalStatusPendaftaran;
use App\Http\Controllers\Dashboard\Staff\IndexController          as StaffDashboard;
use App\Http\Controllers\Dashboard\Staff\ProfileController        as StaffProfile;
use App\Http\Controllers\Dashboard\Staff\Exam\ResultController    as StaffExamResult;
use App\Http\Controllers\Dashboard\Admin\IndexController          as AdminDashboard;
use App\Http\Controllers\Dashboard\Admin\ProfileController        as AdminProfile;
use App\Http\Controllers\Dashboard\Admin\CandidateController      as AdminCandidate;
use App\Http\Controllers\Dashboard\Admin\WaveController           as AdminWave;
use App\Http\Controllers\Dashboard\Admin\SystemSettingsController as AdminSystemSettings;
use App\Http\Controllers\Dashboard\Admin\StaffController          as AdminStaffCtrl;
use App\Http\Controllers\Dashboard\Admin\Exam\IndexController     as AdminExamDashboard;
use App\Http\Controllers\Dashboard\Admin\Exam\SubjectController   as AdminExamSubject;
use App\Http\Controllers\Dashboard\Admin\Exam\PackageController   as AdminExamPackage;
use App\Http\Controllers\Dashboard\Admin\Exam\QuestionImportController as AdminExamImport;
use App\Http\Controllers\Dashboard\Admin\Exam\SessionController   as AdminExamSession;
use App\Http\Controllers\Dashboard\Admin\Exam\ResultController    as AdminExamResult;
use App\Http\Controllers\Dashboard\Admin\Exam\MonitoringController as AdminExamMonitoring;
use App\Http\Controllers\Dashboard\Candidate\Exam\ExamController  as CandidateExam;
use App\Http\Controllers\Dashboard\Candidate\Exam\AttemptController as CandidateExamAttempt;
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
        ->middleware('throttle:30,1')
        ->name('daftar.check-draft');
    Route::post('/daftar/check-duplicate', [FormWizardController::class, 'checkDuplicate'])
        ->middleware('throttle:10,1')
        ->name('daftar.check-duplicate');
    Route::post('/daftar/resume', [FormWizardController::class, 'resume'])
        ->middleware('throttle:5,1')
        ->name('daftar.resume');
    Route::post('/daftar/step1', [FormWizardController::class, 'storeStep1'])
        ->middleware('throttle:10,1')
        ->name('daftar.step1');
    Route::put('/daftar/step2/{draft}', [FormWizardController::class, 'updateStep2'])
        ->middleware('throttle:15,1')
        ->name('daftar.step2');

    // ⚠️ initStep3 HARUS sebelum step3 agar Laravel tidak salah tangkap {draft}
    Route::put('/daftar/step3/init/{draft}', [FormWizardController::class, 'initStep3'])
        ->middleware('throttle:15,1')
        ->name('daftar.step3.init');
    Route::put('/daftar/step3/{draft}', [FormWizardController::class, 'updateStep3'])
        ->middleware('throttle:10,1')
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

        // ── Kalender SPMB ────────────────────────────────────────────────
        Route::get('/calendar', [CandidateCalendar::class, 'show'])
            ->name('calendar');
        Route::get('/calendar/events', [CandidateCalendar::class, 'events'])
            ->name('calendar.events');
        Route::post('/calendar/agenda', [CandidateCalendar::class, 'store'])
            ->name('calendar.agenda.store');
        Route::patch('/calendar/settings', [CandidateCalendar::class, 'updateSettings'])
            ->name('calendar.settings.update');
        Route::get('/info', ComingSoonController::class)
            ->defaults('feature', 'candidate.info')
            ->name('info');
        Route::get('/pengumuman', ComingSoonController::class)
            ->defaults('feature', 'candidate.announcements')
            ->name('announcements');
        Route::get('/bantuan', [CandidateHelp::class, 'show'])
            ->name('help');
        Route::get('/status', fn () => redirect()->route('dashboard.status-pendaftaran'))
            ->name('status');
        Route::get('/status-pendaftaran', [CandidateStatusPendaftaran::class, 'show'])
            ->name('status-pendaftaran');
        Route::get('/pembayaran/riwayat', [CandidatePaymentHistory::class, 'index'])
            ->name('payment-history');
        Route::get('/seleksi/status', [CandidateSelectionStatus::class, 'show'])
            ->name('selection-status');
        Route::get('/seleksi/hasil', [CandidateSelectionResult::class, 'show'])
            ->name('selection-result');

        // ── Seleksi / Online Exam ───────────────────────────────────────
        Route::prefix('seleksi')
            ->name('exam.')
            ->group(function () {
                Route::get('/', [CandidateExam::class, 'index'])
                    ->name('index');
                Route::get('/sesi/{session}', [CandidateExam::class, 'show'])
                    ->name('sessions.show');
                Route::post('/sesi/{session}/start', [CandidateExamAttempt::class, 'start'])
                    ->name('sessions.start');
                Route::get('/attempts/{attempt}', [CandidateExamAttempt::class, 'show'])
                    ->name('attempts.show');
                Route::get('/attempts/{attempt}/sync', [CandidateExamAttempt::class, 'sync'])
                    ->name('attempts.sync');
                Route::post('/attempts/{attempt}/answers', [CandidateExamAttempt::class, 'saveAnswer'])
                    ->name('attempts.answers.save');
                Route::post('/attempts/{attempt}/submit', [CandidateExamAttempt::class, 'submit'])
                    ->name('attempts.submit');
            });

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
        Route::get('/pembayaran/status', [CandidatePayment::class, 'status'])
            ->name('pembayaran.status');
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
        Route::get('/calendar', ComingSoonController::class)
            ->defaults('feature', 'staff.calendar')
            ->name('calendar');

        // ── Candidates ───────────────────────────────────────────────────
        Route::get('/candidates', [StaffDashboard::class, 'candidates'])
            ->name('candidates.index');
        Route::get('/candidates/{candidate}', [StaffDashboard::class, 'show'])
            ->name('candidates.show')
            ->missing(fn () => redirect()
                ->route('staff.candidates.index')
                ->with('error', 'Kandidat yang dipilih tidak ditemukan atau sudah tidak tersedia.'));
        Route::get('/candidates/{candidate}/status-pendaftaran', [InternalStatusPendaftaran::class, 'show'])
            ->name('candidates.status-pendaftaran')
            ->missing(fn () => redirect()
                ->route('staff.candidates.index')
                ->with('error', 'Kandidat yang dipilih tidak ditemukan atau sudah tidak tersedia.'));
        Route::get('/candidates/{candidate}/health-documents/{docType}', [SecureFileController::class, 'staffHealthDocumentPreview'])
            ->where('docType', 'chronic-disease|surat-sehat|bpjs-card|vaccine-card')
            ->middleware('throttle:sensitive-file')
            ->name('health-documents.preview');
        Route::get('/candidates/{candidate}/{section}', [StaffDashboard::class, 'show'])
            ->where('section', 'data-diri|data-kesehatan|data-wali|dokumen|pembayaran')
            ->name('candidates.section')
            ->missing(fn () => redirect()
                ->route('staff.candidates.index')
                ->with('error', 'Kandidat yang dipilih tidak ditemukan atau sudah tidak tersedia.'));
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

        // ── Future operational pages ───────────────────────────────────
        Route::get('/selection-status', ComingSoonController::class)
            ->defaults('feature', 'staff.selection-status')
            ->name('selection-status');
        Route::prefix('exams')
            ->name('exams.')
            ->group(function () {
                Route::get('/sessions', ComingSoonController::class)
                    ->defaults('feature', 'staff.exam-sessions')
                    ->name('sessions');
                Route::get('/results', [StaffExamResult::class, 'index'])
                    ->name('results.index');
                Route::get('/results/{attempt}', [StaffExamResult::class, 'show'])
                    ->name('results.show');
            });
        Route::get('/reports', [StaffDashboard::class, 'reports'])
            ->name('reports');
        Route::get('/reports/export-settings', [StaffDashboard::class, 'reportExportSettings'])
            ->name('reports.export-settings');
        Route::get('/payment-operations', [StaffDashboard::class, 'paymentOperations'])
            ->name('payment-operations.index');
        Route::get('/payment-recap', ComingSoonController::class)
            ->defaults('feature', 'staff.payment-recap')
            ->name('payment-recap');

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
        Route::get('/profile/avatar', [StaffProfile::class, 'serveAvatar'])
            ->name('profile.avatar');
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
        Route::get('/calendar', ComingSoonController::class)
            ->defaults('feature', 'admin.calendar')
            ->name('calendar');

        // ── Candidates ───────────────────────────────────────────────────
        Route::get('/candidates', [AdminCandidate::class, 'index'])
            ->name('candidates.index');
        Route::get('/candidates/{candidate}', [StaffDashboard::class, 'show'])
            ->name('candidates.show')
            ->missing(fn () => redirect()
                ->route('admin.candidates.index')
                ->with('error', 'Kandidat yang dipilih tidak ditemukan atau sudah tidak tersedia.'));
        Route::get('/candidates/{candidate}/status-pendaftaran', [InternalStatusPendaftaran::class, 'show'])
            ->name('candidates.status-pendaftaran')
            ->missing(fn () => redirect()
                ->route('admin.candidates.index')
                ->with('error', 'Kandidat yang dipilih tidak ditemukan atau sudah tidak tersedia.'));
        Route::get('/candidates/{candidate}/health-documents/{docType}', [SecureFileController::class, 'adminHealthDocumentPreview'])
            ->where('docType', 'chronic-disease|surat-sehat|bpjs-card|vaccine-card')
            ->middleware('throttle:sensitive-file')
            ->name('health-documents.preview');
        Route::get('/candidates/{candidate}/{section}', [StaffDashboard::class, 'show'])
            ->where('section', 'data-diri|data-kesehatan|data-wali|dokumen|pembayaran')
            ->name('candidates.section')
            ->missing(fn () => redirect()
                ->route('admin.candidates.index')
                ->with('error', 'Kandidat yang dipilih tidak ditemukan atau sudah tidak tersedia.'));
        Route::post('/candidates/{candidate}/status', [StaffDashboard::class, 'updateStatus'])
            ->name('candidates.status');
        Route::delete('/candidates/{candidate}', [AdminDashboard::class, 'deleteCandidate'])
            ->name('candidates.delete');

        // ── Sensitive file access ────────────────────────────────────────
        Route::get('/documents/{document}/preview', [SecureFileController::class, 'adminDocumentPreview'])
            ->middleware('throttle:sensitive-file')
            ->name('documents.preview');
        Route::post('/documents/{document}/verify', [StaffDashboard::class, 'verifyDocument'])
            ->name('documents.verify');
        Route::get('/payments/{payment}/proof', [SecureFileController::class, 'adminPaymentProofPreview'])
            ->middleware('throttle:sensitive-file')
            ->name('payments.proof');
        Route::post('/payments/{payment}/verify', [StaffDashboard::class, 'verifyPayment'])
            ->name('payments.verify');

        // ── Waves ─────────────────────────────────────────────────────────
        Route::get('/waves', [AdminWave::class, 'index'])
            ->name('waves.index');
        Route::post('/waves', [AdminWave::class, 'store'])
            ->name('waves.store');
        Route::put('/waves/{wave}', [AdminWave::class, 'update'])
            ->name('waves.update');
        Route::delete('/waves/{wave}', [AdminWave::class, 'destroy'])
            ->name('waves.destroy');
        Route::post('/waves/{wave}/toggle', [AdminWave::class, 'toggle'])
            ->name('waves.toggle');

        // ── System Settings ───────────────────────────────────────────────
        Route::get('/settings', [AdminSystemSettings::class, 'index'])
            ->name('settings');
        Route::get('/programs', [AdminSystemSettings::class, 'programs'])
            ->name('programs');
        Route::post('/settings/programs', [AdminSystemSettings::class, 'storeProgram'])
            ->name('settings.programs.store');
        Route::put('/settings/programs/{program}', [AdminSystemSettings::class, 'updateProgram'])
            ->name('settings.programs.update');
        Route::delete('/settings/programs/{program}', [AdminSystemSettings::class, 'destroyProgram'])
            ->name('settings.programs.destroy');
        Route::post('/settings/programs/{program}/toggle', [AdminSystemSettings::class, 'toggleProgram'])
            ->name('settings.programs.toggle');
        Route::post('/settings/extracurriculars', [AdminSystemSettings::class, 'storeExtracurricular'])
            ->name('settings.extracurriculars.store');
        Route::put('/settings/extracurriculars/{extracurricular}', [AdminSystemSettings::class, 'updateExtracurricular'])
            ->name('settings.extracurriculars.update');
        Route::delete('/settings/extracurriculars/{extracurricular}', [AdminSystemSettings::class, 'destroyExtracurricular'])
            ->name('settings.extracurriculars.destroy');
        Route::post('/settings/extracurriculars/{extracurricular}/toggle', [AdminSystemSettings::class, 'toggleExtracurricular'])
            ->name('settings.extracurriculars.toggle');
        Route::post('/settings/payment-configs', [AdminSystemSettings::class, 'storePaymentConfig'])
            ->name('settings.payment-configs.store');
        Route::put('/settings/payment-configs/{paymentConfig}', [AdminSystemSettings::class, 'updatePaymentConfig'])
            ->name('settings.payment-configs.update');
        Route::delete('/settings/payment-configs/{paymentConfig}', [AdminSystemSettings::class, 'destroyPaymentConfig'])
            ->name('settings.payment-configs.destroy');

        // ── Online Selection Exam ───────────────────────────────────────
        Route::prefix('exams')
            ->name('exams.')
            ->group(function () {
                Route::get('/', [AdminExamDashboard::class, 'index'])
                    ->name('index');
                Route::get('/monitoring', [AdminExamMonitoring::class, 'index'])
                    ->name('monitoring.index');
                Route::get('/monitoring/feed', [AdminExamMonitoring::class, 'feed'])
                    ->name('monitoring.feed');
                Route::get('/monitoring/display', [AdminExamMonitoring::class, 'display'])
                    ->name('monitoring.display');

                Route::resource('subjects', AdminExamSubject::class)
                    ->only(['index', 'store', 'update', 'destroy']);

                Route::post('/packages/{package}/publish', [AdminExamPackage::class, 'publish'])
                    ->name('packages.publish');
                Route::post('/packages/{package}/close', [AdminExamPackage::class, 'close'])
                    ->name('packages.close');
                Route::get('/packages/{package}/template', [AdminExamPackage::class, 'downloadTemplate'])
                    ->name('packages.template.download');
                Route::resource('packages', AdminExamPackage::class);

                Route::get('/packages/{package}/imports', [AdminExamImport::class, 'index'])
                    ->name('packages.imports.index');
                Route::post('/packages/{package}/imports', [AdminExamImport::class, 'store'])
                    ->middleware('throttle:upload')
                    ->name('packages.imports.store');
                Route::get('/imports/{batch}', [AdminExamImport::class, 'show'])
                    ->name('imports.show');

                Route::post('/sessions/{session}/candidates', [AdminExamSession::class, 'assignCandidates'])
                    ->name('sessions.candidates.assign');
                Route::resource('sessions', AdminExamSession::class);

                Route::get('/results', [AdminExamResult::class, 'index'])
                    ->name('results.index');
                Route::get('/results/{attempt}', [AdminExamResult::class, 'show'])
                    ->name('results.show');
            });

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

        // ── Future admin pages ──────────────────────────────────────────
        Route::get('/selection-status', ComingSoonController::class)
            ->defaults('feature', 'admin.selection-status')
            ->name('selection-status');
        Route::get('/reports', ComingSoonController::class)
            ->defaults('feature', 'admin.reports')
            ->name('reports');
        Route::get('/announcements', ComingSoonController::class)
            ->defaults('feature', 'admin.announcements')
            ->name('announcements');
        Route::get('/payment-recap', ComingSoonController::class)
            ->defaults('feature', 'admin.payment-recap')
            ->name('payment-recap');
        Route::get('/users', ComingSoonController::class)
            ->defaults('feature', 'admin.users')
            ->name('users');

        // ── Profile ───────────────────────────────────────────────────────
        Route::get('/profile', [AdminProfile::class, 'show'])
            ->name('profile');
        Route::put('/profile', [AdminProfile::class, 'update'])
            ->name('profile.update');
        Route::get('/profile/avatar', [AdminProfile::class, 'serveAvatar'])
            ->name('profile.avatar');
        Route::post('/profile/avatar', [AdminProfile::class, 'updateAvatar'])
            ->name('profile.avatar.update');

    });

require __DIR__ . '/auth.php';
