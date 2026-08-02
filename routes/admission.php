<?php

use App\Http\Controllers\Admission\FormWizardController;
use Illuminate\Support\Facades\Route;

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

    Route::put('/daftar/step3/init/{draft}', [FormWizardController::class, 'initStep3'])
        ->middleware('throttle:15,1')
        ->name('daftar.step3.init');
    Route::put('/daftar/step3/{draft}', [FormWizardController::class, 'updateStep3'])
        ->middleware('throttle:10,1')
        ->name('daftar.step3');
});
