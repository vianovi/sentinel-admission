<?php

namespace App\Imports\Exam;

use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\XLSX\Reader;

class ExamQuestionWorkbookReader
{
    /**
     * @return array{headings: array<int, string>, rows: array<int, array{row_number: int, values: array<int, mixed>}>}
     */
    public function readFirstSheet(string $path, int $maxRows): array
    {
        $reader = new Reader();
        $reader->open($path);

        try {
            foreach ($reader->getSheetIterator() as $sheet) {
                $headings = [];
                $rows = [];
                $seenHeader = false;
                $dataRows = 0;

                foreach ($sheet->getRowIterator() as $rowNumber => $row) {
                    if (! $row instanceof Row) {
                        continue;
                    }

                    $values = $row->toArray();

                    if (! $seenHeader) {
                        if ($this->isEmpty($values)) {
                            continue;
                        }

                        $headings = array_map(
                            fn ($value) => $this->stringValue($value),
                            $values
                        );
                        $seenHeader = true;
                        continue;
                    }

                    if ($this->isEmpty($values)) {
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
                ];
            }

            return ['headings' => [], 'rows' => []];
        } finally {
            $reader->close();
        }
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
