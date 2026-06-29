<?php

use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamQuestion;
use App\Models\Exam\ExamSubject;
use App\Models\User;
use App\Services\Exam\ExamPackageTemplateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

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
    expect($response->headers->get('content-disposition'))->toContain('template-soal-mtk-gl1-tes-matematika-gelombang-1.xlsx');

    $downloadPath = $response->baseResponse->getFile()->getPathname();

    try {
        $zip = new ZipArchive();
        expect($zip->open($downloadPath))->toBeTrue();

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

function fillIndonesianExamTemplate(string $path): void
{
    $zip = new ZipArchive();
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
