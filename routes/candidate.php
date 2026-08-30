<?php

use App\Http\Controllers\Dashboard\Candidate\CalendarController as CandidateCalendar;
use App\Http\Controllers\Dashboard\Candidate\DataDiriController as CandidateDataDiri;
use App\Http\Controllers\Dashboard\Candidate\DocumentController as CandidateDocument;
use App\Http\Controllers\Dashboard\Candidate\GuardianController as CandidateGuardian;
use App\Http\Controllers\Dashboard\Candidate\HealthRecordController as CandidateHealthRecord;
use App\Http\Controllers\Dashboard\Candidate\HelpController as CandidateHelp;
use App\Http\Controllers\Dashboard\Candidate\IndexController as CandidateDashboard;
use App\Http\Controllers\Dashboard\Candidate\PaymentController as CandidatePayment;
use App\Http\Controllers\Dashboard\Candidate\PaymentHistoryController as CandidatePaymentHistory;
use App\Http\Controllers\Dashboard\Candidate\ProfileController as CandidateProfile;
use App\Http\Controllers\Dashboard\Candidate\SelectionResultController as CandidateSelectionResult;
use App\Http\Controllers\Dashboard\Candidate\SelectionStatusController as CandidateSelectionStatus;
use App\Http\Controllers\Dashboard\Candidate\StatusPendaftaranController as CandidateStatusPendaftaran;
use App\Http\Controllers\Dashboard\ComingSoonController;
use App\Http\Controllers\Dashboard\SecureFileController;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', RoleMiddleware::class.':candidate'])
    ->prefix('dashboard')
    ->name('dashboard.')
    ->group(function () {
        Route::get('/', [CandidateDashboard::class, 'index'])
            ->name('index');

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

        Route::get('/data-diri', [CandidateDataDiri::class, 'show'])
            ->name('data-diri');
        Route::put('/data-diri', [CandidateDataDiri::class, 'update'])
            ->name('data-diri.update');
        Route::post('/data-diri/change-request', [CandidateDataDiri::class, 'requestDataChange'])
            ->name('data-diri.change-request');
        Route::delete('/data-diri/change-request', [CandidateDataDiri::class, 'cancelDataChange'])
            ->name('data-diri.change-request.cancel');

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

        Route::get('/data-wali', [CandidateGuardian::class, 'index'])
            ->name('data-wali');
        Route::put('/data-wali', [CandidateGuardian::class, 'update'])
            ->name('data-wali.update');

        Route::get('/data-dokumen', [CandidateDocument::class, 'index'])
            ->name('data-dokumen.index');
        Route::get('/data-dokumen/download/{document}', [SecureFileController::class, 'candidateDocumentDownload'])
            ->middleware('throttle:sensitive-file')
            ->name('data-dokumen.download');
        Route::get('/data-dokumen/preview/{document}', [SecureFileController::class, 'candidateDocumentPreview'])
            ->middleware('throttle:sensitive-file')
            ->name('data-dokumen.preview');
        Route::post('/data-dokumen/{docType}', [CandidateDocument::class, 'store'])
            ->name('data-dokumen.store')
            ->middleware('throttle:upload');
        Route::delete('/data-dokumen/{document}', [CandidateDocument::class, 'destroy'])
            ->name('data-dokumen.destroy');

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
