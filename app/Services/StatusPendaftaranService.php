<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamSessionCandidate;
use App\Models\Payment;
use App\Models\User;
use App\Services\CandidateStatus\CandidateCompletionEvaluator;
use App\Services\CandidateStatus\CandidateEvaluationResult;
use App\Services\CandidateStatus\CandidateGateService;
use App\Services\CandidateStatus\CandidateVerificationEvaluator;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class StatusPendaftaranService
{
    public function __construct(
        private readonly CandidateCompletionEvaluator $completionEvaluator,
        private readonly CandidateVerificationEvaluator $verificationEvaluator,
        private readonly CandidateGateService $gateService
    ) {}

    public function forCandidate(Candidate $candidate, User $user): array
    {
        return $this->build($candidate, $user, 'candidate');
    }

    public function forInternal(Candidate $candidate, string $scope): array
    {
        return $this->build($candidate, $candidate->user, $scope);
    }

    private function build(Candidate $candidate, ?User $candidateUser, string $viewer): array
    {
        $this->loadRelations($candidate);

        $candidateUser = $candidateUser ?? $candidate->user;
        $completion = $this->completionEvaluator->evaluate($candidate);
        $dataDiri = $this->completionEvaluator->candidateSection($candidate);
        $guardian = $this->completionEvaluator->guardianSection($candidate);
        $health = $this->completionEvaluator->healthSection($candidate);
        $verification = $this->verificationEvaluator->evaluate($candidate);
        $gates = $this->gateService->summary($candidate, $candidateUser);
        $documentSummary = $this->documentSummary($candidate);
        $paymentSummary = $this->paymentSummary($candidate);
        $selectionSummary = $this->selectionSummary($candidate, $gates['exam'], $viewer);
        $paths = $this->paths($candidate, $viewer);
        $waitingSide = $this->waitingSide($candidate, $candidateUser, $documentSummary, $paymentSummary, $selectionSummary);

        $completionChecklist = $this->completionChecklist(
            $dataDiri,
            $guardian,
            $health,
            $documentSummary,
            $paymentSummary,
            $selectionSummary,
            $gates,
            $paths
        );
        $nextActions = $this->nextActions($completionChecklist, $documentSummary, $paymentSummary, $selectionSummary, $candidate, $paths);

        return [
            'viewer' => [
                'role' => $viewer,
                'is_candidate' => $viewer === 'candidate',
                'is_internal' => in_array($viewer, ['staff', 'admin'], true),
            ],
            'identity' => $this->identity($candidate, $candidateUser),
            'lifecycle' => [
                'current' => $candidate->status,
                'label' => $this->candidateStatusLabel($candidate->status),
                'tone' => $this->candidateStatusTone($candidate->status),
                'description' => $this->candidateStatusDescription($candidate->status),
                'waiting_side' => $waitingSide['key'],
                'waiting_side_label' => $waitingSide['label'],
                'waiting_side_description' => $waitingSide['description'],
                'updated_at' => $this->formatDateTime($candidate->updated_at),
            ],
            'lifecycle_steps' => $this->lifecycleSteps($candidate),
            'progress' => [
                'completion_percentage' => $completion->percentage(),
                'verification_percentage' => $verification->percentage(),
                'completed_checklist' => collect($completionChecklist)->where('status', 'complete')->count(),
                'total_checklist' => count($completionChecklist),
            ],
            'gates' => $gates,
            'completion_checklist' => $completionChecklist,
            'verification_checklist' => $this->verificationChecklist($candidate, $verification, $documentSummary, $paymentSummary),
            'selection_summary' => $selectionSummary,
            'primary_action' => $nextActions[0] ?? null,
            'secondary_actions' => array_slice($nextActions, 1),
            'timeline' => $this->timeline($candidate, $documentSummary, $paymentSummary, $selectionSummary, $viewer),
            'review_blockers' => $this->reviewBlockers($candidate, $completion, $documentSummary, $paymentSummary, $selectionSummary, $paths),
            'quick_links' => $this->quickLinks($paths, $viewer),
            'meta' => [
                'generated_at' => $this->formatDateTime(now()),
                'source' => 'existing admission lifecycle, gate, document, payment, request, wave, and exam records',
            ],
        ];
    }

    private function loadRelations(Candidate $candidate): void
    {
        $candidate->loadMissing([
            'user.pendingEmailReviewer',
            'admissionWave:id,title,academic_year,start_date,end_date,registration_fee,announcement_info',
            'registrationDraft:id,registration_code,created_at',
            'guardian',
            'healthRecord',
            'documents.verifiedBy',
            'payments.verifiedBy',
            'examSessionCandidates.session.package.subject',
            'examSessionCandidates.attempts.session',
            'examSessionCandidates.attempts.package',
            'examAttempts.session',
            'examAttempts.package',
        ]);
    }

    private function identity(Candidate $candidate, ?User $user): array
    {
        return [
            'id' => $candidate->id,
            'full_name' => $candidate->full_name,
            'candidate_code' => $candidate->candidate_code,
            'registration_code' => $candidate->registrationDraft?->registration_code,
            'nisn' => $candidate->nisn,
            'email' => $user?->email ?? $candidate->email,
            'email_verified' => (bool) $user?->hasVerifiedEmail(),
            'phone_number' => $candidate->phone_number,
            'program_choice' => $candidate->program_choice,
            'major_choice' => $candidate->major_choice,
            'school_origin' => $candidate->school_origin,
            'is_transfer' => (bool) $candidate->is_transfer,
            'admission_wave' => $candidate->admissionWave ? [
                'title' => $candidate->admissionWave->title,
                'academic_year' => $candidate->admissionWave->academic_year,
                'start_date' => $this->formatDate($candidate->admissionWave->start_date),
                'end_date' => $this->formatDate($candidate->admissionWave->end_date),
            ] : null,
        ];
    }

    private function documentSummary(Candidate $candidate): array
    {
        $requiredTypes = $this->verificationEvaluator->requiredDocumentTypes($candidate);
        $requiredLabels = $this->verificationEvaluator->requiredDocumentLabels($candidate);
        $documents = $candidate->documents->whereIn('doc_type', $requiredTypes)->values();
        $uploadedTypes = $documents->pluck('doc_type')->unique()->values();
        $verifiedTypes = $documents
            ->where('status', 'verified')
            ->pluck('doc_type')
            ->unique()
            ->values();
        $pendingDocuments = $documents->where('status', 'pending')->values();
        $rejectedDocuments = $documents->where('status', 'rejected')->values();
        $missingTypes = collect($requiredTypes)->diff($uploadedTypes)->values();
        $missingVerifiedTypes = collect($requiredTypes)->diff($verifiedTypes)->values();

        $status = match (true) {
            $rejectedDocuments->isNotEmpty() => 'rejected',
            $missingTypes->isNotEmpty() => 'incomplete',
            $pendingDocuments->isNotEmpty() || $missingVerifiedTypes->isNotEmpty() => 'pending_review',
            default => 'complete',
        };

        return [
            'status' => $status,
            'label' => $this->checklistStatusLabel($status),
            'required_total' => count($requiredTypes),
            'uploaded_required' => $uploadedTypes->count(),
            'verified_required' => $verifiedTypes->count(),
            'pending' => $pendingDocuments->count(),
            'rejected' => $rejectedDocuments->count(),
            'missing_required' => $missingTypes->count(),
            'missing_required_labels' => $missingTypes
                ->map(fn (string $type) => $requiredLabels[$type] ?? $type)
                ->all(),
            'rejected_documents' => $rejectedDocuments
                ->map(fn (CandidateDocument $document) => [
                    'id' => $document->id,
                    'label' => CandidateDocument::DOC_TYPES[$document->doc_type]['label'] ?? $document->doc_type,
                    'reason' => $this->safeText($document->rejection_reason),
                    'updated_at' => $this->formatDateTime($document->updated_at),
                ])
                ->values()
                ->all(),
            'last_updated_at' => $this->latestFormattedDate($documents),
        ];
    }

    private function paymentSummary(Candidate $candidate): array
    {
        $payments = $candidate->payments->sortByDesc('created_at')->values();
        $latest = $payments->first();
        $paid = $payments->first(fn (Payment $payment) => $payment->status === Payment::STATUS_PAID);

        if (! $latest) {
            return [
                'exists' => false,
                'status' => 'incomplete',
                'label' => 'Belum Lengkap',
                'payment_status' => null,
                'payment_status_label' => 'Belum ada transaksi',
                'manual_status' => null,
                'manual_status_label' => null,
                'rejection_reason' => null,
                'amount' => null,
                'last_updated_at' => null,
            ];
        }

        $isRejected = $latest->manual_status === Payment::MANUAL_REJECTED
            || in_array($latest->status, [Payment::STATUS_FAILED, Payment::STATUS_EXPIRED, Payment::STATUS_CANCELLED], true);
        $status = match (true) {
            (bool) $paid => 'complete',
            $isRejected => 'rejected',
            $latest->manual_status === Payment::MANUAL_PROOF_UPLOADED => 'pending_review',
            default => 'incomplete',
        };

        return [
            'exists' => true,
            'status' => $status,
            'label' => $this->checklistStatusLabel($status),
            'payment_status' => $latest->status,
            'payment_status_label' => $this->paymentStatusLabel($latest->status),
            'manual_status' => $latest->manual_status,
            'manual_status_label' => $latest->manual_status ? $this->manualStatusLabel($latest->manual_status) : null,
            'rejection_reason' => $this->safeText($latest->rejection_reason),
            'amount' => $latest->final_amount !== null ? (float) $latest->final_amount : null,
            'last_updated_at' => $this->formatDateTime($latest->updated_at),
            'paid_at' => $this->formatDateTime($paid?->paid_at),
            'verified_at' => $this->formatDateTime($paid?->verified_at),
        ];
    }

    private function selectionSummary(Candidate $candidate, array $examGate, string $viewer): array
    {
        $assignments = $candidate->examSessionCandidates->sortByDesc('assigned_at')->values();
        $attempts = $candidate->examAttempts->sortByDesc('created_at')->values();
        $latestAssignment = $assignments->first();
        $latestAttempt = $attempts->first();
        $candidateCanSeeScore = $latestAttempt
            && ! $latestAttempt->isInProgress()
            && (bool) ($latestAttempt->session?->show_result_to_candidate || $latestAttempt->package?->show_result_to_candidate);
        $internalViewer = in_array($viewer, ['staff', 'admin'], true);
        $scoreVisible = $internalViewer || $candidateCanSeeScore;

        $status = match (true) {
            $examGate['locked'] ?? false => 'locked',
            ! $latestAssignment => 'unavailable',
            ! $latestAttempt => 'incomplete',
            $latestAttempt->isInProgress() => 'incomplete',
            $latestAttempt->status === ExamAttempt::STATUS_CANCELLED
                || $latestAttempt->status === ExamAttempt::STATUS_INVALIDATED => 'rejected',
            ! $scoreVisible => 'pending_review',
            default => 'complete',
        };

        return [
            'status' => $status,
            'label' => $this->checklistStatusLabel($status),
            'assignments_count' => $assignments->count(),
            'attempts_count' => $attempts->count(),
            'gate_allowed' => (bool) ($examGate['allowed'] ?? false),
            'locked_reason' => $examGate['reason'] ?? null,
            'latest_assignment' => $latestAssignment ? [
                'id' => $latestAssignment->id,
                'status' => $latestAssignment->status,
                'status_label' => $this->assignmentStatusLabel($latestAssignment->status),
                'session_title' => $latestAssignment->session?->title,
                'assigned_at' => $this->formatDateTime($latestAssignment->assigned_at),
            ] : null,
            'latest_attempt' => $latestAttempt ? [
                'id' => $latestAttempt->id,
                'status' => $latestAttempt->status,
                'status_label' => $this->attemptStatusLabel($latestAttempt->status),
                'attempt_number' => $latestAttempt->attempt_number,
                'session_title' => $latestAttempt->session?->title,
                'submitted_at' => $this->formatDateTime($latestAttempt->submitted_at),
                'score_visible' => $scoreVisible,
                'percentage_score' => $scoreVisible && $latestAttempt->percentage_score !== null
                    ? (float) $latestAttempt->percentage_score
                    : null,
                'passing_score' => $scoreVisible && $latestAttempt->passing_score !== null
                    ? (float) $latestAttempt->passing_score
                    : null,
                'passed' => $scoreVisible ? $latestAttempt->passed : null,
            ] : null,
            'last_updated_at' => $this->formatDateTime($latestAttempt?->updated_at ?? $latestAssignment?->updated_at),
        ];
    }

    private function completionChecklist(
        CandidateEvaluationResult $dataDiri,
        CandidateEvaluationResult $guardian,
        CandidateEvaluationResult $health,
        array $documentSummary,
        array $paymentSummary,
        array $selectionSummary,
        array $gates,
        array $paths
    ): array {
        $documentStatus = ($gates['documents']['locked'] ?? false)
            ? 'locked'
            : $documentSummary['status'];
        $paymentStatus = ($gates['payment']['locked'] ?? false)
            ? 'locked'
            : $paymentSummary['status'];

        return [
            $this->checklistItem(
                'data-diri',
                'Data Diri',
                'fa-solid fa-id-card',
                $dataDiri->complete() ? 'complete' : 'incomplete',
                $dataDiri->complete() ? 'Identitas dan pilihan program utama sudah lengkap.' : $this->missingText($dataDiri),
                $paths['data_diri'],
                null
            ),
            $this->checklistItem(
                'data-wali',
                'Data Wali',
                'fa-solid fa-people-roof',
                $guardian->complete() ? 'complete' : 'incomplete',
                $guardian->complete() ? 'Data orang tua/wali sudah memenuhi syarat minimum.' : $this->missingText($guardian),
                $paths['data_wali'],
                null
            ),
            $this->checklistItem(
                'data-kesehatan',
                'Data Kesehatan',
                'fa-solid fa-heart-pulse',
                $health->complete() ? 'complete' : 'incomplete',
                $health->complete() ? 'Informasi kesehatan dasar sudah lengkap.' : $this->missingText($health),
                $paths['data_kesehatan'],
                null
            ),
            $this->checklistItem(
                'dokumen',
                'Dokumen',
                'fa-solid fa-file-lines',
                $documentStatus,
                $this->documentDescription($documentStatus, $documentSummary, $gates['documents']['reason'] ?? null),
                $paths['dokumen'],
                $documentSummary['last_updated_at'],
                $gates['documents']['reason'] ?? null
            ),
            $this->checklistItem(
                'pembayaran',
                'Pembayaran',
                'fa-solid fa-credit-card',
                $paymentStatus,
                $this->paymentDescription($paymentStatus, $paymentSummary, $gates['payment']['reason'] ?? null),
                $paths['pembayaran'],
                $paymentSummary['last_updated_at'] ?? null,
                $gates['payment']['reason'] ?? null
            ),
            $this->checklistItem(
                'ujian-seleksi',
                'Ujian Seleksi',
                'fa-solid fa-clipboard-question',
                $selectionSummary['status'],
                $this->selectionDescription($selectionSummary),
                $paths['seleksi'],
                $selectionSummary['last_updated_at'],
                $selectionSummary['locked_reason']
            ),
            $this->checklistItem(
                'daftar-ulang',
                'Daftar Ulang',
                'fa-solid fa-file-signature',
                'unavailable',
                'Tahap daftar ulang belum dibuka pada sistem ini.',
                null,
                null
            ),
        ];
    }

    private function verificationChecklist(
        Candidate $candidate,
        CandidateEvaluationResult $verification,
        array $documentSummary,
        array $paymentSummary
    ): array {
        return [
            [
                'key' => 'required-documents',
                'label' => 'Dokumen wajib terverifikasi',
                'status' => $documentSummary['status'],
                'status_label' => $this->checklistStatusLabel($documentSummary['status']),
                'description' => "{$documentSummary['verified_required']} dari {$documentSummary['required_total']} dokumen wajib sudah verified.",
            ],
            [
                'key' => 'bpjs-card',
                'label' => 'Kartu BPJS / JKN',
                'status' => empty($candidate->healthRecord?->bpjs_card_path) ? 'incomplete' : 'complete',
                'status_label' => empty($candidate->healthRecord?->bpjs_card_path) ? 'Belum Lengkap' : 'Selesai',
                'description' => empty($candidate->healthRecord?->bpjs_card_path)
                    ? 'Berkas BPJS/JKN belum tersedia di data kesehatan.'
                    : 'Berkas BPJS/JKN sudah tersedia.',
            ],
            [
                'key' => 'payment-paid',
                'label' => 'Pembayaran pendaftaran',
                'status' => $paymentSummary['status'],
                'status_label' => $paymentSummary['label'],
                'description' => $paymentSummary['payment_status_label'],
            ],
            [
                'key' => 'verification-overall',
                'label' => 'Status verifikasi otomatis',
                'status' => $verification->complete() ? 'complete' : 'pending_review',
                'status_label' => $verification->complete() ? 'Selesai' : 'Menunggu Review',
                'description' => $verification->complete()
                    ? 'Semua syarat verifikasi utama sudah terpenuhi.'
                    : 'Masih ada syarat verifikasi yang belum terpenuhi.',
            ],
        ];
    }

    private function checklistItem(
        string $key,
        string $label,
        string $icon,
        string $status,
        string $description,
        ?string $href,
        ?string $lastUpdatedAt,
        ?string $lockedReason = null
    ): array {
        return [
            'key' => $key,
            'label' => $label,
            'icon' => $icon,
            'status' => $status,
            'status_label' => $this->checklistStatusLabel($status),
            'tone' => $this->checklistTone($status),
            'description' => $description,
            'href' => $href,
            'last_updated_at' => $lastUpdatedAt,
            'locked_reason' => $lockedReason,
        ];
    }

    private function nextActions(
        array $checklist,
        array $documentSummary,
        array $paymentSummary,
        array $selectionSummary,
        Candidate $candidate,
        array $paths
    ): array {
        $actions = [];

        foreach ($checklist as $item) {
            if (in_array($item['key'], ['data-diri', 'data-wali', 'data-kesehatan'], true) && $item['status'] !== 'complete') {
                $actions[] = $this->action("Lengkapi {$item['label']}", $item['description'], $item['href'], $item['icon'], 'primary');
            }
        }

        if ($documentSummary['status'] === 'rejected') {
            $actions[] = $this->action('Perbaiki dokumen ditolak', 'Ada dokumen yang perlu diunggah ulang sesuai catatan panitia.', $paths['dokumen'], 'fa-solid fa-file-circle-xmark', 'danger');
        } elseif ($documentSummary['status'] === 'incomplete' && $candidate->status !== 'draft') {
            $actions[] = $this->action('Upload dokumen wajib', 'Lengkapi dokumen wajib agar panitia bisa melanjutkan verifikasi.', $paths['dokumen'], 'fa-solid fa-file-arrow-up', 'primary');
        }

        if ($paymentSummary['status'] === 'rejected') {
            $actions[] = $this->action('Upload ulang bukti pembayaran', 'Bukti pembayaran terakhir ditolak. Periksa catatan sebelum mengunggah ulang.', $paths['pembayaran'], 'fa-solid fa-receipt', 'danger');
        } elseif ($paymentSummary['status'] === 'incomplete' && $candidate->status !== 'draft') {
            $actions[] = $this->action('Selesaikan pembayaran', 'Buat transaksi atau unggah bukti pembayaran agar status bisa diverifikasi.', $paths['pembayaran'], 'fa-solid fa-credit-card', 'primary');
        }

        if ($selectionSummary['gate_allowed'] && in_array($selectionSummary['status'], ['incomplete', 'complete', 'pending_review'], true)) {
            $actions[] = $this->action('Buka seleksi', 'Lihat sesi ujian, status pengerjaan, dan hasil yang sudah boleh ditampilkan.', $paths['seleksi'], 'fa-solid fa-clipboard-question', 'neutral');
        }

        if (empty($actions)) {
            $actions[] = $this->action('Pantau status pendaftaran', 'Belum ada aksi wajib dari sisi kandidat saat ini. Pantau catatan panitia secara berkala.', $paths['status'], 'fa-solid fa-list-check', 'neutral');
        }

        return array_values(collect($actions)->unique('href')->all());
    }

    private function timeline(Candidate $candidate, array $documentSummary, array $paymentSummary, array $selectionSummary, string $viewer): array
    {
        $items = [
            $this->timelineItem(
                'candidate-created',
                'Data kandidat dibuat',
                'Akun pendaftaran dan data awal kandidat tercatat di sistem.',
                $candidate->created_at,
                'neutral'
            ),
            $this->timelineItem(
                'candidate-status',
                'Status saat ini: '.$this->candidateStatusLabel($candidate->status),
                $this->candidateStatusDescription($candidate->status),
                $candidate->updated_at,
                $candidate->status === 'rejected' ? 'danger' : 'primary'
            ),
        ];

        foreach ($documentSummary['rejected_documents'] as $document) {
            $items[] = [
                'key' => 'document-rejected-'.$document['id'],
                'title' => 'Dokumen ditolak: '.$document['label'],
                'description' => $document['reason'] ? 'Alasan: '.$document['reason'] : 'Dokumen perlu diperbaiki sesuai arahan panitia.',
                'date' => $document['updated_at'],
                'tone' => 'danger',
                '_sort_date' => $document['updated_at'],
            ];
        }

        if ($paymentSummary['status'] === 'rejected') {
            $items[] = [
                'key' => 'payment-rejected',
                'title' => 'Bukti pembayaran ditolak',
                'description' => $paymentSummary['rejection_reason'] ? 'Alasan: '.$paymentSummary['rejection_reason'] : 'Bukti pembayaran perlu diunggah ulang.',
                'date' => $paymentSummary['last_updated_at'],
                'tone' => 'danger',
                '_sort_date' => $paymentSummary['last_updated_at'],
            ];
        } elseif ($paymentSummary['status'] === 'complete') {
            $items[] = [
                'key' => 'payment-complete',
                'title' => 'Pembayaran tercatat lunas',
                'description' => 'Pembayaran pendaftaran sudah tercatat sebagai lunas.',
                'date' => $paymentSummary['paid_at'] ?? $paymentSummary['verified_at'] ?? $paymentSummary['last_updated_at'],
                'tone' => 'success',
                '_sort_date' => $paymentSummary['paid_at'] ?? $paymentSummary['verified_at'] ?? $paymentSummary['last_updated_at'],
            ];
        } elseif ($paymentSummary['status'] === 'pending_review') {
            $items[] = [
                'key' => 'payment-review',
                'title' => 'Bukti pembayaran menunggu review',
                'description' => 'Bukti pembayaran sudah masuk dan menunggu verifikasi panitia.',
                'date' => $paymentSummary['last_updated_at'],
                'tone' => 'warning',
                '_sort_date' => $paymentSummary['last_updated_at'],
            ];
        }

        $dataChange = $candidate->data_change_request;
        if (is_array($dataChange) && isset($dataChange['status'])) {
            $status = (string) $dataChange['status'];
            $items[] = [
                'key' => 'data-change-'.$status,
                'title' => $status === 'pending' ? 'Permintaan perubahan data diajukan' : 'Permintaan perubahan data '.$this->requestStatusLabel($status),
                'description' => $this->dataChangeDescription($dataChange),
                'date' => $this->formatDateTime($dataChange['reviewed_at'] ?? $dataChange['processed_at'] ?? $dataChange['requested_at'] ?? null),
                'tone' => $status === 'rejected' ? 'danger' : ($status === 'approved' ? 'success' : 'warning'),
                '_sort_date' => $dataChange['reviewed_at'] ?? $dataChange['processed_at'] ?? $dataChange['requested_at'] ?? null,
            ];
        }

        if ($candidate->user?->pending_email) {
            $emailStatus = $candidate->user->pending_email_status ?? 'pending';
            $items[] = [
                'key' => 'email-change-'.$emailStatus,
                'title' => $emailStatus === 'pending' ? 'Permintaan perubahan email diajukan' : 'Permintaan perubahan email '.$this->requestStatusLabel($emailStatus),
                'description' => $emailStatus === 'rejected' && $candidate->user->pending_email_rejection_reason
                    ? 'Alasan: '.$candidate->user->pending_email_rejection_reason
                    : 'Email tujuan: '.$candidate->user->pending_email,
                'date' => $this->formatDateTime($candidate->user->pending_email_reviewed_at ?? $candidate->user->pending_email_requested_at),
                'tone' => $emailStatus === 'rejected' ? 'danger' : ($emailStatus === 'approved' ? 'success' : 'warning'),
                '_sort_date' => $candidate->user->pending_email_reviewed_at ?? $candidate->user->pending_email_requested_at,
            ];
        }

        if ($selectionSummary['latest_attempt']) {
            $attempt = $selectionSummary['latest_attempt'];
            $items[] = [
                'key' => 'exam-attempt-'.$attempt['id'],
                'title' => 'Ujian seleksi: '.$attempt['status_label'],
                'description' => $this->examTimelineDescription($attempt, $viewer),
                'date' => $attempt['submitted_at'],
                'tone' => $attempt['passed'] === false ? 'danger' : ($attempt['passed'] === true ? 'success' : 'neutral'),
                '_sort_date' => $attempt['submitted_at'],
            ];
        }

        return collect($items)
            ->sortByDesc(fn (array $item) => $item['_sort_date'] ?? $item['date'] ?? '')
            ->map(function (array $item) {
                unset($item['_sort_date']);

                return $item;
            })
            ->values()
            ->take(12)
            ->all();
    }

    private function reviewBlockers(
        Candidate $candidate,
        CandidateEvaluationResult $completion,
        array $documentSummary,
        array $paymentSummary,
        array $selectionSummary,
        array $paths
    ): array {
        $blockers = [];

        if (! $completion->complete()) {
            $blockers[] = $this->blocker('core-data', 'Data pendaftaran belum lengkap', $this->missingText($completion), $paths['data_diri'], 'warning');
        }

        if ($documentSummary['rejected'] > 0) {
            $blockers[] = $this->blocker('documents-rejected', 'Ada dokumen ditolak', "{$documentSummary['rejected']} dokumen wajib perlu diperbaiki kandidat.", $paths['dokumen'], 'danger');
        } elseif ($documentSummary['pending'] > 0) {
            $blockers[] = $this->blocker('documents-pending', 'Dokumen menunggu review', "{$documentSummary['pending']} dokumen wajib perlu ditinjau.", $paths['dokumen'], 'warning');
        } elseif ($documentSummary['missing_required'] > 0 && $candidate->status !== 'draft') {
            $blockers[] = $this->blocker('documents-missing', 'Dokumen wajib belum lengkap', implode(', ', $documentSummary['missing_required_labels']), $paths['dokumen'], 'warning');
        }

        if ($paymentSummary['status'] === 'rejected') {
            $blockers[] = $this->blocker('payment-rejected', 'Pembayaran ditolak', $paymentSummary['rejection_reason'] ?? 'Kandidat perlu mengunggah ulang bukti pembayaran.', $paths['pembayaran'], 'danger');
        } elseif ($paymentSummary['status'] === 'pending_review') {
            $blockers[] = $this->blocker('payment-review', 'Pembayaran menunggu review', 'Bukti pembayaran manual perlu diverifikasi.', $paths['pembayaran'], 'warning');
        } elseif ($paymentSummary['status'] === 'incomplete' && $candidate->status !== 'draft') {
            $blockers[] = $this->blocker('payment-missing', 'Pembayaran belum selesai', 'Belum ada pembayaran lunas untuk kandidat ini.', $paths['pembayaran'], 'warning');
        }

        if (is_array($candidate->data_change_request) && ($candidate->data_change_request['status'] ?? null) === 'pending') {
            $blockers[] = $this->blocker('data-change-pending', 'Permintaan perubahan data pending', 'Ada permintaan perubahan data yang perlu diputuskan panitia.', $paths['change_requests'], 'warning');
        }

        if ($candidate->user?->hasPendingEmailRequest()) {
            $blockers[] = $this->blocker('email-change-pending', 'Permintaan perubahan email pending', 'Ada permintaan email baru yang perlu diperiksa manual.', $paths['change_requests'], 'warning');
        }

        if ($candidate->status === 'verified' && $selectionSummary['status'] === 'unavailable') {
            $blockers[] = $this->blocker('exam-unassigned', 'Belum ada sesi ujian', 'Kandidat sudah verified, tetapi belum memiliki sesi ujian yang tercatat.', $paths['hasil_ujian'], 'neutral');
        }

        if (empty($blockers)) {
            $blockers[] = $this->blocker('clear', 'Tidak ada blocker utama', 'Tidak ditemukan blocker operasional besar dari data yang tersedia saat ini.', null, 'success');
        }

        return $blockers;
    }

    private function quickLinks(array $paths, string $viewer): array
    {
        if ($viewer === 'candidate') {
            return [
                $this->quickLink('Data Diri', $paths['data_diri'], 'fa-solid fa-id-card'),
                $this->quickLink('Data Wali', $paths['data_wali'], 'fa-solid fa-people-roof'),
                $this->quickLink('Data Kesehatan', $paths['data_kesehatan'], 'fa-solid fa-heart-pulse'),
                $this->quickLink('Dokumen', $paths['dokumen'], 'fa-solid fa-file-lines'),
                $this->quickLink('Pembayaran', $paths['pembayaran'], 'fa-solid fa-credit-card'),
                $this->quickLink('Ujian Seleksi', $paths['seleksi'], 'fa-solid fa-clipboard-question'),
            ];
        }

        return [
            $this->quickLink('Data Diri', $paths['data_diri'], 'fa-solid fa-id-card'),
            $this->quickLink('Data Wali', $paths['data_wali'], 'fa-solid fa-people-roof'),
            $this->quickLink('Data Kesehatan', $paths['data_kesehatan'], 'fa-solid fa-heart-pulse'),
            $this->quickLink('Review Dokumen', $paths['dokumen'], 'fa-solid fa-file-circle-check'),
            $this->quickLink('Review Pembayaran', $paths['pembayaran'], 'fa-solid fa-money-check-dollar'),
            $this->quickLink('Hasil Ujian', $paths['hasil_ujian'], 'fa-solid fa-list-check'),
            $this->quickLink('Permintaan Perubahan', $paths['change_requests'], 'fa-solid fa-arrows-rotate'),
        ];
    }

    private function lifecycleSteps(Candidate $candidate): array
    {
        $current = $candidate->status;
        $order = ['draft', 'submitted', 'verified', 'final'];
        $currentStep = in_array($current, ['accepted', 'rejected'], true) ? 'final' : $current;
        $currentIndex = array_search($currentStep, $order, true);

        return collect($order)->map(function (string $step, int $index) use ($current, $currentIndex) {
            $status = match (true) {
                $step === 'final' && $current === 'rejected' => 'rejected',
                $step === 'final' && $current === 'accepted' => 'complete',
                $index < $currentIndex => 'complete',
                $index === $currentIndex => 'current',
                default => 'upcoming',
            };

            return [
                'key' => $step,
                'label' => $step === 'final' ? ($current === 'rejected' ? 'Rejected' : 'Accepted / Rejected') : $this->candidateStatusLabel($step),
                'description' => $this->lifecycleStepDescription($step, $current),
                'status' => $status,
            ];
        })->all();
    }

    private function waitingSide(
        Candidate $candidate,
        ?User $user,
        array $documentSummary,
        array $paymentSummary,
        array $selectionSummary
    ): array {
        if (in_array($candidate->status, ['accepted', 'rejected'], true)) {
            return ['key' => 'final', 'label' => 'Keputusan final', 'description' => 'Status akhir sudah tercatat di sistem.'];
        }

        if ($candidate->status === 'draft') {
            return ['key' => 'candidate', 'label' => 'Kandidat', 'description' => 'Kandidat perlu melengkapi data pendaftaran utama.'];
        }

        if ($user && ! $user->hasVerifiedEmail()) {
            return ['key' => 'candidate', 'label' => 'Kandidat', 'description' => 'Kandidat perlu menyelesaikan verifikasi email akun.'];
        }

        if ($documentSummary['status'] === 'rejected' || $paymentSummary['status'] === 'rejected') {
            return ['key' => 'candidate', 'label' => 'Kandidat', 'description' => 'Ada berkas atau pembayaran yang perlu diperbaiki kandidat.'];
        }

        if ($documentSummary['status'] === 'pending_review' || $paymentSummary['status'] === 'pending_review') {
            return ['key' => 'staff', 'label' => 'Panitia', 'description' => 'Data sudah masuk dan sedang menunggu review panitia.'];
        }

        if ($selectionSummary['gate_allowed'] && in_array($selectionSummary['status'], ['incomplete', 'complete'], true)) {
            return ['key' => 'candidate', 'label' => 'Kandidat', 'description' => 'Kandidat perlu memantau atau mengikuti sesi seleksi yang tersedia.'];
        }

        return ['key' => 'system', 'label' => 'Sistem / Panitia', 'description' => 'Status sedang menunggu pembaruan dari proses berikutnya.'];
    }

    private function paths(Candidate $candidate, string $viewer): array
    {
        if ($viewer === 'candidate') {
            return [
                'status' => '/dashboard/status-pendaftaran',
                'data_diri' => '/dashboard/data-diri',
                'data_wali' => '/dashboard/data-wali',
                'data_kesehatan' => '/dashboard/data-kesehatan',
                'dokumen' => '/dashboard/data-dokumen',
                'pembayaran' => '/dashboard/pembayaran',
                'seleksi' => '/dashboard/seleksi',
                'hasil_ujian' => '/dashboard/seleksi',
                'change_requests' => '/dashboard/data-diri',
            ];
        }

        $base = "/dashboard/{$viewer}/candidates/{$candidate->id}";

        return [
            'status' => "{$base}/status-pendaftaran",
            'data_diri' => "{$base}/data-diri",
            'data_wali' => "{$base}/data-wali",
            'data_kesehatan' => "{$base}/data-kesehatan",
            'dokumen' => "{$base}/dokumen",
            'pembayaran' => "{$base}/pembayaran",
            'seleksi' => "{$base}/status-pendaftaran",
            'hasil_ujian' => "/dashboard/{$viewer}/exams/results",
            'change_requests' => "/dashboard/{$viewer}/change-requests",
        ];
    }

    private function action(string $title, string $description, ?string $href, string $icon, string $tone): array
    {
        return compact('title', 'description', 'href', 'icon', 'tone');
    }

    private function blocker(string $key, string $title, string $description, ?string $href, string $tone): array
    {
        return compact('key', 'title', 'description', 'href', 'tone');
    }

    private function quickLink(string $label, string $href, string $icon): array
    {
        return compact('label', 'href', 'icon');
    }

    private function timelineItem(string $key, string $title, string $description, mixed $date, string $tone): array
    {
        return [
            'key' => $key,
            'title' => $title,
            'description' => $description,
            'date' => $this->formatDateTime($date),
            'tone' => $tone,
            '_sort_date' => $date,
        ];
    }

    private function latestFormattedDate(Collection $items): ?string
    {
        $latest = $items->sortByDesc('updated_at')->first();

        return $this->formatDateTime($latest?->updated_at);
    }

    private function formatDateTime(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        if ($value instanceof CarbonInterface) {
            return $value->format('d M Y · H:i');
        }

        try {
            return \Carbon\Carbon::parse($value)->format('d M Y · H:i');
        } catch (\Throwable) {
            return $this->safeText($value);
        }
    }

    private function formatDate(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        if ($value instanceof CarbonInterface) {
            return $value->format('d M Y');
        }

        try {
            return \Carbon\Carbon::parse($value)->format('d M Y');
        } catch (\Throwable) {
            return $this->safeText($value);
        }
    }

    private function missingText(CandidateEvaluationResult $result): string
    {
        $missing = array_slice($result->missingLabels(), 0, 3);

        return empty($missing)
            ? 'Tidak ada kekurangan utama yang terdeteksi.'
            : 'Perlu dilengkapi: '.implode(', ', $missing).'.';
    }

    private function documentDescription(string $status, array $summary, ?string $lockedReason): string
    {
        return match ($status) {
            'locked' => $lockedReason ?? 'Dokumen belum bisa diunggah pada tahap ini.',
            'complete' => 'Semua dokumen wajib sudah diverifikasi.',
            'pending_review' => "{$summary['pending']} dokumen menunggu review panitia.",
            'rejected' => "{$summary['rejected']} dokumen perlu diperbaiki.",
            default => $summary['missing_required'] > 0
                ? 'Belum lengkap: '.implode(', ', array_slice($summary['missing_required_labels'], 0, 3)).'.'
                : 'Dokumen wajib belum lengkap.',
        };
    }

    private function paymentDescription(string $status, array $summary, ?string $lockedReason): string
    {
        return match ($status) {
            'locked' => $lockedReason ?? 'Pembayaran belum bisa dilakukan pada tahap ini.',
            'complete' => 'Pembayaran pendaftaran sudah lunas.',
            'pending_review' => 'Bukti pembayaran sedang menunggu verifikasi panitia.',
            'rejected' => $summary['rejection_reason'] ? 'Ditolak: '.$summary['rejection_reason'] : 'Bukti pembayaran ditolak.',
            default => $summary['exists'] ? $summary['payment_status_label'] : 'Belum ada transaksi pembayaran.',
        };
    }

    private function selectionDescription(array $summary): string
    {
        if ($summary['status'] === 'locked') {
            return $summary['locked_reason'] ?? 'Ujian seleksi belum bisa diakses.';
        }

        if ($summary['status'] === 'unavailable') {
            return 'Belum ada sesi ujian seleksi yang tersedia.';
        }

        if (! $summary['latest_attempt']) {
            return 'Sesi ujian sudah tersedia, tetapi belum ada attempt yang tercatat.';
        }

        if ($summary['status'] === 'pending_review') {
            return 'Ujian sudah dikumpulkan. Hasil belum dibuka untuk kandidat.';
        }

        return 'Status ujian terakhir: '.$summary['latest_attempt']['status_label'].'.';
    }

    private function dataChangeDescription(array $request): string
    {
        $field = str_replace('_', ' ', (string) ($request['field'] ?? 'data'));
        $status = (string) ($request['status'] ?? 'pending');

        if ($status === 'rejected' && ! empty($request['rejection_reason'])) {
            return 'Perubahan '.$field.' ditolak. Alasan: '.$request['rejection_reason'];
        }

        if ($status === 'approved') {
            return 'Perubahan '.$field.' disetujui dan diterapkan.';
        }

        return 'Perubahan '.$field.' menunggu review panitia.';
    }

    private function examTimelineDescription(array $attempt, string $viewer): string
    {
        if (! $attempt['score_visible']) {
            return 'Ujian sudah tercatat, tetapi hasil belum dibuka untuk kandidat.';
        }

        if ($attempt['percentage_score'] === null) {
            return 'Ujian sudah tercatat. Nilai belum tersedia.';
        }

        $result = $attempt['passed'] === null
            ? 'hasil akhir belum ditandai'
            : ($attempt['passed'] ? 'lulus' : 'belum lulus');

        return 'Nilai '.$attempt['percentage_score'].'%, '.$result.'.';
    }

    private function safeText(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = trim((string) $value);

        return $text !== '' ? $text : null;
    }

    private function candidateStatusLabel(?string $status): string
    {
        return match ($status) {
            'draft' => 'Draft',
            'submitted' => 'Submitted',
            'verified' => 'Verified',
            'accepted' => 'Accepted',
            'rejected' => 'Rejected',
            default => 'Belum diketahui',
        };
    }

    private function candidateStatusTone(?string $status): string
    {
        return match ($status) {
            'draft' => 'neutral',
            'submitted' => 'warning',
            'verified' => 'primary',
            'accepted' => 'success',
            'rejected' => 'danger',
            default => 'neutral',
        };
    }

    private function candidateStatusDescription(?string $status): string
    {
        return match ($status) {
            'draft' => 'Data utama belum lengkap untuk masuk tahap verifikasi.',
            'submitted' => 'Data utama sudah diajukan dan menunggu verifikasi dokumen/pembayaran.',
            'verified' => 'Syarat pendaftaran utama sudah diverifikasi. Kandidat dapat masuk tahap seleksi jika tersedia.',
            'accepted' => 'Kandidat sudah dinyatakan diterima secara final.',
            'rejected' => 'Kandidat sudah dinyatakan tidak diterima secara final.',
            default => 'Status belum dapat dibaca oleh sistem.',
        };
    }

    private function lifecycleStepDescription(string $step, string $current): string
    {
        return match ($step) {
            'draft' => 'Kandidat melengkapi Data Diri, Data Wali, dan Data Kesehatan.',
            'submitted' => 'Data masuk antrean review dokumen dan pembayaran.',
            'verified' => 'Syarat utama sudah valid untuk masuk seleksi.',
            'final' => $current === 'rejected'
                ? 'Keputusan akhir: kandidat tidak diterima.'
                : 'Keputusan akhir hanya diisi manual oleh panitia.',
            default => '',
        };
    }

    private function checklistStatusLabel(string $status): string
    {
        return match ($status) {
            'complete' => 'Selesai',
            'incomplete' => 'Belum Lengkap',
            'pending_review' => 'Menunggu Review',
            'rejected' => 'Ditolak',
            'unavailable' => 'Belum Tersedia',
            'locked' => 'Terkunci',
            default => 'Belum diketahui',
        };
    }

    private function checklistTone(string $status): string
    {
        return match ($status) {
            'complete' => 'success',
            'pending_review' => 'warning',
            'rejected' => 'danger',
            'locked', 'unavailable' => 'muted',
            default => 'neutral',
        };
    }

    private function paymentStatusLabel(?string $status): string
    {
        return match ($status) {
            Payment::STATUS_PENDING => 'Menunggu Pembayaran',
            Payment::STATUS_PAID => 'Lunas',
            Payment::STATUS_FAILED => 'Gagal',
            Payment::STATUS_EXPIRED => 'Kedaluwarsa',
            Payment::STATUS_CANCELLED => 'Dibatalkan',
            null => 'Belum ada transaksi',
            default => ucfirst($status),
        };
    }

    private function manualStatusLabel(string $status): string
    {
        return match ($status) {
            Payment::MANUAL_WAITING_PROOF => 'Menunggu Bukti',
            Payment::MANUAL_PROOF_UPLOADED => 'Bukti Diupload',
            Payment::MANUAL_VERIFIED => 'Terverifikasi',
            Payment::MANUAL_REJECTED => 'Ditolak',
            default => ucfirst($status),
        };
    }

    private function assignmentStatusLabel(string $status): string
    {
        return match ($status) {
            ExamSessionCandidate::STATUS_ELIGIBLE => 'Eligible',
            ExamSessionCandidate::STATUS_BLOCKED => 'Dibatasi',
            ExamSessionCandidate::STATUS_COMPLETED => 'Selesai',
            default => ucfirst($status),
        };
    }

    private function attemptStatusLabel(string $status): string
    {
        return match ($status) {
            ExamAttempt::STATUS_IN_PROGRESS => 'Sedang Dikerjakan',
            ExamAttempt::STATUS_SUBMITTED => 'Terkumpul',
            ExamAttempt::STATUS_AUTO_SUBMITTED => 'Terkumpul Otomatis',
            ExamAttempt::STATUS_EXPIRED => 'Kedaluwarsa',
            ExamAttempt::STATUS_CANCELLED => 'Dibatalkan',
            ExamAttempt::STATUS_INVALIDATED => 'Dibatalkan Panitia',
            default => ucfirst($status),
        };
    }

    private function requestStatusLabel(string $status): string
    {
        return match ($status) {
            'approved' => 'disetujui',
            'rejected' => 'ditolak',
            default => 'diproses',
        };
    }
}
