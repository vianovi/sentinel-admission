<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

test('public admission accepts self entered identity and retries do not duplicate participants', function () {
    [$session] = publicTokenFixture();
    $data = ['name' => 'Peserta Publik', 'school_origin' => 'SMP Contoh', 'entry_key' => (string) Str::uuid()];
    $first = $this->postJson(route('public-exam.join', 'ROOM01'), $data)->assertSuccessful();
    $id = $first->json('participant_id');
    $this->postJson(route('public-exam.join', 'ROOM01'), $data)->assertSuccessful()->assertJsonPath('participant_id', $id);
    expect(DB::table('exam_public_participants')->where('name', 'Peserta Publik')->count())->toBe(1)
        ->and(DB::table('exam_public_session_tokens')->where('token', 'ROOM01')->value('used_count'))->toBe(1);
    $this->assertDatabaseHas('exam_public_participants', ['id' => $id, 'exam_public_session_id' => $session, 'school_origin' => 'SMP Contoh']);
    $this->getJson(route('public-exam.dashboard', $id))->assertForbidden();
});

test('automatic rotation preserves one token and rejects its predecessor without ending participant access', function () {
    [$session] = publicTokenFixture();
    DB::table('exam_public_sessions')->where('id', $session)->update(['token_rotation_minutes' => 5]);
    DB::table('exam_public_session_tokens')->where('token', 'ROOM01')->update(['expires_at' => now()->addMinutes(5)]);
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), [
        'name' => 'Peserta', 'school_origin' => 'SMP', 'entry_key' => (string) Str::uuid(),
    ])->assertSuccessful();
    $secret = collect($join->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === 'public_exam_session')->getValue();
    $this->travel(5)->minutes();
    $this->getJson(route('public-exam.session', 'ROOM01'))->assertNotFound();
    $this->artisan('exam:rotate-public-tokens')->assertSuccessful();
    $token = DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->value('token');
    expect($token)->not->toBe('ROOM01');
    $this->artisan('exam:rotate-public-tokens')->assertSuccessful();
    expect(DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->count())->toBe(1)
        ->and(DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->value('token'))->toBe($token);
    $this->getJson(route('public-exam.session', $token))->assertSuccessful();
    $this->withHeader('X-Public-Exam-Session', $secret)->getJson(route('public-exam.dashboard', $join->json('participant_id')))->assertSuccessful();
});

test('rotation respects session status schedule and closing boundary', function (string $status, int $opens, int $closes, bool $expected) {
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Scheduled', 'status' => $status,
        'opens_at' => now()->addMinutes($opens), 'closes_at' => now()->addMinutes($closes),
    ]);
    $this->artisan('exam:rotate-public-tokens')->assertSuccessful();
    $token = DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->first();
    expect($token !== null)->toBe($expected);
    if ($token) {
        expect($token->expires_at)->toBeLessThanOrEqual(now()->addMinutes($closes)->toDateTimeString());
        $response = $this->getJson(route('public-exam.session', $token->token));
        if ($opens > 0) {
            $response->assertNotFound();
        } else {
            $response->assertSuccessful();
        }
    }
})->with([
    ['draft', -10, 30, false], ['closed', -10, 30, false],
    ['published', -10, 0, false], ['published', -10, 2, true], ['published', 30, 60, true],
]);

test('interval settings enforce validation and authorization', function () {
    [$session] = publicTokenFixture();
    $url = route('admin.exams.public-v2.sessions.rotation.update', $session);
    $this->putJson($url, ['token_rotation_minutes' => 10])->assertUnauthorized();
    $this->actingAs(\App\Models\User::factory()->create(['role' => 'staff']))->putJson($url, ['token_rotation_minutes' => 10])->assertForbidden();
    $this->actingAs(\App\Models\User::factory()->create(['role' => 'admin']));
    foreach ([null, 0, -1, 1.5, 1441] as $minutes) {
        $this->putJson($url, ['token_rotation_minutes' => $minutes])->assertUnprocessable();
    }
    $this->putJson($url, ['token_rotation_minutes' => 10])->assertConflict();
    DB::table('exam_public_sessions')->where('id', $session)->update(['status' => 'draft']);
    $this->putJson($url, ['token_rotation_minutes' => 10])->assertSuccessful();
    $this->assertDatabaseHas('exam_public_sessions', ['id' => $session, 'token_rotation_minutes' => 10]);
    DB::table('exam_public_sessions')->where('id', $session)->update(['status' => 'closed']);
    $this->putJson($url, ['token_rotation_minutes' => 2])->assertConflict();
    $this->assertDatabaseHas('exam_public_sessions', ['id' => $session, 'token_rotation_minutes' => 10]);
});

test('public admission validates identity and refuses expired tokens without creating records', function () {
    publicTokenFixture();
    $count = DB::table('exam_public_participants')->count();
    $this->postJson(route('public-exam.join', 'ROOM01'), ['entry_key' => 'invalid'])->assertUnprocessable();
    DB::table('exam_public_session_tokens')->where('token', 'ROOM01')->update(['expires_at' => now()]);
    $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Person', 'school_origin' => 'School', 'entry_key' => (string) Str::uuid()])->assertForbidden();
    expect(DB::table('exam_public_participants')->count())->toBe($count);
});

function publicTokenFixture(): array
{
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Token Fixture', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHours(2),
        'status' => 'published', 'order_type' => 'free', 'token_rotation_minutes' => 5,
    ]);
    DB::table('exam_public_session_tokens')->insert([
        'exam_public_session_id' => $session, 'token' => 'ROOM01', 'expires_at' => now()->addMinutes(5),
    ]);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'Fixture', 'code' => 'FIX']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject, 'title' => 'Fixture Package', 'code' => 'FIX-1', 'status' => 'published',
        'passing_score' => 50, 'allow_retry' => false, 'show_result_to_participant' => false,
    ]);
    DB::table('exam_public_session_packages')->insert([
        'exam_public_session_id' => $session, 'exam_public_package_id' => $package,
        'exam_public_subject_id' => $subject, 'sort_order' => 0,
    ]);
    DB::table('exam_public_questions')->insert([
        'exam_public_package_id' => $package, 'question_text' => 'Fixture question',
        'options' => json_encode(['A' => 'Ya', 'B' => 'Tidak']), 'correct_answer' => 'A', 'point' => 1,
    ]);

    return [$session, $package];
}
