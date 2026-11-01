<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('legacy public start and attempt endpoints are gone without creating attempts', function () {
    $subject = DB::table('exam_subjects')->insertGetId(['name' => 'MTK']);
    $package = DB::table('exam_packages')->insertGetId(['exam_subject_id' => $subject, 'title' => 'Paket lama']);
    $session = DB::table('exam_sessions')->insertGetId([
        'exam_package_id' => $package, 'title' => 'Sesi lama', 'opens_at' => now()->subHour(),
        'closes_at' => now()->addHour(), 'duration_minutes' => 60, 'passing_score' => 65,
        'is_public' => true, 'status' => 'published',
    ]);
    $attempt = DB::table('exam_attempts')->insertGetId([
        'exam_session_id' => $session, 'exam_package_id' => $package,
        'guest_name' => 'Peserta', 'guest_session_token' => 'original-secret',
    ]);
    $this->post('/exam/p/ROOM01/start', [
        'guest_name' => 'Peserta', 'guest_school' => 'SD', 'package_id' => 1,
    ])->assertStatus(410);
    $this->get('/exam/p/ROOM01')->assertStatus(410);
    $this->get('/exam/attempts/'.$attempt)->assertStatus(410);
    $this->post('/exam/attempts/'.$attempt.'/resume')->assertStatus(410);
    $this->post('/exam/attempts/'.$attempt.'/save-answer')->assertStatus(410);
    $this->post('/exam/attempts/'.$attempt.'/submit')->assertStatus(410);

    expect(DB::table('exam_attempts')->count())->toBe(1)
        ->and(DB::table('exam_attempts')->where('id', $attempt)->value('guest_session_token'))->toBe('original-secret');
});

test('legacy admin public session routes are gone but the new roster route stays available', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin)->get(route('admin.exams.public-sessions.index'))->assertStatus(410);
    $this->actingAs($admin)->post(route('admin.exams.public-sessions.store'))->assertStatus(410);
    $this->actingAs($admin)->post('/dashboard/admin/exams/public-sessions/attempts/1/force-submit')->assertNotFound();

    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Ujian Publik Baru', 'opens_at' => now(), 'closes_at' => now()->addDay(),
    ]);
    $this->actingAs($admin)->get(route('admin.exams.public-sessions.participants.index', $session))->assertSuccessful();
    expect(DB::table('exam_sessions')->count())->toBe(0);
});

test('internal session creation cannot enable legacy public access or issue legacy tokens', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_subjects')->insertGetId(['name' => 'MTK']);
    $package = DB::table('exam_packages')->insertGetId(['exam_subject_id' => $subject, 'title' => 'Paket internal']);

    $this->actingAs($admin)->post(route('admin.exams.sessions.store'), [
        'exam_package_id' => $package,
        'title' => 'Sesi Internal',
        'opens_at' => now()->subHour()->toISOString(),
        'closes_at' => now()->addHour()->toISOString(),
        'duration_minutes' => 60,
        'passing_score' => 65,
        'max_attempts' => 1,
        'is_public' => true,
        'status' => 'published',
    ])->assertRedirect();

    $session = DB::table('exam_sessions')->where('title', 'Sesi Internal')->first();
    expect($session)->not->toBeNull()->and($session->is_public)->toBe(0);
    $this->actingAs($admin)->post(route('admin.exams.sessions.tokens.store', $session->id))->assertStatus(410);
    expect(DB::table('exam_session_tokens')->count())->toBe(0);
});
