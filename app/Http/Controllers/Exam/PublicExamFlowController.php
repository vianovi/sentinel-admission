<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Services\Exam\PublicExamAttemptSubmissionService;
use App\Services\Exam\PublicExamResultService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PublicExamFlowController extends Controller
{
    public function __construct(
        private readonly PublicExamResultService $results,
        private readonly PublicExamAttemptSubmissionService $submissions,
    ) {}

    public function page(): Response
    {
        return Inertia::render('Public/Exam/PublicExam');
    }

    public function session(string $token): JsonResponse
    {
        $session = $this->validToken($token)->session;

        return response()->json(['session' => [
            'id' => $session->id,
            'title' => $session->title,
            'instructions' => $session->instructions,
            'order_type' => $session->order_type,
            'time_source' => $session->time_source ?? 'server',
        ]]);
    }

    public function join(Request $request, string $token): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'school_origin' => ['required', 'string', 'max:255'],
            'entry_key' => ['required', 'uuid'],
        ]);

        [$participantId, $secret] = DB::transaction(function () use ($token, $data): array {
            $sessionId = DB::table('exam_public_session_tokens')->where('token', $token)->value('exam_public_session_id');
            abort_unless($sessionId, 403, 'Token tidak berlaku. Minta token terbaru kepada pengawas.');
            $session = DB::table('exam_public_sessions')->where('id', $sessionId)->lockForUpdate()->first();
            $access = DB::table('exam_public_session_tokens')->where('token', $token)->lockForUpdate()->first();
            abort_unless($access, 403, 'Token telah berganti. Gunakan token terbaru.');
            abort_unless($session && $session->status === 'published'
                && $session->opens_at <= now() && $session->closes_at > now()
                && (! $access->expires_at || $access->expires_at > now())
                && ($access->max_uses === null || $access->used_count < $access->max_uses), 403);
            $packageCount = DB::table('exam_public_session_packages')->where('exam_public_session_id', $session->id)->count();
            abort_unless($packageCount >= 1 && $packageCount <= 5 && DB::table('exam_public_session_packages as assignment')
                ->join('exam_public_packages as package', 'package.id', '=', 'assignment.exam_public_package_id')
                ->where('assignment.exam_public_session_id', $session->id)
                ->whereNotNull('package.passing_score')->whereNotNull('package.allow_retry')->whereNotNull('package.show_result_to_participant')
                ->count() === $packageCount, 422, 'Pengaturan paket sesi belum lengkap.');

            $secret = hash_hmac('sha256', 'public-exam:'.$session->id.':'.$data['entry_key'], config('app.key'));
            $person = DB::table('exam_public_participants')->where('session_secret', hash('sha256', $secret))->lockForUpdate()->first();
            if ($person) {
                return [$person->id, $secret];
            }

            $participantId = DB::table('exam_public_participants')->insertGetId([
                'exam_public_session_id' => $session->id,
                'exam_public_session_token_id' => $access->id,
                'participant_code' => Str::upper(Str::random(16)),
                'name' => $data['name'], 'school_origin' => $data['school_origin'],
                'session_secret' => hash('sha256', $secret),
                'started_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('exam_public_session_tokens')->where('id', $access->id)->increment('used_count');

            return [$participantId, $secret];
        }, 3);

        return response()->json(['participant_id' => $participantId])
            ->cookie(cookie('public_exam_session', $secret, 300, '/', null, $request->isSecure(), true, false, 'strict'));
    }

    public function dashboard(Request $request, int $participant): JsonResponse
    {
        $person = $this->participant($request, $participant);
        $session = DB::table('exam_public_sessions')->where('id', $person->exam_public_session_id)->first();
        $packages = DB::table('exam_public_session_packages as pivot')
            ->join('exam_public_packages as package', 'package.id', '=', 'pivot.exam_public_package_id')
            ->join('exam_public_subjects as subject', 'subject.id', '=', 'pivot.exam_public_subject_id')
            ->where('pivot.exam_public_session_id', $session->id)->orderBy('pivot.sort_order')
            ->get(['package.id', 'package.title', 'subject.name as subject_name', 'subject.id as subject_id']);

        $result = $this->results->refresh($person->id);

        return response()->json([
            'participant' => ['id' => $person->id, 'name' => $person->name, 'school_origin' => $person->school_origin],
            'session' => ['title' => $session->title, 'order_type' => $session->order_type, 'time_source' => $session->time_source ?? 'server'],
            'packages' => $packages,
            'attempts' => DB::table('exam_public_subject_attempts')->where('exam_public_participant_id', $person->id)
                ->get(['id', 'exam_public_subject_id', 'attempt_type', 'status', 'expires_at'])
                ->map(fn (object $attempt): array => [
                    'id' => $attempt->id,
                    'exam_public_subject_id' => $attempt->exam_public_subject_id,
                    'attempt_type' => $attempt->attempt_type,
                    'status' => $attempt->status,
                    'expires_at' => \Carbon\Carbon::parse($attempt->expires_at, config('app.timezone'))->toISOString(),
                ]),
            'result' => [
                'completed' => $result['completed'],
                'subjects' => collect($result['subjects'])->map(fn (array $subject): array => [
                    'subject_id' => $subject['subject_id'],
                    'primary_score' => $subject['show_result_to_participant'] ? $subject['primary_score'] : null,
                    'remedial_score' => $subject['show_result_to_participant'] ? $subject['remedial_score'] : null,
                    'remedial_available' => $subject['remedial_available'],
                ])->all(),
            ],
        ]);
    }

    public function start(Request $request, int $participant, int $package): JsonResponse
    {
        $this->participant($request, $participant);

        $attemptId = DB::transaction(function () use ($participant, $package): int {
            $person = DB::table('exam_public_participants')->where('id', $participant)->firstOrFail();
            $session = DB::table('exam_public_sessions')->where('id', $person->exam_public_session_id)->lockForUpdate()->first();
            abort_unless($session && $session->status === 'published' && $session->opens_at <= now() && $session->closes_at > now(), 403);
            $person = DB::table('exam_public_participants')->where('id', $participant)->lockForUpdate()->firstOrFail();
            $assignment = DB::table('exam_public_session_packages as pivot')
                ->join('exam_public_packages as package', 'package.id', '=', 'pivot.exam_public_package_id')
                ->join('exam_public_subjects as subject', 'subject.id', '=', 'pivot.exam_public_subject_id')
                ->where('pivot.exam_public_session_id', $session->id)->where('pivot.exam_public_package_id', $package)
                ->where('package.status', 'published')->where('subject.is_active', true)
                ->first(['pivot.exam_public_subject_id', 'pivot.sort_order', 'package.duration_minutes', 'package.randomize_questions']);
            abort_unless($assignment, 403);
            abort_unless(DB::table('exam_public_packages')->where('id', $package)->whereNotNull('passing_score')
                ->whereNotNull('allow_retry')->whereNotNull('show_result_to_participant')->exists(), 422, 'Pengaturan paket belum lengkap.');

            $attempts = DB::table('exam_public_subject_attempts')->where('exam_public_participant_id', $participant)->get();
            $active = $attempts->first(fn ($attempt) => $attempt->status === 'in_progress' && $attempt->expires_at > now());
            if ($active) {
                abort_unless((int) $active->exam_public_package_id === $package, 409, 'Selesaikan mapel yang sedang dikerjakan.');

                return (int) $active->id;
            }
            abort_unless($attempts->every(fn ($attempt) => $attempt->status !== 'in_progress'), 409, 'Kumpulkan mapel yang waktunya habis sebelum melanjutkan.');

            $primary = $attempts->first(fn ($attempt) => (int) $attempt->exam_public_subject_id === (int) $assignment->exam_public_subject_id && $attempt->attempt_type === 'primary');
            $result = $primary ? $this->results->refresh($participant) : null;
            $subject = $result ? collect($result['subjects'])->firstWhere('subject_id', (int) $assignment->exam_public_subject_id) : null;
            abort_if($primary && ! ($subject['remedial_available'] ?? false), 403, 'Remedial tidak tersedia.');

            if ($session->order_type === 'sequential' && ! $primary) {
                $previous = DB::table('exam_public_session_packages')->where('exam_public_session_id', $session->id)
                    ->where('sort_order', '<', $assignment->sort_order)->pluck('exam_public_subject_id');
                foreach ($previous as $subjectId) {
                    abort_unless($attempts->contains(fn ($attempt) => (int) $attempt->exam_public_subject_id === (int) $subjectId
                        && $attempt->attempt_type === 'primary' && in_array($attempt->status, ['submitted', 'auto_submitted'], true)), 403, 'Selesaikan mapel sebelumnya.');
                }
            }

            $questions = DB::table('exam_public_questions')->where('exam_public_package_id', $package)->where('is_active', true)
                ->whereNull('deleted_at')->orderBy('sort_order')->orderBy('id')->get(['id', 'point']);
            abort_if($questions->isEmpty(), 422, 'Paket belum memiliki soal aktif.');
            $questionIds = $questions->pluck('id');
            if ($assignment->randomize_questions) {
                $questionIds = $questionIds->shuffle();
            }

            return DB::table('exam_public_subject_attempts')->insertGetId([
                'exam_public_participant_id' => $participant,
                'exam_public_package_id' => $package,
                'exam_public_subject_id' => $assignment->exam_public_subject_id,
                'attempt_type' => $primary ? 'remedial' : 'primary',
                'attempt_number' => $primary ? $attempts->where('exam_public_subject_id', $assignment->exam_public_subject_id)->count() + 1 : 1,
                'started_at' => now(),
                'expires_at' => now()->addMinutes($assignment->duration_minutes)->min(\Carbon\Carbon::parse($session->closes_at)),
                'question_order' => json_encode($questionIds->values()->all(), JSON_THROW_ON_ERROR),
                'total_questions' => $questions->count(),
                'max_score' => $questions->sum('point'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json(['attempt_id' => $attemptId]);
    }

    public function attempt(Request $request, int $attempt): JsonResponse
    {
        $record = $this->attemptFor($request, $attempt);
        $questions = collect();
        if ($record->status === 'in_progress' && $record->expires_at > now()) {
            $ids = collect(json_decode($record->question_order, true, 512, JSON_THROW_ON_ERROR));
            $questions = DB::table('exam_public_questions')->whereIn('id', $ids)->where('exam_public_package_id', $record->exam_public_package_id)
                ->get(['id', 'question_text', 'options'])->sortBy(fn ($question) => $ids->search($question->id))->values()
                ->map(fn ($question) => ['id' => $question->id, 'question_text' => $question->question_text, 'options' => json_decode($question->options, true)]);
        }

        return response()->json([
            'attempt' => [
                'id' => $record->id,
                'status' => $record->status,
                'expires_at' => \Carbon\Carbon::parse($record->expires_at, config('app.timezone'))->toISOString(),
                'total_questions' => $record->total_questions,
                'violations_count' => $record->violations_count,
            ],
            'questions' => $questions,
            'answers' => DB::table('exam_public_attempt_answers')->where('exam_public_subject_attempt_id', $attempt)
                ->get(['exam_public_question_id', 'selected_option']),
        ]);
    }

    public function answer(Request $request, int $attempt): JsonResponse
    {
        $this->attemptFor($request, $attempt);
        $data = $request->validate([
            'question_id' => ['required', 'integer'],
            'selected_option' => ['nullable', Rule::in(['A', 'B', 'C', 'D', 'E'])],
        ]);

        DB::transaction(function () use ($attempt, $data): void {
            $record = DB::table('exam_public_subject_attempts')->where('id', $attempt)->lockForUpdate()->firstOrFail();
            abort_unless($record->status === 'in_progress' && $record->expires_at > now(), 423);
            $ids = json_decode($record->question_order, true, 512, JSON_THROW_ON_ERROR);
            abort_unless(in_array($data['question_id'], $ids, true), 422);
            $question = DB::table('exam_public_questions')->where('id', $data['question_id'])
                ->where('exam_public_package_id', $record->exam_public_package_id)->first(['options']);
            abort_unless($question, 422);
            $option = $data['selected_option'] ?? null;
            abort_unless($option === null || array_key_exists($option, json_decode($question->options, true, 512, JSON_THROW_ON_ERROR)), 422);
            DB::table('exam_public_attempt_answers')->updateOrInsert(
                ['exam_public_subject_attempt_id' => $attempt, 'exam_public_question_id' => $data['question_id']],
                ['selected_option' => $option, 'saved_at' => now(), 'updated_at' => now()]
            );
        });

        return response()->json(['saved' => true]);
    }

    public function submit(Request $request, int $attempt): JsonResponse
    {
        $record = $this->attemptFor($request, $attempt);
        $this->submissions->submit($record->id);

        return response()->json(['submitted' => true]);
    }

    public function violation(Request $request, int $attempt): JsonResponse
    {
        $this->attemptFor($request, $attempt);
        $data = $request->validate([
            'type' => ['required', Rule::in(['exit_fullscreen', 'tab_switch'])],
        ]);

        $count = DB::transaction(function () use ($attempt, $data): int {
            $record = DB::table('exam_public_subject_attempts')->where('id', $attempt)->lockForUpdate()->firstOrFail();
            abort_unless($record->status === 'in_progress' && $record->expires_at > now(), 423, 'Ujian sudah dikunci.');
            $metadata = json_decode($record->metadata ?: '{}', true) ?: [];
            $metadata['violations_log'][] = ['type' => $data['type'], 'at' => now()->toISOString()];
            $count = $record->violations_count + 1;

            DB::table('exam_public_subject_attempts')->where('id', $record->id)->update([
                'violations_count' => $count,
                'metadata' => json_encode($metadata, JSON_THROW_ON_ERROR),
                'updated_at' => now(),
            ]);

            return $count;
        });

        return response()->json(['violations_count' => $count]);
    }

    private function validToken(string $token): object
    {
        $access = DB::table('exam_public_session_tokens')->where('token', $token)->first();
        abort_unless($access, 404);
        $session = DB::table('exam_public_sessions')->where('id', $access->exam_public_session_id)->first();
        abort_unless($session && $session->status === 'published' && $session->opens_at <= now() && $session->closes_at > now()
            && (! $access->expires_at || $access->expires_at > now())
            && ($access->max_uses === null || $access->used_count < $access->max_uses), 404);
        $access->session = $session;

        return $access;
    }

    private function participant(Request $request, int $id): object
    {
        $person = DB::table('exam_public_participants')->where('id', $id)->first();
        $secret = $request->cookie('public_exam_session') ?? $request->header('X-Public-Exam-Session');
        abort_unless($person && is_string($secret) && strlen($secret) === 64
            && hash_equals($person->session_secret, hash('sha256', $secret)), 403);

        return $person;
    }

    private function attemptFor(Request $request, int $id): object
    {
        $attempt = DB::table('exam_public_subject_attempts')->where('id', $id)->first();
        abort_unless($attempt, 404);
        $this->participant($request, $attempt->exam_public_participant_id);

        return $attempt;
    }
}
