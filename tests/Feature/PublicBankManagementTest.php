<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;

test('admin creates a separate four-subject bank and publishes packages with active questions', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    foreach (['IPAS', 'PAIBP', 'MTK', 'BINDO'] as $code) {
        $subject = $this->actingAs($admin)->postJson(route('admin.exams.public-bank.subjects.store'), [
            'name' => $code, 'code' => $code,
        ])->assertCreated()->json('id');
        $package = $this->postJson(route('admin.exams.public-bank.packages.store'), [
            'exam_public_subject_id' => $subject, 'title' => $code.' Paket 1',
            'code' => $code.'-1',
        ])->assertCreated()->json('id');

        $this->postJson(route('admin.exams.public-bank.packages.publish', $package))->assertUnprocessable();
        $this->putJson(route('admin.exams.public-bank.packages.settings.update', $package), [
            'passing_score' => 55, 'allow_retry' => true, 'show_result_to_participant' => false,
        ])->assertSuccessful();
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

test('public package publication follows active question flags rather than a fixed question count', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject, 'title' => 'MTK Paket 1', 'code' => 'TA01-MTK',
        'passing_score' => 55, 'allow_retry' => false, 'show_result_to_participant' => false,
    ]);
    DB::table('exam_public_questions')->insert([
        'exam_public_package_id' => $package, 'question_text' => 'Soal nonaktif',
        'options' => json_encode(['A' => 'Ya', 'B' => 'Tidak']), 'correct_answer' => 'A', 'is_active' => false,
    ]);

    $this->actingAs($admin)->postJson(route('admin.exams.public-bank.packages.publish', $package))->assertUnprocessable();

    for ($number = 1; $number <= 11; $number++) {
        DB::table('exam_public_questions')->insert([
            'exam_public_package_id' => $package, 'question_text' => "Soal aktif {$number}",
            'options' => json_encode(['A' => 'Ya', 'B' => 'Tidak']), 'correct_answer' => 'A', 'is_active' => true,
        ]);
    }

    $this->postJson(route('admin.exams.public-bank.packages.publish', $package))
        ->assertSuccessful()->assertJsonPath('status', 'published');
});

test('public XLSX import reads package settings and active flags without touching internal bank', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = $this->actingAs($admin)->postJson(route('admin.exams.public-bank.packages.store'), [
        'exam_public_subject_id' => $subject, 'title' => 'MTK-PAKET 1', 'code' => 'TA01-MTK',
    ])->assertCreated()->json('id');

    $file = publicPackageWorkbook();
    try {
        $response = $this->postJson(route('admin.exams.public-bank.packages.import', $package), ['file' => $file]);
        $response->assertSuccessful()->assertJsonPath('imported', 2)->assertJsonPath('active', 1);
        $record = DB::table('exam_public_packages')->where('id', $package)->first();
        expect((int) $record->duration_minutes)->toBe(30)
            ->and((float) $record->passing_score)->toBe(55.0)
            ->and((int) $record->allow_retry)->toBe(0)
            ->and((int) $record->show_result_to_participant)->toBe(0)
            ->and(DB::table('exam_public_questions')->where('exam_public_package_id', $package)->count())->toBe(2)
            ->and(DB::table('exam_public_questions')->where('exam_public_package_id', $package)->where('is_active', true)->count())->toBe(1)
            ->and(DB::table('exam_questions')->count())->toBe(0)
            ->and(DB::table('exam_packages')->count())->toBe(0);
        $this->postJson(route('admin.exams.public-bank.packages.publish', $package))->assertSuccessful();
        $this->postJson(route('admin.exams.public-bank.packages.import', $package), ['file' => $file])->assertStatus(409);
    } finally {
        @unlink($file->getRealPath());
    }
});

test('public import rejects mismatched category and invalid rows without partial writes', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'IPAS', 'code' => 'IPAS']);
    $package = $this->actingAs($admin)->postJson(route('admin.exams.public-bank.packages.store'), [
        'exam_public_subject_id' => $subject, 'title' => 'MTK-PAKET 1', 'code' => 'TA01-MTK',
    ])->assertCreated()->json('id');

    $file = publicPackageWorkbook();
    try {
        $this->postJson(route('admin.exams.public-bank.packages.import', $package), ['file' => $file])
            ->assertUnprocessable()->assertJsonValidationErrors('file');
        expect(DB::table('exam_public_questions')->count())->toBe(0)
            ->and(DB::table('exam_public_packages')->where('id', $package)->value('passing_score'))->toBeNull();
    } finally {
        @unlink($file->getRealPath());
    }
});

test('original MTK workbook is rejected for mismatched public subject without modifying either bank', function () {
    $source = '/home/silinux/Desktop/Paket Ujian PSB/Soal/MTK/Soal-ta01-mtk-mtk-paket-1.xlsx';
    if (! is_file($source)) {
        test()->markTestSkipped('Original workbook is not available on this machine.');
    }
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = $this->actingAs($admin)->postJson(route('admin.exams.public-bank.packages.store'), [
        'exam_public_subject_id' => $subject, 'title' => 'MTK-PAKET 1', 'code' => 'TA01-MTK',
    ])->assertCreated()->json('id');
    $file = new UploadedFile($source, basename($source), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);

    $this->postJson(route('admin.exams.public-bank.packages.import', $package), ['file' => $file])
        ->assertUnprocessable()->assertJsonValidationErrors('file');
    expect(DB::table('exam_public_questions')->count())->toBe(0)
        ->and(DB::table('exam_questions')->count())->toBe(0)
        ->and(DB::table('exam_public_packages')->where('id', $package)->value('passing_score'))->toBeNull();
});

function publicPackageWorkbook(): UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'public-exam-').'.xlsx';
    $writer = new Writer;
    $writer->openToFile($path);
    $sheet = $writer->getCurrentSheet();
    $sheet->setName('Data Soal');
    foreach ([
        ['KONFIGURASI PAKET'], ['kategori', 'MTK'], ['judul_paket', 'MTK-PAKET 1'], ['kode_paket', 'TA01-MTK'],
        ['KONFIGURASI UJIAN'], ['durasi_menit', '30'], ['ambang_lulus_persen', '55'], ['tampilkan_hasil', 'tidak'], ['izinkan_ujian_ulang', 'tidak'],
        ['DATA SOAL'], ['nomor', 'teks_soal', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'opsi_e', 'jawaban_benar', 'poin', 'aktif'],
        ['1', 'Pertanyaan pertama?', 'Benar', 'Salah', 'Mungkin', 'Tidak', '', 'A', '10', 'ya'],
        ['2', 'Pertanyaan kedua?', 'Benar', 'Salah', 'Mungkin', 'Tidak', '', 'B', '10', 'tidak'],
    ] as $row) {
        $writer->addRow(Row::fromValues($row));
    }
    $writer->close();

    return new UploadedFile($path, 'mtk-paket-1.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
}

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

test('public package settings cannot change after a participant has started its session', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject, 'title' => 'MTK Paket 1', 'code' => 'MTK-1',
        'passing_score' => 55, 'allow_retry' => true, 'show_result_to_participant' => false,
    ]);
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Sesi MTK', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(), 'status' => 'published',
    ]);
    DB::table('exam_public_session_packages')->insert([
        'exam_public_session_id' => $session, 'exam_public_package_id' => $package,
        'exam_public_subject_id' => $subject, 'sort_order' => 0,
    ]);
    $url = route('admin.exams.public-bank.packages.settings.update', $package);
    $settings = ['passing_score' => 60, 'allow_retry' => false, 'show_result_to_participant' => true];

    $this->actingAs($admin)->putJson($url, $settings)->assertSuccessful();
    DB::table('exam_public_participants')->insert([
        'exam_public_session_id' => $session, 'participant_code' => 'STARTEDCODE00001',
        'name' => 'Anak A', 'school_origin' => 'Sekolah A', 'started_at' => now(),
    ]);
    $this->putJson($url, ['passing_score' => 70, 'allow_retry' => true, 'show_result_to_participant' => false])->assertStatus(409);
    expect((float) DB::table('exam_public_packages')->where('id', $package)->value('passing_score'))->toBe(60.0);
});
