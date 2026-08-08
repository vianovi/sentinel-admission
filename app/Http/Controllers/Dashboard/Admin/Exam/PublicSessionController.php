<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\StoreExamSessionRequest;
use App\Models\AdmissionWave;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionToken;
use App\Services\Exam\ExamAuditLogger;
use App\Services\Exam\ExamSessionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PublicSessionController extends Controller
{
    public function __construct(
        private readonly ExamAuditLogger $audit,
        private readonly ExamSessionService $sessionService
    ) {}

    public function index(Request $request): Response
    {
        $selectedSessionId = $request->query('session_id');

        $publicSessions = ExamSession::query()
            ->with(['package:id,title,code', 'tokens' => fn ($q) => $q->latest()])
            ->withCount(['attempts'])
            ->where('is_public', true)
            ->latest()
            ->get();

        $activeSession = $selectedSessionId
            ? $publicSessions->firstWhere('id', (int) $selectedSessionId) ?? $publicSessions->first()
            : $publicSessions->first();

        $attempts = collect();
        $tokens = collect();
        $stats = [
            'total_participants' => 0,
            'in_progress' => 0,
            'submitted' => 0,
            'avg_score' => 0,
        ];

        if ($activeSession) {
            $attemptsQuery = ExamAttempt::query()
                ->where('exam_session_id', $activeSession->id);

            $stats['total_participants'] = (int) $attemptsQuery->count();
            $stats['in_progress'] = (int) (clone $attemptsQuery)->where('status', ExamAttempt::STATUS_IN_PROGRESS)->count();
            $stats['submitted'] = (int) (clone $attemptsQuery)->whereIn('status', [ExamAttempt::STATUS_SUBMITTED, ExamAttempt::STATUS_AUTO_SUBMITTED])->count();
            $stats['avg_score'] = round((float) (clone $attemptsQuery)->whereNotNull('percentage_score')->avg('percentage_score'), 1);

            $attempts = ExamAttempt::query()
                ->where('exam_session_id', $activeSession->id)
                ->latest('started_at')
                ->take(50)
                ->get()
                ->map(fn (ExamAttempt $attempt) => [
                    'id' => $attempt->id,
                    'guest_name' => $attempt->guest_name ?? '-',
                    'guest_school' => $attempt->guest_school ?? '-',
                    'guest_email' => $attempt->guest_email,
                    'guest_phone' => $attempt->guest_phone,
                    'token' => $attempt->token?->token ?? '-',
                    'status' => $attempt->status,
                    'started_at' => $attempt->started_at?->format('d M Y H:i'),
                    'submitted_at' => $attempt->submitted_at?->format('H:i:s'),
                    'score' => $attempt->percentage_score !== null ? (float) $attempt->percentage_score : null,
                    'passed' => $attempt->passed,
                    'violations_count' => $attempt->violations_count,
                ]);

            $tokens = $activeSession->tokens->map(fn (ExamSessionToken $token) => [
                'id' => $token->id,
                'token' => $token->token,
                'label' => $token->label,
                'type' => $token->type,
                'used_count' => $token->used_count,
                'max_uses' => $token->max_uses,
                'is_expired' => $token->isExpired(),
                'is_valid' => $token->isValid(),
                'created_at' => $token->created_at?->format('d M H:i'),
                'expires_at' => $token->expires_at?->format('d M H:i'),
            ]);
        }

        return Inertia::render('Dashboard/Admin/Exam/PublicSessions', [
            'public_sessions' => $publicSessions->map(fn (ExamSession $session) => [
                'id' => $session->id,
                'title' => $session->title,
                'package_title' => $session->package?->title,
                'status' => $session->status,
                'is_open' => $session->isOpenForStart(),
                'opens_at' => $session->opens_at?->format('d M Y H:i'),
                'closes_at' => $session->closes_at?->format('d M Y H:i'),
                'duration_minutes' => $session->duration_minutes,
                'show_result_to_candidate' => (bool) $session->show_result_to_candidate,
                'attempts_count' => $session->attempts_count,
            ]),
            'active_session_id' => $activeSession?->id,
            'active_session' => $activeSession ? [
                'id' => $activeSession->id,
                'title' => $activeSession->title,
                'description' => $activeSession->description,
                'instructions' => $activeSession->instructions,
                'exam_package_id' => $activeSession->exam_package_id,
                'admission_wave_id' => $activeSession->admission_wave_id,
                'package_title' => $activeSession->package?->title,
                'status' => $activeSession->status,
                'is_open' => $activeSession->isOpenForStart(),
                'show_result_to_candidate' => (bool) $activeSession->show_result_to_candidate,
                'opens_at' => $activeSession->opens_at?->format('Y-m-d\TH:i'),
                'closes_at' => $activeSession->closes_at?->format('Y-m-d\TH:i'),
                'duration_minutes' => $activeSession->duration_minutes,
                'passing_score' => (float) $activeSession->passing_score,
                'max_attempts' => $activeSession->max_attempts,
                'public_access_type' => $activeSession->public_access_type,
            ] : null,
            'packages' => ExamPackage::where('status', ExamPackage::STATUS_PUBLISHED)->get(['id', 'title', 'code', 'duration_minutes', 'passing_score']),
            'waves' => AdmissionWave::get(['id', 'title', 'academic_year']),
            'attempts' => $attempts,
            'tokens' => $tokens,
            'stats' => $stats,
        ]);
    }

    public function store(StoreExamSessionRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $session = ExamSession::create([
            ...$validated,
            'is_public' => true,
            'public_access_type' => $validated['public_access_type'] ?? 'token_required',
            'created_by' => $request->user()?->id,
        ]);

        // Automatically create initial proctor token
        ExamSessionToken::create([
            'exam_session_id' => $session->id,
            'token' => Str::upper(Str::random(6)),
            'label' => 'Token Ruang Publik Utama',
            'type' => ExamSessionToken::TYPE_MULTI_USE,
            'max_uses' => 0,
            'expires_at' => $session->closes_at,
            'created_by' => $request->user()?->id,
        ]);

        $this->audit->log('public_session_created', [
            'exam_session_id' => $session->id,
            'exam_package_id' => $session->exam_package_id,
        ], $request);

        return redirect()
            ->route('admin.exams.public-sessions.index', ['session_id' => $session->id])
            ->with('success', 'Sesi Ujian Publik berhasil dibuat dengan Token Proctor perdana.');
    }

    public function update(StoreExamSessionRequest $request, ExamSession $session): RedirectResponse
    {
        $validated = $request->validated();

        $session->update([
            ...$validated,
            'is_public' => true,
        ]);

        $this->audit->log('public_session_updated', [
            'exam_session_id' => $session->id,
        ], $request);

        return redirect()
            ->route('admin.exams.public-sessions.index', ['session_id' => $session->id])
            ->with('success', 'Pengaturan Sesi Ujian Publik berhasil diperbarui.');
    }

    public function destroy(ExamSession $session, Request $request): RedirectResponse
    {
        $this->audit->log('public_session_deleted', [
            'exam_session_id' => $session->id,
        ], $request);

        $session->delete();

        return redirect()
            ->route('admin.exams.public-sessions.index')
            ->with('success', 'Sesi Ujian Publik berhasil dihapus.');
    }

    public function destroyToken(ExamSessionToken $token, Request $request): RedirectResponse
    {
        $tokenId = $token->id;
        $token->delete();

        $this->audit->log('proctor_token_deleted', [
            'token_id' => $tokenId,
        ], $request);

        return back()->with('success', 'Token Proktor berhasil dihapus.');
    }

    public function toggleResultVisibility(ExamSession $session, Request $request): RedirectResponse
    {
        $session->update([
            'show_result_to_candidate' => ! $session->show_result_to_candidate,
        ]);

        $statusLabel = $session->show_result_to_candidate ? 'ditampilkan' : 'disembunyikan';

        $this->audit->log('public_session_result_visibility_toggled', [
            'exam_session_id' => $session->id,
            'show_result_to_candidate' => $session->show_result_to_candidate,
        ], $request);

        return back()->with('success', "Pengaturan pengumuman hasil ujian publik kini: {$statusLabel}.");
    }

    public function generateToken(ExamSession $session, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:single_use,multi_use'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'expiry_minutes' => ['nullable', 'integer', 'min:5', 'max:1440'],
        ]);

        $expiresAt = isset($validated['expiry_minutes'])
            ? now()->addMinutes((int) $validated['expiry_minutes'])
            : $session->closes_at;

        $token = ExamSessionToken::create([
            'exam_session_id' => $session->id,
            'token' => Str::upper(Str::random(6)),
            'label' => $validated['label'] ?? 'Token Proktor (' . now()->format('H:i') . ')',
            'type' => $validated['type'],
            'max_uses' => $validated['type'] === 'single_use' ? 1 : ($validated['max_uses'] ?? 0),
            'expires_at' => $expiresAt,
            'created_by' => $request->user()?->id,
        ]);

        $this->audit->log('proctor_token_generated', [
            'exam_session_id' => $session->id,
            'token_id' => $token->id,
            'token' => $token->token,
        ], $request);

        return back()->with('success', "Token Proktor Ujian Baru berhasil dibuat: {$token->token}");
    }

    public function rotateToken(ExamSessionToken $token, Request $request): RedirectResponse
    {
        $session = $token->session;

        // Expire current token
        $token->update(['expires_at' => now()]);

        // Generate new random 6-character room token
        $newToken = ExamSessionToken::create([
            'exam_session_id' => $session->id,
            'token' => Str::upper(Str::random(6)),
            'label' => 'Token Proktor Rotasi (' . now()->format('H:i') . ')',
            'type' => $token->type,
            'max_uses' => $token->max_uses,
            'expires_at' => $session->closes_at,
            'created_by' => $request->user()?->id,
        ]);

        $this->audit->log('proctor_token_rotated', [
            'exam_session_id' => $session->id,
            'old_token' => $token->token,
            'new_token' => $newToken->token,
        ], $request);

        return back()->with('success', "Token berhasil dirotasi ke token baru: {$newToken->token}");
    }
}

