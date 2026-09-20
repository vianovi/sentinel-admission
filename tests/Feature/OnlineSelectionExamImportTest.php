<?php

use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamQuestion;
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

        expect($sheetData)
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
        '<x:c r="B14" s="46" />' => '<x:c r="B14" s="46" t="str"><x:v>45</x:v></x:c>',
        '<x:c r="B15" s="46" />' => '<x:c r="B15" s="46" t="str"><x:v>65</x:v></x:c>',
        '<x:c r="B16" s="46" t="str"><x:v>tidak</x:v></x:c>' => '<x:c r="B16" s="46" t="str"><x:v>ya</x:v></x:c>',
        '<x:c r="B17" s="46" t="str"><x:v>tidak</x:v></x:c>' => '<x:c r="B17" s="46" t="str"><x:v>ya</x:v></x:c>',
        '<x:c r="B21" s="42" />' => '<x:c r="B21" s="42" t="str"><x:v>Hasil dari 12 + 8 adalah ...</x:v></x:c>',
        '<x:c r="C21" s="42" />' => '<x:c r="C21" s="42" t="str"><x:v>18</x:v></x:c>',
        '<x:c r="D21" s="42" />' => '<x:c r="D21" s="42" t="str"><x:v>19</x:v></x:c>',
        '<x:c r="E21" s="42" />' => '<x:c r="E21" s="42" t="str"><x:v>20</x:v></x:c>',
        '<x:c r="F21" s="42" />' => '<x:c r="F21" s="42" t="str"><x:v>21</x:v></x:c>',
        '<x:c r="G21" s="42" />' => '<x:c r="G21" s="42" t="str"><x:v>22</x:v></x:c>',
        '<x:c r="H21" s="42" />' => '<x:c r="H21" s="42" t="str"><x:v>C</x:v></x:c>',
        '<x:c r="I21" s="42" />' => '<x:c r="I21" s="42" t="str"><x:v>2</x:v></x:c>',
        '<x:c r="J21" s="42" />' => '<x:c r="J21" s="42" t="str"><x:v>mudah</x:v></x:c>',
        '<x:c r="K21" s="42" />' => '<x:c r="K21" s="42" t="str"><x:v>12 + 8 = 20</x:v></x:c>',
    ];

    $xml = str_replace(array_keys($replacements), array_values($replacements), $xml);
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

    $writer = new Writer();
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
    $zip = new ZipArchive();
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

    $writer = new Writer();
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

    $zip = new ZipArchive();
    if ($zip->open($path) === true) {
        $xml = $zip->getFromName('xl/worksheets/sheet1.xml');
        
        // Replace PLACEHOLDER_QUESTION_TEXT with a reference to a shared string (index 0)
        $xml = preg_replace('/<c r="([^"]+)" s="([^"]+)" t="inlineStr"><is><t>PLACEHOLDER_QUESTION_TEXT<\/t><\/is><\/c>/', '<c r="$1" s="$2" t="s"><v>0</v></c>', $xml);
        
        $zip->addFromString('xl/worksheets/sheet1.xml', $xml);
        
        $sharedStringsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' . "\n"
            . '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="1" uniqueCount="1">'
            . '<si><r><t xml:space="preserve">Hasil 7</t></r><r><rPr><vertAlign val="superscript"/></rPr><t>2</t></r><r><t xml:space="preserve"> adalah ...</t></r></si>'
            . '</sst>';
        $zip->addFromString('xl/sharedStrings.xml', $sharedStringsXml);
        
        $rels = $zip->getFromName('xl/_rels/workbook.xml.rels');
        if (strpos($rels, 'sharedStrings') === false) {
            $newRel = '<Relationship Id="rId_sharedStrings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>';
            $rels = str_replace('</Relationships>', $newRel . '</Relationships>', $rels);
            $zip->addFromString('xl/_rels/workbook.xml.rels', $rels);
        }
        
        $contentTypes = $zip->getFromName('[Content_Types].xml');
        if (strpos($contentTypes, 'sharedStrings') === false) {
            $newType = '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>';
            $contentTypes = str_replace('</Types>', $newType . '</Types>', $contentTypes);
            $zip->addFromString('[Content_Types].xml', $contentTypes);
        }

        $zip->close();
    }

    return $path;
}
