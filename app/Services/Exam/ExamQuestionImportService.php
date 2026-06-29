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

    private const COLUMN_ALIASES = [
        'nomor' => 'row_number',
        'teks_soal' => 'question_text',
        'opsi_a' => 'option_a',
        'opsi_b' => 'option_b',
        'opsi_c' => 'option_c',
        'opsi_d' => 'option_d',
        'opsi_e' => 'option_e',
        'jawaban_benar' => 'correct_answer',
        'poin' => 'point',
        'tingkat_kesulitan' => 'difficulty',
        'pembahasan' => 'explanation',
        'aktif' => 'is_active',
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
            $workbook = $this->reader->readDataSheet($path, self::MAX_ROWS);
            $headingMap = $this->headingMap($workbook['headings']);
            $missing = $this->missingColumns($headingMap, $workbook['package_config']);
            $examConfig = $this->normalizeExamConfig($workbook['exam_config']);
            $configFailures = $this->validateExamConfig($examConfig, $workbook['exam_config']);

            if ($missing !== [] || $configFailures !== []) {
                $batch->update([
                    'status' => ExamImportBatch::STATUS_FAILED,
                    'missing_columns' => $missing,
                    'failure_report' => [[
                        'row' => 1,
                        'reasons' => array_values(array_filter([
                            $missing !== [] ? 'Kolom wajib belum lengkap: ' . implode(', ', $missing) : null,
                            ...$configFailures,
                        ])),
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
            $scanned = 0;
            $seenHashes = [];
            $maxSort = (int) ExamQuestion::where('exam_package_id', $package->id)->max('sort_order');
            $packageConfigFailures = $this->validatePackageConfig($workbook['package_config'], $package);

            if ($packageConfigFailures !== []) {
                $failureReport = $this->withImportSummary([[
                    'row' => null,
                    'question_text' => null,
                    'reasons' => $packageConfigFailures,
                ]], $package, $workbook['package_config'], $examConfig);

                $batch->update([
                    'status' => ExamImportBatch::STATUS_FAILED,
                    'failure_report' => $failureReport,
                    'finished_at' => now(),
                ]);

                $this->audit->log('import_failed', [
                    'exam_package_id' => $package->id,
                    'metadata' => [
                        'batch_id' => $batch->id,
                        'reason' => 'package_metadata_mismatch',
                    ],
                ], $request);

                return $batch->fresh();
            }

            foreach ($workbook['rows'] as $row) {
                $mapped = $this->mapRow($row['values'], $headingMap);

                if ($this->isBlankQuestionRow($mapped)) {
                    continue;
                }

                $scanned++;
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
                'total_rows' => $scanned,
                'imported_rows' => $imported,
                'failed_rows' => count($failures),
                'failure_report' => $this->withImportSummary($failures, $package, $workbook['package_config'], $examConfig),
                'finished_at' => now(),
            ]);

            if ($configFailures === [] && $packageConfigFailures === [] && $examConfig !== []) {
                $package->update($this->packageUpdatesFromConfig($examConfig));
            }

            $this->audit->log('questions_imported', [
                'exam_package_id' => $package->id,
                'metadata' => [
                    'batch_id' => $batch->id,
                    'total_rows' => $scanned,
                    'imported_rows' => $imported,
                    'failed_rows' => count($failures),
                    'exam_config' => $examConfig,
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
        return [
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
        ];
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
            $normalized = self::COLUMN_ALIASES[$normalized] ?? $normalized;

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

        foreach ([...self::REQUIRED_COLUMNS, 'subject', 'package', 'row_number'] as $column) {
            $index = $headingMap[$column] ?? null;
            $mapped[$column] = $index === null ? '' : $this->stringValue($values[$index] ?? null);
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

        foreach (['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'point', 'difficulty'] as $field) {
            if (($row[$field] ?? '') === '') {
                $reasons[] = "Kolom {$field} wajib diisi.";
            }
        }

        if (($row['subject'] ?? '') !== '' && ! $this->sameLabel($row['subject'], [$package->subject?->name, $package->subject?->code])) {
            $reasons[] = 'Subject pada baris tidak cocok dengan paket tujuan.';
        }

        if (($row['package'] ?? '') !== '' && ! $this->sameLabel($row['package'], [$package->title, $package->code])) {
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

    private function missingColumns(array $headingMap, array $packageConfig): array
    {
        $missing = array_values(array_diff(self::REQUIRED_COLUMNS, array_keys($headingMap)));

        if ($packageConfig === []) {
            foreach (['subject', 'package'] as $legacyColumn) {
                if (! array_key_exists($legacyColumn, $headingMap)) {
                    $missing[] = $legacyColumn;
                }
            }
        }

        return $missing;
    }

    private function validatePackageConfig(array $config, ExamPackage $package): array
    {
        if ($config === []) {
            return [];
        }

        $package->loadMissing('subject');
        $reasons = [];

        if (($config['kode_paket'] ?? '') !== '' && ! $this->sameLabel($config['kode_paket'], [$package->code])) {
            $reasons[] = 'Kode paket pada file tidak cocok dengan paket tujuan.';
        }

        if (($config['judul_paket'] ?? '') !== '' && ! $this->sameLabel($config['judul_paket'], [$package->title])) {
            $reasons[] = 'Judul paket pada file tidak cocok dengan paket tujuan.';
        }

        if (($config['kategori'] ?? '') !== '' && ! $this->sameLabel($config['kategori'], [$package->subject?->name, $package->subject?->code])) {
            $reasons[] = 'Kategori pada file tidak cocok dengan paket tujuan.';
        }

        return $reasons;
    }

    private function normalizeExamConfig(array $config): array
    {
        if ($config === []) {
            return [];
        }

        return [
            'duration_minutes' => $config['durasi_menit'] ?? '',
            'passing_score' => $config['ambang_lulus_persen'] ?? '',
            'show_result_to_candidate' => $config['tampilkan_hasil'] ?? '',
            'allow_retake' => $config['izinkan_ujian_ulang'] ?? '',
        ];
    }

    private function validateExamConfig(array $config, array $rawConfig): array
    {
        if ($rawConfig === []) {
            return [];
        }

        $reasons = [];

        if (! is_numeric($config['duration_minutes'] ?? null) || (int) $config['duration_minutes'] < 5 || (int) $config['duration_minutes'] > 300) {
            $reasons[] = 'durasi_menit wajib berupa angka 5-300.';
        }

        if (! is_numeric($config['passing_score'] ?? null) || (float) $config['passing_score'] < 0 || (float) $config['passing_score'] > 100) {
            $reasons[] = 'ambang_lulus_persen wajib berupa angka 0-100.';
        }

        foreach (['show_result_to_candidate' => 'tampilkan_hasil', 'allow_retake' => 'izinkan_ujian_ulang'] as $key => $label) {
            if (! $this->isBooleanValueValid($config[$key] ?? '')) {
                $reasons[] = "{$label} harus bernilai ya/tidak, true/false, atau 1/0.";
            }
        }

        return $reasons;
    }

    private function packageUpdatesFromConfig(array $config): array
    {
        return [
            'duration_minutes' => (int) $config['duration_minutes'],
            'passing_score' => (float) $config['passing_score'],
            'show_result_to_candidate' => $this->parseBoolean($config['show_result_to_candidate']),
            'max_attempts' => $this->parseBoolean($config['allow_retake']) ? 2 : 1,
        ];
    }

    private function withImportSummary(array $failures, ExamPackage $package, array $packageConfig, array $examConfig): array
    {
        $summary = [
            'row' => null,
            'type' => 'summary',
            'question_text' => 'Ringkasan import',
            'reasons' => [
                'Kode paket terdeteksi: '.($packageConfig['kode_paket'] ?? $package->code ?? '-'),
                'Judul paket terdeteksi: '.($packageConfig['judul_paket'] ?? $package->title),
                'Durasi terdeteksi: '.($examConfig['duration_minutes'] ?? '-').' menit',
                'Ambang lulus terdeteksi: '.($examConfig['passing_score'] ?? '-').'%',
                'Tampilkan hasil: '.$this->displayBoolean($examConfig['show_result_to_candidate'] ?? null),
                'Izinkan ujian ulang: '.$this->displayBoolean($examConfig['allow_retake'] ?? null),
            ],
        ];

        return [$summary, ...$failures];
    }

    private function isBlankQuestionRow(array $row): bool
    {
        foreach (['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'correct_answer', 'point', 'difficulty', 'explanation'] as $field) {
            if (($row[$field] ?? '') !== '') {
                return false;
            }
        }

        return true;
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
            '1', '0', 'true', 'false', 'yes', 'no', 'y', 'n', 'ya', 'tidak', 'aktif', 'nonaktif',
        ], true);
    }

    private function parseActive(string $value): bool
    {
        $value = Str::lower(trim($value));

        if ($value === '') {
            return true;
        }

        return in_array($value, ['1', 'true', 'yes', 'y', 'ya', 'aktif'], true);
    }

    private function isBooleanValueValid(string $value): bool
    {
        return in_array(Str::lower(trim($value)), [
            '1', '0', 'true', 'false', 'yes', 'no', 'y', 'n', 'ya', 'tidak',
        ], true);
    }

    private function parseBoolean(string $value): bool
    {
        return in_array(Str::lower(trim($value)), ['1', 'true', 'yes', 'y', 'ya'], true);
    }

    private function displayBoolean(?string $value): string
    {
        if ($value === null || trim($value) === '') {
            return '-';
        }

        return $this->parseBoolean($value) ? 'ya' : 'tidak';
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
