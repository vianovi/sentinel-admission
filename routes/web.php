<?php

use App\Http\Controllers\Public\WelcomeController;
use App\Http\Controllers\Webhook\MidtransController;
use Illuminate\Support\Facades\Route;

Route::get('/', [WelcomeController::class, 'index'])->name('home');

Route::get('/media/gallery/{filename}', [WelcomeController::class, 'serveGallery'])
    ->name('media.gallery')
    ->where('filename', '.+');

require __DIR__.'/admission.php';
require __DIR__.'/candidate.php';

Route::post('/payment/webhook', [MidtransController::class, 'handle'])
    ->name('payment.webhook')
    ->withoutMiddleware(['web', \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);

require __DIR__.'/staff.php';
require __DIR__.'/admin.php';
require __DIR__.'/auth.php';
require __DIR__.'/exam.php';
