<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PublicSessionV2Controller extends Controller
{
    public function page(): Response
    {
        return Inertia::render('Dashboard/Admin/Exam/PublicExam');
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'sessions' => DB::table('exam_public_sessions')->latest('id')
                ->get(['id', 'title', 'status', 'order_type', 'opens_at', 'closes_at', 'passing_score']),
            'packages' => DB::table('exam_public_packages as package')
                ->join('exam_public_subjects as subject', 'subject.id', '=', 'package.exam_public_subject_id')
                ->where('package.status', 'published')->where('subject.is_active', true)
                ->whereNotNull('package.passing_score')->whereNotNull('package.allow_retry')->whereNotNull('package.show_result_to_participant')
                ->orderBy('subject.name')->get(['package.id', 'package.title', 'subject.name as subject_name', 'subject.id as subject_id']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1500'],
            'instructions' => ['nullable', 'string', 'max:5000'],
            'opens_at' => ['required', 'date'],
            'closes_at' => ['required', 'date', 'after:opens_at'],
            'order_type' => ['required', Rule::in(['free', 'sequential'])],
            'package_ids' => ['required', 'array', 'size:4'],
            'package_ids.*' => ['required', 'integer', 'distinct', Rule::exists('exam_public_packages', 'id')->where('status', 'published')],
        ]);

        $id = DB::transaction(function () use ($request, $data): int {
            $packages = DB::table('exam_public_packages as package')
                ->join('exam_public_subjects as subject', 'subject.id', '=', 'package.exam_public_subject_id')
                ->whereIn('package.id', $data['package_ids'])->where('package.status', 'published')
                ->where('subject.is_active', true)
                ->whereNotNull('package.passing_score')->whereNotNull('package.allow_retry')->whereNotNull('package.show_result_to_participant')
                ->get(['package.id', 'package.exam_public_subject_id']);
            abort_unless($packages->count() === 4 && $packages->unique('exam_public_subject_id')->count() === 4, 422, 'Pilih tepat satu paket dari empat mapel berbeda.');

            $sessionId = DB::table('exam_public_sessions')->insertGetId([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'instructions' => $data['instructions'] ?? null,
                'opens_at' => \Carbon\Carbon::parse($data['opens_at'])->setTimezone(config('app.timezone'))->toDateTimeString(),
                'closes_at' => \Carbon\Carbon::parse($data['closes_at'])->setTimezone(config('app.timezone'))->toDateTimeString(),
                'order_type' => $data['order_type'],
                'status' => 'draft',
                'created_by' => $request->user()->id,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            foreach ($data['package_ids'] as $order => $packageId) {
                DB::table('exam_public_session_packages')->insert([
                    'exam_public_session_id' => $sessionId,
                    'exam_public_package_id' => $packageId,
                    'exam_public_subject_id' => $packages->firstWhere('id', $packageId)->exam_public_subject_id,
                    'sort_order' => $order,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }

            return $sessionId;
        });

        return response()->json(['id' => $id, 'status' => 'draft'], 201);
    }

    public function show(int $session): JsonResponse
    {
        $record = DB::table('exam_public_sessions')->where('id', $session)->first();
        abort_unless($record, 404);

        return response()->json([
            'session' => $record,
            'packages' => DB::table('exam_public_session_packages as pivot')
                ->join('exam_public_packages as package', 'package.id', '=', 'pivot.exam_public_package_id')
                ->join('exam_public_subjects as subject', 'subject.id', '=', 'pivot.exam_public_subject_id')
                ->where('pivot.exam_public_session_id', $session)->orderBy('pivot.sort_order')
                ->get(['package.id', 'package.title', 'subject.name as subject_name', 'pivot.sort_order']),
            'tokens' => DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)
                ->orderByDesc('id')->get(['id', 'token', 'label', 'used_count', 'max_uses', 'expires_at']),
        ]);
    }

    public function publish(int $session): JsonResponse
    {
        return DB::transaction(function () use ($session): JsonResponse {
            $record = DB::table('exam_public_sessions')->where('id', $session)->lockForUpdate()->first();
            abort_unless($record && $record->status === 'draft', 403);
            abort_unless($record->closes_at > now() && DB::table('exam_public_session_packages as pivot')
                ->join('exam_public_packages as package', 'package.id', '=', 'pivot.exam_public_package_id')
                ->where('pivot.exam_public_session_id', $session)->where('package.status', 'published')
                ->whereNotNull('package.passing_score')->whereNotNull('package.allow_retry')->whereNotNull('package.show_result_to_participant')
                ->count() === 4, 422);

            DB::table('exam_public_sessions')->where('id', $session)->update(['status' => 'published', 'updated_at' => now()]);

            return response()->json(['status' => 'published']);
        });
    }

    public function updatePackages(Request $request, int $session): JsonResponse
    {
        $data = $request->validate([
            'package_ids' => ['required', 'array', 'size:4'],
            'package_ids.*' => ['required', 'integer', 'distinct', Rule::exists('exam_public_packages', 'id')->where('status', 'published')],
        ]);

        return DB::transaction(function () use ($session, $data): JsonResponse {
            $record = DB::table('exam_public_sessions')->where('id', $session)->lockForUpdate()->first();
            abort_unless($record && $record->status === 'draft', 409, 'Hanya sesi draft yang paketnya dapat diubah.');
            abort_if(DB::table('exam_public_participants as participant')
                ->join('exam_public_subject_attempts as attempt', 'attempt.exam_public_participant_id', '=', 'participant.id')
                ->where('participant.exam_public_session_id', $session)->exists(), 409, 'Sesi sudah memiliki pengerjaan peserta.');

            $packages = DB::table('exam_public_packages as package')
                ->join('exam_public_subjects as subject', 'subject.id', '=', 'package.exam_public_subject_id')
                ->whereIn('package.id', $data['package_ids'])->where('package.status', 'published')->where('subject.is_active', true)
                ->whereNotNull('package.passing_score')->whereNotNull('package.allow_retry')->whereNotNull('package.show_result_to_participant')
                ->get(['package.id', 'package.exam_public_subject_id']);
            abort_unless($packages->count() === 4 && $packages->unique('exam_public_subject_id')->count() === 4, 422, 'Pilih tepat satu paket dari empat jenis mapel berbeda.');

            DB::table('exam_public_session_tokens')->where('exam_public_session_id', $session)->delete();
            DB::table('exam_public_session_packages')->where('exam_public_session_id', $session)->delete();
            foreach ($data['package_ids'] as $order => $packageId) {
                DB::table('exam_public_session_packages')->insert([
                    'exam_public_session_id' => $session,
                    'exam_public_package_id' => $packageId,
                    'exam_public_subject_id' => $packages->firstWhere('id', $packageId)->exam_public_subject_id,
                    'sort_order' => $order,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }

            DB::table('exam_public_sessions')->where('id', $session)->update(['updated_at' => now()]);

            return response()->json(['updated' => true, 'tokens_revoked' => true]);
        });
    }

    public function close(int $session): JsonResponse
    {
        $updated = DB::table('exam_public_sessions')->where('id', $session)->where('status', 'published')
            ->update(['status' => 'closed', 'updated_at' => now()]);
        abort_unless($updated, 403);

        return response()->json(['status' => 'closed']);
    }

    public function token(Request $request, int $session): JsonResponse
    {
        $data = $request->validate([
            'label' => ['nullable', 'string', 'max:255'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
        ]);
        $record = DB::table('exam_public_sessions')->where('id', $session)->first();
        abort_unless($record && $record->status === 'published', 403);

        $code = Str::upper(Str::random(12));
        DB::table('exam_public_session_tokens')->insert([
            'exam_public_session_id' => $session,
            'token' => $code,
            'label' => $data['label'] ?? null,
            'max_uses' => $data['max_uses'] ?? null,
            'expires_at' => $record->closes_at,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['token' => $code], 201);
    }
}
