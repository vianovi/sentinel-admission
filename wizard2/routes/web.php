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

// ----- Form Wizard (/daftar) -----
Route::middleware('guest')->group(function () {
    Route::get('/daftar', [FormWizardController::class, 'show'])->name('daftar');
    Route::post('/daftar/save-draft', [FormWizardController::class, 'saveDraft'])->name('daftar.save-draft');
    Route::post('/daftar/submit', [FormWizardController::class, 'submitDraft'])->name('daftar.submit');
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
