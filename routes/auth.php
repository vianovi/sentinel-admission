<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\RegisterController;
use App\Http\Middleware\ValidateDraftToken;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {

    // ----- Register (via wizard draft token) -----
    Route::middleware(ValidateDraftToken::class)->group(function () {
        Route::get('register', [RegisterController::class, 'show'])->name('register');
        Route::post('register', [RegisterController::class, 'store']);
    });

    // ----- Login -----
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {

    // ----- Logout -----
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});