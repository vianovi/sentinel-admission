<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Writer;

test('admin downloads a package-specific public XLSX template', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'Matematika', 'code' => 'MTK']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject,
        'title' => 'Tes Matematika Publik',
        'code' => 'PUB-MTK-01',
        'status' => 'draft',
    ]);

    $response = $this->actingAs($admin)->get(route('admin.exams.public-bank.packages.template.download', $package));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        ->and($response->headers->get('content-disposition'))->toContain('paket-soal-pub-mtk-01-tes-matematika-publik.xlsx');
});

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
        $this->get(route('admin.public-exams.packages.show', $package))->assertSuccessful()
            ->assertInertia(fn ($page) => $page->has('imports', 1)
                ->where('imports.0.metadata.status', 'completed')
                ->where('imports.0.metadata.imported', 2)
                ->where('imports.0.metadata.filename', 'mtk-paket-1.xlsx'));
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

test('public XLSX import restores answer options that spreadsheet software converted to dates', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = $this->actingAs($admin)->postJson(route('admin.exams.public-bank.packages.store'), [
        'exam_public_subject_id' => $subject, 'title' => 'MTK-PAKET 1', 'code' => 'TA01-MTK',
    ])->assertCreated()->json('id');

    $file = publicPackageWorkbook([
        new DateTimeImmutable('2026-01-04 00:00:00'), 'Salah', 'Mungkin', 'Tidak', '',
    ]);

    try {
        $this->postJson(route('admin.exams.public-bank.packages.import', $package), ['file' => $file])
            ->assertSuccessful()
            ->assertJsonPath('imported', 2);

        $question = DB::table('exam_public_questions')->where('exam_public_package_id', $package)->where('sort_order', 1)->first();
        expect(json_decode($question->options, true))->toMatchArray(['A' => '1/4', 'B' => 'Salah']);
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
        $this->get(route('admin.public-exams.packages.show', $package))->assertSuccessful()
            ->assertInertia(fn ($page) => $page->has('imports', 1)
                ->where('imports.0.metadata.status', 'failed')
                ->where('imports.0.metadata.imported', 0)
                ->has('imports.0.metadata.errors.file', 1));
        expect(DB::table('exam_public_questions')->count())->toBe(0)
            ->and(DB::table('exam_public_packages')->where('id', $package)->value('passing_score'))->toBeNull();
    } finally {
        @unlink($file->getRealPath());
    }
});

test('public import explains the exact Excel row and validation reasons', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = $this->actingAs($admin)->postJson(route('admin.exams.public-bank.packages.store'), [
        'exam_public_subject_id' => $subject, 'title' => 'MTK-PAKET 1', 'code' => 'TA01-MTK',
    ])->assertCreated()->json('id');
    $file = publicPackageWorkbook(['Benar', '', '', '', '']);

    try {
        $message = $this->postJson(route('admin.exams.public-bank.packages.import', $package), ['file' => $file])
            ->assertUnprocessable()->json('errors.file.0');

        expect($message)->toContain('Baris Excel 12')
            ->toContain('Minimal 2 opsi jawaban harus diisi')
            ->toContain('Import dibatalkan');
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

function publicPackageWorkbook(array $firstRowOptions = ['Benar', 'Salah', 'Mungkin', 'Tidak', '']): UploadedFile
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
        ['1', 'Pertanyaan pertama?', ...$firstRowOptions, 'A', '10', 'ya'],
        ['2', 'Pertanyaan kedua?', 'Benar', 'Salah', 'Mungkin', 'Tidak', '', 'B', '10', 'tidak'],
    ] as $index => $row) {
        $writer->addRow($index === 11 && $firstRowOptions[0] instanceof DateTimeInterface
            ? Row::fromValuesWithStyles($row, [2 => new Style(format: 'yyyy-mm-dd hh:mm:ss')])
            : Row::fromValues($row));
    }
    $writer->close();

    return new UploadedFile($path, 'mtk-paket-1.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
}

test('deleting an unused public package resets sessions and revokes tokens while preserving roster', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = DB::table('exam_public_packages')->insertGetId([
        'exam_public_subject_id' => $subject, 'title' => 'MTK 1', 'code' => 'MTK-1', 'status' => 'published',
    ]);
    $session = DB::table('exam_public_sessions')->insertGetId([
        'title' => 'Sesi Aman', 'status' => 'published', 'opens_at' => now()->subHour(), 'closes_at' => now()->addHour(),
    ]);
    DB::table('exam_public_session_packages')->insert([
        'exam_public_session_id' => $session, 'exam_public_package_id' => $package, 'exam_public_subject_id' => $subject, 'sort_order' => 0,
    ]);
    DB::table('exam_public_session_tokens')->insert(['exam_public_session_id' => $session, 'token' => 'OLDROOM']);
    $participant = DB::table('exam_public_participants')->insertGetId([
        'exam_public_session_id' => $session, 'name' => 'Peserta Fiktif', 'school_origin' => 'Sekolah Fiktif', 'participant_code' => 'FAKESTUDENT000001',
    ]);
    $this->actingAs($admin)->deleteJson(route('admin.exams.public-bank.packages.destroy', $package))
        ->assertSuccessful()->assertJsonPath('sessions_reset', 1);
    expect(DB::table('exam_public_packages')->where('id', $package)->exists())->toBeFalse()
        ->and(DB::table('exam_public_sessions')->where('id', $session)->value('status'))->toBe('draft')
        ->and(DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->count())->toBe(0)
        ->and(DB::table('exam_public_participants')->where('id', $participant)->value('participant_code'))->toBe('FAKESTUDENT000001');
});

test('public package deletion preserves all data once an attempt exists', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = DB::table('exam_public_packages')->insertGetId(['exam_public_subject_id' => $subject, 'title' => 'MTK 1', 'code' => 'MTK-1']);
    $session = DB::table('exam_public_sessions')->insertGetId(['title' => 'Sesi', 'opens_at' => now(), 'closes_at' => now()->addHour()]);
    $participant = DB::table('exam_public_participants')->insertGetId([
        'exam_public_session_id' => $session, 'name' => 'Peserta Fiktif', 'school_origin' => 'Sekolah Fiktif', 'participant_code' => 'FAKESTUDENT000001',
    ]);
    DB::table('exam_public_subject_attempts')->insert([
        'exam_public_participant_id' => $participant, 'exam_public_package_id' => $package, 'exam_public_subject_id' => $subject,
        'started_at' => now(), 'expires_at' => now()->addHour(),
    ]);
    $this->actingAs($admin)->deleteJson(route('admin.exams.public-bank.packages.destroy', $package))->assertStatus(409);
    expect(DB::table('exam_public_packages')->where('id', $package)->exists())->toBeTrue()
        ->and(DB::table('exam_public_subject_attempts')->count())->toBe(1);
});

test('package deletion refuses a participant already inside a related room before starting questions', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = DB::table('exam_public_packages')->insertGetId(['exam_public_subject_id' => $subject, 'title' => 'MTK 1', 'code' => 'MTK-1']);
    $session = DB::table('exam_public_sessions')->insertGetId(['title' => 'Sesi', 'opens_at' => now(), 'closes_at' => now()->addHour(), 'status' => 'published']);
    DB::table('exam_public_session_packages')->insert(['exam_public_session_id' => $session, 'exam_public_package_id' => $package, 'exam_public_subject_id' => $subject, 'sort_order' => 0]);
    DB::table('exam_public_session_tokens')->insert(['exam_public_session_id' => $session, 'token' => 'ACTIVE_ROOM']);
    DB::table('exam_public_participants')->insert(['exam_public_session_id' => $session, 'name' => 'Anak', 'school_origin' => 'Sekolah', 'participant_code' => 'JOINEDSTUDENT0001', 'started_at' => now()]);

    $this->actingAs($admin)->deleteJson(route('admin.exams.public-bank.packages.destroy', $package))->assertStatus(409);
    expect(DB::table('exam_public_packages')->where('id', $package)->exists())->toBeTrue()
        ->and(DB::table('exam_public_session_tokens')->where('token', 'ACTIVE_ROOM')->exists())->toBeTrue()
        ->and(DB::table('exam_public_sessions')->where('id', $session)->value('status'))->toBe('published');
});

test('admin can edit package settings, toggle or delete questions, and return package to draft', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = DB::table('exam_public_packages')->insertGetId(['exam_public_subject_id' => $subject, 'title' => 'MTK 1', 'code' => 'MTK-1', 'status' => 'published', 'passing_score' => 60, 'allow_retry' => false, 'show_result_to_participant' => false]);
    $question = DB::table('exam_public_questions')->insertGetId(['exam_public_package_id' => $package, 'question_text' => '1+1?', 'options' => json_encode(['A' => '2', 'B' => '3']), 'correct_answer' => 'A', 'point' => 10]);
    $session = DB::table('exam_public_sessions')->insertGetId(['title' => 'Sesi', 'status' => 'published', 'opens_at' => now(), 'closes_at' => now()->addHour()]);
    DB::table('exam_public_session_packages')->insert(['exam_public_session_id' => $session, 'exam_public_package_id' => $package, 'exam_public_subject_id' => $subject, 'sort_order' => 0]);
    DB::table('exam_public_session_tokens')->insert(['exam_public_session_id' => $session, 'token' => 'EDITROOM']);

    $this->actingAs($admin)->putJson(route('admin.exams.public-bank.packages.settings.update', $package), ['passing_score' => 70, 'allow_retry' => true, 'show_result_to_participant' => true])->assertSuccessful();
    $this->patchJson(route('admin.exams.public-bank.questions.toggle', $question), ['is_active' => false])->assertSuccessful();
    expect((bool) DB::table('exam_public_questions')->where('id', $question)->value('is_active'))->toBeFalse();
    $this->patchJson(route('admin.exams.public-bank.questions.toggle', $question), ['is_active' => true])->assertSuccessful();
    $this->postJson(route('admin.exams.public-bank.packages.draft', $package))->assertSuccessful()->assertJsonPath('status', 'draft');
    expect(DB::table('exam_public_packages')->where('id', $package)->value('status'))->toBe('draft')
        ->and(DB::table('exam_public_sessions')->where('id', $session)->value('status'))->toBe('draft')
        ->and(DB::table('exam_public_session_tokens')->where('token', 'EDITROOM')->exists())->toBeFalse();
    $this->deleteJson(route('admin.exams.public-bank.questions.destroy', $question))->assertSuccessful();
    expect(DB::table('exam_public_questions')->where('id', $question)->value('deleted_at'))->not->toBeNull();
});

test('package editing is blocked after an attempt exists', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = DB::table('exam_public_subjects')->insertGetId(['name' => 'MTK', 'code' => 'MTK']);
    $package = DB::table('exam_public_packages')->insertGetId(['exam_public_subject_id' => $subject, 'title' => 'MTK 1', 'code' => 'MTK-1']);
    $participant = DB::table('exam_public_participants')->insertGetId(['exam_public_session_id' => DB::table('exam_public_sessions')->insertGetId(['title' => 'Sesi', 'opens_at' => now(), 'closes_at' => now()->addHour()]), 'name' => 'Anak', 'school_origin' => 'Sekolah', 'participant_code' => 'EDITBLOCK000001']);
    $question = DB::table('exam_public_questions')->insertGetId(['exam_public_package_id' => $package, 'question_text' => '1+1?', 'options' => json_encode(['A' => '2', 'B' => '3']), 'correct_answer' => 'A', 'point' => 10]);
    DB::table('exam_public_subject_attempts')->insert(['exam_public_participant_id' => $participant, 'exam_public_package_id' => $package, 'exam_public_subject_id' => $subject, 'started_at' => now(), 'expires_at' => now()->addHour()]);
    $this->actingAs($admin)->patchJson(route('admin.exams.public-bank.questions.toggle', $question), ['is_active' => false])->assertStatus(409);
    $this->postJson(route('admin.exams.public-bank.packages.draft', $package))->assertStatus(409);
    expect(DB::table('exam_public_packages')->where('id', $package)->value('status'))->toBe('draft');
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
