<?php

use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamAuditLog;
use App\Models\Exam\ExamImportBatch;
use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamQuestion;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSubject;
use App\Models\User;
use App\Services\Exam\ExamPackageTemplateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;

uses(RefreshDatabase::class);

it('downloads a package specific XLSX template without raw placeholders', function () {
    $admin = User::factory()->admin()->create();
    $subject = ExamSubject::create([
        'name' => 'Matematika',
        'code' => 'MTK',
        'is_active' => true,
    ]);
    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'created_by' => $admin->id,
        'title' => 'Tes Matematika Gelombang 1',
        'code' => 'MTK-GL1',
        'description' => 'Paket seleksi matematika.',
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'show_result_to_candidate' => false,
        'status' => ExamPackage::STATUS_DRAFT,
    ]);

    $response = $this->actingAs($admin)
        ->get("/dashboard/admin/exams/packages/{$package->id}/template");

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect($response->headers->get('content-disposition'))->toContain('template-soal-mtk-gl1-tes-matematika-gelombang-1.xlsx');

    $downloadPath = $response->baseResponse->getFile()->getPathname();

    try {
        expect(file_get_contents($downloadPath, false, null, 0, 4))->toBe("PK\x03\x04");

        $zip = new ZipArchive;
        expect($zip->open($downloadPath))->toBeTrue();

        $workbook = $zip->getFromName('xl/workbook.xml');
        $sheetData = '';

        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = $zip->getNameIndex($index);

            if (is_string($name) && str_starts_with($name, 'xl/worksheets/')) {
                $sheetData .= $zip->getFromIndex($index);
            }
        }

        $zip->close();

        $reader = new \OpenSpout\Reader\XLSX\Reader;
        $reader->open($downloadPath);
        $firstSheet = null;
        foreach ($reader->getSheetIterator() as $sheet) {
            $firstSheet = $sheet;
            break;
        }

        $rows = iterator_to_array($firstSheet->getRowIterator());
        $text = '';
        foreach ($rows as $row) {
            $text .= implode('|', $row->toArray())."\n";
        }
        $reader->close();

        expect($text)
            ->toContain('Matematika')
            ->toContain('Tes Matematika Gelombang 1')
            ->toContain('MTK-GL1')
            ->not->toContain('{kategori}')
            ->not->toContain('{judul_paket}')
            ->not->toContain('{kode_paket}')
            ->not->toContain('{deskripsi}')
            ->not->toContain('{status_paket}');

        expect($workbook)
            ->toContain('Data Soal')
            ->toContain('Panduan');
    } finally {
        @unlink($downloadPath);
    }
});

it('imports Indonesian template headers and updates package configuration', function () {
    $admin = User::factory()->admin()->create();
    $subject = ExamSubject::create([
        'name' => 'Matematika',
        'code' => 'MTK',
        'is_active' => true,
    ]);
    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'created_by' => $admin->id,
        'title' => 'Tes Matematika Gelombang 1',
        'code' => 'MTK-GL1',
        'description' => 'Paket seleksi matematika.',
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'show_result_to_candidate' => false,
        'status' => ExamPackage::STATUS_DRAFT,
    ]);

    $generated = app(ExamPackageTemplateService::class)->generate($package);

    try {
        fillIndonesianExamTemplate($generated['path']);

        $upload = new UploadedFile(
            $generated['path'],
            'template-terisi.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );

        $this->actingAs($admin)
            ->post("/dashboard/admin/exams/packages/{$package->id}/imports", [
                'file' => $upload,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $package->refresh();

        expect($package->duration_minutes)->toBe(45)
            ->and((float) $package->passing_score)->toBe(65.0)
            ->and($package->show_result_to_candidate)->toBeTrue()
            ->and($package->max_attempts)->toBe(2);

        $question = ExamQuestion::where('exam_package_id', $package->id)->firstOrFail();

        expect($question->question_text)->toBe('Hasil dari 12 + 8 adalah ...')
            ->and($question->correct_answer)->toBe('C')
            ->and((float) $question->point)->toBe(2.0)
            ->and($question->difficulty)->toBe('easy')
            ->and($question->is_active)->toBeTrue();
    } finally {
        @unlink($generated['path']);
    }
});

it('preserves English import header compatibility', function () {
    $admin = User::factory()->admin()->create();
    $subject = ExamSubject::create([
        'name' => 'English',
        'code' => 'ENG',
        'is_active' => true,
    ]);
    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'created_by' => $admin->id,
        'title' => 'English Placement Test',
        'code' => 'ENG-GL1',
        'description' => 'English compatibility test.',
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'show_result_to_candidate' => false,
        'status' => ExamPackage::STATUS_DRAFT,
    ]);
    $path = createEnglishHeaderWorkbook();

    try {
        $upload = new UploadedFile(
            $path,
            'english-headers.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );

        $this->actingAs($admin)
            ->post("/dashboard/admin/exams/packages/{$package->id}/imports", [
                'file' => $upload,
            ])
            ->assertRedirect();

        $question = ExamQuestion::where('exam_package_id', $package->id)->firstOrFail();

        expect($question->question_text)->toBe('Choose the correct greeting.')
            ->and($question->correct_answer)->toBe('B')
            ->and((float) $question->point)->toBe(1.0)
            ->and($question->difficulty)->toBe('medium')
            ->and($question->is_active)->toBeTrue();
    } finally {
        @unlink($path);
    }
});

it('imports rich text superscript formatting correctly as HTML tags', function () {
    $admin = User::factory()->admin()->create();
    $subject = ExamSubject::create([
        'name' => 'English',
        'code' => 'ENG',
        'is_active' => true,
    ]);
    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'created_by' => $admin->id,
        'title' => 'English Placement Test',
        'code' => 'ENG-GL1',
        'description' => 'English compatibility test.',
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'show_result_to_candidate' => false,
        'status' => ExamPackage::STATUS_DRAFT,
    ]);
    $path = createSuperscriptHeaderWorkbook();

    try {
        $upload = new UploadedFile(
            $path,
            'superscript-headers.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );

        $this->actingAs($admin)
            ->post("/dashboard/admin/exams/packages/{$package->id}/imports", [
                'file' => $upload,
            ])
            ->assertRedirect();

        $question = ExamQuestion::where('exam_package_id', $package->id)->firstOrFail();

        expect($question->question_text)->toBe('Hasil 7<sup>2</sup> adalah ...')
            ->and($question->correct_answer)->toBe('B')
            ->and((float) $question->point)->toBe(1.0)
            ->and($question->difficulty)->toBe('medium')
            ->and($question->is_active)->toBeTrue();
    } finally {
        @unlink($path);
    }
});

function fillIndonesianExamTemplate(string $path): void
{
    $zip = new ZipArchive;
    $zip->open($path);
    $xml = $zip->getFromName('xl/worksheets/sheet1.xml');

    $replacements = [
        '/<c r="B14"[^>]*\/>|<c r="B14"[^>]*>.*?<\/c>/' => '<c r="B14" s="8" t="str"><v>45</v></c>',
        '/<c r="B15"[^>]*\/>|<c r="B15"[^>]*>.*?<\/c>/' => '<c r="B15" s="8" t="str"><v>65</v></c>',
        '/<c r="B16"[^>]*\/>|<c r="B16"[^>]*>.*?<\/c>/' => '<c r="B16" s="8" t="str"><v>ya</v></c>',
        '/<c r="B17"[^>]*\/>|<c r="B17"[^>]*>.*?<\/c>/' => '<c r="B17" s="8" t="str"><v>ya</v></c>',
        '/<c r="A21"[^>]*\/>|<c r="A21"[^>]*>.*?<\/c>/' => '<c r="A21" s="6" t="str"><v>1</v></c>',
        '/<c r="B21"[^>]*\/>|<c r="B21"[^>]*>.*?<\/c>/' => '<c r="B21" s="6" t="str"><v>Hasil dari 12 + 8 adalah ...</v></c>',
        '/<c r="C21"[^>]*\/>|<c r="C21"[^>]*>.*?<\/c>/' => '<c r="C21" s="6" t="str"><v>18</v></c>',
        '/<c r="D21"[^>]*\/>|<c r="D21"[^>]*>.*?<\/c>/' => '<c r="D21" s="6" t="str"><v>19</v></c>',
        '/<c r="E21"[^>]*\/>|<c r="E21"[^>]*>.*?<\/c>/' => '<c r="E21" s="6" t="str"><v>20</v></c>',
        '/<c r="F21"[^>]*\/>|<c r="F21"[^>]*>.*?<\/c>/' => '<c r="F21" s="6" t="str"><v>21</v></c>',
        '/<c r="G21"[^>]*\/>|<c r="G21"[^>]*>.*?<\/c>/' => '<c r="G21" s="6" t="str"><v>22</v></c>',
        '/<c r="H21"[^>]*\/>|<c r="H21"[^>]*>.*?<\/c>/' => '<c r="H21" s="6" t="str"><v>C</v></c>',
        '/<c r="I21"[^>]*\/>|<c r="I21"[^>]*>.*?<\/c>/' => '<c r="I21" s="6" t="str"><v>2</v></c>',
        '/<c r="J21"[^>]*\/>|<c r="J21"[^>]*>.*?<\/c>/' => '<c r="J21" s="6" t="str"><v>mudah</v></c>',
        '/<c r="K21"[^>]*\/>|<c r="K21"[^>]*>.*?<\/c>/' => '<c r="K21" s="6" t="str"><v>12 + 8 = 20</v></c>',
        '/<c r="L21"[^>]*\/>|<c r="L21"[^>]*>.*?<\/c>/' => '<c r="L21" s="6" t="str"><v>ya</v></c>',
    ];

    foreach ($replacements as $pattern => $replace) {
        $xml = preg_replace($pattern, $replace, $xml);
    }

    $zip->addFromString('xl/worksheets/sheet1.xml', $xml);
    $zip->close();
}

function createEnglishHeaderWorkbook(): string
{
    $basePath = tempnam(sys_get_temp_dir(), 'exam-english-');

    if ($basePath === false) {
        throw new RuntimeException('Unable to create temporary workbook path.');
    }

    $path = $basePath.'.xlsx';
    @unlink($basePath);

    $writer = new Writer;
    $writer->openToFile($path);
    $writer->addRow(Row::fromValues([
        'subject',
        'package',
        'question_text',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'option_e',
        'correct_answer',
        'point',
        'difficulty',
        'explanation',
        'is_active',
    ]));
    $writer->addRow(Row::fromValues([
        'ENG',
        'ENG-GL1',
        'Choose the correct greeting.',
        'Good night',
        'Good morning',
        'Goodbye',
        'See you',
        '',
        'B',
        1,
        'medium',
        'Good morning is a greeting.',
        'true',
    ]));
    $writer->close();

    return $path;
}

function createSuperscriptHeaderWorkbook(): string
{
    $basePath = tempnam(sys_get_temp_dir(), 'exam-superscript-');

    if ($basePath === false) {
        throw new RuntimeException('Unable to create temporary workbook path.');
    }

    $path = $basePath.'.xlsx';
    @unlink($basePath);

    $writer = new Writer;
    $writer->openToFile($path);
    $writer->addRow(Row::fromValues([
        'subject',
        'package',
        'question_text',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'option_e',
        'correct_answer',
        'point',
        'difficulty',
        'explanation',
        'is_active',
    ]));
    $writer->addRow(Row::fromValues([
        'ENG',
        'ENG-GL1',
        'PLACEHOLDER_QUESTION_TEXT',
        'Good night',
        'Good morning',
        'Goodbye',
        'See you',
        '',
        'B',
        1,
        'medium',
        'Good morning is a greeting.',
        'true',
    ]));
    $writer->close();

    // Now open the zip and replace PLACEHOLDER_QUESTION_TEXT in xl/worksheets/sheet1.xml
    $zip = new ZipArchive;
    if ($zip->open($path) === true) {
        $xml = $zip->getFromName('xl/worksheets/sheet1.xml');

        $richText = '<is><r><t xml:space="preserve">Hasil 7</t></r><r><rPr><vertAlign val="superscript"/></rPr><t>2</t></r><r><t xml:space="preserve"> adalah ...</t></r></is>';

        $xml = str_replace('<is><t>PLACEHOLDER_QUESTION_TEXT</t></is>', $richText, $xml);

        $zip->addFromString('xl/worksheets/sheet1.xml', $xml);
        $zip->close();
    }

    return $path;
}

it('imports shared strings rich text superscript formatting correctly as HTML tags', function () {
    $admin = User::factory()->admin()->create();
    $subject = ExamSubject::create([
        'name' => 'English',
        'code' => 'ENG',
        'is_active' => true,
    ]);
    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'created_by' => $admin->id,
        'title' => 'English Placement Test',
        'code' => 'ENG-GL1',
        'description' => 'English compatibility test.',
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'show_result_to_candidate' => false,
        'status' => ExamPackage::STATUS_DRAFT,
    ]);
    $path = createSharedStringSuperscriptHeaderWorkbook();

    try {
        $upload = new UploadedFile(
            $path,
            'shared-superscript-headers.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );

        $this->actingAs($admin)
            ->post("/dashboard/admin/exams/packages/{$package->id}/imports", [
                'file' => $upload,
            ])
            ->assertRedirect();

        $question = ExamQuestion::where('exam_package_id', $package->id)->firstOrFail();

        expect($question->question_text)->toBe('Hasil 7<sup>2</sup> adalah ...')
            ->and($question->correct_answer)->toBe('B')
            ->and((float) $question->point)->toBe(1.0)
            ->and($question->difficulty)->toBe('medium')
            ->and($question->is_active)->toBeTrue();
    } finally {
        @unlink($path);
    }
});

function createSharedStringSuperscriptHeaderWorkbook(): string
{
    $basePath = tempnam(sys_get_temp_dir(), 'exam-shared-superscript-');

    if ($basePath === false) {
        throw new RuntimeException('Unable to create temporary workbook path.');
    }

    $path = $basePath.'.xlsx';
    @unlink($basePath);

    $writer = new Writer;
    $writer->openToFile($path);
    $writer->addRow(Row::fromValues([
        'subject',
        'package',
        'question_text',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'option_e',
        'correct_answer',
        'point',
        'difficulty',
        'explanation',
        'is_active',
    ]));
    $writer->addRow(Row::fromValues([
        'ENG',
        'ENG-GL1',
        'PLACEHOLDER_QUESTION_TEXT',
        'Good night',
        'Good morning',
        'Goodbye',
        'See you',
        '',
        'B',
        1,
        'medium',
        'Good morning is a greeting.',
        'true',
    ]));
    $writer->close();

    $zip = new ZipArchive;
    if ($zip->open($path) === true) {
        $xml = $zip->getFromName('xl/worksheets/sheet1.xml');

        // Replace PLACEHOLDER_QUESTION_TEXT with a reference to a shared string (index 0)
        $xml = preg_replace('/<c r="([^"]+)" s="([^"]+)" t="inlineStr"><is><t>PLACEHOLDER_QUESTION_TEXT<\/t><\/is><\/c>/', '<c r="$1" s="$2" t="s"><v>0</v></c>', $xml);

        $zip->addFromString('xl/worksheets/sheet1.xml', $xml);

        $sharedStringsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'."\n"
            .'<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="1" uniqueCount="1">'
            .'<si><r><t xml:space="preserve">Hasil 7</t></r><r><rPr><vertAlign val="superscript"/></rPr><t>2</t></r><r><t xml:space="preserve"> adalah ...</t></r></si>'
            .'</sst>';
        $zip->addFromString('xl/sharedStrings.xml', $sharedStringsXml);

        $rels = $zip->getFromName('xl/_rels/workbook.xml.rels');
        if (strpos($rels, 'sharedStrings') === false) {
            $newRel = '<Relationship Id="rId_sharedStrings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>';
            $rels = str_replace('</Relationships>', $newRel.'</Relationships>', $rels);
            $zip->addFromString('xl/_rels/workbook.xml.rels', $rels);
        }

        $contentTypes = $zip->getFromName('[Content_Types].xml');
        if (strpos($contentTypes, 'sharedStrings') === false) {
            $newType = '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>';
            $contentTypes = str_replace('</Types>', $newType.'</Types>', $contentTypes);
            $zip->addFromString('[Content_Types].xml', $contentTypes);
        }

        $zip->close();
    }

    return $path;
}

it('clears all questions in bank soal for a package while preserving import batch history and audit logs', function () {
    $admin = User::factory()->admin()->create();
    $subject = ExamSubject::create([
        'name' => 'Fisika',
        'code' => 'FSK',
        'is_active' => true,
    ]);
    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'created_by' => $admin->id,
        'title' => 'Fisika Dasar',
        'code' => 'FSK-01',
        'duration_minutes' => 60,
        'passing_score' => 75,
        'max_attempts' => 1,
        'status' => ExamPackage::STATUS_PUBLISHED,
    ]);

    $batch = ExamImportBatch::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'uploaded_by' => $admin->id,
        'original_filename' => 'soal_fisika.xlsx',
        'status' => ExamImportBatch::STATUS_COMPLETED,
        'total_rows' => 2,
        'imported_rows' => 2,
        'failed_rows' => 0,
        'started_at' => now(),
        'finished_at' => now(),
    ]);

    $q1 = ExamQuestion::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'exam_import_batch_id' => $batch->id,
        'question_text' => 'Berapa gravitasi bumi?',
        'options' => ['A' => '9.8 m/s²', 'B' => '10 m/s²', 'C' => '8 m/s²', 'D' => '12 m/s²'],
        'correct_answer' => 'A',
        'point' => 1,
        'difficulty' => 'easy',
        'is_active' => true,
    ]);

    $q2 = ExamQuestion::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'exam_import_batch_id' => $batch->id,
        'question_text' => 'Rumus kecepatan?',
        'options' => ['A' => 'v = s / t', 'B' => 'v = s * t', 'C' => 'v = m * a', 'D' => 'v = f * lambda'],
        'correct_answer' => 'A',
        'point' => 1,
        'difficulty' => 'easy',
        'is_active' => true,
    ]);

    expect($package->questions()->count())->toBe(2);

    $response = $this->actingAs($admin)
        ->delete("/dashboard/admin/exams/packages/{$package->id}/questions");

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Questions are soft-deleted from active bank soal
    expect($package->fresh()->questions()->count())->toBe(0);
    expect(ExamQuestion::withTrashed()->where('exam_package_id', $package->id)->count())->toBe(2);

    // Published package reverts to draft because 0 questions remain
    expect($package->fresh()->status)->toBe(ExamPackage::STATUS_DRAFT);

    // Import batch history remains completely intact!
    $freshBatch = $batch->fresh();
    expect($freshBatch)->not->toBeNull();
    expect($freshBatch->original_filename)->toBe('soal_fisika.xlsx');
    expect($freshBatch->imported_rows)->toBe(2);
    expect($freshBatch->questions()->count())->toBe(0);

    // Audit log was recorded
    expect(ExamAuditLog::where('event_type', 'exam_question_bank_cleared')->exists())->toBeTrue();
});

it('deletes questions from a specific import batch while preserving the batch record', function () {
    $admin = User::factory()->admin()->create();
    $subject = ExamSubject::create([
        'name' => 'Biologi',
        'code' => 'BIO',
        'is_active' => true,
    ]);
    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'created_by' => $admin->id,
        'title' => 'Biologi Sel',
        'code' => 'BIO-01',
        'duration_minutes' => 45,
        'passing_score' => 60,
        'max_attempts' => 1,
        'status' => ExamPackage::STATUS_DRAFT,
    ]);

    $batch1 = ExamImportBatch::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'uploaded_by' => $admin->id,
        'original_filename' => 'batch1_salah.xlsx',
        'status' => ExamImportBatch::STATUS_COMPLETED,
        'total_rows' => 1,
        'imported_rows' => 1,
        'failed_rows' => 0,
    ]);

    $q1 = ExamQuestion::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'exam_import_batch_id' => $batch1->id,
        'question_text' => 'Soal dari batch 1',
        'options' => ['A' => 'A', 'B' => 'B', 'C' => 'C', 'D' => 'D'],
        'correct_answer' => 'A',
        'point' => 1,
        'is_active' => true,
    ]);

    $batch2 = ExamImportBatch::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'uploaded_by' => $admin->id,
        'original_filename' => 'batch2_benar.xlsx',
        'status' => ExamImportBatch::STATUS_COMPLETED,
        'total_rows' => 1,
        'imported_rows' => 1,
        'failed_rows' => 0,
    ]);

    $q2 = ExamQuestion::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'exam_import_batch_id' => $batch2->id,
        'question_text' => 'Soal dari batch 2',
        'options' => ['A' => 'A', 'B' => 'B', 'C' => 'C', 'D' => 'D'],
        'correct_answer' => 'B',
        'point' => 1,
        'is_active' => true,
    ]);

    expect($package->questions()->count())->toBe(2);

    // Delete only batch 1 questions
    $response = $this->actingAs($admin)
        ->delete("/dashboard/admin/exams/imports/{$batch1->id}/questions");

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Batch 1 questions are deleted, batch 2 questions remain
    expect($batch1->fresh()->questions()->count())->toBe(0);
    expect($batch2->fresh()->questions()->count())->toBe(1);
    expect($package->fresh()->questions()->count())->toBe(1);

    // Both import batch records still exist!
    expect(ExamImportBatch::count())->toBe(2);
    expect(ExamAuditLog::where('event_type', 'exam_import_batch_questions_deleted')->exists())->toBeTrue();
});

it('deletes an individual question from bank soal', function () {
    $admin = User::factory()->admin()->create();
    $subject = ExamSubject::create([
        'name' => 'Kimia',
        'code' => 'KIM',
        'is_active' => true,
    ]);
    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'created_by' => $admin->id,
        'title' => 'Kimia Dasar',
        'code' => 'KIM-01',
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'status' => ExamPackage::STATUS_DRAFT,
    ]);

    $question = ExamQuestion::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'question_text' => 'Lambang emas?',
        'options' => ['A' => 'Au', 'B' => 'Ag', 'C' => 'Fe', 'D' => 'Cu'],
        'correct_answer' => 'A',
        'point' => 1,
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->delete("/dashboard/admin/exams/questions/{$question->id}");

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect($question->fresh()->trashed())->toBeTrue();
    expect($package->fresh()->questions()->count())->toBe(0);
    expect(ExamAuditLog::where('event_type', 'exam_question_deleted')->exists())->toBeTrue();
});

it('prevents clearing bank soal when there are active in-progress attempts', function () {
    $admin = User::factory()->admin()->create();
    $subject = ExamSubject::create([
        'name' => 'Sejarah',
        'code' => 'SJR',
        'is_active' => true,
    ]);
    $package = ExamPackage::create([
        'exam_subject_id' => $subject->id,
        'created_by' => $admin->id,
        'title' => 'Sejarah Indonesia',
        'code' => 'SJR-01',
        'duration_minutes' => 60,
        'passing_score' => 70,
        'max_attempts' => 1,
        'status' => ExamPackage::STATUS_PUBLISHED,
    ]);

    $question = ExamQuestion::create([
        'exam_subject_id' => $subject->id,
        'exam_package_id' => $package->id,
        'question_text' => 'Tahun kemerdekaan RI?',
        'options' => ['A' => '1945', 'B' => '1944', 'C' => '1946', 'D' => '1947'],
        'correct_answer' => 'A',
        'point' => 1,
        'is_active' => true,
    ]);

    $session = ExamSession::create([
        'exam_package_id' => $package->id,
        'title' => 'Sesi Ujian Sejarah',
        'opens_at' => now()->subHour(),
        'closes_at' => now()->addHour(),
        'duration_minutes' => 60,
        'passing_score' => 70,
        'status' => ExamSession::STATUS_PUBLISHED,
    ]);

    // Active in-progress attempt
    ExamAttempt::create([
        'exam_session_id' => $session->id,
        'exam_package_id' => $package->id,
        'status' => ExamAttempt::STATUS_IN_PROGRESS,
        'attempt_number' => 1,
        'started_at' => now(),
    ]);

    $response = $this->actingAs($admin)
        ->delete("/dashboard/admin/exams/packages/{$package->id}/questions");

    $response->assertSessionHasErrors('package');
    expect($package->fresh()->questions()->count())->toBe(1);
});
