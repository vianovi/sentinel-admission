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
            'code' => $code.'-1', 'duration_minutes' => 35,
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
    ])->json('id');

    $this->postJson(route('admin.exams.public-bank.questions.store', $package), [
        'question_text' => 'Tidak valid', 'options' => ['A' => 'Satu', 'B' => 'Dua'],
        'correct_answer' => 'C', 'point' => 10,
    ])->assertUnprocessable();
    expect(DB::table('exam_public_questions')->count())->toBe(0);
});
