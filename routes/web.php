<?php

use App\Http\Controllers\Dashboard\AdminDashboardController;
use App\Http\Controllers\Dashboard\CandidateDashboardController;
use App\Http\Controllers\Dashboard\StaffDashboardController;
use App\Http\Controllers\FormWizardController;
use App\Http\Controllers\WelcomeController;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;

// ─── Landing Page ─────────────────────────────────────────────────────────────
Route::get('/', [WelcomeController::class, 'index'])->name('home');

// ─── Form Wizard (guest only) ─────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/daftar', [FormWizardController::class, 'show'])->name('daftar');
    Route::post('/daftar/check-duplicate', [FormWizardController::class, 'checkDuplicate'])->name('daftar.check-duplicate');
    Route::post('/daftar/resume', [FormWizardController::class, 'resume'])->name('daftar.resume');
    Route::post('/daftar/step1', [FormWizardController::class, 'storeStep1'])->name('daftar.step1');
    Route::put('/daftar/step2/{draft}', [FormWizardController::class, 'updateStep2'])->name('daftar.step2');
    Route::put('/daftar/step3/{draft}', [FormWizardController::class, 'updateStep3'])->name('daftar.step3');
});

// ─── Dashboard Candidate ──────────────────────────────────────────────────────
Route::middleware(['auth', RoleMiddleware::class . ':candidate'])
    ->prefix('dashboard')
    ->name('dashboard')
    ->group(function () {
        Route::get('/', [CandidateDashboardController::class, 'index'])->name('');
    });

// ─── Dashboard Staff ──────────────────────────────────────────────────────────
Route::middleware(['auth', RoleMiddleware::class . ':staff'])
    ->prefix('dashboard/staff')
    ->name('staff.')
    ->group(function () {
        Route::get('/', [StaffDashboardController::class, 'index'])->name('dashboard');
        Route::get('/candidates/{candidate}', [StaffDashboardController::class, 'show'])->name('candidates.show');
        Route::post('/documents/{document}/verify', [StaffDashboardController::class, 'verifyDocument'])->name('documents.verify');
        Route::post('/candidates/{candidate}/status', [StaffDashboardController::class, 'updateStatus'])->name('candidates.status');
    });

// ─── Dashboard Admin ──────────────────────────────────────────────────────────
Route::middleware(['auth', RoleMiddleware::class . ':admin'])
    ->prefix('dashboard/admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
        Route::post('/staff/{user}/toggle', [AdminDashboardController::class, 'toggleStaff'])->name('staff.toggle');
        Route::delete('/candidates/{candidate}', [AdminDashboardController::class, 'deleteCandidate'])->name('candidates.delete');
        Route::post('/waves/{wave}/toggle', [AdminDashboardController::class, 'toggleWave'])->name('waves.toggle');
    });

require __DIR__ . '/auth.php';
