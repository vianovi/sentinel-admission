<?php

use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->withoutMiddleware(ThrottleRequests::class);
});

function publicFlowFixture(string $order = 'free'): array
{
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Ujian Publik', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHours(3),
        'status' => 'published', 'order_type' => $order,
    ]);
    DB::table('exam_public_session_tokens')->insert(['exam_public_session_id' => $session, 'token' => 'ROOM01']);
    $packages = [];
    foreach (['IPAS', 'PAIBP', 'MTK', 'BINDO'] as $index => $code) {
        $subject = DB::table('exam_public_subjects')->insertGetId(['name' => $code, 'code' => $code]);
        $package = DB::table('exam_public_packages')->insertGetId([
            'exam_public_subject_id' => $subject, 'title' => $code.' Paket 1', 'code' => $code.'-1', 'status' => 'published',
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

test('public participant completes four packages in free order and sees only aggregate result', function () {
    [, $packages] = publicFlowFixture();
    $this->get(route('public-exam.session', 'ROOM01'))->assertSuccessful()->assertJsonPath('session.order_type', 'free');
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal']);
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

    $this->getJson(route('public-exam.dashboard', $participant))->assertJsonPath('result.average_score', 100)
        ->assertJsonPath('result.is_passed', true);
    expect(DB::table('exam_attempts')->count())->toBe(0);
});

test('public participant cannot access another participant by changing the ID', function () {
    publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal']);
    $id = $join->json('participant_id');
    $this->getJson(route('public-exam.dashboard', $id))->assertForbidden();
});

test('sequential session blocks skipping its first subject', function () {
    [, $packages] = publicFlowFixture('sequential');
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal']);
    $cookie = collect($join->headers->getCookies())->first(fn ($value) => $value->getName() === 'public_exam_session');
    $this->withHeader('X-Public-Exam-Session', $cookie->getValue());
    $this->postJson(route('public-exam.start', [$join->json('participant_id'), $packages['MTK'][0]]))->assertForbidden();
});

test('a passing aggregate does not open remedial even for a low subject', function () {
    [, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal']);
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
        if ($code === 'MTK') {
            $this->postJson(route('public-exam.start', [$participant, $package]))->assertForbidden();
        }
    }

    $this->getJson(route('public-exam.dashboard', $participant))->assertJsonPath('result.average_score', 75)
        ->assertJsonPath('result.is_passed', true)->assertJsonPath('result.subjects.2.remedial_available', false);
});

test('a failing aggregate opens remedial only for the low subject', function () {
    [, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak B', 'school_origin' => 'SD Asal']);
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

    $this->getJson(route('public-exam.dashboard', $participant))->assertJsonPath('result.average_score', 50)
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
    $this->getJson(route('public-exam.dashboard', $participant))->assertJsonPath('result.average_score', 75)
        ->assertJsonPath('result.is_passed', true)->assertJsonPath('result.subjects.2.primary_score', 0)
        ->assertJsonPath('result.subjects.2.remedial_score', 100);
});

test('answers cannot use a question outside the frozen attempt', function () {
    [, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak A', 'school_origin' => 'SD Asal']);
    $cookie = collect($join->headers->getCookies())->first(fn ($value) => $value->getName() === 'public_exam_session');
    $this->withHeader('X-Public-Exam-Session', $cookie->getValue());
    $attempt = $this->postJson(route('public-exam.start', [$join->json('participant_id'), $packages['IPAS'][0]]))->json('attempt_id');

    $this->postJson(route('public-exam.answer', $attempt), [
        'question_id' => $packages['MTK'][1], 'selected_option' => 'A',
    ])->assertUnprocessable();
    expect(DB::table('exam_public_attempt_answers')->count())->toBe(0);
});

test('an expired attempt must be submitted before another subject starts', function () {
    [, $packages] = publicFlowFixture();
    $join = $this->postJson(route('public-exam.join', 'ROOM01'), ['name' => 'Anak C', 'school_origin' => 'SD Asal']);
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
