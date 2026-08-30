<?php

use App\Http\Controllers\Admission\RegisterController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Middleware\ValidateDraftToken;
use Illuminate\Support\Facades\Route;

// =============================================
// GUEST routes — hanya bisa diakses sebelum login
// =============================================
Route::middleware('guest')->group(function () {

    // Register via wizard draft token
    Route::middleware(ValidateDraftToken::class)->group(function () {
        Route::get('register', [RegisterController::class, 'show'])
            ->middleware('throttle:15,1')
            ->name('register');
        Route::post('register', [RegisterController::class, 'store'])
            ->middleware('throttle:5,1');
    });

    // ── Candidate Login ───────────────────────────────────────────────────────
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    // ── Staff & Admin Login ───────────────────────────────────────────────────
    Route::get('staff/login', [AuthenticatedSessionController::class, 'createStaff'])
        ->name('staff.login');
    Route::post('staff/login', [AuthenticatedSessionController::class, 'storeStaff'])
        ->name('staff.login.post');

    // Forgot & Reset Password (shared — satu flow untuk semua role)
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('reset-password', [NewPasswordController::class, 'store'])->name('password.store');
});

// =============================================
// AUTH routes — hanya bisa diakses setelah login
// =============================================
Route::middleware('auth')->group(function () {

    // Email Verification (tidak blocking — user bisa akses dashboard)
    Route::get('email/verify', [EmailVerificationController::class, 'notice'])->name('verification.notice');
    Route::get('email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('email/verification-notification', [EmailVerificationController::class, 'send'])
        ->middleware('throttle:verification')
        ->name('verification.send');

    // Logout
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});
