<?php

namespace App\Http\Controllers\Dashboard\Admin\PublicExam;

use App\Http\Controllers\Controller;
use App\Models\SystemActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicExamPagesController extends Controller
{
    public function package(int $package): Response
    {
        $record = DB::table('exam_public_packages as package')
            ->join('exam_public_subjects as subject', 'subject.id', '=', 'package.exam_public_subject_id')
            ->where('package.id', $package)
            ->first(['package.*', 'subject.name as subject_name']);
        abort_unless($record, 404);

        return Inertia::render('Dashboard/Admin/PublicExam/PackageShow', [
            'examPackage' => $record,
            'imports' => SystemActivityLog::query()->where('module', 'public_exam')
                ->where('target_type', 'PublicExamPackage')->where('target_id', (string) $package)
                ->whereIn('action', ['public_exam.import.completed', 'public_exam.import.failed'])
                ->latest('id')->get(['id', 'actor_name', 'created_at', 'metadata']),
            'questions' => DB::table('exam_public_questions')->where('exam_public_package_id', $package)
                ->whereNull('deleted_at')->orderBy('sort_order')->orderBy('id')
                ->get(['id', 'question_text', 'options', 'correct_answer', 'point', 'is_active']),
            'sessions' => DB::table('exam_public_session_packages as assignment')
                ->join('exam_public_sessions as session', 'session.id', '=', 'assignment.exam_public_session_id')
                ->where('assignment.exam_public_package_id', $package)
                ->orderByDesc('session.id')->get(['session.id', 'session.title', 'session.status']),
        ]);
    }

    public function packages(): Response
    {
        $packages = DB::table('exam_public_packages as package')
            ->join('exam_public_subjects as subject', 'subject.id', '=', 'package.exam_public_subject_id')
            ->select('package.id', 'package.title', 'package.code', 'package.status', 'package.duration_minutes', 'package.passing_score', 'package.allow_retry', 'package.show_result_to_participant', 'package.exam_public_subject_id', 'subject.name as subject_name')
            ->selectSub(DB::table('exam_public_questions')->selectRaw('count(*)')->whereColumn('exam_public_package_id', 'package.id')->whereNull('deleted_at')->where('is_active', true), 'question_count')
            ->orderByDesc('package.id')->get();

        $subjects = DB::table('exam_public_subjects')->where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Dashboard/Admin/PublicExam/Packages', [
            'subjects' => $subjects,
            'packages' => $packages,
            'stats' => [
                'total' => $packages->count(),
                'published' => $packages->where('status', 'published')->count(),
                'total_questions' => (int) $packages->sum('question_count'),
                'total_subjects' => $subjects->count(),
            ],
        ]);
    }

    public function sessions(?int $session = null): Response
    {
        if ($session !== null) {
            abort_unless(DB::table('exam_public_sessions')->where('id', $session)->exists(), 404);
        }
        $sessions = DB::table('exam_public_sessions')->orderByDesc('id')
            ->when($session !== null, fn ($query) => $query->where('id', $session))
            ->get(['id', 'title', 'description', 'instructions', 'status', 'order_type', 'opens_at', 'closes_at', 'token_rotation_minutes']);

        $sessionIds = $sessions->pluck('id')->all();
        foreach ($sessions as $record) {
            app(\App\Services\Exam\PublicSessionTokenService::class)->current($record->id);
        }

        $sessionPackages = DB::table('exam_public_session_packages as sp')
            ->join('exam_public_packages as p', 'p.id', '=', 'sp.exam_public_package_id')
            ->join('exam_public_subjects as s', 's.id', '=', 'p.exam_public_subject_id')
            ->whereIn('sp.exam_public_session_id', $sessionIds)
            ->orderBy('sp.sort_order')
            ->get(['sp.exam_public_session_id', 'p.id', 'p.title', 'p.code', 's.name as subject_name'])
            ->groupBy('exam_public_session_id');

        $sessionTokens = DB::table('exam_public_session_tokens')
            ->whereIn('exam_public_session_id', $sessionIds)
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->orderByDesc('id')
            ->get()
            ->unique('exam_public_session_id')
            ->keyBy('exam_public_session_id');

        $participantCounts = DB::table('exam_public_participants')
            ->whereIn('exam_public_session_id', $sessionIds)
            ->select('exam_public_session_id', DB::raw('count(*) as count'))
            ->groupBy('exam_public_session_id')
            ->pluck('count', 'exam_public_session_id');

        $sessionsWithDetails = $sessions->map(function ($session) use ($sessionPackages, $sessionTokens, $participantCounts) {
            return [
                'id' => $session->id,
                'title' => $session->title,
                'description' => $session->description,
                'instructions' => $session->instructions,
                'status' => $session->status,
                'order_type' => $session->order_type,
                'opens_at' => \Carbon\Carbon::parse($session->opens_at, config('app.timezone'))->toIso8601String(),
                'closes_at' => \Carbon\Carbon::parse($session->closes_at, config('app.timezone'))->toIso8601String(),
                'packages' => $sessionPackages->get($session->id, collect())->values(),
                'active_token' => $session->status === 'published' && $session->closes_at > now() ? $sessionTokens->get($session->id)?->token : null,
                'token_rotation_minutes' => $session->token_rotation_minutes,
                'token_expires_at' => $sessionTokens->get($session->id)?->expires_at ? \Carbon\Carbon::parse($sessionTokens->get($session->id)->expires_at)->toIso8601String() : null,
                'participants_count' => (int) ($participantCounts->get($session->id) ?? 0),
            ];
        });

        $availablePackages = DB::table('exam_public_packages as package')
            ->join('exam_public_subjects as subject', 'subject.id', '=', 'package.exam_public_subject_id')
            ->where('package.status', 'published')->where('subject.is_active', true)
            ->whereNotNull('package.passing_score')->whereNotNull('package.allow_retry')->whereNotNull('package.show_result_to_participant')
            ->orderBy('subject.name')->get(['package.id', 'package.title', 'subject.name as subject_name', 'subject.id as subject_id']);

        return Inertia::render('Dashboard/Admin/PublicExam/Sessions', [
            'detailMode' => $session !== null,
            'examTimezone' => config('app.timezone'),
            'publicExamUrl' => app()->environment('local')
                ? url('/public-exam')
                : rtrim((string) config('app.url'), '/').'/public-exam',
            'sessions' => $sessionsWithDetails,
            'packages' => $availablePackages,
            'stats' => [
                'total' => $sessions->count(),
                'published' => $sessions->where('status', 'published')->count(),
                'available_packages' => $availablePackages->count(),
                'total_participants' => (int) $participantCounts->sum(),
            ],
        ]);
    }

    public function results(Request $request): Response
    {
        $request->validate([
            'session' => ['nullable', 'integer', 'exists:exam_public_sessions,id'],
            'status' => ['nullable', 'string'],
            'passed' => ['nullable', 'string', 'in:1,0'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $sessionId = $request->query('session');
        $status = $request->query('status');
        $passed = $request->query('passed');
        $search = $request->query('search');

        $query = DB::table('exam_public_participants as participant')
            ->join('exam_public_sessions as session', 'session.id', '=', 'participant.exam_public_session_id')
            ->when($sessionId, fn ($query) => $query->where('session.id', $sessionId))
            ->when($status, fn ($query) => $query->where('participant.status', $status))
            ->when($passed !== null && $passed !== '', fn ($query) => $query->where('participant.is_passed', (bool) $passed))
            ->when($search, function ($query) use ($search) {
                $term = '%'.trim($search).'%';
                $query->where(function ($sub) use ($term) {
                    $sub->where('participant.name', 'like', $term)
                        ->orWhere('participant.participant_code', 'like', $term)
                        ->orWhere('participant.school_origin', 'like', $term);
                });
            });

        $participants = (clone $query)
            ->orderByDesc('participant.id')
            ->paginate(25, ['participant.id', 'participant.participant_code', 'participant.name', 'participant.school_origin', 'participant.status', 'participant.average_score', 'participant.is_passed', 'participant.completed_at', 'participant.exam_public_session_id', 'session.title as session_title'])
            ->withQueryString();

        $sessionIds = $participants->getCollection()->pluck('exam_public_session_id')->unique();
        $assigned = DB::table('exam_public_session_packages as assignment')
            ->join('exam_public_packages as package', 'package.id', '=', 'assignment.exam_public_package_id')
            ->join('exam_public_subjects as subject', 'subject.id', '=', 'assignment.exam_public_subject_id')
            ->whereIn('assignment.exam_public_session_id', $sessionIds)
            ->orderBy('assignment.sort_order')
            ->get(['assignment.exam_public_session_id', 'assignment.exam_public_subject_id', 'package.title as package_title', 'package.passing_score', 'package.allow_retry', 'subject.name as subject_name'])
            ->groupBy('exam_public_session_id');
        $attempts = DB::table('exam_public_subject_attempts')
            ->whereIn('exam_public_participant_id', $participants->getCollection()->pluck('id'))
            ->orderBy('attempt_number')
            ->get(['exam_public_participant_id', 'exam_public_subject_id', 'attempt_number', 'attempt_type', 'status', 'percentage_score'])
            ->groupBy('exam_public_participant_id');

        $participants->getCollection()->transform(function ($participant) use ($assigned, $attempts) {
            $participant->is_passed = $participant->is_passed === null ? null : (bool) $participant->is_passed;
            $bySubject = $attempts->get($participant->id, collect())->groupBy('exam_public_subject_id');
            $participant->subjects = $assigned->get($participant->exam_public_session_id, collect())->map(function ($subject) use ($bySubject, $participant) {
                $history = $bySubject->get($subject->exam_public_subject_id, collect())
                    ->map(fn ($attempt) => [
                        'number' => $attempt->attempt_number,
                        'type' => $attempt->attempt_type,
                        'status' => $attempt->status,
                        'score' => $attempt->percentage_score === null ? null : (float) $attempt->percentage_score,
                    ])->values();
                $scores = $history->whereIn('status', ['submitted', 'auto_submitted'])->pluck('score')->filter(fn ($score) => $score !== null);
                $best = $scores->isEmpty() ? null : $scores->max();
                $below = $best !== null && $subject->passing_score !== null && $best <= (float) $subject->passing_score;

                return [
                    'name' => $subject->subject_name,
                    'package' => $subject->package_title,
                    'threshold' => $subject->passing_score === null ? null : (float) $subject->passing_score,
                    'allow_retry' => (bool) $subject->allow_retry,
                    'best' => $best,
                    'passed' => $best === null || $subject->passing_score === null ? null : ! $below,
                    'note' => $below ? ($participant->is_passed === null ? 'Nilai mapel rendah; hasil akhir belum tersedia.' : ($participant->is_passed ? 'Nilai mapel rendah; rata-rata akhir memenuhi ambang lulus.' : 'Nilai mapel rendah; rata-rata akhir belum memenuhi ambang lulus.')) : null,
                    'attempts' => $history,
                ];
            })->values();

            return $participant;
        });

        $baseStatsQuery = DB::table('exam_public_participants')
            ->when($sessionId, fn ($q) => $q->where('exam_public_session_id', $sessionId));

        $totalParticipants = (clone $baseStatsQuery)->count();
        $passedCount = (clone $baseStatsQuery)->where('is_passed', true)->count();
        $failedCount = (clone $baseStatsQuery)->where('is_passed', false)->count();
        $averageScore = (clone $baseStatsQuery)->whereNotNull('average_score')->avg('average_score');

        return Inertia::render('Dashboard/Admin/PublicExam/Results', [
            'participants' => $participants,
            'sessions' => DB::table('exam_public_sessions')->orderByDesc('id')->get(['id', 'title']),
            'selectedSession' => $sessionId ? (int) $sessionId : null,
            'filters' => [
                'session' => $sessionId ? (int) $sessionId : null,
                'status' => $status ?? '',
                'passed' => $passed ?? '',
                'search' => $search ?? '',
            ],
            'stats' => [
                'total' => $totalParticipants,
                'passed' => $passedCount,
                'failed' => $failedCount,
                'average_score' => $averageScore ? round((float) $averageScore, 1) : 0,
            ],
        ]);
    }
}
