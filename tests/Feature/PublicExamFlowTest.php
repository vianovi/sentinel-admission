<?php

use App\Models\User;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    $this->withoutMiddleware(ThrottleRequests::class);
});

test('public join rate limit separates phones sharing one network', function () {
    publicFlowFixture();
    $this->withMiddleware(ThrottleRequests::class);

    foreach (range(1, 6) as $number) {
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
            ->postJson(route('public-exam.join', 'ROOM01'), [
                'name' => 'Peserta '.$number,
                'school_origin' => 'Sekolah',
                'entry_key' => (string) Illuminate\Support\Str::uuid(),
            ])->assertSuccessful();
    }

    expect(DB::table('exam_public_participants')->whereNotNull('started_at')->count())->toBe(6);
    RateLimiter::clear('public-exam-join:network:ROOM01|192.0.2.10');
});

test('public sessions support the configured package count from creation to final score', function (int $count, string $order) {
    [, $packages] = publicFlowFixture($order, $count);
    $admin = User::factory()->create(['role' => 'admin']);
    $ids = array_column(array_values($packages), 0);
    $session = $this->actingAs($admin)->postJson(route('admin.exams.public-v2.sessions.store'), [
        'title' => 'Dynamic session', 'opens_at' => now()->subHour()->toISOString(),
        'closes_at' => now()->addHour()->toISOString(), 'order_type' => $order, 'package_ids' => $ids,
    ])->assertCreated()->json('id');
    expect(DB::table('exam_public_session_packages')->where('exam_public_session_id', $session)->count())->toBe($count);
    $this->postJson(route('admin.exams.public-v2.sessions.publish', $session))->assertSuccessful();
    $token = DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->value('token');
    DB::table('exam_public_participants')->where('participant_code', 'STUDENTCODE00001')->update(['exam_public_session_id' => $session]);
    $this->app['auth']->logout();
    $join = $this->postJson(route('public-exam.join', $token), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()])->assertSuccessful();
    $participant = $join->json('participant_id');
    $secret = collect($join->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === 'public_exam_session')->getValue();
    $this->withHeader('X-Public-Exam-Session', $secret);
    foreach (array_values($packages) as $index => [$package, $question]) {
        $this->getJson(route('public-exam.dashboard', $participant))->assertJsonPath('result.completed', false);
        $attempt = $this->postJson(route('public-exam.start', [$participant, $package]))->assertSuccessful()->json('attempt_id');
        if ($index === 0) {
            $this->postJson(route('public-exam.answer', $attempt), ['question_id' => $question, 'selected_option' => 'A'])->assertSuccessful();
        }
        $this->postJson(route('public-exam.submit', $attempt))->assertSuccessful();
    }
    $this->getJson(route('public-exam.dashboard', $participant))->assertJsonPath('result.completed', true);
    $result = DB::table('exam_public_participants')->find($participant);
    expect($result->status)->toBe('completed')
        ->and((float) $result->average_score)->toBe(round(100 / $count, 2))
        ->and((bool) $result->is_passed)->toBe(100 / $count > 65);
})->with([1, 2, 3, 4, 5])->with(['free', 'sequential']);

function publicFlowFixture(string $order = 'free', int $packageCount = 4): array
{
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Ujian Publik', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHours(3),
        'status' => 'published', 'order_type' => $order,
    ]);
    DB::table('exam_public_session_tokens')->insert(['exam_public_session_id' => $session, 'token' => 'ROOM01']);
    DB::table('exam_public_participants')->insert([
        'exam_public_session_id' => $session,
        'participant_code' => 'STUDENTCODE00001',
        'name' => 'Anak A',
        'school_origin' => 'SD Asal',
    ]);
    $packages = [];
    foreach (array_slice(['IPAS', 'PAIBP', 'MTK', 'BINDO', 'BING'], 0, $packageCount) as $index => $code) {
        $subject = DB::table('exam_public_subjects')->insertGetId(['name' => $code, 'code' => $code]);
        $package = DB::table('exam_public_packages')->insertGetId([
            'exam_public_subject_id' => $subject, 'title' => $code.' Paket 1', 'code' => $code.'-1', 'status' => 'published',
            'passing_score' => 50, 'allow_retry' => $code === 'MTK', 'show_result_to_participant' => false,
        ]);
        DB::table('exam_public_session_packages')->insert([
            'exam_public_session_id' => $session, 'exam_public_package_id' => $package,
            'exam_public_subject_id' => $subject, 'sort_order' => $index,
        ]);
        $question = DB::table('exam_public_questions')->insertGetId([
            'exam_public_package_id' => $package, 'question_text' => $code.'?',
            'options' => json_encode(['A' => 'Ya', 'B' => 'Tidak']), 'correct_answer' => 'A', 'point' => 10,
        ]);
        $packages[$code] = [$package, $question];
    }

    return [$session, $packages];
}

test('public session edits accept one to five packages but reject empty excessive or duplicate selections', function () {
    [$session, $packages] = publicFlowFixture('free', 5);
    DB::table('exam_public_sessions')->where('id', $session)->update(['status' => 'draft']);
    $this->actingAs(User::factory()->create(['role' => 'admin']));
    $ids = array_column(array_values($packages), 0);
    foreach ([$ids, [$ids[0]]] as $selection) {
        $this->putJson(route('admin.exams.public-v2.sessions.packages.update', $session), ['package_ids' => $selection])->assertSuccessful();
        expect(DB::table('exam_public_session_packages')->where('exam_public_session_id', $session)->count())->toBe(count($selection));
    }
    foreach ([[], [...$ids, $ids[0]], [$ids[0], $ids[0]]] as $selection) {
        $this->putJson(route('admin.exams.public-v2.sessions.packages.update', $session), ['package_ids' => $selection])->assertUnprocessable();
        $this->postJson(route('admin.exams.public-v2.sessions.store'), [
            'title' => 'Invalid', 'opens_at' => now()->toISOString(), 'closes_at' => now()->addHour()->toISOString(),
            'order_type' => 'free', 'package_ids' => $selection,
        ])->assertUnprocessable();
        expect(DB::table('exam_public_session_packages')->where('exam_public_session_id', $session)->pluck('exam_public_package_id')->all())->toBe([$ids[0]]);
    }
    expect(DB::table('exam_public_sessions')->count())->toBe(1);
});

test('publish and join reject a session when any selected package is not ready', function () {
    [$session, $packages] = publicFlowFixture('free', 5);
    DB::table('exam_public_sessions')->where('id', $session)->update(['status' => 'draft']);
    DB::table('exam_public_packages')->where('id', $packages['BING'][0])->update(['passing_score' => null]);
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->postJson(route('admin.exams.public-v2.sessions.publish', $session))->assertUnprocessable();
    expect(DB::table('exam_public_sessions')->where('id', $session)->value('status'))->toBe('draft');
    DB::table('exam_public_sessions')->where('id', $session)->update(['status' => 'published']);
    $this->app['auth']->logout();
    $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()])->assertUnprocessable();
    expect(DB::table('exam_public_participants')->value('started_at'))->toBeNull()
        ->and(DB::table('exam_public_session_tokens')->value('used_count'))->toBe(0);
});

test('public participant completes four packages in free order without seeing aggregate result', function () {
    [, $packages] = publicFlowFixture();
    $this->get(route('public-exam.page'))
        ->assertInertia(fn ($page) => $page->component('Public/Exam/PublicExam'));
    $this->get(route('public-exam.session', 'ROOM01'))->assertSuccessful()->assertJsonPath('session.order_type', 'free');
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $join->assertSuccessful();
    $participant = $join->json('participant_id');
    $cookie = collect($join->headers->getCookies())->first(fn ($value) => $value->getName() === 'public_exam_session');
    expect($cookie)->not->toBeNull()
        ->and(hash('sha256', $cookie->getValue()))->toBe(DB::table('exam_public_participants')->where('id', $participant)->value('session_secret'));
    $this->withHeader('X-Public-Exam-Session', $cookie->getValue());
    $this->getJson(route('public-exam.dashboard', $participant))->assertSuccessful()->assertJsonPath('result.completed', false);

    foreach (['MTK', 'IPAS', 'PAIBP', 'BINDO'] as $code) {
        [$package, $question] = $packages[$code];
        $start = $this->postJson(route('public-exam.start', [$participant, $package]));
        $start->assertSuccessful();
        $attempt = $start->json('attempt_id');
        $this->getJson(route('public-exam.attempt', $attempt))->assertSuccessful()
            ->assertJsonPath('questions.0.id', $question)->assertJsonMissingPath('questions.0.correct_answer');
        $this->postJson(route('public-exam.answer', $attempt), ['question_id' => $question, 'selected_option' => 'A'])->assertSuccessful();
        $this->postJson(route('public-exam.submit', $attempt))->assertSuccessful();
    }

    $this->getJson(route('public-exam.dashboard', $participant))->assertJsonPath('result.completed', true)
        ->assertJsonMissingPath('result.average_score')->assertJsonMissingPath('result.is_passed');
    expect((float) DB::table('exam_public_participants')->where('id', $participant)->value('average_score'))->toBe(100.0);
    expect(DB::table('exam_attempts')->count())->toBe(0);
});

test('public participant cannot access another participant by changing the ID', function () {
    publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $id = $join->json('participant_id');
    $this->getJson(route('public-exam.dashboard', $id))->assertForbidden();
});

test('public dashboard exposes attempt expiry for the participant workspace', function () {
    [, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $participant = $join->json('participant_id');
    $secret = collect($join->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === 'public_exam_session')->getValue();
    $this->withHeader('X-Public-Exam-Session', $secret);
    $attempt = $this->postJson(route('public-exam.start', [$participant, $packages['IPAS'][0]]))->json('attempt_id');
    DB::table('exam_public_subject_attempts')->where('id', $attempt)->update(['expires_at' => now()->subMinute()]);

    $response = $this->getJson(route('public-exam.dashboard', $participant))->assertSuccessful();

    expect($response->json('attempts.0.id'))->toBe($attempt)
        ->and($response->json('attempts.0.expires_at'))->toBeString()->not->toBeEmpty();
});

test('public exam heartbeat records participant state and current question position', function () {
    [, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $participant = $join->json('participant_id');
    $secret = collect($join->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === 'public_exam_session')->getValue();
    $this->withHeader('X-Public-Exam-Session', $secret);
    $attempt = $this->postJson(route('public-exam.start', [$participant, $packages['IPAS'][0]]))->json('attempt_id');

    $this->postJson(route('public-exam.heartbeat', $attempt), [
        'state' => 'attempt', 'event' => 'question_view', 'question_index' => 2,
    ])->assertSuccessful();

    expect(DB::table('exam_public_subject_attempts')->where('id', $attempt)->first())
        ->last_state->toBe('attempt')
        ->last_event->toBe('question_view')
        ->current_question_index->toBe(2)
        ->last_seen_at->not->toBeNull();
    expect(DB::table('exam_public_participants')->where('id', $participant)->first())
        ->current_state->toBe('attempt')
        ->last_event->toBe('question_view')
        ->last_seen_at->not->toBeNull();
});

test('sequential session blocks skipping its first subject', function () {
    [, $packages] = publicFlowFixture('sequential');
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $cookie = collect($join->headers->getCookies())->first(fn ($value) => $value->getName() === 'public_exam_session');
    $this->withHeader('X-Public-Exam-Session', $cookie->getValue());
    $this->postJson(route('public-exam.start', [$join->json('participant_id'), $packages['MTK'][0]]))->assertForbidden();
});

test('a passing aggregate does not prevent retry of a low subject when scores are hidden', function () {
    [, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $participant = $join->json('participant_id');
    $cookie = collect($join->headers->getCookies())->first(fn ($value) => $value->getName() === 'public_exam_session');
    $this->withHeader('X-Public-Exam-Session', $cookie->getValue());

    foreach (['IPAS', 'PAIBP', 'MTK', 'BINDO'] as $code) {
        [$package, $question] = $packages[$code];
        $attempt = $this->postJson(route('public-exam.start', [$participant, $package]))->json('attempt_id');
        if ($code !== 'MTK') {
            $this->postJson(route('public-exam.answer', $attempt), ['question_id' => $question, 'selected_option' => 'A'])->assertSuccessful();
        }
        $this->postJson(route('public-exam.submit', $attempt))->assertSuccessful();
    }

    $this->getJson(route('public-exam.dashboard', $participant))->assertJsonPath('result.subjects.2.remedial_available', true)
        ->assertJsonMissingPath('result.average_score');
    expect((float) DB::table('exam_public_participants')->where('id', $participant)->value('average_score'))->toBe(75.0);
});

test('a failing aggregate opens remedial only for the low subject', function () {
    [, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $participant = $join->json('participant_id');
    $cookie = collect($join->headers->getCookies())->first(fn ($value) => $value->getName() === 'public_exam_session');
    $this->withHeader('X-Public-Exam-Session', $cookie->getValue());

    foreach (['IPAS', 'PAIBP', 'MTK', 'BINDO'] as $code) {
        [$package, $question] = $packages[$code];
        $attempt = $this->postJson(route('public-exam.start', [$participant, $package]))->json('attempt_id');
        if ($code === 'IPAS') {
            $this->postJson(route('public-exam.start', [$participant, $packages['MTK'][0]]))->assertStatus(409);
        }
        if ($code !== 'MTK' && $code !== 'BINDO') {
            $this->postJson(route('public-exam.answer', $attempt), ['question_id' => $question, 'selected_option' => 'A'])->assertSuccessful();
        }
        $this->postJson(route('public-exam.submit', $attempt))->assertSuccessful();
    }

    $this->getJson(route('public-exam.dashboard', $participant))
        ->assertJsonPath('result.subjects.2.remedial_available', true);
    $this->postJson(route('public-exam.start', [$participant, $packages['IPAS'][0]]))->assertForbidden();
    $remedial = $this->postJson(route('public-exam.start', [$participant, $packages['MTK'][0]]));
    $remedial->assertSuccessful();
    expect(DB::table('exam_public_subject_attempts')->where('id', $remedial->json('attempt_id'))->value('attempt_type'))->toBe('remedial');
    $this->postJson(route('public-exam.start', [$participant, $packages['MTK'][0]]))->assertJsonPath('attempt_id', $remedial->json('attempt_id'));
    $this->postJson(route('public-exam.answer', $remedial->json('attempt_id')), [
        'question_id' => $packages['MTK'][1], 'selected_option' => 'A',
    ])->assertSuccessful();
    $this->postJson(route('public-exam.submit', $remedial->json('attempt_id')))->assertSuccessful();
    $this->getJson(route('public-exam.dashboard', $participant))->assertJsonPath('result.subjects.2.remedial_available', false)
        ->assertJsonPath('result.subjects.2.primary_score', null);
    expect((float) DB::table('exam_public_participants')->where('id', $participant)->value('average_score'))->toBe(75.0);
});

test('answers cannot use a question outside the frozen attempt', function () {
    [, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $cookie = collect($join->headers->getCookies())->first(fn ($value) => $value->getName() === 'public_exam_session');
    $this->withHeader('X-Public-Exam-Session', $cookie->getValue());
    $attempt = $this->postJson(route('public-exam.start', [$join->json('participant_id'), $packages['IPAS'][0]]))->json('attempt_id');

    $this->postJson(route('public-exam.answer', $attempt), [
        'question_id' => $packages['MTK'][1], 'selected_option' => 'A',
    ])->assertUnprocessable();
    expect(DB::table('exam_public_attempt_answers')->count())->toBe(0);
});

test('public attempt records fullscreen and tab violations while it remains active', function () {
    [, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $secret = collect($join->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === 'public_exam_session')->getValue();
    $this->withHeader('X-Public-Exam-Session', $secret);
    $attempt = $this->postJson(route('public-exam.start', [$join->json('participant_id'), $packages['IPAS'][0]]))->json('attempt_id');

    $this->postJson(route('public-exam.violation', $attempt), ['type' => 'exit_fullscreen'])
        ->assertSuccessful()
        ->assertJsonPath('violations_count', 1);
    $this->postJson(route('public-exam.violation', $attempt), ['type' => 'tab_switch'])
        ->assertSuccessful()
        ->assertJsonPath('violations_count', 2);

    $record = DB::table('exam_public_subject_attempts')->find($attempt);
    expect($record->violations_count)->toBe(2)
        ->and(json_decode($record->metadata, true)['violations_log'])->toHaveCount(2);

    $this->postJson(route('public-exam.submit', $attempt))->assertSuccessful();
    $this->postJson(route('public-exam.violation', $attempt), ['type' => 'tab_switch'])->assertStatus(423);
});

test('an expired attempt must be submitted before another subject starts', function () {
    [, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $cookie = collect($join->headers->getCookies())->first(fn ($value) => $value->getName() === 'public_exam_session');
    $this->withHeader('X-Public-Exam-Session', $cookie->getValue());
    $participant = $join->json('participant_id');
    $attempt = $this->postJson(route('public-exam.start', [$participant, $packages['IPAS'][0]]))->json('attempt_id');
    DB::table('exam_public_subject_attempts')->where('id', $attempt)->update(['expires_at' => now()->subMinute()]);

    $this->postJson(route('public-exam.answer', $attempt), [
        'question_id' => $packages['IPAS'][1], 'selected_option' => 'A',
    ])->assertStatus(423);
    $this->postJson(route('public-exam.start', [$participant, $packages['MTK'][0]]))->assertStatus(409);
    $this->postJson(route('public-exam.submit', $attempt))->assertSuccessful();
    $this->postJson(route('public-exam.start', [$participant, $packages['MTK'][0]]))->assertSuccessful();
});

test('room token and another persons name cannot reclaim an existing participant', function () {
    publicFlowFixture();
    $this->postJson(route('public-exam.join', 'ROOM01'), ['participant_code' => 'UNKNOWNCODE00000'])->assertUnprocessable();
    $data = ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()];
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), $data)->assertSuccessful();
    $second = $this->postJson(route('public-exam.join', 'ROOM01'), [...$data, 'entry_key' => (string) \Illuminate\Support\Str::uuid()])->assertSuccessful();
    expect($second->json('participant_id'))->not->toBe($join->json('participant_id'));
    $secret = collect($second->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === 'public_exam_session')->getValue();
    $this->withHeader('X-Public-Exam-Session', $secret)->getJson(route('public-exam.dashboard', $join->json('participant_id')))->assertForbidden();
});

test('visible passing score hides retry while hidden score permits exactly one retry', function () {
    [, $packages] = publicFlowFixture();
    DB::table('exam_public_packages')->where('id', $packages['IPAS'][0])->update([
        'passing_score' => 60, 'allow_retry' => true, 'show_result_to_participant' => true,
    ]);
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $participant = $join->json('participant_id');
    $cookie = collect($join->headers->getCookies())->first(fn ($value) => $value->getName() === 'public_exam_session');
    $this->withHeader('X-Public-Exam-Session', $cookie->getValue());

    $ipas = $this->postJson(route('public-exam.start', [$participant, $packages['IPAS'][0]]))->json('attempt_id');
    $this->postJson(route('public-exam.answer', $ipas), ['question_id' => $packages['IPAS'][1], 'selected_option' => 'A'])->assertSuccessful();
    $this->postJson(route('public-exam.submit', $ipas))->assertSuccessful();
    $this->getJson(route('public-exam.dashboard', $participant))
        ->assertJsonPath('result.subjects.0.primary_score', 100)
        ->assertJsonPath('result.subjects.0.remedial_available', false)
        ->assertJsonPath('result.subjects.2.primary_score', null)
        ->assertJsonMissingPath('result.average_score')->assertJsonMissingPath('result.is_passed');
    $this->postJson(route('public-exam.start', [$participant, $packages['IPAS'][0]]))->assertForbidden();

    $mtk = $this->postJson(route('public-exam.start', [$participant, $packages['MTK'][0]]))->json('attempt_id');
    $this->postJson(route('public-exam.submit', $mtk))->assertSuccessful();
    $this->getJson(route('public-exam.dashboard', $participant))
        ->assertJsonPath('result.subjects.2.primary_score', null)
        ->assertJsonPath('result.subjects.2.remedial_available', true);
    $retry = $this->postJson(route('public-exam.start', [$participant, $packages['MTK'][0]]))->assertSuccessful()->json('attempt_id');
    $this->postJson(route('public-exam.submit', $retry))->assertSuccessful();
    $this->postJson(route('public-exam.start', [$participant, $packages['MTK'][0]]))->assertForbidden();
    expect(DB::table('exam_public_subject_attempts')->where('exam_public_package_id', $packages['MTK'][0])->count())->toBe(2);
});

test('unconfigured published public package cannot be started', function () {
    [, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $cookie = collect($join->headers->getCookies())->first(fn ($value) => $value->getName() === 'public_exam_session');
    $this->withHeader('X-Public-Exam-Session', $cookie->getValue());
    DB::table('exam_public_packages')->where('id', $packages['MTK'][0])->update(['passing_score' => null]);

    $this->postJson(route('public-exam.start', [$join->json('participant_id'), $packages['MTK'][0]]))->assertUnprocessable();
    expect(DB::table('exam_public_subject_attempts')->count())->toBe(0);
});

test('closing a public session auto submits active attempts and is idempotent', function () {
    [$session, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal', 'entry_key' => (string) \Illuminate\Support\Str::uuid()]);
    $participant = $join->json('participant_id');
    $secret = collect($join->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === 'public_exam_session')->getValue();
    $this->withHeader('X-Public-Exam-Session', $secret);

    $completedAttempt = $this->postJson(route('public-exam.start', [$participant, $packages['IPAS'][0]]))->json('attempt_id');
    $this->postJson(route('public-exam.submit', $completedAttempt))->assertSuccessful();
    $activeAttempt = $this->postJson(route('public-exam.start', [$participant, $packages['MTK'][0]]))->json('attempt_id');
    $this->postJson(route('public-exam.answer', $activeAttempt), [
        'question_id' => $packages['MTK'][1],
        'selected_option' => 'A',
    ])->assertSuccessful();

    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin)->postJson(route('admin.exams.public-v2.sessions.close', $session))
        ->assertSuccessful()->assertJsonPath('status', 'closed');

    expect(DB::table('exam_public_sessions')->where('id', $session)->value('status'))->toBe('closed')
        ->and(DB::table('exam_public_subject_attempts')->where('id', $completedAttempt)->value('status'))->toBe('submitted')
        ->and(DB::table('exam_public_subject_attempts')->where('id', $activeAttempt)->value('status'))->toBe('auto_submitted')
        ->and((float) DB::table('exam_public_subject_attempts')->where('id', $activeAttempt)->value('percentage_score'))->toBe(100.0)
        ->and(DB::table('exam_public_attempt_answers')->where('exam_public_subject_attempt_id', $activeAttempt)->value('selected_option'))->toBe('A');

    $this->postJson(route('admin.exams.public-v2.sessions.close', $session))->assertSuccessful();
    $this->withHeader('X-Public-Exam-Session', $secret);
    $this->postJson(route('public-exam.answer', $activeAttempt), [
        'question_id' => $packages['MTK'][1],
        'selected_option' => 'B',
    ])->assertStatus(423);
    $this->postJson(route('public-exam.submit', $activeAttempt))->assertStatus(409);
    $this->postJson(route('public-exam.start', [$participant, $packages['BINDO'][0]]))->assertForbidden();
    $this->getJson(route('public-exam.session', 'ROOM01'))->assertNotFound();
});
