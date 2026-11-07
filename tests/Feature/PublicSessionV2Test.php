<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('admin creates a four-subject draft then publishes and issues a room token', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ids = [];
    foreach (['IPAS', 'PAIBP', 'MTK', 'BINDO'] as $code) {
        $subject = DB::table('exam_public_subjects')->insertGetId(['name' => $code, 'code' => $code]);
        $ids[] = DB::table('exam_public_packages')->insertGetId([
            'exam_public_subject_id' => $subject, 'title' => $code.' Paket 1', 'code' => $code.'-1', 'status' => 'published',
            'passing_score' => 50, 'allow_retry' => false, 'show_result_to_participant' => false,
        ]);
    }

    $response = $this->actingAs($admin)->postJson(route('admin.exams.public-v2.sessions.store'), [
        'title' => 'Ujian Minggu 1', 'opens_at' => now()->subHour()->toISOString(),
        'closes_at' => now()->addHours(2)->toISOString(), 'order_type' => 'sequential',
        'package_ids' => $ids,
    ])->assertCreated();
    $session = $response->json('id');
    $this->getJson(route('admin.exams.public-v2.sessions.show', $session))->assertJsonCount(4, 'packages')
        ->assertJsonPath('packages.0.subject_name', 'IPAS');
    $this->actingAs($admin)->get(route('admin.exams.public-v2.page'))
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/Exam/PublicExam'));
    expect(DB::table('exam_public_sessions')->where('id', $session)->value('closes_at'))->toBeGreaterThan(now()->toDateTimeString());
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $session))->assertSuccessful()->assertJsonPath('status', 'published');
    $token = $this->postJson(route('admin.exams.public-v2.sessions.tokens.store', $session))->assertCreated()->json('token');
    expect(strlen($token))->toBe(12);
    $this->app['auth']->logout();
    expect(DB::table('exam_public_sessions')->where('id', $session)->value('status'))->toBe('published')
        ->and(DB::table('exam_public_session_tokens')->where('token', $token)->exists())->toBeTrue();
    $this->getJson(route('public-exam.session', $token))->assertSuccessful()->assertJsonPath('session.order_type', 'sequential');
    expect(DB::table('exam_sessions')->count())->toBe(0);
});

test('duplicate mapel is rejected and guests cannot manage public sessions', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $ids = [];
    for ($index = 1; $index <= 4; $index++) {
        $ids[] = DB::table('exam_public_packages')->insertGetId([
            'exam_public_subject_id' => $subject, 'title' => 'MTK '.$index,
            'code' => 'MTK-'.$index, 'status' => 'published',
            'passing_score' => 50, 'allow_retry' => false, 'show_result_to_participant' => false,
        ]);
    }
    $input = [
        'title' => 'Ujian', 'opens_at' => now()->subHour()->toISOString(),
        'closes_at' => now()->addHour()->toISOString(), 'order_type' => 'free', 'package_ids' => $ids,
    ];
    $this->postJson(route('admin.exams.public-v2.sessions.store'), $input)->assertUnauthorized();
    $this->actingAs($admin)->postJson(route('admin.exams.public-v2.sessions.store'), $input)->assertUnprocessable();
    expect(DB::table('exam_public_sessions')->count())->toBe(0);
});

test('session timestamps with an explicit offset are stored in the application timezone', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ids = [];
    foreach (['IPAS', 'PAIBP', 'MTK', 'BINDO'] as $code) {
        $subject = DB::table('exam_public_subjects')->insertGetId(['name' => $code, 'code' => $code]);
        $ids[] = DB::table('exam_public_packages')->insertGetId([
            'exam_public_subject_id' => $subject, 'title' => $code, 'code' => $code, 'status' => 'published',
            'passing_score' => 50, 'allow_retry' => false, 'show_result_to_participant' => false,
        ]);
    }

    $opensAt = now()->subHour()->startOfMinute();
    $closesAt = now()->addHours(2)->startOfMinute();
    $id = $this->actingAs($admin)->postJson(route('admin.exams.public-v2.sessions.store'), [
        'title' => 'Ujian Zona Waktu',
        'opens_at' => $opensAt->copy()->setTimezone('Asia/Jakarta')->toIso8601String(),
        'closes_at' => $closesAt->copy()->setTimezone('Asia/Jakarta')->toIso8601String(),
        'order_type' => 'free', 'package_ids' => $ids,
    ])->assertCreated()->json('id');

    expect(DB::table('exam_public_sessions')->where('id', $id)->value('opens_at'))->toBe($opensAt->toDateTimeString())
        ->and(DB::table('exam_public_sessions')->where('id', $id)->value('closes_at'))->toBe($closesAt->toDateTimeString());
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $id))->assertSuccessful();
});
