<?php

namespace App\Services\Exam;

use App\Models\Exam\ExamPackage;
use Illuminate\Support\Str;
use ZipArchive;

class ExamPackageTemplateService
{
    private const MASTER_TEMPLATE = 'templates/exam/template-import-soal-ujian-seleksi-spmb.final.xlsx';

    /**
     * @return array{path: string, filename: string}
     */
    public function generate(ExamPackage $package): array
    {
        $package->loadMissing('subject:id,name,code');

        $source = resource_path(self::MASTER_TEMPLATE);

        if (! is_file($source)) {
            throw new \RuntimeException('EXAM_TEMPLATE_MASTER_NOT_FOUND');
        }

        $target = tempnam(sys_get_temp_dir(), 'exam-template-');

        if ($target === false) {
            throw new \RuntimeException('EXAM_TEMPLATE_TEMP_FAILED');
        }

        $target .= '.xlsx';
        copy($source, $target);

        $replacements = [
            '{kategori}' => $package->subject?->name ?? '-',
            '{judul_paket}' => $package->title,
            '{kode_paket}' => $package->code ?: 'PKG-'.$package->id,
            '{deskripsi}' => $package->description ?: '-',
            '{status_paket}' => $package->status,
        ];

        $archive = new ZipArchive();

        if ($archive->open($target) !== true) {
            @unlink($target);
            throw new \RuntimeException('EXAM_TEMPLATE_ZIP_OPEN_FAILED');
        }

        try {
            foreach (['xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml'] as $entry) {
                $xml = $archive->getFromName($entry);

                if ($xml === false) {
                    continue;
                }

                foreach ($replacements as $placeholder => $value) {
                    $xml = str_replace($placeholder, $this->xmlText($value), $xml);
                }

                $archive->addFromString($entry, $xml);
            }
        } finally {
            $archive->close();
        }

        return [
            'path' => $target,
            'filename' => $this->filename($package),
        ];
    }

    private function filename(ExamPackage $package): string
    {
        $code = Str::slug($package->code ?: 'paket-'.$package->id);
        $title = Str::slug($package->title);
        $suffix = trim($code.'-'.$title, '-');

        return 'template-soal-'.($suffix !== '' ? $suffix : 'paket-'.$package->id).'.xlsx';
    }

    private function xmlText(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_COMPAT, 'UTF-8');
    }
}
