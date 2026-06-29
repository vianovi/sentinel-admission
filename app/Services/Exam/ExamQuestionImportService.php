<?php

namespace App\Services\Exam;

use App\Imports\Exam\ExamQuestionWorkbookReader;
use App\Models\Exam\ExamImportBatch;
use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamQuestion;
use App\Support\SentinelStoragePaths;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExamQuestionImportService
{
    private const MAX_ROWS = 2000;

    private const REQUIRED_COLUMNS = [
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
    ];

    public function __construct(
        private readonly ExamQuestionWorkbookReader $reader,
        private readonly ExamAuditLogger $audit
    ) {}

    public function import(ExamPackage $package, UploadedFile $file, Request $request): ExamImportBatch
    {
        $storedPath = null;
        $batch = null;

        try {
            if (! $this->hasXlsxSignature($file)) {
                throw new \RuntimeException('INVALID_XLSX_SIGNATURE');
            }

            $storedPath = SentinelStoragePaths::examImportDirectory()
                . '/'
                . Str::uuid()
                . '.xlsx';

            Storage::disk('private')->put($storedPath, file_get_contents($file->getRealPath()));

            $batch = ExamImportBatch::create([
                'exam_subject_id' => $package->exam_subject_id,
                'exam_package_id' => $package->id,
                'uploaded_by' => $request->user()?->id,
                'original_filename' => $file->getClientOriginalName(),
                'stored_path' => $storedPath,
                'file_hash' => hash_file('sha256', $file->getRealPath()),
                'file_size_kb' => (int) ceil(($file->getSize() ?: 0) / 1024),
                'status' => ExamImportBatch::STATUS_PENDING,
                'started_at' => now(),
            ]);

            $path = Storage::disk('private')->path($storedPath);
            $workbook = $this->reader->readFirstSheet($path, self::MAX_ROWS);
            $headingMap = $this->headingMap($workbook['headings']);
            $missing = array_values(array_diff(self::REQUIRED_COLUMNS, array_keys($headingMap)));

            if ($missing !== []) {
                $batch->update([
                    'status' => ExamImportBatch::STATUS_FAILED,
                    'missing_columns' => $missing,
                    'failure_report' => [[
                        'row' => 1,
                        'reasons' => ['Kolom wajib belum lengkap: ' . implode(', ', $missing)],
                    ]],
                    'finished_at' => now(),
                ]);

                $this->audit->log('import_failed', [
                    'exam_package_id' => $package->id,
                    'metadata' => [
                        'missing_columns' => $missing,
                        'batch_id' => $batch->id,
                    ],
                ], $request);

                return $batch->fresh();
            }

            $failures = [];
            $imported = 0;
            $seenHashes = [];
            $maxSort = (int) ExamQuestion::where('exam_package_id', $package->id)->max('sort_order');

            foreach ($workbook['rows'] as $row) {
                $mapped = $this->mapRow($row['values'], $headingMap);
                $validation = $this->validateRow($mapped, $package, $seenHashes);

                if ($validation['reasons'] !== []) {
                    $failures[] = [
                        'row' => $row['row_number'],
                        'question_text' => Str::limit($mapped['question_text'] ?? '', 120),
                        'reasons' => $validation['reasons'],
                    ];
                    continue;
                }

                $seenHashes[] = $validation['question_hash'];
                $imported++;

                ExamQuestion::create([
                    'exam_subject_id' => $package->exam_subject_id,
                    'exam_package_id' => $package->id,
                    'exam_import_batch_id' => $batch->id,
                    'question_text' => $mapped['question_text'],
                    'options' => [
                        'A' => $mapped['option_a'],
                        'B' => $mapped['option_b'],
                        'C' => $mapped['option_c'],
                        'D' => $mapped['option_d'],
                        'E' => $mapped['option_e'] ?: null,
                    ],
                    'correct_answer' => $mapped['correct_answer'],
                    'point' => (float) $mapped['point'],
                    'difficulty' => $this->normalizeDifficulty($mapped['difficulty']),
                    'explanation' => $mapped['explanation'] ?: null,
                    'is_active' => $this->parseActive($mapped['is_active']),
                    'sort_order' => $maxSort + $imported,
                    'question_hash' => $validation['question_hash'],
                ]);
            }

            $batch->update([
                'status' => ExamImportBatch::STATUS_COMPLETED,
                'total_rows' => count($workbook['rows']),
                'imported_rows' => $imported,
                'failed_rows' => count($failures),
                'failure_report' => $failures,
                'finished_at' => now(),
            ]);

            $this->audit->log('questions_imported', [
                'exam_package_id' => $package->id,
                'metadata' => [
                    'batch_id' => $batch->id,
                    'total_rows' => count($workbook['rows']),
                    'imported_rows' => $imported,
                    'failed_rows' => count($failures),
                ],
            ], $request);

            return $batch->fresh();
        } catch (\Throwable $exception) {
            Log::error('Exam question import failed', [
                'package_id' => $package->id,
                'batch_id' => $batch?->id,
                'error' => $exception->getMessage(),
            ]);

            if ($batch) {
                $batch->update([
                    'status' => ExamImportBatch::STATUS_FAILED,
                    'failure_report' => [[
                        'row' => null,
                        'reasons' => ['File tidak dapat diproses. Pastikan format XLSX sesuai template.'],
                    ]],
                    'finished_at' => now(),
                ]);
            } else {
                $batch = ExamImportBatch::create([
                    'exam_subject_id' => $package->exam_subject_id,
                    'exam_package_id' => $package->id,
                    'uploaded_by' => $request->user()?->id,
                    'original_filename' => $file->getClientOriginalName(),
                    'stored_path' => $storedPath,
                    'file_hash' => $file->isValid() ? hash_file('sha256', $file->getRealPath()) : null,
                    'file_size_kb' => (int) ceil(($file->getSize() ?: 0) / 1024),
                    'status' => ExamImportBatch::STATUS_FAILED,
                    'failure_report' => [[
                        'row' => null,
                        'reasons' => ['File tidak dapat diproses. Pastikan format XLSX sesuai template.'],
                    ]],
                    'started_at' => now(),
                    'finished_at' => now(),
                ]);
            }

            $this->audit->log('import_failed', [
                'exam_package_id' => $package->id,
                'metadata' => [
                    'batch_id' => $batch->id,
                    'reason' => 'processing_failed',
                ],
            ], $request);

            return $batch->fresh();
        }
    }

    public static function requiredColumns(): array
    {
        return self::REQUIRED_COLUMNS;
    }

    public static function maxRows(): int
    {
        return self::MAX_ROWS;
    }

    private function hasXlsxSignature(UploadedFile $file): bool
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $header = $handle ? bin2hex(fread($handle, 4)) : '';

        if ($handle) {
            fclose($handle);
        }

        return in_array($header, ['504b0304', '504b0506', '504b0708'], true);
    }

    private function headingMap(array $headings): array
    {
        $map = [];

        foreach ($headings as $index => $heading) {
            $normalized = $this->normalizeHeading((string) $heading);

            if ($normalized !== '') {
                $map[$normalized] = $index;
            }
        }

        return $map;
    }

    private function normalizeHeading(string $heading): string
    {
        $heading = strtolower(trim($heading));
        $heading = preg_replace('/[^a-z0-9]+/', '_', $heading) ?? '';

        return trim($heading, '_');
    }

    private function mapRow(array $values, array $headingMap): array
    {
        $mapped = [];

        foreach (self::REQUIRED_COLUMNS as $column) {
            $mapped[$column] = $this->stringValue($values[$headingMap[$column]] ?? null);
        }

        $mapped['correct_answer'] = strtoupper($mapped['correct_answer']);

        return $mapped;
    }

    /**
     * @return array{reasons: array<int, string>, question_hash: string}
     */
    private function validateRow(array $row, ExamPackage $package, array $seenHashes): array
    {
        $reasons = [];
        $package->loadMissing('subject');

        foreach (['subject', 'package', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'point', 'difficulty'] as $field) {
            if (($row[$field] ?? '') === '') {
                $reasons[] = "Kolom {$field} wajib diisi.";
            }
        }

        if (! $this->sameLabel($row['subject'] ?? '', [$package->subject?->name, $package->subject?->code])) {
            $reasons[] = 'Subject pada baris tidak cocok dengan paket tujuan.';
        }

        if (! $this->sameLabel($row['package'] ?? '', [$package->title, $package->code])) {
            $reasons[] = 'Package pada baris tidak cocok dengan paket tujuan.';
        }

        $correct = $row['correct_answer'] ?? '';
        if (! in_array($correct, ['A', 'B', 'C', 'D', 'E'], true)) {
            $reasons[] = 'correct_answer harus A, B, C, D, atau E.';
        }

        if ($correct === 'E' && ($row['option_e'] ?? '') === '') {
            $reasons[] = 'option_e wajib diisi jika jawaban benar adalah E.';
        }

        if (! is_numeric($row['point'] ?? null) || (float) $row['point'] <= 0) {
            $reasons[] = 'point harus berupa angka positif.';
        }

        if (! in_array($this->normalizeDifficulty($row['difficulty'] ?? ''), ['easy', 'medium', 'hard'], true)) {
            $reasons[] = 'difficulty harus easy, medium, atau hard.';
        }

        if (! $this->isActiveValueValid($row['is_active'] ?? '')) {
            $reasons[] = 'is_active harus bernilai true/false, yes/no, 1/0, aktif/nonaktif, atau dikosongkan.';
        }

        $hash = hash('sha256', Str::lower(trim($row['question_text'] ?? '')) . '|' . $package->id);

        if (in_array($hash, $seenHashes, true)) {
            $reasons[] = 'Duplikat soal terdeteksi di file import.';
        }

        if (ExamQuestion::where('exam_package_id', $package->id)->where('question_hash', $hash)->exists()) {
            $reasons[] = 'Soal serupa sudah ada di paket ini.';
        }

        return [
            'reasons' => $reasons,
            'question_hash' => $hash,
        ];
    }

    private function sameLabel(string $value, array $allowed): bool
    {
        $value = Str::lower(trim($value));

        foreach ($allowed as $item) {
            if ($item !== null && $value === Str::lower(trim((string) $item))) {
                return true;
            }
        }

        return false;
    }

    private function normalizeDifficulty(string $value): string
    {
        return match (Str::lower(trim($value))) {
            'easy', 'mudah' => 'easy',
            'medium', 'sedang' => 'medium',
            'hard', 'sulit' => 'hard',
            default => '',
        };
    }

    private function isActiveValueValid(string $value): bool
    {
        return $value === '' || in_array(Str::lower(trim($value)), [
            '1', '0', 'true', 'false', 'yes', 'no', 'y', 'n', 'aktif', 'nonaktif',
        ], true);
    }

    private function parseActive(string $value): bool
    {
        $value = Str::lower(trim($value));

        if ($value === '') {
            return true;
        }

        return in_array($value, ['1', 'true', 'yes', 'y', 'aktif'], true);
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
