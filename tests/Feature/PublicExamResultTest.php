<?php

use App\Services\Exam\PublicExamResultService;
use Illuminate\Support\Facades\DB;

function publicResultFixture(array $scores): array
{
    $sessionId = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Ujian Masuk',
        'opens_at' => now()->subHour(),
        'closes_at' => now()->addHour(),
    ]);
    $participantId = DB::table('exam_public_participants')->insertGetId([
        'exam_public_session_id' => $sessionId,
        'participant_code' => 'TEST-'.uniqid(),
        'name' => 'Peserta',
        'school_origin' => 'Sekolah',
        'session_secret' => bin2hex(random_bytes(32)),
        'started_at' => now(),
    ]);

    $subjects = [];
    foreach (['IPAS', 'PAIBP', 'MTK', 'BINDO'] as $order => $code) {
        $subjectId = DB::table('exam_public_subjects')->insertGetId(['code' => $code, 'name' => $code]);
        $packageId = DB::table('exam_public_packages')->insertGetId([
            'exam_public_subject_id' => $subjectId,
            'code' => $code.'-1',
            'title' => $code.' Paket 1',
        ]);
        DB::table('exam_public_session_packages')->insert([
            'exam_public_session_id' => $sessionId,
            'exam_public_package_id' => $packageId,
            'exam_public_subject_id' => $subjectId,
            'sort_order' => $order,
        ]);
        $subjects[$code] = [$subjectId, $packageId];

        if (isset($scores[$code])) {
            DB::table('exam_public_subject_attempts')->insert([
                'exam_public_participant_id' => $participantId,
                'exam_public_package_id' => $packageId,
                'exam_public_subject_id' => $subjectId,
                'started_at' => now(),
                'expires_at' => now()->addHour(),
                'status' => 'submitted',
                'percentage_score' => $scores[$code],
            ]);
        }
    }

    return [$participantId, $subjects];
}

test('results remain pending until all four subjects have a primary score', function () {
    [$participantId] = publicResultFixture(['IPAS' => 90, 'PAIBP' => 90, 'MTK' => 90]);

    $result = app(PublicExamResultService::class)->refresh($participantId);

    expect($result['completed'])->toBeFalse()
        ->and($result['average_score'])->toBeNull()
        ->and($result['is_passed'])->toBeNull()
        ->and(DB::table('exam_public_participants')->where('id', $participantId)->value('status'))->toBe('in_progress');
});

test('exactly 65 is not passing and low subject is eligible for remedial', function () {
    [$participantId] = publicResultFixture(['IPAS' => 70, 'PAIBP' => 70, 'MTK' => 40, 'BINDO' => 80]);

    $result = app(PublicExamResultService::class)->refresh($participantId);

    expect($result['average_score'])->toBe(65.0)
        ->and($result['is_passed'])->toBeFalse()
        ->and($result['subjects'][2]['remedial_available'])->toBeTrue()
        ->and(DB::table('exam_public_participants')->where('id', $participantId)->value('status'))->toBe('completed');
});

test('higher remedial replaces low score and can pass without a per-subject floor', function () {
    [$participantId, $subjects] = publicResultFixture(['IPAS' => 80, 'PAIBP' => 80, 'MTK' => 20, 'BINDO' => 80]);

    expect(app(PublicExamResultService::class)->refresh($participantId)['is_passed'])->toBeFalse();

    DB::table('exam_public_subject_attempts')->insert([
        'exam_public_participant_id' => $participantId,
        'exam_public_subject_id' => $subjects['MTK'][0],
        'exam_public_package_id' => $subjects['MTK'][1],
        'attempt_type' => 'remedial',
        'attempt_number' => 2,
        'started_at' => now(),
        'expires_at' => now()->addHour(),
        'status' => 'submitted',
        'percentage_score' => 50,
    ]);

    $result = app(PublicExamResultService::class)->refresh($participantId);
    expect($result['subjects'][2]['primary_score'])->toBe(20.0)
        ->and($result['subjects'][2]['remedial_score'])->toBe(50.0)
        ->and($result['average_score'])->toBe(72.5)
        ->and($result['is_passed'])->toBeTrue();
});

test('worse remedial never lowers the effective score', function () {
    [$participantId, $subjects] = publicResultFixture(['IPAS' => 80, 'PAIBP' => 80, 'MTK' => 40, 'BINDO' => 60]);
    DB::table('exam_public_subject_attempts')->insert([
        'exam_public_participant_id' => $participantId,
        'exam_public_subject_id' => $subjects['MTK'][0],
        'exam_public_package_id' => $subjects['MTK'][1],
        'attempt_type' => 'remedial',
        'attempt_number' => 2,
        'started_at' => now(),
        'expires_at' => now()->addHour(),
        'status' => 'submitted',
        'percentage_score' => 10,
    ]);

    $result = app(PublicExamResultService::class)->refresh($participantId);
    expect($result['average_score'])->toBe(65.0)
        ->and($result['is_passed'])->toBeFalse()
        ->and($result['subjects'][2]['effective_score'])->toBe(40.0)
        ->and($result['subjects'][2]['remedial_available'])->toBeFalse();
});

test('no subject below 50 leaves a failing candidate without automatic remedial', function () {
    [$participantId] = publicResultFixture(['IPAS' => 60, 'PAIBP' => 60, 'MTK' => 60, 'BINDO' => 60]);
    $result = app(PublicExamResultService::class)->refresh($participantId);

    expect($result['is_passed'])->toBeFalse()
        ->and(collect($result['subjects'])->contains('remedial_available', true))->toBeFalse();
});

test('an in-progress remedial does not free another remedial slot', function () {
    [$participantId, $subjects] = publicResultFixture(['IPAS' => 80, 'PAIBP' => 80, 'MTK' => 40, 'BINDO' => 60]);
    DB::table('exam_public_subject_attempts')->insert([
        'exam_public_participant_id' => $participantId,
        'exam_public_subject_id' => $subjects['MTK'][0],
        'exam_public_package_id' => $subjects['MTK'][1],
        'attempt_type' => 'remedial',
        'attempt_number' => 2,
        'started_at' => now(),
        'expires_at' => now()->addHour(),
        'status' => 'in_progress',
    ]);

    $result = app(PublicExamResultService::class)->refresh($participantId);

    expect($result['average_score'])->toBe(65.0)
        ->and($result['subjects'][2]['remedial_available'])->toBeFalse();
});
