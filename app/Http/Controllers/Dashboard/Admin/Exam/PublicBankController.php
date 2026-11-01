<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PublicBankController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'subjects' => DB::table('exam_public_subjects')->orderBy('name')->get(['id', 'name', 'code', 'is_active']),
            'packages' => DB::table('exam_public_packages as packages')
                ->join('exam_public_subjects as subjects', 'subjects.id', '=', 'packages.exam_public_subject_id')
                ->select('packages.id', 'packages.title', 'packages.code', 'packages.status', 'packages.duration_minutes', 'packages.exam_public_subject_id', 'subjects.name as subject_name')
                ->selectSub(DB::table('exam_public_questions')->selectRaw('count(*)')->whereColumn('exam_public_package_id', 'packages.id')->whereNull('deleted_at')->where('is_active', true), 'question_count')
                ->orderBy('subjects.name')->orderBy('packages.title')->get(),
        ]);
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
            'duration_minutes' => ['required', 'integer', 'between:5,300'],
            'randomize_questions' => ['sometimes', 'boolean'],
        ]);

        $id = DB::table('exam_public_packages')->insertGetId([
            ...$data, 'randomize_questions' => $data['randomize_questions'] ?? false,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['id' => $id], 201);
    }

    public function questions(int $package): JsonResponse
    {
        abort_unless(DB::table('exam_public_packages')->where('id', $package)->exists(), 404);

        return response()->json(['questions' => DB::table('exam_public_questions')
            ->where('exam_public_package_id', $package)->whereNull('deleted_at')
            ->orderBy('sort_order')->orderBy('id')->get(['id', 'question_text', 'options', 'correct_answer', 'point', 'is_active'])]);
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
            abort_unless(DB::table('exam_public_questions')->where('exam_public_package_id', $package)
                ->whereNull('deleted_at')->where('is_active', true)->count() === 10, 422, 'Paket harus berisi tepat 10 soal aktif.');

            DB::table('exam_public_packages')->where('id', $package)->update(['status' => 'published', 'updated_at' => now()]);

            return response()->json(['status' => 'published']);
        });
    }
}
