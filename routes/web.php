<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\FormWizardController;
use App\Http\Controllers\RegisterController;
use App\Http\Middleware\ValidateDraftToken;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ----- Landing Page -----
Route::get('/', [WelcomeController::class, 'index'])->name('home');

// ----- Form Wizard -----
Route::middleware('guest')->group(function () {
    Route::get('/daftar', [FormWizardController::class, 'show'])->name('daftar');

    // Cek duplikat sebelum insert
    Route::post('/daftar/check-duplicate', [FormWizardController::class, 'checkDuplicate'])->name('daftar.check-duplicate');

    // Resume draft lama
    Route::post('/daftar/resume', [FormWizardController::class, 'resume'])->name('daftar.resume');

    // Per-step endpoints
    Route::post('/daftar/step1',          [FormWizardController::class, 'storeStep1'])->name('daftar.step1');
    Route::put('/daftar/step2/{draft}',   [FormWizardController::class, 'updateStep2'])->name('daftar.step2');
    Route::put('/daftar/step3/{draft}',   [FormWizardController::class, 'updateStep3'])->name('daftar.step3');
});

// ----- Register -----
Route::middleware(['guest', ValidateDraftToken::class])->group(function () {
    Route::get('/register', [RegisterController::class, 'show'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);
});

// ----- Dashboard -----
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// ----- Profile -----
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
