<?php

use App\Http\Controllers\Dashboard\ChangeRequestController;
use App\Http\Controllers\Dashboard\ComingSoonController;
use App\Http\Controllers\Dashboard\SecureFileController;
use App\Http\Controllers\Dashboard\Staff\IndexController as StaffDashboard;
use App\Http\Controllers\Dashboard\Staff\ProfileController as StaffProfile;
use App\Http\Controllers\Dashboard\StatusPendaftaranController as InternalStatusPendaftaran;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', RoleMiddleware::class . ':staff'])
    ->prefix('dashboard/staff')
    ->name('staff.')
    ->group(function () {
        Route::get('/', [StaffDashboard::class, 'index'])
            ->name('dashboard');
        Route::get('/calendar', ComingSoonController::class)
            ->defaults('feature', 'staff.calendar')
            ->name('calendar');

        Route::get('/candidates', [StaffDashboard::class, 'candidates'])
            ->name('candidates.index');
        Route::get('/candidate-status', [StaffDashboard::class, 'candidateStatus'])
            ->name('candidate-status.index');
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

        Route::get('/selection-status', ComingSoonController::class)
            ->defaults('feature', 'staff.selection-status')
            ->name('selection-status');
        Route::prefix('exams')->name('exams.')->group(function () {
            Route::get('/sessions', ComingSoonController::class)
                ->defaults('feature', 'staff.exam-sessions')
                ->name('sessions');
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

        Route::post('/documents/{document}/verify', [StaffDashboard::class, 'verifyDocument'])
            ->name('documents.verify');
        Route::get('/documents/{document}/preview', [SecureFileController::class, 'staffDocumentPreview'])
            ->middleware('throttle:sensitive-file')
            ->name('documents.preview');

        Route::post('/payments/{payment}/verify', [StaffDashboard::class, 'verifyPayment'])
            ->name('payments.verify');
        Route::get('/payments/{payment}/proof', [SecureFileController::class, 'staffPaymentProofPreview'])
            ->middleware('throttle:sensitive-file')
            ->name('payments.proof');

        Route::get('/profile', [StaffProfile::class, 'show'])
            ->name('profile');
        Route::put('/profile', [StaffProfile::class, 'update'])
            ->name('profile.update');
        Route::get('/profile/avatar', [StaffProfile::class, 'serveAvatar'])
            ->name('profile.avatar');
        Route::post('/profile/avatar', [StaffProfile::class, 'updateAvatar'])
            ->name('profile.avatar.update');
    });
