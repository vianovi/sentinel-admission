<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('unpublishing revokes access and allows editing republishing or deleting a draft', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'Mapel', 'code' => 'UNPUB']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject, 'title' => 'Paket', 'code' => 'UNPUB-1', 'status' => 'published',
        'passing_score' => 50, 'allow_retry' => false, 'show_result_to_participant' => false,
    ]);
    addPublicSessionQuestions([$package]);
    $input = ['title' => 'Sesi', 'opens_at' => now()->subHour()->toISOString(), 'closes_at' => now()->addHours(2)->toISOString(), 'order_type' => 'free', 'package_ids' => [$package]];
    $session = $this->actingAs($admin)->postJson(route('admin.exams.public-v2.sessions.store'), $input)->assertCreated()->json('id');
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $session))->assertSuccessful();
    $oldToken = DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->value('token');
    $this->putJson(route('admin.exams.public-v2.sessions.update', $session), $input)->assertConflict();
    $url = route('admin.exams.public-v2.sessions.unpublish', $session);
    $this->postJson($url)->assertSuccessful()->assertJsonPath('status', 'draft')->assertJsonPath('tokens_revoked', true);
    $this->postJson($url)->assertSuccessful();
    $this->artisan('exam:rotate-public-tokens')->assertSuccessful();
    expect(app(\App\Services\Exam\PublicSessionTokenService::class)->current($session))->toBeNull()
        ->and(DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->count())->toBe(0)
        ->and(DB::table('exam_public_session_packages')->where('exam_public_session_id', $session)->count())->toBe(1);
    $this->putJson(route('admin.exams.public-v2.sessions.update', $session), [...$input, 'title' => 'Sesi Diedit'])->assertSuccessful();
    $this->assertDatabaseHas('exam_public_sessions', ['id' => $session, 'title' => 'Sesi Diedit', 'status' => 'draft']);
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $session))->assertSuccessful();
    expect(DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->value('token'))->not->toBe($oldToken);
    $this->postJson($url)->assertSuccessful();
    $this->deleteJson(route('admin.exams.public-v2.sessions.destroy', $session))->assertSuccessful();
    $this->assertDatabaseMissing('exam_public_sessions', ['id' => $session]);
});

test('unpublishing is admin only and reopens unused closed sessions but refuses started sessions', function () {
    $session = DB::table('exam_public_sessions')->insertGetId(['title' => 'Sesi', 'status' => 'published', 'opens_at' => now(), 'closes_at' => now()->addHour()]);
    DB::table('exam_public_session_tokens')->insert(['exam_public_session_id' => $session, 'token' => 'KEEP1']);
    $url = route('admin.exams.public-v2.sessions.unpublish', $session);
    $this->postJson($url)->assertUnauthorized();
    $this->actingAs(User::factory()->create(['role' => 'staff']))->postJson($url)->assertForbidden();
    $this->actingAs(User::factory()->create(['role' => 'admin']));
    DB::table('exam_public_sessions')->where('id', $session)->update(['status' => 'closed']);
    $this->postJson($url)->assertSuccessful()->assertJsonPath('status', 'draft');
    $this->assertDatabaseMissing('exam_public_session_tokens', ['token' => 'KEEP1']);
    DB::table('exam_public_sessions')->where('id', $session)->update(['status' => 'published']);
    DB::table('exam_public_session_tokens')->insert(['exam_public_session_id' => $session, 'token' => 'KEEP2']);
    DB::table('exam_public_participants')->insert(['exam_public_session_id' => $session, 'name' => 'Peserta', 'school_origin' => 'Sekolah', 'participant_code' => 'UNPUBSTARTED', 'started_at' => now()]);
    $this->postJson($url)->assertConflict();
    DB::table('exam_public_sessions')->where('id', $session)->update(['status' => 'closed']);
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $session))->assertConflict();
    $this->assertDatabaseHas('exam_public_sessions', ['id' => $session, 'status' => 'closed']);
    $this->assertDatabaseHas('exam_public_session_tokens', ['token' => 'KEEP2']);
    $this->postJson(route('admin.exams.public-v2.sessions.unpublish', 999999))->assertNotFound();
});

test('admin can reactivate an unused closed session directly with a fresh token', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'Mapel Aktif', 'code' => 'REACTIVE']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject, 'title' => 'Paket Aktif', 'code' => 'REACTIVE-1', 'status' => 'published',
        'passing_score' => 50, 'allow_retry' => false, 'show_result_to_participant' => false,
    ]);
    addPublicSessionQuestions([$package]);
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Aktifkan Lagi', 'status' => 'closed', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);
    DB::table('exam_public_session_packages')->insert([
        'exam_public_session_id' => $session, 'exam_public_package_id' => $package,
        'exam_public_subject_id' => $subject, 'sort_order' => 0,
    ]);

    $this->actingAs($admin)->postJson(route('admin.exams.public-v2.sessions.publish', $session))
        ->assertSuccessful()->assertJsonPath('status', 'published');

    $this->assertDatabaseHas('exam_public_sessions', ['id' => $session, 'status' => 'published']);
    expect(DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->value('token'))->toHaveLength(5);
});

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
    addPublicSessionQuestions($ids);
    $this->getJson(route('admin.exams.public-v2.sessions.show', $session))->assertJsonCount(4, 'packages')
        ->assertJsonPath('packages.0.subject_name', 'IPAS');
    $this->actingAs($admin)->get(route('admin.public-exams.sessions.index'))
        ->assertInertia(fn ($page) => $page->component('Dashboard/Admin/PublicExam/Sessions'));
    expect(DB::table('exam_public_sessions')->where('id', $session)->value('closes_at'))->toBeGreaterThan(now()->toDateTimeString());
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $session))->assertSuccessful()->assertJsonPath('status', 'published');
    $token = DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->value('token');
    expect(strlen($token))->toBe(5);
    $this->postJson(route('admin.exams.public-v2.sessions.tokens.store', $session))->assertGone();
    $this->travel(5)->minutes();
    $this->artisan('exam:rotate-public-tokens')->assertSuccessful();
    $replacement = DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->value('token');
    $this->app['auth']->logout();
    expect(DB::table('exam_public_sessions')->where('id', $session)->value('status'))->toBe('published')
        ->and(DB::table('exam_public_session_tokens')->where('token', $token)->exists())->toBeFalse()
        ->and(DB::table('exam_public_session_tokens')->where('token', $replacement)->exists())->toBeTrue();
    $this->getJson(route('public-exam.session', $token))->assertNotFound();
    $this->getJson(route('public-exam.session', $replacement))->assertSuccessful()->assertJsonPath('session.order_type', 'sequential');
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

test('admin can delete an unused draft session and its configuration rows', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $packages = [];
    foreach (range(1, 4) as $number) {
        $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'Mapel '.$number, 'code' => 'DEL'.$number]);
        $packages[] = DB::table('exam_public_packages')->insertGetId([
            'exam_public_subject_id' => $subject, 'title' => 'Paket '.$number, 'code' => 'DEL-'.$number,
            'status' => 'published', 'passing_score' => 50, 'allow_retry' => false, 'show_result_to_participant' => false,
        ]);
    }
    $session = $this->actingAs($admin)->postJson(route('admin.exams.public-v2.sessions.store'), [
        'title' => 'Sesi Sampah', 'opens_at' => now()->toISOString(), 'closes_at' => now()->addHour()->toISOString(),
        'order_type' => 'free', 'package_ids' => $packages,
    ])->assertCreated()->json('id');
    DB::table('exam_public_session_tokens')->insert(['exam_public_session_id' => $session, 'token' => 'DELTEST']);

    $this->deleteJson(route('admin.exams.public-v2.sessions.destroy', $session))
        ->assertSuccessful()->assertJsonPath('deleted', true);

    expect(DB::table('exam_public_sessions')->where('id', $session)->exists())->toBeFalse()
        ->and(DB::table('exam_public_session_packages')->where('exam_public_session_id', $session)->exists())->toBeFalse()
        ->and(DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->exists())->toBeFalse();
});

test('public session deletion rejects published and attended sessions', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $packages = [];
    foreach (range(1, 4) as $number) {
        $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'Mapel '.$number, 'code' => 'GUARD'.$number]);
        $packages[] = DB::table('exam_public_packages')->insertGetId([
            'exam_public_subject_id' => $subject, 'title' => 'Paket '.$number, 'code' => 'GUARD-'.$number,
            'status' => 'published', 'passing_score' => 50, 'allow_retry' => false, 'show_result_to_participant' => false,
        ]);
    }
    $create = fn (string $title) => $this->actingAs($admin)->postJson(route('admin.exams.public-v2.sessions.store'), [
        'title' => $title, 'opens_at' => now()->toISOString(), 'closes_at' => now()->addHour()->toISOString(),
        'order_type' => 'free', 'package_ids' => $packages,
    ])->assertCreated()->json('id');
    $published = $create('Sudah Terbit');
    addPublicSessionQuestions($packages);
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $published))->assertSuccessful();
    $this->deleteJson(route('admin.exams.public-v2.sessions.destroy', $published))->assertConflict();

    $attended = $create('Sudah Ada Peserta');
    DB::table('exam_public_participants')->insert([
        'exam_public_session_id' => $attended, 'participant_code' => 'DELETEGUARD0001',
        'name' => 'Peserta', 'school_origin' => 'Sekolah',
    ]);
    $this->deleteJson(route('admin.exams.public-v2.sessions.destroy', $attended))->assertConflict();
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
    addPublicSessionQuestions($ids);
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $id))->assertSuccessful();
});

test('draft session can replace four distinct public packages and revoke stale tokens without losing roster', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $packages = [];
    foreach (['IPAS', 'PAIBP', 'MTK', 'BINDO'] as $code) {
        $subject = DB::table('exam_public_subjects')->insertGetId(['name' => $code, 'code' => $code]);
        foreach ([1, 2] as $number) {
            $packages[$code][$number] = DB::table('exam_public_packages')->insertGetId([
                'exam_public_subject_id' => $subject, 'title' => $code.' '.$number, 'code' => $code.'-'.$number,
                'status' => 'published', 'passing_score' => 55, 'allow_retry' => false, 'show_result_to_participant' => false,
            ]);
        }
    }
    $session = $this->actingAs($admin)->postJson(route('admin.exams.public-v2.sessions.store'), [
        'title' => 'Sesi Ulang', 'opens_at' => now()->subHour()->toISOString(), 'closes_at' => now()->addHours(2)->toISOString(),
        'order_type' => 'free', 'package_ids' => array_map(fn ($code) => $packages[$code][1], ['IPAS', 'PAIBP', 'MTK', 'BINDO']),
    ])->assertCreated()->json('id');
    DB::table('exam_public_session_tokens')->insert(['exam_public_session_id' => $session, 'token' => 'STALECODE']);
    DB::table('exam_public_participants')->insert([
        'exam_public_session_id' => $session, 'name' => 'Peserta Fiktif', 'school_origin' => 'Sekolah Fiktif', 'participant_code' => 'FAKESTUDENT000001',
    ]);
    $replacement = array_map(fn ($code) => $packages[$code][2], ['IPAS', 'PAIBP', 'MTK', 'BINDO']);
    addPublicSessionQuestions($replacement);

    $this->putJson(route('admin.exams.public-v2.sessions.packages.update', $session), ['package_ids' => [$replacement[0], $replacement[0], $replacement[2], $replacement[3]]])->assertUnprocessable();
    $this->putJson(route('admin.exams.public-v2.sessions.packages.update', $session), ['package_ids' => $replacement])
        ->assertSuccessful()->assertJsonPath('tokens_revoked', true);

    expect(DB::table('exam_public_session_packages')->where('exam_public_session_id', $session)->orderBy('sort_order')->pluck('exam_public_package_id')->all())->toBe($replacement)
        ->and(DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->count())->toBe(0)
        ->and(DB::table('exam_public_participants')->where('exam_public_session_id', $session)->count())->toBe(1);
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $session))->assertSuccessful();
    $this->getJson(route('public-exam.session', 'STALECODE'))->assertNotFound();
});

function addPublicSessionQuestions(array $packages): void
{
    foreach ($packages as $package) {
        DB::table('exam_public_questions')->insert([
            'exam_public_package_id' => $package, 'question_text' => 'Pertanyaan fixture',
            'options' => json_encode(['A' => 'Ya', 'B' => 'Tidak']), 'correct_answer' => 'A', 'point' => 1,
        ]);
    }
}

test('draft configuration updates atomically and cannot change after participant entry', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ids = [];
    foreach (range(1, 4) as $number) {
        $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'Mapel '.$number, 'code' => 'M'.$number]);
        $ids[] = DB::table('exam_public_packages')->insertGetId([
            'exam_public_subject_id' => $subject, 'title' => 'Paket '.$number, 'code' => 'P'.$number,
            'status' => 'published', 'passing_score' => 55, 'allow_retry' => false, 'show_result_to_participant' => false,
        ]);
    }
    $data = ['title' => 'Draft', 'opens_at' => now()->toISOString(), 'closes_at' => now()->addHours(2)->toISOString(), 'order_type' => 'free', 'time_source' => 'participant', 'package_ids' => $ids];
    $session = $this->actingAs($admin)->postJson(route('admin.exams.public-v2.sessions.store'), $data)->assertCreated()->json('id');
    $url = route('admin.exams.public-v2.sessions.update', $session);
    $this->putJson($url, [...$data, 'title' => 'Tidak tersimpan', 'package_ids' => [$ids[0], $ids[0], $ids[2], $ids[3]]])->assertUnprocessable();
    expect(DB::table('exam_public_sessions')->where('id', $session)->value('title'))->toBe('Draft');
    $this->putJson($url, [...$data, 'title' => 'Revisi', 'instructions' => 'Baca petunjuk', 'order_type' => 'sequential', 'package_ids' => array_reverse($ids)])->assertSuccessful();
    expect(DB::table('exam_public_sessions')->where('id', $session)->value('title'))->toBe('Revisi')
        ->and(DB::table('exam_public_sessions')->where('id', $session)->value('time_source'))->toBe('participant')
        ->and(DB::table('exam_public_session_packages')->where('exam_public_session_id', $session)->orderBy('sort_order')->pluck('exam_public_package_id')->all())->toBe(array_reverse($ids));
    $this->get(route('admin.public-exams.sessions.show', $session))->assertInertia(fn ($page) => $page
        ->where('examTimezone', config('app.timezone'))
        ->where('sessions.0.instructions', 'Baca petunjuk')
        ->where('sessions.0.opens_at', fn ($value) => preg_match('/[+-]\d{2}:\d{2}$/', $value) === 1));
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $session))->assertUnprocessable();
    addPublicSessionQuestions($ids);
    $subject = DB::table('exam_public_packages')->where('id', $ids[0])->value('exam_public_subject_id');
    DB::table('exam_public_subjects')->where('id', $subject)->update(['is_active' => false]);
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $session))->assertUnprocessable();
    DB::table('exam_public_subjects')->where('id', $subject)->update(['is_active' => true]);
    DB::table('exam_public_participants')->insert([
        'exam_public_session_id' => $session, 'participant_code' => 'CONFIGGUARD00001',
        'name' => 'Fixture', 'school_origin' => 'School', 'started_at' => now(),
    ]);
    $this->putJson($url, $data)->assertConflict();
    expect(DB::table('exam_public_sessions')->where('id', $session)->value('title'))->toBe('Revisi');
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $session))->assertSuccessful();
    $this->putJson($url, $data)->assertConflict();
    $this->actingAs(User::factory()->create(['role' => 'staff']))->putJson($url, $data)->assertForbidden();
});
