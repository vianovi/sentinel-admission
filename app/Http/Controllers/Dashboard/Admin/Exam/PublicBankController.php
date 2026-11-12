<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use App\Imports\Exam\ExamQuestionWorkbookReader;
use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamSubject;
use App\Models\SystemActivityLog;
use App\Services\Exam\ExamPackageTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PublicBankController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'subjects' => DB::table('exam_public_subjects')->orderBy('name')->get(['id', 'name', 'code', 'is_active']),
            'packages' => DB::table('exam_public_packages as packages')
                ->join('exam_public_subjects as subjects', 'subjects.id', '=', 'packages.exam_public_subject_id')
                ->select('packages.id', 'packages.title', 'packages.code', 'packages.status', 'packages.duration_minutes', 'packages.passing_score', 'packages.allow_retry', 'packages.show_result_to_participant', 'packages.exam_public_subject_id', 'subjects.name as subject_name')
                ->selectSub(DB::table('exam_public_questions')->selectRaw('count(*)')->whereColumn('exam_public_package_id', 'packages.id')->whereNull('deleted_at')->where('is_active', true), 'question_count')
                ->orderBy('subjects.name')->orderBy('packages.title')->get(),
        ]);
    }

    public function downloadTemplate(int $package, ExamPackageTemplateService $templateService): BinaryFileResponse|HttpResponse
    {
        $record = DB::table('exam_public_packages as package')
            ->join('exam_public_subjects as subject', 'subject.id', '=', 'package.exam_public_subject_id')
            ->where('package.id', $package)
            ->first(['package.id', 'package.title', 'package.code', 'package.status', 'subject.name as subject_name']);
        abort_unless($record, 404);

        $templatePackage = (new ExamPackage)->forceFill([
            'id' => $record->id,
            'title' => $record->title,
            'code' => $record->code,
            'status' => $record->status,
            'description' => '-',
        ])->setRelation('subject', (new ExamSubject)->forceFill(['name' => $record->subject_name]));

        try {
            $template = $templateService->generate($templatePackage);
        } catch (\Throwable $exception) {
            Log::error('Public exam package template download failed', ['package_id' => $package, 'error' => $exception->getMessage()]);

            return response('Template soal belum dapat dibuat. Periksa dukungan XLSX/ZIP di server lalu coba lagi.', 503, [
                'Content-Type' => 'text/plain; charset=UTF-8',
                'X-Content-Type-Options' => 'nosniff',
            ]);
        }

        $filename = 'paket-soal-'.trim(Str::slug($record->code).'-'.Str::slug($record->title), '-').'.xlsx';

        return response()->download($template['path'], $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function storeSubject(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'alpha_dash', 'max:50', Rule::unique('exam_public_subjects', 'code')],
        ]);

        $id = DB::table('exam_public_subjects')->insertGetId([
            ...$data, 'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['id' => $id], 201);
    }

    public function storePackage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'exam_public_subject_id' => ['required', 'integer', Rule::exists('exam_public_subjects', 'id')->where('is_active', true)],
            'title' => ['required', 'string', 'max:255'],
            'code' => ['required', 'alpha_dash', 'max:80', Rule::unique('exam_public_packages', 'code')],
            'duration_minutes' => ['sometimes', 'integer', 'between:5,300'],
            'randomize_questions' => ['sometimes', 'boolean'],
        ]);

        $id = DB::table('exam_public_packages')->insertGetId([
            ...$data, 'randomize_questions' => $data['randomize_questions'] ?? false,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['id' => $id], 201);
    }

    public function updatePackage(Request $request, int $package): JsonResponse
    {
        $data = $request->validate([
            'passing_score' => ['required', 'numeric', 'between:0,100'],
            'allow_retry' => ['required', 'boolean'],
            'show_result_to_participant' => ['required', 'boolean'],
        ]);

        $record = DB::table('exam_public_packages')->where('id', $package)->first();
        abort_unless($record, 404);
        abort_if(DB::table('exam_public_subject_attempts')->where('exam_public_package_id', $package)->exists(), 409, 'Pengaturan paket yang sudah dikerjakan tidak boleh diubah.');
        abort_if(DB::table('exam_public_session_packages as assignment')
            ->join('exam_public_participants as participant', 'participant.exam_public_session_id', '=', 'assignment.exam_public_session_id')
            ->where('assignment.exam_public_package_id', $package)->whereNotNull('participant.started_at')->exists(), 409, 'Pengaturan paket dalam sesi yang sudah dimulai tidak boleh diubah.');

        DB::table('exam_public_packages')->where('id', $package)->update([...$data, 'updated_at' => now()]);

        return response()->json(['updated' => true]);
    }

    public function questions(int $package): JsonResponse
    {
        abort_unless(DB::table('exam_public_packages')->where('id', $package)->exists(), 404);

        return response()->json(['questions' => DB::table('exam_public_questions')
            ->where('exam_public_package_id', $package)->whereNull('deleted_at')
            ->orderBy('sort_order')->orderBy('id')->get(['id', 'question_text', 'options', 'correct_answer', 'point', 'is_active'])]);
    }

    public function importQuestions(Request $request, int $package, ExamQuestionWorkbookReader $reader): JsonResponse
    {
        abort_unless(DB::table('exam_public_packages')->where('id', $package)->exists(), 404);
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx', 'max:5120']]);
        $filename = mb_substr($request->file('file')?->getClientOriginalName() ?? 'Tanpa file', 0, 255);

        try {
            return DB::transaction(function () use ($request, $package, $reader, $filename): JsonResponse {
                $response = $this->importWorkbook($request, $package, $reader);
                SystemActivityLog::log('public_exam.import.completed', 'public_exam', 'Import soal publik berhasil.', $filename,
                    ['filename' => $filename, 'status' => 'completed', ...$response->getData(true), 'errors' => []],
                    'PublicExamPackage', (string) $package);

                return $response;
            });
        } catch (ValidationException $exception) {
            SystemActivityLog::log('public_exam.import.failed', 'public_exam', 'Import soal publik ditolak; tidak ada soal disimpan.', $filename,
                ['filename' => $filename, 'status' => 'failed', 'imported' => 0, 'active' => 0, 'errors' => $exception->errors()],
                'PublicExamPackage', (string) $package);

            throw $exception;
        }
    }

    private function importWorkbook(Request $request, int $package, ExamQuestionWorkbookReader $reader): JsonResponse
    {
        $file = $request->file('file');
        abort_unless($file && $file->isValid(), 422);
        $signature = file_get_contents($file->getRealPath(), false, null, 0, 4);
        abort_unless($signature === "PK\x03\x04", 422, 'File bukan XLSX yang valid.');

        try {
            $book = $reader->readDataSheet($file->getRealPath(), 2001);
        } catch (\Throwable) {
            throw ValidationException::withMessages(['file' => 'File XLSX tidak dapat dibaca.']);
        }

        $settings = $book['exam_config'];
        $meta = $book['package_config'];
        $headings = array_map(fn ($value) => strtolower(trim((string) $value)), $book['headings']);
        $required = ['teks_soal', 'opsi_a', 'opsi_b', 'opsi_c', 'jawaban_benar', 'poin', 'aktif'];
        $missing = array_diff($required, $headings);
        if ($missing || count($headings) !== count(array_unique($headings)) || count($book['rows']) === 0 || count($book['rows']) > 2000) {
            throw ValidationException::withMessages(['file' => 'Header tidak lengkap atau jumlah baris soal harus 1–2000.']);
        }

        $duration = $settings['durasi_menit'] ?? null;
        $threshold = $settings['ambang_lulus_persen'] ?? null;
        $boolean = ['ya' => true, 'tidak' => false, 'yes' => true, 'no' => false, 'true' => true, 'false' => false, '1' => true, '0' => false];
        $show = $boolean[strtolower($settings['tampilkan_hasil'] ?? '')] ?? null;
        $retry = $boolean[strtolower($settings['izinkan_ujian_ulang'] ?? '')] ?? null;
        if (! is_numeric($duration) || (float) $duration != (int) $duration || (int) $duration < 5 || (int) $duration > 300 || ! is_numeric($threshold) || (float) $threshold < 0 || (float) $threshold > 100 || $show === null || $retry === null) {
            throw ValidationException::withMessages(['file' => 'Konfigurasi ujian (durasi, ambang, tampilkan hasil, izin ulang) tidak valid.']);
        }

        $questions = [];
        foreach ($book['rows'] as $row) {
            $values = array_combine($headings, array_map(static function ($value): string {
                return $value instanceof \DateTimeInterface ? $value->format('Y-m-d H:i:s') : (is_scalar($value) ? trim((string) $value) : '');
            }, array_slice(array_pad($row['values'], count($headings), ''), 0, count($headings))));
            $text = trim((string) ($values['teks_soal'] ?? ''));
            if ($text === '' && trim((string) ($values['jawaban_benar'] ?? '')) === '') {
                continue;
            }
            $options = [];
            foreach (['a', 'b', 'c', 'd', 'e'] as $letter) {
                $value = trim((string) ($values['opsi_'.$letter] ?? ''));
                if ($value !== '') {
                    $options[strtoupper($letter)] = $value;
                }
            }
            $correct = strtoupper(trim((string) ($values['jawaban_benar'] ?? '')));
            $active = $boolean[strtolower(trim((string) ($values['aktif'] ?? '')))] ?? null;
            $point = $values['poin'] ?? null;
            if ($text === '' || mb_strlen($text) > 20000 || count($options) < 2 || collect($options)->contains(fn ($value) => mb_strlen($value) > 5000) || ! isset($options[$correct]) || ! is_numeric($point) || (float) $point <= 0 || (float) $point > 9999 || $active === null) {
                throw ValidationException::withMessages(['file' => 'Soal pada baris '.$row['row_number'].' tidak valid; tidak ada data yang diimpor.']);
            }
            $questions[] = [
                'exam_public_package_id' => $package,
                'question_text' => $text,
                'options' => json_encode($options, JSON_THROW_ON_ERROR),
                'correct_answer' => $correct,
                'point' => $point,
                'is_active' => $active,
                'sort_order' => count($questions) + 1,
                'created_at' => now(), 'updated_at' => now(),
            ];
        }
        if ($questions === [] || ! collect($questions)->contains('is_active', true)) {
            throw ValidationException::withMessages(['file' => 'File harus memiliki setidaknya satu soal aktif.']);
        }

        return DB::transaction(function () use ($package, $meta, $duration, $threshold, $show, $retry, $questions): JsonResponse {
            $record = DB::table('exam_public_packages as package')
                ->join('exam_public_subjects as subject', 'subject.id', '=', 'package.exam_public_subject_id')
                ->where('package.id', $package)
                ->lockForUpdate()
                ->first(['package.id', 'package.code', 'package.title', 'package.status', 'subject.name as subject_name']);
            abort_unless($record, 404);
            abort_unless($record->status === 'draft', 409, 'Paket harus draft sebelum import.');
            foreach (['kode_paket' => $record->code, 'judul_paket' => $record->title, 'kategori' => $record->subject_name] as $key => $expected) {
                if (mb_strtolower(trim((string) ($meta[$key] ?? ''))) !== mb_strtolower(trim((string) $expected))) {
                    throw ValidationException::withMessages(['file' => "{$key} tidak cocok dengan paket/jenis mapel tujuan. Perbaiki file XLSX sebelum import."]);
                }
            }
            abort_if(DB::table('exam_public_questions')->where('exam_public_package_id', $package)->exists(), 409, 'Bank soal paket tidak kosong; import ditolak agar soal tidak tertimpa atau terduplikasi.');
            abort_if(DB::table('exam_public_subject_attempts')->where('exam_public_package_id', $package)->exists(), 409);

            DB::table('exam_public_questions')->insert($questions);
            DB::table('exam_public_packages')->where('id', $package)->update([
                'duration_minutes' => (int) $duration,
                'passing_score' => (float) $threshold,
                'show_result_to_participant' => $show,
                'allow_retry' => $retry,
                'updated_at' => now(),
            ]);

            return response()->json(['imported' => count($questions), 'active' => collect($questions)->where('is_active', true)->count()]);
        });
    }

    public function storeQuestion(Request $request, int $package): JsonResponse
    {
        $data = $request->validate([
            'question_text' => ['required', 'string', 'max:20000'],
            'options' => ['required', 'array:A,B,C,D,E', 'min:2', 'max:5'],
            'options.*' => ['required', 'string', 'max:5000'],
            'correct_answer' => ['required', Rule::in(['A', 'B', 'C', 'D', 'E'])],
            'point' => ['required', 'numeric', 'gt:0', 'max:9999'],
        ]);
        abort_unless(DB::table('exam_public_packages')->where('id', $package)->where('status', 'draft')->exists(), 403);
        abort_if(DB::table('exam_public_subject_attempts')->where('exam_public_package_id', $package)->exists(), 409);
        abort_unless(array_key_exists($data['correct_answer'], $data['options']), 422, 'Jawaban benar harus ada dalam pilihan.');

        $id = DB::table('exam_public_questions')->insertGetId([
            'exam_public_package_id' => $package,
            'question_text' => $data['question_text'],
            'options' => json_encode($data['options'], JSON_THROW_ON_ERROR),
            'correct_answer' => $data['correct_answer'],
            'point' => $data['point'],
            'sort_order' => DB::table('exam_public_questions')->where('exam_public_package_id', $package)->max('sort_order') + 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['id' => $id], 201);
    }

    public function publish(int $package): JsonResponse
    {
        return DB::transaction(function () use ($package): JsonResponse {
            $record = DB::table('exam_public_packages')->where('id', $package)->lockForUpdate()->first();
            abort_unless($record && $record->status === 'draft', 403);
            abort_unless($record->passing_score !== null && $record->allow_retry !== null && $record->show_result_to_participant !== null, 422, 'Lengkapi pengaturan penilaian paket.');
            $activeQuestionCount = DB::table('exam_public_questions')
                ->where('exam_public_package_id', $package)->whereNull('deleted_at')->where('is_active', true)->count();
            abort_unless($activeQuestionCount > 0, 422, 'Paket harus memiliki setidaknya satu soal aktif.');

            DB::table('exam_public_packages')->where('id', $package)->update(['status' => 'published', 'updated_at' => now()]);

            return response()->json(['status' => 'published']);
        });
    }

    public function destroyPackage(int $package): JsonResponse
    {
        return DB::transaction(function () use ($package): JsonResponse {
            $record = DB::table('exam_public_packages')->where('id', $package)->lockForUpdate()->first();
            abort_unless($record, 404);
            $sessions = DB::table('exam_public_session_packages')
                ->where('exam_public_package_id', $package)->pluck('exam_public_session_id');
            DB::table('exam_public_sessions')->whereIn('id', $sessions)->orderBy('id')->lockForUpdate()->get();
            abort_if(DB::table('exam_public_participants')->whereIn('exam_public_session_id', $sessions)
                ->whereNotNull('started_at')->exists(), 409, 'Peserta sudah masuk ke sesi terkait; paket tidak boleh dihapus.');
            abort_if(DB::table('exam_public_subject_attempts')->where('exam_public_package_id', $package)->exists(), 409, 'Paket sudah memiliki pengerjaan peserta.');
            abort_if(DB::table('exam_public_subject_attempts as attempt')
                ->join('exam_public_participants as participant', 'participant.id', '=', 'attempt.exam_public_participant_id')
                ->whereIn('participant.exam_public_session_id', $sessions)->exists(), 409, 'Sesi terkait sudah memiliki pengerjaan peserta.');

            DB::table('exam_public_session_tokens')->whereIn('exam_public_session_id', $sessions)->delete();
            DB::table('exam_public_sessions')->whereIn('id', $sessions)->update(['status' => 'draft', 'updated_at' => now()]);
            DB::table('exam_public_session_packages')->where('exam_public_package_id', $package)->delete();
            DB::table('exam_public_questions')->where('exam_public_package_id', $package)->delete();
            DB::table('exam_public_packages')->where('id', $package)->delete();

            return response()->json(['deleted' => true, 'sessions_reset' => $sessions->count()]);
        });
    }
}
