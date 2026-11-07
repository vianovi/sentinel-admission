<?php

use App\Models\User;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->withoutMiddleware(ThrottleRequests::class);
});

test('admin pre-registers two children with the same name but distinct codes', function () {
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Ujian Publik', 'opens_at' => now()->subHour(),
        'closes_at' => now()->addHour(), 'status' => 'published',
    ]);
    $admin = User::factory()->create(['role' => 'admin']);

    $first = $this->actingAs($admin)->postJson(route('admin.exams.public-sessions.participants.store', $session), [
        'name' => 'Anak Sama', 'school_origin' => 'SD Asal', 'address' => 'Alamat A',
    ]);
    $second = $this->actingAs($admin)->postJson(route('admin.exams.public-sessions.participants.store', $session), [
        'name' => 'Anak Sama', 'school_origin' => 'SD Asal', 'address' => 'Alamat B',
    ]);

    $first->assertCreated();
    $second->assertCreated();
    expect($first->json('participant_code'))->not->toBe($second->json('participant_code'))
        ->and(DB::table('exam_public_participants')->count())->toBe(2)
        ->and(DB::table('exam_public_participants')->where('id', $first->json('id'))->value('started_at'))->toBeNull();
});

test('guest cannot pre-register a public participant', function () {
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Ujian Publik', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);

    $this->postJson(route('admin.exams.public-sessions.participants.store', $session), [
        'name' => 'Anak A', 'school_origin' => 'SD Asal',
    ])->assertUnauthorized();
    expect(DB::table('exam_public_participants')->count())->toBe(0);
});

test('admin exports one row per child including initial and remedial scores safely', function () {
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Ujian Publik', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);
    $admin = User::factory()->create(['role' => 'admin']);
    $participant = $this->actingAs($admin)->postJson(route('admin.exams.public-sessions.participants.store', $session), [
        'name' => '=1+1', 'school_origin' => 'SD Asal', 'address' => '@CMD',
    ])->json('id');
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = DB::table('exam_public_packages')->insertGetId(['exam_public_subject_id' => $subject, 'title' => 'MTK', 'code' => 'MTK-1', 'passing_score' => 60]);
    DB::table('exam_public_session_packages')->insert([
        'exam_public_session_id' => $session, 'exam_public_package_id' => $package,
        'exam_public_subject_id' => $subject, 'sort_order' => 0,
    ]);
    foreach ([['primary', 1, 20], ['remedial', 2, 80]] as [$type, $number, $score]) {
        DB::table('exam_public_subject_attempts')->insert([
            'exam_public_participant_id' => $participant, 'exam_public_package_id' => $package,
            'exam_public_subject_id' => $subject, 'attempt_type' => $type, 'attempt_number' => $number,
            'status' => 'submitted', 'started_at' => now(), 'expires_at' => now()->addHour(),
            'percentage_score' => $score,
        ]);
    }

    $response = $this->actingAs($admin)->get(route('admin.exams.public-sessions.results.export', $session));
    $response->assertSuccessful();
    expect($response->headers->get('content-type'))->toContain('text/csv');
    ob_start();
    $response->baseResponse->sendContent();
    $csv = ob_get_clean();
    $lines = array_map('str_getcsv', array_filter(explode("\n", trim($csv))));

    expect($lines)->toHaveCount(2)
        ->and($lines[1][1])->toBe("'=1+1")
        ->and($lines[1][3])->toBe("'@CMD")
        ->and($lines[1][4])->toBe('20')
        ->and($lines[1][5])->toBe('80')
        ->and($lines[1][6])->toBe('80')
        ->and($lines[1][7])->toBe('60')
        ->and($lines[1][8])->toBe('LULUS MAPEL');
});

test('guest cannot list participants or download their private results', function () {
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Ujian Publik', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);

    $this->getJson(route('admin.exams.public-sessions.participants.index', $session))->assertUnauthorized();
    $this->get(route('admin.exams.public-sessions.results.export', $session))->assertRedirect();
});
