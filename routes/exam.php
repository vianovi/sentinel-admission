<?php

// routes/exam.php
// ─────────────────────────────────────────────────────────────────────────────
// ONLINE EXAM ENGINE — All exam-related routes isolated from SPMB core.
// Covers: Public guest exam, Candidate exam, Staff exam results, Admin exam management.
// ─────────────────────────────────────────────────────────────────────────────

use App\Http\Controllers\Dashboard\Admin\Exam\PackageController as AdminExamPackage;
use App\Http\Controllers\Dashboard\Admin\Exam\PublicBankController as AdminPublicBank;
use App\Http\Controllers\Dashboard\Admin\Exam\PublicParticipantController as AdminPublicParticipant;
use App\Http\Controllers\Dashboard\Admin\Exam\PublicSessionV2Controller as AdminPublicSessionV2;
use App\Http\Controllers\Dashboard\Admin\Exam\QuestionImportController as AdminExamImport;
use App\Http\Controllers\Dashboard\Admin\Exam\ResultController as AdminExamResult;
use App\Http\Controllers\Dashboard\Admin\Exam\SessionController as AdminExamSession;
use App\Http\Controllers\Dashboard\Admin\Exam\SubjectController as AdminExamSubject;
use App\Http\Controllers\Dashboard\Candidate\Exam\AttemptController as CandidateExamAttempt;
use App\Http\Controllers\Dashboard\Candidate\Exam\ExamController as CandidateExam;
use App\Http\Controllers\Dashboard\Staff\Exam\ResultController as StaffExamResult;
use App\Http\Controllers\Exam\PublicExamFlowController;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;

// ─────────────────────────────────────────────────────────────────────────────
// EXAM IMAGE SERVING — /exam-media/ bypasses Cloudflare WAF (blocks /storage/ with 403)
// ─────────────────────────────────────────────────────────────────────────────
Route::get('/exam-media/{filename}', function (string $filename) {
    $safeName = basename($filename);
    $disk = \Illuminate\Support\Facades\Storage::disk('public');

    if ($disk->exists('exam-public/images/'.$safeName)) {
        return response()->file($disk->path('exam-public/images/'.$safeName));
    }

    if ($disk->exists('exam/images/'.$safeName)) {
        return response()->file($disk->path('exam/images/'.$safeName));
    }

    abort(404);
})->where('filename', '[a-zA-Z0-9_\-\.]+')->name('exam.images.serve');

Route::prefix('public-exam')->name('public-exam.')->group(function () {
    Route::get('/', [PublicExamFlowController::class, 'page'])->name('page');
    Route::get('/sessions/{token}', [PublicExamFlowController::class, 'session'])->name('session')->middleware('throttle:30,1');
    Route::post('/sessions/{token}/join', [PublicExamFlowController::class, 'join'])->name('join')->middleware('throttle:5,1');
    Route::get('/participants/{participant}', [PublicExamFlowController::class, 'dashboard'])->name('dashboard');
    Route::post('/participants/{participant}/packages/{package}/start', [PublicExamFlowController::class, 'start'])->name('start')->middleware('throttle:10,1');
    Route::get('/attempts/{attempt}', [PublicExamFlowController::class, 'attempt'])->name('attempt');
    Route::post('/attempts/{attempt}/answers', [PublicExamFlowController::class, 'answer'])->name('answer')->middleware('throttle:60,1');
    Route::post('/attempts/{attempt}/violations', [PublicExamFlowController::class, 'violation'])->name('violation')->middleware('throttle:60,1');
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
        Route::post('/attempts/{attempt}/violations', [CandidateExamAttempt::class, 'violation'])->name('attempts.violations');
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
        Route::get('/', fn () => abort(404))->name('index');
        Route::get('/monitoring', fn () => abort(404))->name('monitoring.index');
        Route::get('/monitoring/feed', fn () => abort(404))->name('monitoring.feed');
        Route::get('/monitoring/display', fn () => abort(404))->name('monitoring.display');

        // MEDIA MANAGER
        Route::get('/media', fn () => abort(404))->name('media.index');
        Route::post('/media', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'store'])->name('media.store');
        Route::put('/media/rename', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'rename'])->name('media.rename');
        Route::delete('/media', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'destroy'])->name('media.destroy');
        Route::get('/media/packages', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'packages'])->name('media.packages');
        Route::get('/media/packages/{packageId}/questions', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'questions'])->name('media.questions');
        Route::post('/media/assign', [\App\Http\Controllers\Dashboard\Admin\Exam\AdminExamMediaController::class, 'assign'])->name('media.assign');

        Route::resource('subjects', AdminExamSubject::class)
            ->only(['store', 'update', 'destroy']);
        Route::get('/subjects', fn () => abort(404))->name('subjects.index');

        Route::post('/packages/{package}/publish', [AdminExamPackage::class, 'publish'])->name('packages.publish');
        Route::post('/packages/{package}/close', [AdminExamPackage::class, 'close'])->name('packages.close');
        Route::get('/packages/{package}/template', [AdminExamPackage::class, 'downloadTemplate'])->name('packages.template.download');
        Route::delete('/packages/{package}/questions', [AdminExamPackage::class, 'clearQuestions'])->name('packages.questions.clear');
        Route::delete('/questions/{question}', [AdminExamPackage::class, 'destroyQuestion'])->name('questions.destroy');
        Route::resource('packages', AdminExamPackage::class)->except(['index']);
        Route::get('/packages', fn () => abort(404))->name('packages.index');

        Route::get('/packages/{package}/imports', [AdminExamImport::class, 'index'])->name('packages.imports.index');
        Route::post('/packages/{package}/imports', [AdminExamImport::class, 'store'])->middleware('throttle:upload')->name('packages.imports.store');
        Route::get('/imports/{batch}', [AdminExamImport::class, 'show'])->name('imports.show');
        Route::delete('/imports/{batch}/questions', [AdminExamImport::class, 'destroyQuestions'])->name('imports.questions.destroy');

        Route::get('/public-bank', [AdminPublicBank::class, 'index'])->name('public-bank.index');
        Route::post('/public-bank/subjects', [AdminPublicBank::class, 'storeSubject'])->name('public-bank.subjects.store');
        Route::post('/public-bank/packages', [AdminPublicBank::class, 'storePackage'])->name('public-bank.packages.store');
        Route::put('/public-bank/packages/{package}/settings', [AdminPublicBank::class, 'updatePackage'])->name('public-bank.packages.settings.update');
        Route::post('/public-bank/packages/{package}/draft', [AdminPublicBank::class, 'revertToDraft'])->name('public-bank.packages.draft');
        Route::get('/public-bank/packages/{package}/questions', [AdminPublicBank::class, 'questions'])->name('public-bank.questions.index');
        Route::get('/public-bank/packages/{package}/template', [AdminPublicBank::class, 'downloadTemplate'])->name('public-bank.packages.template.download');
        Route::post('/public-bank/packages/{package}/questions', [AdminPublicBank::class, 'storeQuestion'])->name('public-bank.questions.store');
        Route::patch('/public-bank/questions/{question}', [AdminPublicBank::class, 'toggleQuestion'])->name('public-bank.questions.toggle');
        Route::delete('/public-bank/questions/{question}', [AdminPublicBank::class, 'destroyQuestion'])->name('public-bank.questions.destroy');
        Route::post('/public-bank/packages/{package}/imports', [AdminPublicBank::class, 'importQuestions'])->middleware('throttle:upload')->name('public-bank.packages.import');
        Route::post('/public-bank/packages/{package}/publish', [AdminPublicBank::class, 'publish'])->name('public-bank.packages.publish');
        Route::delete('/public-bank/packages/{package}', [AdminPublicBank::class, 'destroyPackage'])->name('public-bank.packages.destroy');

        Route::get('/public-v2/sessions', [AdminPublicSessionV2::class, 'index'])->name('public-v2.sessions.index');
        Route::post('/public-v2/sessions', [AdminPublicSessionV2::class, 'store'])->name('public-v2.sessions.store');
        Route::get('/public-v2/sessions/{session}', [AdminPublicSessionV2::class, 'show'])->name('public-v2.sessions.show');
        Route::delete('/public-v2/sessions/{session}', [AdminPublicSessionV2::class, 'destroy'])->name('public-v2.sessions.destroy');
        Route::post('/public-v2/sessions/{session}/publish', [AdminPublicSessionV2::class, 'publish'])->name('public-v2.sessions.publish');
        Route::put('/public-v2/sessions/{session}/packages', [AdminPublicSessionV2::class, 'updatePackages'])->name('public-v2.sessions.packages.update');
        Route::put('/public-v2/sessions/{session}', [AdminPublicSessionV2::class, 'update'])->name('public-v2.sessions.update');
        Route::post('/public-v2/sessions/{session}/close', [AdminPublicSessionV2::class, 'close'])->name('public-v2.sessions.close');
        Route::put('/public-v2/sessions/{session}/rotation', [AdminPublicSessionV2::class, 'rotation'])->name('public-v2.sessions.rotation.update');
        Route::post('/public-v2/sessions/{session}/tokens', [AdminPublicSessionV2::class, 'token'])->name('public-v2.sessions.tokens.store');

        Route::get('/public-sessions/{session}/participants', [AdminPublicParticipant::class, 'index'])->name('public-sessions.participants.index');
        Route::get('/public-sessions/{session}/results.csv', [AdminPublicParticipant::class, 'export'])->name('public-sessions.results.export');
        Route::post('/public-sessions/{session}/participants', [AdminPublicParticipant::class, 'store'])->name('public-sessions.participants.store');
        Route::post('/sessions/{session}/candidates', [AdminExamSession::class, 'assignCandidates'])->name('sessions.candidates.assign');
        Route::resource('sessions', AdminExamSession::class)->except(['index']);
        Route::get('/sessions', fn () => abort(404))->name('sessions.index');

        Route::get('/results', [AdminExamResult::class, 'index'])->name('results.index');
        Route::get('/results/{attempt}', [AdminExamResult::class, 'show'])->name('results.show');
        Route::post('/results/{attempt}/force-stop', [AdminExamResult::class, 'forceStop'])->name('results.force-stop');
        Route::delete('/results/{attempt}/history', [AdminExamResult::class, 'destroyHistory'])->name('results.history.destroy');
    });

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC EXAM ADMIN — Isolated public exam management: Media, Categories, Packages, Sessions, Results
// ─────────────────────────────────────────────────────────────────────────────

Route::middleware(['auth', RoleMiddleware::class.':admin'])
    ->prefix('dashboard/admin/public-exams')
    ->name('admin.public-exams.')
    ->group(function () {
        Route::prefix('media')->name('media.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamMediaController::class, 'index'])->name('index');
            Route::post('/', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamMediaController::class, 'store'])->name('store');
            Route::put('/rename', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamMediaController::class, 'rename'])->name('rename');
            Route::delete('/', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamMediaController::class, 'destroy'])->name('destroy');
            Route::get('/packages', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamMediaController::class, 'packages'])->name('packages');
            Route::get('/packages/{packageId}/questions', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamMediaController::class, 'questions'])->name('questions');
            Route::post('/assign', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamMediaController::class, 'assign'])->name('assign');
        });
        Route::get('/categories', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamCategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamCategoryController::class, 'store'])->name('categories.store');
        Route::put('/categories/{subject}', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamCategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{subject}', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamCategoryController::class, 'destroy'])->name('categories.destroy');
        Route::get('/packages', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamPagesController::class, 'packages'])->name('packages.index');
        Route::get('/packages/{package}', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamPagesController::class, 'package'])->whereNumber('package')->name('packages.show');
        Route::get('/sessions', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamPagesController::class, 'sessions'])->name('sessions.index');
        Route::get('/sessions/{session}', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamPagesController::class, 'sessions'])->whereNumber('session')->name('sessions.show');
        Route::get('/results', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamPagesController::class, 'results'])->name('results.index');
        Route::post('/results/participants/{participant}/force-stop', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamPagesController::class, 'forceStopParticipant'])->name('results.participants.force-stop');
        Route::delete('/results/participants/{participant}', [\App\Http\Controllers\Dashboard\Admin\PublicExam\PublicExamPagesController::class, 'destroyParticipantHistory'])->name('results.participants.destroy');
    });
