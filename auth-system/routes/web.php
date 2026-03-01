<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\FormWizardController;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
        Route::get('/', fn () => Inertia::render('Dashboard/Index'))->name('');
    });

// ─── Dashboard Staff ──────────────────────────────────────────────────────────
Route::middleware(['auth', RoleMiddleware::class . ':staff'])
    ->prefix('dashboard/staff')
    ->name('staff.')
    ->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Staff/Index'))->name('dashboard');
    });

// ─── Dashboard Admin ──────────────────────────────────────────────────────────
Route::middleware(['auth', RoleMiddleware::class . ':admin'])
    ->prefix('dashboard/admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Admin/Index'))->name('dashboard');
    });

require __DIR__.'/auth.php';
