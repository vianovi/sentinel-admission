<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('admin creates a separate four-subject bank and publishes only ten-question packages', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    foreach (['IPAS', 'PAIBP', 'MTK', 'BINDO'] as $code) {
        $subject = $this->actingAs($admin)->postJson(route('admin.exams.public-bank.subjects.store'), [
            'name' => $code, 'code' => $code,
        ])->assertCreated()->json('id');
        $package = $this->postJson(route('admin.exams.public-bank.packages.store'), [
            'exam_public_subject_id' => $subject, 'title' => $code.' Paket 1',
            'code' => $code.'-1', 'duration_minutes' => 35, 'passing_score' => 55,
            'allow_retry' => true, 'show_result_to_participant' => false,
        ])->assertCreated()->json('id');

        $this->postJson(route('admin.exams.public-bank.packages.publish', $package))->assertUnprocessable();
        for ($number = 1; $number <= 10; $number++) {
            $this->postJson(route('admin.exams.public-bank.questions.store', $package), [
                'question_text' => "Pertanyaan {$number}", 'options' => ['A' => 'Benar', 'B' => 'Salah'],
                'correct_answer' => 'A', 'point' => 10,
            ])->assertCreated();
        }

        $this->postJson(route('admin.exams.public-bank.packages.publish', $package))
            ->assertSuccessful()->assertJsonPath('status', 'published');
        $this->postJson(route('admin.exams.public-bank.questions.store', $package), [
            'question_text' => 'Tidak boleh', 'options' => ['A' => 'Ya', 'B' => 'Tidak'],
            'correct_answer' => 'A', 'point' => 10,
        ])->assertForbidden();
    }

    $this->getJson(route('admin.exams.public-bank.index'))->assertSuccessful()
        ->assertJsonCount(4, 'subjects')->assertJsonCount(4, 'packages');
    expect(DB::table('exam_packages')->count())->toBe(0)
        ->and(DB::table('exam_questions')->count())->toBe(0)
        ->and(DB::table('exam_public_questions')->count())->toBe(40);
});

test('public bank rejects malformed answers and guest access', function () {
    $this->postJson(route('admin.exams.public-bank.subjects.store'), ['name' => 'IPAS', 'code' => 'IPAS'])
        ->assertUnauthorized();
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = $this->actingAs($admin)->postJson(route('admin.exams.public-bank.subjects.store'), [
        'name' => 'IPAS', 'code' => 'IPAS',
    ])->json('id');
    $package = $this->postJson(route('admin.exams.public-bank.packages.store'), [
        'exam_public_subject_id' => $subject, 'title' => 'IPAS 1', 'code' => 'IPAS-1', 'duration_minutes' => 35,
        'passing_score' => 55, 'allow_retry' => false, 'show_result_to_participant' => false,
    ])->json('id');

    $this->postJson(route('admin.exams.public-bank.questions.store', $package), [
        'question_text' => 'Tidak valid', 'options' => ['A' => 'Satu', 'B' => 'Dua'],
        'correct_answer' => 'C', 'point' => 10,
    ])->assertUnprocessable();
    expect(DB::table('exam_public_questions')->count())->toBe(0);
});

test('unconfigured public packages cannot publish until admin supplies all scoring options', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject, 'title' => 'Paket lama', 'code' => 'MTK-OLD',
    ]);
    for ($index = 0; $index < 10; $index++) {
        DB::table('exam_public_questions')->insert([
            'exam_public_package_id' => $package, 'question_text' => 'Soal '.$index,
            'options' => json_encode(['A' => 'Benar', 'B' => 'Salah']), 'correct_answer' => 'A',
        ]);
    }

    $this->actingAs($admin)->postJson(route('admin.exams.public-bank.packages.publish', $package))->assertUnprocessable();
    $this->putJson(route('admin.exams.public-bank.packages.settings.update', $package), [
        'passing_score' => 55, 'allow_retry' => false, 'show_result_to_participant' => true,
    ])->assertSuccessful();
    $this->postJson(route('admin.exams.public-bank.packages.publish', $package))->assertSuccessful();
    expect((float) DB::table('exam_public_packages')->where('id', $package)->value('passing_score'))->toBe(55.0);
});
