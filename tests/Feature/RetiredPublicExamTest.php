<?php

use Illuminate\Support\Facades\Route;

test('legacy public exam routes are unregistered while replacement and candidate routes remain separate', function () {
    expect(Route::has('exam.public.landing'))->toBeFalse()
        ->and(Route::has('admin.exams.public-sessions.index'))->toBeFalse()
        ->and(Route::has('public-exam.page'))->toBeTrue()
        ->and(Route::has('dashboard.exam.index'))->toBeTrue()
        ->and(Route::has('dashboard.exam.sessions.start'))->toBeTrue();

    $this->get('/exam/p/ROOM01')->assertNotFound();
    $this->get('/dashboard/admin/exams/public-sessions')->assertNotFound();
});
