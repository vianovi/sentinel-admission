<?php

use App\Http\Controllers\Dashboard\Admin\CandidateController as AdminCandidate;
use App\Http\Controllers\Dashboard\Admin\IndexController as AdminDashboard;
use App\Http\Controllers\Dashboard\Admin\ProfileController as AdminProfile;
use App\Http\Controllers\Dashboard\Admin\StaffController as AdminStaffCtrl;
use App\Http\Controllers\Dashboard\Admin\SystemSettingsController as AdminSystemSettings;
use App\Http\Controllers\Dashboard\Admin\WaveController as AdminWave;
use App\Http\Controllers\Dashboard\ChangeRequestController;
use App\Http\Controllers\Dashboard\ComingSoonController;
use App\Http\Controllers\Dashboard\SecureFileController;
use App\Http\Controllers\Dashboard\Staff\IndexController as StaffDashboard;
use App\Http\Controllers\Dashboard\StatusPendaftaranController as InternalStatusPendaftaran;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', RoleMiddleware::class.':admin'])
    ->prefix('dashboard/admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', [AdminDashboard::class, 'index'])
            ->name('dashboard');
        Route::get('/calendar', [\App\Http\Controllers\Dashboard\Admin\CalendarController::class, 'show'])
            ->name('calendar');
        Route::get('/calendar/events', [\App\Http\Controllers\Dashboard\Admin\CalendarController::class, 'events'])
            ->name('calendar.events');
        Route::post('/calendar/events', [\App\Http\Controllers\Dashboard\Admin\CalendarController::class, 'store'])
            ->name('calendar.store');
        Route::patch('/calendar/settings', [\App\Http\Controllers\Dashboard\Admin\CalendarController::class, 'updateSettings'])
            ->name('calendar.settings.update');
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

        Route::get('/staff-list', [AdminStaffCtrl::class, 'index'])
            ->name('staff.index');
        Route::post('/staff/{user}/toggle', [AdminDashboard::class, 'toggleStaff'])
            ->name('staff.toggle');

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
            ->defaults('feature', 'admin.selection-status')
            ->name('selection-status');
        Route::get('/reports', [\App\Http\Controllers\Dashboard\Admin\ReportController::class, 'index'])
            ->name('reports');
        Route::get('/announcements', ComingSoonController::class)
            ->defaults('feature', 'admin.announcements')
            ->name('announcements');
        Route::get('/payment-recap', ComingSoonController::class)
            ->defaults('feature', 'admin.payment-recap')
            ->name('payment-recap');
        Route::get('/users', [\App\Http\Controllers\Dashboard\Admin\UserController::class, 'index'])
            ->name('users.index');
        Route::post('/users/{user}/toggle-status', [\App\Http\Controllers\Dashboard\Admin\UserController::class, 'toggleStatus'])
            ->name('users.toggle-status');
        Route::get('/profile', [AdminProfile::class, 'show'])
            ->name('profile');
        Route::put('/profile', [AdminProfile::class, 'update'])
            ->name('profile.update');
        Route::get('/profile/avatar', [AdminProfile::class, 'serveAvatar'])
            ->name('profile.avatar');
        Route::post('/profile/avatar', [AdminProfile::class, 'updateAvatar'])
            ->name('profile.avatar.update');
    });
