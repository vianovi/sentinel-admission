<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

test('public exam tables are independent of internal exam tables', function () {
    foreach (['subjects', 'packages', 'questions', 'sessions', 'session_packages', 'session_tokens', 'participants', 'subject_attempts', 'attempt_answers'] as $name) {
        expect(Schema::hasTable('exam_public_'.$name))->toBeTrue();
    }

    expect(Schema::hasTable('exam_subjects'))->toBeTrue()
        ->and(Schema::hasTable('exam_packages'))->toBeTrue()
        ->and(Schema::hasTable('exam_questions'))->toBeTrue()
        ->and(Schema::hasTable('exam_attempts'))->toBeTrue();
});

test('a public session can assign only one package per subject', function () {
    $subjectId = DB::table('exam_public_subjects')->insertGetId(['name' => 'IPAS', 'code' => 'IPAS']);
    $firstPackage = DB::table('exam_public_packages')->insertGetId(['exam_public_subject_id' => $subjectId, 'title' => 'Paket 1', 'code' => 'IPAS-1']);
    $secondPackage = DB::table('exam_public_packages')->insertGetId(['exam_public_subject_id' => $subjectId, 'title' => 'Paket 2', 'code' => 'IPAS-2']);
    $sessionId = DB::table('exam_public_sessions')->insertGetId(['title' => 'Gelombang 1', 'opens_at' => now(), 'closes_at' => now()->addDay()]);

    DB::table('exam_public_session_packages')->insert([
        'exam_public_session_id' => $sessionId,
        'exam_public_package_id' => $firstPackage,
        'exam_public_subject_id' => $subjectId,
        'sort_order' => 1,
    ]);

    expect(fn () => DB::table('exam_public_session_packages')->insert([
        'exam_public_session_id' => $sessionId,
        'exam_public_package_id' => $secondPackage,
        'exam_public_subject_id' => $subjectId,
        'sort_order' => 2,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});
