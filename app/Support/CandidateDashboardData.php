<?php

namespace App\Support;

use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\Payment;
use App\Models\User;
use App\Services\CandidateStatus\CandidateCompletionEvaluator;
use App\Services\CandidateStatus\CandidateEvaluationResult;
use App\Services\CandidateStatus\CandidateGateService;
use App\Services\CandidateStatus\CandidateVerificationEvaluator;
use Illuminate\Support\Collection;

class CandidateDashboardData
{
    public static function make(Candidate $candidate, User $user): array
    {
        $documents = $candidate->documents;
        $payment = $candidate->payments->sortByDesc('created_at')->first();
        $completionEvaluator = app(CandidateCompletionEvaluator::class);
        $verificationEvaluator = app(CandidateVerificationEvaluator::class);
        $gateService = app(CandidateGateService::class);

        $dataDiri = self::completionSection($completionEvaluator->candidateSection($candidate));
        $guardian = self::completionSection($completionEvaluator->guardianSection($candidate));
        $health = self::completionSection($completionEvaluator->healthSection($candidate));
        $documentSummary = self::documentSummary($candidate, $documents, $verificationEvaluator);
        $paymentSummary = self::paymentSummary($payment);
        $statusSummary = self::statusSummary($candidate);
        $gates = $gateService->summary($candidate, $user);

        $sections = [
            self::section('data-diri', 'Data Diri', 'fa-solid fa-id-card', '/dashboard/data-diri', $dataDiri),
            self::section('data-wali', 'Data Wali', 'fa-solid fa-people-roof', '/dashboard/data-wali', $guardian),
            self::section('data-kesehatan', 'Data Kesehatan', 'fa-solid fa-heart-pulse', '/dashboard/data-kesehatan', $health),
            self::section('dokumen', 'Dokumen', 'fa-solid fa-file-lines', '/dashboard/data-dokumen', [
                'percentage' => $documentSummary['completion_percentage'],
                'missing' => $documentSummary['missing_required_labels'],
                'state' => $documentSummary['state'],
            ]),
            self::section('pembayaran', 'Pembayaran', 'fa-solid fa-credit-card', '/dashboard/pembayaran', [
                'percentage' => $paymentSummary['completion_percentage'],
                'missing' => $paymentSummary['missing'],
                'state' => $paymentSummary['state'],
            ]),
            self::section('status', 'Status Kandidat', 'fa-solid fa-clock-rotate-left', '/dashboard/status-pendaftaran', [
                'percentage' => $statusSummary['completion_percentage'],
                'missing' => $statusSummary['missing'],
                'state' => $statusSummary['state'],
            ]),
        ];

        $overallProgress = (int) round(collect($sections)->avg('percentage'));

        return [
            'identity' => self::identity($candidate, $user),
            'progress' => [
                'overall_percentage' => $overallProgress,
                'completed_sections' => collect($sections)->where('state', 'complete')->count(),
                'total_sections' => count($sections),
                'sections' => $sections,
            ],
            'next_action' => self::nextAction($candidate, $user, $dataDiri, $guardian, $health, $documentSummary, $paymentSummary, $gates),
            'gates' => $gates,
            'documents_summary' => $documentSummary,
            'payment_summary' => $paymentSummary,
            'status_summary' => $statusSummary,
        ];
    }

    private static function identity(Candidate $candidate, User $user): array
    {
        return [
            'full_name' => $candidate->full_name,
            'candidate_code' => $candidate->candidate_code,
            'registration_code' => $candidate->registrationDraft?->registration_code,
            'status' => $candidate->status,
            'status_label' => self::candidateStatusLabel($candidate->status),
            'admission_wave' => $candidate->admissionWave ? [
                'title' => $candidate->admissionWave->title,
                'academic_year' => $candidate->admissionWave->academic_year,
                'end_date' => $candidate->admissionWave->end_date?->format('d F Y'),
            ] : null,
            'program_choice' => $candidate->program_choice,
            'major_choice' => $candidate->major_choice,
            'email' => $user->email,
            'phone_number' => $candidate->phone_number,
            'nisn' => $candidate->nisn,
            'school_origin' => $candidate->school_origin,
        ];
    }

    private static function completionSection(CandidateEvaluationResult $result): array
    {
        $percentage = $result->percentage();
        $missing = $result->missingLabels();

        return [
            'percentage' => $percentage,
            'missing' => $missing,
            'state' => empty($missing) ? 'complete' : ($percentage >= 70 ? 'warning' : 'incomplete'),
        ];
    }

    private static function documentSummary(
        Candidate $candidate,
        Collection $documents,
        CandidateVerificationEvaluator $verificationEvaluator
    ): array
    {
        $requiredTypes = $verificationEvaluator->requiredDocumentTypes($candidate);
        $requiredLabels = collect($verificationEvaluator->requiredDocumentLabels($candidate));

        $uploadedRequiredTypes = $documents
            ->whereIn('doc_type', $requiredTypes)
            ->pluck('doc_type')
            ->unique()
            ->values();

        $missingRequiredTypes = collect($requiredTypes)->diff($uploadedRequiredTypes);

        $normalizedStatuses = $documents->map(fn (CandidateDocument $document) => self::normalizeDocumentStatus($document->status));
        $rejectedRequired = $documents
            ->whereIn('doc_type', $requiredTypes)
            ->filter(fn (CandidateDocument $document) => self::normalizeDocumentStatus($document->status) === 'rejected');

        $completion = count($requiredTypes) === 0
            ? 100
            : (int) round(($uploadedRequiredTypes->count() / count($requiredTypes)) * 100);

        $state = match (true) {
            $rejectedRequired->isNotEmpty() => 'warning',
            $missingRequiredTypes->isNotEmpty() => 'incomplete',
            $documents->whereIn('doc_type', $requiredTypes)
                ->filter(fn (CandidateDocument $document) => self::normalizeDocumentStatus($document->status) === 'pending')
                ->isNotEmpty() => 'warning',
            default => 'complete',
        };

        return [
            'total_required' => count($requiredTypes),
            'uploaded_required' => $uploadedRequiredTypes->count(),
            'total_uploaded' => $documents->count(),
            'pending' => $normalizedStatuses->filter(fn (string $status) => $status === 'pending')->count(),
            'verified' => $normalizedStatuses->filter(fn (string $status) => $status === 'verified')->count(),
            'rejected' => $normalizedStatuses->filter(fn (string $status) => $status === 'rejected')->count(),
            'missing_required' => $missingRequiredTypes->count(),
            'missing_required_labels' => $missingRequiredTypes
                ->map(fn (string $type) => $requiredLabels[$type] ?? $type)
                ->values()
                ->all(),
            'rejected_labels' => $rejectedRequired
                ->map(fn (CandidateDocument $document) => CandidateDocument::DOC_TYPES[$document->doc_type]['label'] ?? $document->doc_type)
                ->values()
                ->all(),
            'completion_percentage' => $completion,
            'state' => $state,
        ];
    }

    private static function paymentSummary(?Payment $payment): array
    {
        if (! $payment) {
            return [
                'exists' => false,
                'status' => 'not_started',
                'status_label' => 'Belum ada transaksi',
                'payment_channel' => null,
                'payment_channel_label' => null,
                'manual_status' => null,
                'manual_status_label' => null,
                'amount' => null,
                'proof_uploaded' => false,
                'verified_at' => null,
                'rejection_reason' => null,
                'completion_percentage' => 0,
                'missing' => ['Buat transaksi pembayaran'],
                'state' => 'incomplete',
            ];
        }

        $isPaid = $payment->status === Payment::STATUS_PAID;
        $isRejected = $payment->manual_status === Payment::MANUAL_REJECTED
            || in_array($payment->status, [Payment::STATUS_FAILED, Payment::STATUS_EXPIRED, Payment::STATUS_CANCELLED], true);
        $proofUploaded = ! empty($payment->proof_uploaded_at) || ! empty($payment->proof_original_filename);

        $percentage = match (true) {
            $isPaid => 100,
            $isRejected => 35,
            $payment->manual_status === Payment::MANUAL_PROOF_UPLOADED => 80,
            $proofUploaded => 70,
            $payment->status === Payment::STATUS_PENDING => 50,
            default => 25,
        };

        return [
            'exists' => true,
            'status' => $payment->status,
            'status_label' => self::paymentStatusLabel($payment->status),
            'payment_channel' => $payment->payment_channel,
            'payment_channel_label' => self::paymentChannelLabel($payment->payment_channel),
            'manual_status' => $payment->manual_status,
            'manual_status_label' => $payment->manual_status ? self::manualStatusLabel($payment->manual_status) : null,
            'amount' => $payment->final_amount !== null ? (float) $payment->final_amount : null,
            'proof_uploaded' => $proofUploaded,
            'verified_at' => $payment->verified_at?->format('d F Y'),
            'rejection_reason' => $payment->rejection_reason,
            'completion_percentage' => $percentage,
            'missing' => $isPaid ? [] : ['Selesaikan pembayaran'],
            'state' => $isPaid ? 'complete' : ($isRejected ? 'warning' : 'incomplete'),
        ];
    }

    private static function statusSummary(Candidate $candidate): array
    {
        $percentage = match ($candidate->status) {
            'draft' => 20,
            'submitted' => 55,
            'verified' => 80,
            'accepted', 'rejected' => 100,
            default => 20,
        };

        return [
            'current' => $candidate->status,
            'current_label' => self::candidateStatusLabel($candidate->status),
            'completion_percentage' => $percentage,
            'state' => $candidate->status === 'rejected'
                ? 'warning'
                : (in_array($candidate->status, ['accepted', 'verified'], true) ? 'complete' : 'incomplete'),
            'missing' => in_array($candidate->status, ['verified', 'accepted', 'rejected'], true)
                ? []
                : ['Menunggu proses verifikasi/status berikutnya'],
            'timeline' => [
                self::timelineStep('draft', 'Data awal tersimpan', $candidate->status),
                self::timelineStep('submitted', 'Diajukan untuk verifikasi', $candidate->status),
                self::timelineStep('verified', 'Diverifikasi panitia', $candidate->status),
                self::timelineStep('accepted', 'Hasil seleksi', $candidate->status),
            ],
        ];
    }

    private static function nextAction(
        Candidate $candidate,
        User $user,
        array $dataDiri,
        array $guardian,
        array $health,
        array $documentSummary,
        array $paymentSummary,
        array $gates
    ): array {
        if (! $user->hasVerifiedEmail()) {
            $emailReason = collect($gates['documents']['reasons'] ?? [])
                ->first(fn (string $reason) => str_contains($reason, 'Verifikasi email'));

            return self::action('Verifikasi email akun', $emailReason ?? 'Cek inbox dan selesaikan verifikasi email agar akunmu siap dipakai.', '/email/verify', 'Verifikasi Email', 'fa-solid fa-envelope-circle-check', 'warning');
        }

        if ($candidate->status === 'rejected') {
            return self::action('Cek hasil pendaftaran', 'Status pendaftaranmu ditolak. Lihat catatan dari panitia atau hubungi admin sekolah.', '/dashboard/status-pendaftaran', 'Lihat Status', 'fa-solid fa-circle-xmark', 'danger');
        }

        if (! empty($documentSummary['rejected_labels'])) {
            return self::action('Perbaiki dokumen ditolak', 'Ada dokumen yang perlu diunggah ulang: '.implode(', ', array_slice($documentSummary['rejected_labels'], 0, 2)).'.', '/dashboard/data-dokumen', 'Buka Dokumen', 'fa-solid fa-file-circle-xmark', 'danger');
        }

        if (($paymentSummary['manual_status'] ?? null) === Payment::MANUAL_REJECTED) {
            return self::action('Unggah ulang bukti pembayaran', 'Bukti pembayaran sebelumnya ditolak. Periksa catatan dan unggah bukti yang benar.', '/dashboard/pembayaran', 'Buka Pembayaran', 'fa-solid fa-receipt', 'danger');
        }

        if ($dataDiri['state'] !== 'complete') {
            return self::action('Lengkapi Data Diri', self::missingDescription($dataDiri['missing']), '/dashboard/data-diri', 'Lengkapi Data Diri', 'fa-solid fa-id-card', 'primary');
        }

        if ($guardian['state'] !== 'complete') {
            return self::action('Lengkapi Data Wali', self::missingDescription($guardian['missing']), '/dashboard/data-wali', 'Lengkapi Data Wali', 'fa-solid fa-people-roof', 'primary');
        }

        if ($health['state'] !== 'complete') {
            return self::action('Lengkapi Data Kesehatan', self::missingDescription($health['missing']), '/dashboard/data-kesehatan', 'Lengkapi Kesehatan', 'fa-solid fa-heart-pulse', 'primary');
        }

        if ($documentSummary['missing_required'] > 0) {
            return self::action('Upload dokumen wajib', self::missingDescription($documentSummary['missing_required_labels']), '/dashboard/data-dokumen', 'Upload Dokumen', 'fa-solid fa-file-arrow-up', 'primary');
        }

        if ($paymentSummary['state'] !== 'complete') {
            return self::action('Selesaikan pembayaran', 'Buat transaksi atau lanjutkan pembayaran agar proses pendaftaranmu bisa diverifikasi.', '/dashboard/pembayaran', 'Buka Pembayaran', 'fa-solid fa-credit-card', 'primary');
        }

        if ($documentSummary['pending'] > 0 || ($paymentSummary['status'] ?? null) === Payment::STATUS_PENDING) {
            return self::action('Menunggu verifikasi panitia', 'Data utama sudah masuk. Pantau dashboard ini untuk hasil verifikasi dokumen dan pembayaran.', '/dashboard/status-pendaftaran', 'Lihat Ringkasan Status', 'fa-solid fa-hourglass-half', 'neutral');
        }

        return self::action('Pantau status seleksi', 'Pendaftaranmu sudah rapi. Tunggu informasi hasil seleksi dari panitia sekolah.', '/dashboard/status-pendaftaran', 'Lihat Status', 'fa-solid fa-list-check', 'neutral');
    }

    private static function section(string $key, string $label, string $icon, string $href, array $data): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'icon' => $icon,
            'href' => $href,
            'percentage' => $data['percentage'],
            'state' => $data['state'],
            'missing' => array_slice($data['missing'], 0, 3),
            'coming_soon' => (bool) ($data['coming_soon'] ?? false),
        ];
    }

    private static function action(string $title, string $description, string $href, string $label, string $icon, string $tone, bool $comingSoon = false): array
    {
        return compact('title', 'description', 'href', 'label', 'icon', 'tone', 'comingSoon');
    }

    private static function timelineStep(string $key, string $label, string $currentStatus): array
    {
        $order = ['draft', 'submitted', 'verified', 'accepted'];
        $currentIndex = $currentStatus === 'rejected'
            ? array_search('verified', $order, true)
            : array_search($currentStatus, $order, true);
        $stepIndex = array_search($key, $order, true);

        return [
            'key' => $key,
            'label' => $label,
            'state' => match (true) {
                $currentStatus === 'rejected' && $key === 'accepted' => 'warning',
                $stepIndex < $currentIndex => 'complete',
                $stepIndex === $currentIndex => 'current',
                default => 'upcoming',
            },
        ];
    }

    private static function normalizeDocumentStatus(?string $status): string
    {
        return match ($status) {
            'verified', 'valid' => 'verified',
            'rejected', 'invalid' => 'rejected',
            default => 'pending',
        };
    }

    private static function candidateStatusLabel(?string $status): string
    {
        return match ($status) {
            'draft' => 'Draft',
            'submitted' => 'Menunggu Verifikasi',
            'verified' => 'Terverifikasi',
            'accepted' => 'Diterima',
            'rejected' => 'Ditolak',
            default => 'Belum diketahui',
        };
    }

    private static function paymentStatusLabel(?string $status): string
    {
        return match ($status) {
            Payment::STATUS_PENDING => 'Menunggu Pembayaran',
            Payment::STATUS_PAID => 'Lunas',
            Payment::STATUS_FAILED => 'Gagal',
            Payment::STATUS_EXPIRED => 'Kedaluwarsa',
            Payment::STATUS_CANCELLED => 'Dibatalkan',
            default => 'Belum diketahui',
        };
    }

    private static function paymentChannelLabel(?string $channel): ?string
    {
        return match ($channel) {
            Payment::CHANNEL_GATEWAY => 'Payment Gateway',
            Payment::CHANNEL_TRANSFER => 'Transfer Bank',
            Payment::CHANNEL_CASH => 'Tunai',
            null => null,
            default => ucfirst($channel),
        };
    }

    private static function manualStatusLabel(?string $status): ?string
    {
        return match ($status) {
            Payment::MANUAL_WAITING_PROOF => 'Menunggu Bukti',
            Payment::MANUAL_PROOF_UPLOADED => 'Bukti Diupload',
            Payment::MANUAL_VERIFIED => 'Terverifikasi',
            Payment::MANUAL_REJECTED => 'Ditolak',
            null => null,
            default => ucfirst($status),
        };
    }

    private static function missingDescription(array $missing): string
    {
        $items = array_slice($missing, 0, 3);

        return empty($items)
            ? 'Ada bagian yang perlu dilengkapi sebelum proses berikutnya.'
            : 'Yang perlu dilengkapi: '.implode(', ', $items).'.';
    }

}
