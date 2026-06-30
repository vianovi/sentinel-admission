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

        if (! class_exists(ZipArchive::class)) {
            throw new \RuntimeException('EXAM_TEMPLATE_ZIP_EXTENSION_MISSING');
        }

        if (! is_file($source)) {
            throw new \RuntimeException('EXAM_TEMPLATE_MASTER_NOT_FOUND');
        }

        return $this->generateFromMaster($package, $source);
    }

    /**
     * @return array{path: string, filename: string}
     */
    private function generateFromMaster(ExamPackage $package, string $source): array
    {
        $target = $this->tempPath();

        if (! copy($source, $target)) {
            @unlink($target);
            throw new \RuntimeException('EXAM_TEMPLATE_COPY_FAILED');
        }

        $archive = new ZipArchive();

        if ($archive->open($target) !== true) {
            @unlink($target);
            throw new \RuntimeException('EXAM_TEMPLATE_ZIP_OPEN_FAILED');
        }

        try {
            foreach ($this->replaceableEntries($archive) as $entry) {
                $xml = $archive->getFromName($entry);

                if ($xml === false) {
                    continue;
                }

                foreach ($this->replacements($package) as $placeholder => $value) {
                    $xml = str_replace($placeholder, $this->xmlText($value), $xml);
                }

                $archive->addFromString($entry, $xml);
            }
        } catch (\Throwable $exception) {
            @unlink($target);

            throw $exception;
        } finally {
            $archive->close();
        }

        return [
            'path' => $target,
            'filename' => $this->filename($package),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function replaceableEntries(ZipArchive $archive): array
    {
        $entries = [];

        for ($index = 0; $index < $archive->numFiles; $index++) {
            $name = $archive->getNameIndex($index);

            if (! is_string($name) || ! str_ends_with($name, '.xml')) {
                continue;
            }

            if (str_starts_with($name, 'xl/worksheets/') || $name === 'xl/sharedStrings.xml') {
                $entries[] = $name;
            }
        }

        return $entries;
    }

    /**
     * @return array<string, string>
     */
    private function replacements(ExamPackage $package): array
    {
        return [
            '{kategori}' => $package->subject?->name ?? '-',
            '{judul_paket}' => $package->title,
            '{kode_paket}' => $package->code ?: 'PKG-'.$package->id,
            '{deskripsi}' => $package->description ?: '-',
            '{status_paket}' => $package->status,
        ];
    }

    private function tempPath(): string
    {
        $target = tempnam(sys_get_temp_dir(), 'exam-template-');

        if ($target === false) {
            throw new \RuntimeException('EXAM_TEMPLATE_TEMP_FAILED');
        }

        return $target;
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
