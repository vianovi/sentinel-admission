<?php

// routes/exam.php
// ─────────────────────────────────────────────────────────────────────────────
// ONLINE EXAM ENGINE — All exam-related routes isolated from SPMB core.
// Covers: Public guest exam, Candidate exam, Staff exam results, Admin exam management.
// ─────────────────────────────────────────────────────────────────────────────

use App\Http\Controllers\Dashboard\Admin\Exam\IndexController as AdminExamDashboard;
use App\Http\Controllers\Dashboard\Admin\Exam\MonitoringController as AdminExamMonitoring;
use App\Http\Controllers\Dashboard\Admin\Exam\PackageController as AdminExamPackage;
use App\Http\Controllers\Dashboard\Admin\Exam\PublicParticipantController as AdminPublicParticipant;
use App\Http\Controllers\Dashboard\Admin\Exam\PublicSessionController as AdminPublicExamSession;
use App\Http\Controllers\Dashboard\Admin\Exam\QuestionImportController as AdminExamImport;
use App\Http\Controllers\Dashboard\Admin\Exam\ResultController as AdminExamResult;
use App\Http\Controllers\Dashboard\Admin\Exam\SessionController as AdminExamSession;
use App\Http\Controllers\Dashboard\Admin\Exam\SubjectController as AdminExamSubject;
use App\Http\Controllers\Dashboard\Candidate\Exam\AttemptController as CandidateExamAttempt;
use App\Http\Controllers\Dashboard\Candidate\Exam\ExamController as CandidateExam;
use App\Http\Controllers\Dashboard\Staff\Exam\ResultController as StaffExamResult;
use App\Http\Controllers\Exam\PublicExamController;
use App\Http\Controllers\Exam\PublicExamFlowController;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;

// ─────────────────────────────────────────────────────────────────────────────
// EXAM IMAGE SERVING — /exam-media/ bypasses Cloudflare WAF (blocks /storage/ with 403)
// ─────────────────────────────────────────────────────────────────────────────
Route::get('/exam-media/{filename}', function (string $filename) {
    $path = 'exam/images/'.basename($filename);
    if (! \Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
        abort(404);
    }

    return response()->file(\Illuminate\Support\Facades\Storage::disk('public')->path($path));
})->where('filename', '[a-zA-Z0-9_\-\.]+')->name('exam.images.serve');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC EXAM — Guest access via token (Cloudflare Tunnel compatible)
// ─────────────────────────────────────────────────────────────────────────────

Route::prefix('exam')->name('exam.public.')->group(function () {
    Route::get('/p/{token?}', [PublicExamController::class, 'showLanding'])->name('landing');
    Route::post('/p/{token}/start', [PublicExamController::class, 'start'])->name('start')->middleware('throttle:10,1');
    Route::get('/attempts/{attempt}', [PublicExamController::class, 'showAttempt'])->name('attempts.show');
    Route::post('/attempts/{attempt}/resume', [PublicExamController::class, 'resume'])->name('attempts.resume')->middleware('throttle:10,1');
    Route::post('/attempts/{attempt}/sync', [PublicExamController::class, 'sync'])->name('attempts.sync');
    Route::post('/attempts/{attempt}/save-answer', [PublicExamController::class, 'saveAnswer'])->name('attempts.save-answer')->middleware('throttle:60,1');
    Route::post('/attempts/{attempt}/violation', [PublicExamController::class, 'logViolation'])->name('attempts.violation');
    Route::post('/attempts/{attempt}/submit', [PublicExamController::class, 'submit'])->name('attempts.submit');
});

Route::prefix('public-exam')->name('public-exam.')->group(function () {
    Route::get('/sessions/{token}', [PublicExamFlowController::class, 'session'])->name('session')->middleware('throttle:30,1');
    Route::post('/sessions/{token}/join', [PublicExamFlowController::class, 'join'])->name('join')->middleware('throttle:10,1');
    Route::get('/participants/{participant}', [PublicExamFlowController::class, 'dashboard'])->name('dashboard');
    Route::post('/participants/{participant}/packages/{package}/start', [PublicExamFlowController::class, 'start'])->name('start')->middleware('throttle:10,1');
    Route::get('/attempts/{attempt}', [PublicExamFlowController::class, 'attempt'])->name('attempt');
    Route::post('/attempts/{attempt}/answers', [PublicExamFlowController::class, 'answer'])->name('answer')->middleware('throttle:60,1');
    Route::post('/attempts/{attempt}/submit', [PublicExamFlowController::class, 'submit'])->name('submit')->middleware('throttle:60,1');
});

// ─────────────────────────────────────────────────────────────────────────────
// CANDIDATE EXAM — Authenticated candidates taking assigned exams
// ─────────────────────────────────────────────────────────────────────────────

Route::middleware(['auth', RoleMiddleware::class.':candidate'])
    ->prefix('dashboard/seleksi')
    ->name('dashboard.exam.')
    ->group(function () {
        Route::get('/', [CandidateExam::class, 'index'])->name('index');
        Route::get('/sesi/{session}', [CandidateExam::class, 'show'])->name('sessions.show');
        Route::post('/sesi/{session}/start', [CandidateExamAttempt::class, 'start'])->name('sessions.start');
        Route::get('/attempts/{attempt}', [CandidateExamAttempt::class, 'show'])->name('attempts.show');
        Route::get('/attempts/{attempt}/sync', [CandidateExamAttempt::class, 'sync'])->name('attempts.sync');
        Route::post('/attempts/{attempt}/answers', [CandidateExamAttempt::class, 'saveAnswer'])->name('attempts.answers.save');
        Route::post('/attempts/{attempt}/submit', [CandidateExamAttempt::class, 'submit'])->name('attempts.submit');
    });

// ─────────────────────────────────────────────────────────────────────────────
// STAFF EXAM — Staff viewing exam results
// ─────────────────────────────────────────────────────────────────────────────

Route::middleware(['auth', RoleMiddleware::class.':staff'])
    ->prefix('dashboard/staff/exams')
    ->name('staff.exams.')
    ->group(function () {
        Route::get('/results', [StaffExamResult::class, 'index'])->name('results.index');
        Route::get('/results/{attempt}', [StaffExamResult::class, 'show'])->name('results.show');
    });

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN EXAM — Full exam management: subjects, packages, sessions, results
// ─────────────────────────────────────────────────────────────────────────────

Route::middleware(['auth', RoleMiddleware::class.':admin'])
    ->prefix('dashboard/admin/exams')
    ->name('admin.exams.')
    ->group(function () {
        Route::get('/', [AdminExamDashboard::class, 'index'])->name('index');
        Route::get('/monitoring', [AdminExamMonitoring::class, 'index'])->name('monitoring.index');
        Route::get('/monitoring/feed', [AdminExamMonitoring::class, 'feed'])->name('monitoring.feed');
        Route::get('/monitoring/display', [AdminExamMonitoring::class, 'display'])->name('monitoring.display');

        // MEDIA MANAGER
        Route::get('/media', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'index'])->name('media.index');
        Route::post('/media', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'store'])->name('media.store');
        Route::put('/media/rename', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'rename'])->name('media.rename');
        Route::delete('/media', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'destroy'])->name('media.destroy');
        Route::get('/media/packages', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'packages'])->name('media.packages');
        Route::get('/media/packages/{packageId}/questions', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'questions'])->name('media.questions');
        Route::post('/media/assign', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'assign'])->name('media.assign');

        Route::resource('subjects', AdminExamSubject::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::post('/packages/{package}/publish', [AdminExamPackage::class, 'publish'])->name('packages.publish');
        Route::post('/packages/{package}/close', [AdminExamPackage::class, 'close'])->name('packages.close');
        Route::get('/packages/{package}/template', [AdminExamPackage::class, 'downloadTemplate'])->name('packages.template.download');
        Route::delete('/packages/{package}/questions', [AdminExamPackage::class, 'clearQuestions'])->name('packages.questions.clear');
        Route::delete('/questions/{question}', [AdminExamPackage::class, 'destroyQuestion'])->name('questions.destroy');
        Route::resource('packages', AdminExamPackage::class);

        Route::get('/packages/{package}/imports', [AdminExamImport::class, 'index'])->name('packages.imports.index');
        Route::post('/packages/{package}/imports', [AdminExamImport::class, 'store'])->middleware('throttle:upload')->name('packages.imports.store');
        Route::get('/imports/{batch}', [AdminExamImport::class, 'show'])->name('imports.show');
        Route::delete('/imports/{batch}/questions', [AdminExamImport::class, 'destroyQuestions'])->name('imports.questions.destroy');

        Route::get('/public-sessions', [AdminPublicExamSession::class, 'index'])->name('public-sessions.index');
        Route::post('/public-sessions/{session}/participants', [AdminPublicParticipant::class, 'store'])->name('public-sessions.participants.store');
        Route::post('/public-sessions', [AdminPublicExamSession::class, 'store'])->name('public-sessions.store');
        Route::put('/public-sessions/{session}', [AdminPublicExamSession::class, 'update'])->name('public-sessions.update');
        Route::delete('/public-sessions/{session}', [AdminPublicExamSession::class, 'destroy'])->name('public-sessions.destroy');
        Route::post('/public-sessions/{session}/toggle-results', [AdminPublicExamSession::class, 'toggleResultVisibility'])->name('public-sessions.toggle-results');
        Route::post('/public-sessions/{session}/tokens', [AdminPublicExamSession::class, 'generateToken'])->name('public-sessions.tokens.store');
        Route::delete('/public-tokens/{token}', [AdminPublicExamSession::class, 'destroyToken'])->name('public-sessions.destroy-token');
        Route::post('/public-sessions/attempts/{attempt}/force-submit', [AdminPublicExamSession::class, 'forceSubmitAttempt'])->name('public-sessions.attempts.force-submit');
        Route::post('/public-sessions/attempts/{attempt}/reset-violations', [AdminPublicExamSession::class, 'resetAttemptViolations'])->name('public-sessions.attempts.reset-violations');

        Route::post('/sessions/{session}/candidates', [AdminExamSession::class, 'assignCandidates'])->name('sessions.candidates.assign');
        Route::post('/sessions/{session}/tokens', [AdminExamSession::class, 'generateToken'])->name('sessions.tokens.store');
        Route::delete('/tokens/{token}', [AdminExamSession::class, 'destroyToken'])->name('tokens.destroy');
        Route::resource('sessions', AdminExamSession::class);

        Route::get('/results', [AdminExamResult::class, 'index'])->name('results.index');
        Route::get('/results/{attempt}', [AdminExamResult::class, 'show'])->name('results.show');
    });
