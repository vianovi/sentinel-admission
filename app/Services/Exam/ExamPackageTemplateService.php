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

        if (class_exists(ZipArchive::class) && is_file($source)) {
            try {
                return $this->generateFromMaster($package, $source);
            } catch (\Throwable) {
                return $this->generatePlainTemplate($package);
            }
        }

        return $this->generatePlainTemplate($package);
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
            foreach ($this->worksheetEntries($archive) as $entry) {
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
     * @return array{path: string, filename: string}
     */
    private function generatePlainTemplate(ExamPackage $package): array
    {
        $target = $this->tempPath();
        $this->writeStoredZip($target, $this->plainXlsxFiles($package));

        return [
            'path' => $target,
            'filename' => $this->filename($package),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function worksheetEntries(ZipArchive $archive): array
    {
        $entries = [];

        for ($index = 0; $index < $archive->numFiles; $index++) {
            $name = $archive->getNameIndex($index);

            if (is_string($name) && str_starts_with($name, 'xl/worksheets/') && str_ends_with($name, '.xml')) {
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

    /**
     * @return array<string, string>
     */
    private function plainXlsxFiles(ExamPackage $package): array
    {
        return [
            '[Content_Types].xml' => <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>
XML,
            '_rels/.rels' => <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>
XML,
            'xl/workbook.xml' => <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data Soal" sheetId="1" r:id="rId1"/></sheets></workbook>
XML,
            'xl/_rels/workbook.xml.rels' => <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>
XML,
            'xl/worksheets/sheet1.xml' => $this->plainWorksheetXml($package),
        ];
    }

    private function plainWorksheetXml(ExamPackage $package): string
    {
        $rows = [
            ['Template Import Soal Ujian Seleksi'],
            [],
            ['KONFIGURASI_PAKET'],
            ['field', 'value'],
            ['kategori', $package->subject?->name ?? '-'],
            ['judul_paket', $package->title],
            ['kode_paket', $package->code ?: 'PKG-'.$package->id],
            ['deskripsi', $package->description ?: '-'],
            ['status_paket', $package->status],
            [],
            ['KONFIGURASI_UJIAN'],
            ['field', 'value'],
            ['durasi_menit', (string) $package->duration_minutes],
            ['ambang_lulus_persen', (string) $package->passing_score],
            ['tampilkan_hasil', $package->show_result_to_candidate ? 'ya' : 'tidak'],
            ['izinkan_ujian_ulang', $package->max_attempts > 1 ? 'ya' : 'tidak'],
            [],
            ['DATA_SOAL'],
            [
                'nomor',
                'teks_soal',
                'opsi_a',
                'opsi_b',
                'opsi_c',
                'opsi_d',
                'opsi_e',
                'jawaban_benar',
                'poin',
                'tingkat_kesulitan',
                'pembahasan',
                'aktif',
            ],
        ];

        $sheetData = '';

        foreach ($rows as $rowNumber => $values) {
            $sheetData .= $this->worksheetRow($rowNumber + 1, $values);
        }

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>{$sheetData}</sheetData></worksheet>
XML;
    }

    /**
     * @param array<int, string> $values
     */
    private function worksheetRow(int $rowNumber, array $values): string
    {
        if ($values === []) {
            return "<row r=\"{$rowNumber}\"/>";
        }

        $cells = '';

        foreach ($values as $index => $value) {
            $cells .= $this->worksheetCell($this->columnName($index + 1).$rowNumber, $value);
        }

        return "<row r=\"{$rowNumber}\">{$cells}</row>";
    }

    private function worksheetCell(string $reference, string $value): string
    {
        return '<c r="'.$reference.'" t="inlineStr"><is><t>'.$this->xmlText($value).'</t></is></c>';
    }

    private function columnName(int $index): string
    {
        $name = '';

        while ($index > 0) {
            $index--;
            $name = chr(65 + ($index % 26)).$name;
            $index = intdiv($index, 26);
        }

        return $name;
    }

    /**
     * @param array<string, string> $files
     */
    private function writeStoredZip(string $path, array $files): void
    {
        $handle = fopen($path, 'wb');

        if ($handle === false) {
            throw new \RuntimeException('EXAM_TEMPLATE_TEMP_OPEN_FAILED');
        }

        $centralDirectory = '';
        $offset = 0;

        try {
            foreach ($files as $name => $contents) {
                $crc = crc32($contents);

                if ($crc < 0) {
                    $crc += 4294967296;
                }

                $size = strlen($contents);
                $nameLength = strlen($name);
                $localHeader = pack(
                    'VvvvvvVVVvv',
                    0x04034b50,
                    20,
                    0,
                    0,
                    0,
                    0,
                    $crc,
                    $size,
                    $size,
                    $nameLength,
                    0
                ).$name.$contents;

                fwrite($handle, $localHeader);

                $centralDirectory .= pack(
                    'VvvvvvvVVVvvvvvVV',
                    0x02014b50,
                    20,
                    20,
                    0,
                    0,
                    0,
                    0,
                    $crc,
                    $size,
                    $size,
                    $nameLength,
                    0,
                    0,
                    0,
                    0,
                    0,
                    $offset
                ).$name;

                $offset += strlen($localHeader);
            }

            $centralDirectoryOffset = $offset;
            fwrite($handle, $centralDirectory);

            fwrite($handle, pack(
                'VvvvvVVv',
                0x06054b50,
                0,
                0,
                count($files),
                count($files),
                strlen($centralDirectory),
                $centralDirectoryOffset,
                0
            ));
        } finally {
            fclose($handle);
        }
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
