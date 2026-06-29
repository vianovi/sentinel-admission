<?php

namespace App\Imports\Exam;

use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\XLSX\Reader;

class ExamQuestionWorkbookReader
{
    /**
     * @return array{headings: array<int, string>, rows: array<int, array{row_number: int, values: array<int, mixed>}>, package_config: array<string, string>, exam_config: array<string, string>, sheet_name: string|null}
     */
    public function readDataSheet(string $path, int $maxRows): array
    {
        $reader = new Reader();
        $reader->open($path);

        try {
            $fallback = null;

            foreach ($reader->getSheetIterator() as $sheet) {
                if (method_exists($sheet, 'getName') && $sheet->getName() !== 'Data Soal') {
                    if ($fallback === null) {
                        $fallback = $this->readSheet($sheet, $maxRows);
                    }

                    continue;
                }

                return $this->readSheet($sheet, $maxRows);
            }

            return $fallback ?? $this->emptyResult();
        } finally {
            $reader->close();
        }
    }

    /**
     * @return array{headings: array<int, string>, rows: array<int, array{row_number: int, values: array<int, mixed>}>, package_config: array<string, string>, exam_config: array<string, string>, sheet_name: string|null}
     */
    public function readFirstSheet(string $path, int $maxRows): array
    {
        return $this->readDataSheet($path, $maxRows);
    }

    private function readSheet(object $sheet, int $maxRows): array
    {
        $headings = [];
        $rows = [];
        $packageConfig = [];
        $examConfig = [];
        $seenHeader = false;
        $dataRows = 0;
        $section = null;

        foreach ($sheet->getRowIterator() as $rowNumber => $row) {
            if (! $row instanceof Row) {
                continue;
            }

            $values = $row->toArray();
            $stringValues = array_map(fn ($value) => $this->stringValue($value), $values);

            if (! $seenHeader) {
                if ($this->isEmpty($stringValues)) {
                    continue;
                }

                $firstCell = $this->normalizeHeading($stringValues[0] ?? '');

                if (str_contains($firstCell, 'konfigurasi_paket')) {
                    $section = 'package';
                    continue;
                }

                if (str_contains($firstCell, 'konfigurasi_ujian')) {
                    $section = 'exam';
                    continue;
                }

                if (str_contains($firstCell, 'data_soal')) {
                    $section = null;
                    continue;
                }

                if ($this->isQuestionHeader($stringValues)) {
                    $headings = $stringValues;
                    $seenHeader = true;
                    $section = null;
                    continue;
                }

                if ($section === 'package' || $section === 'exam') {
                    $key = $this->normalizeHeading($stringValues[0] ?? '');

                    if ($key !== '' && $key !== 'field') {
                        if ($section === 'package') {
                            $packageConfig[$key] = $stringValues[1] ?? '';
                        } else {
                            $examConfig[$key] = $stringValues[1] ?? '';
                        }
                    }
                }

                continue;
            }

            if ($this->isEmpty($stringValues)) {
                continue;
            }

            $dataRows++;

            if ($dataRows > $maxRows) {
                break;
            }

            $rows[] = [
                'row_number' => is_int($rowNumber) ? $rowNumber : $dataRows + 1,
                'values' => $values,
            ];
        }

        return [
            'headings' => $headings,
            'rows' => $rows,
            'package_config' => $packageConfig,
            'exam_config' => $examConfig,
            'sheet_name' => method_exists($sheet, 'getName') ? $sheet->getName() : null,
        ];
    }

    private function isEmpty(array $values): bool
    {
        foreach ($values as $value) {
            if (trim($this->stringValue($value)) !== '') {
                return false;
            }
        }

        return true;
    }

    private function isQuestionHeader(array $values): bool
    {
        $normalized = array_map(fn ($value) => $this->normalizeHeading($value), $values);

        return in_array('question_text', $normalized, true)
            || in_array('teks_soal', $normalized, true);
    }

    private function normalizeHeading(string $heading): string
    {
        $heading = strtolower(trim($heading));
        $heading = preg_replace('/[^a-z0-9_]+/', '_', $heading) ?? '';

        return trim($heading, '_');
    }

    private function emptyResult(): array
    {
        return [
            'headings' => [],
            'rows' => [],
            'package_config' => [],
            'exam_config' => [],
            'sheet_name' => null,
        ];
    }

    private function stringValue(mixed $value): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        if ($value === null) {
            return '';
        }

        if (is_scalar($value)) {
            return trim((string) $value);
        }

        return '';
    }
}
