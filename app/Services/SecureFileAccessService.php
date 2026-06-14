<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SecureFileAccessService
{
    private const HEALTH_DOCUMENTS = [
        'chronic-disease' => [
            'column' => 'chronic_disease_doc_path',
            'label'  => 'chronic-disease',
        ],
        'surat-sehat' => [
            'column' => 'surat_sehat_path',
            'label'  => 'surat-sehat',
        ],
        'bpjs-card' => [
            'column' => 'bpjs_card_path',
            'label'  => 'bpjs-card',
        ],
        'vaccine-card' => [
            'column' => 'vaccine_card_path',
            'label'  => 'vaccine-card',
        ],
    ];

    private const INLINE_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    public function candidateDocument(Request $request, CandidateDocument $document, string $action): array
    {
        $user = $request->user();
        $candidate = $user?->candidate;
        $target = $document->candidate;
        $fileType = 'candidate_document:' . $document->doc_type;

        if (! $user || ! $candidate || $document->candidate_id !== $candidate->id) {
            $this->logAttempt($request, $fileType, $action, $target, 'denied');
            abort(404);
        }

        return $this->resolveFile(
            request: $request,
            path: $document->file_path,
            filename: $document->original_filename ?: $document->stored_filename,
            fileType: $fileType,
            action: $action,
            candidate: $target
        );
    }

    public function candidateHealthDocument(Request $request, string $docType, string $action): array
    {
        $user = $request->user();
        $candidate = $user?->candidate;
        $config = $this->healthDocumentConfig($docType);
        $fileType = 'health_document:' . ($config['label'] ?? 'invalid');

        if (! $user || ! $candidate || ! $config) {
            $this->logAttempt($request, $fileType, $action, $candidate, 'denied');
            abort(404);
        }

        $record = $candidate->healthRecord;
        $path = $record?->{$config['column']};

        return $this->resolveFile(
            request: $request,
            path: $path,
            filename: $this->healthFilename($candidate, $config['label'], $path),
            fileType: $fileType,
            action: $action,
            candidate: $candidate
        );
    }

    public function candidatePaymentProof(Request $request, Payment $payment, string $action): array
    {
        $user = $request->user();
        $candidate = $user?->candidate;
        $payment->loadMissing('candidate');
        $fileType = 'payment_proof';

        if (! $user || ! $candidate || $payment->candidate_id !== $candidate->id || ! $payment->isManualChannel()) {
            $this->logAttempt($request, $fileType, $action, $payment->candidate, 'denied');
            abort(404);
        }

        return $this->resolveFile(
            request: $request,
            path: $payment->proof_path,
            filename: $payment->proof_original_filename ?: 'bukti-pembayaran',
            fileType: $fileType,
            action: $action,
            candidate: $payment->candidate
        );
    }

    public function staffDocument(Request $request, CandidateDocument $document, string $action): array
    {
        $document->loadMissing('candidate');

        return $this->resolveFile(
            request: $request,
            path: $document->file_path,
            filename: $document->original_filename ?: $document->stored_filename,
            fileType: 'candidate_document:' . $document->doc_type,
            action: $action,
            candidate: $document->candidate
        );
    }

    public function staffHealthDocument(Request $request, Candidate $candidate, string $docType, string $action): array
    {
        return $this->healthDocumentForCandidate($request, $candidate, $docType, $action);
    }

    public function staffPaymentProof(Request $request, Payment $payment, string $action): array
    {
        return $this->paymentProofForStaffOrAdmin($request, $payment, $action);
    }

    public function adminDocument(Request $request, CandidateDocument $document, string $action): array
    {
        return $this->staffDocument($request, $document, $action);
    }

    public function adminHealthDocument(Request $request, Candidate $candidate, string $docType, string $action): array
    {
        return $this->healthDocumentForCandidate($request, $candidate, $docType, $action);
    }

    public function adminPaymentProof(Request $request, Payment $payment, string $action): array
    {
        return $this->paymentProofForStaffOrAdmin($request, $payment, $action);
    }

    public function response(array $file, string $action)
    {
        $mimeType = Storage::disk('private')->mimeType($file['path']);
        $disposition = $action === 'download' || ! in_array($mimeType, self::INLINE_MIME_TYPES, true)
            ? 'attachment'
            : 'inline';

        return Storage::disk('private')->response(
            $file['path'],
            $this->safeFilename($file['filename'], $file['path']),
            [
                'Cache-Control' => 'private, no-store, max-age=0',
                'Pragma' => 'no-cache',
                'X-Content-Type-Options' => 'nosniff',
            ],
            $disposition
        );
    }

    private function healthDocumentForCandidate(Request $request, Candidate $candidate, string $docType, string $action): array
    {
        $config = $this->healthDocumentConfig($docType);
        $fileType = 'health_document:' . ($config['label'] ?? 'invalid');

        if (! $config) {
            $this->logAttempt($request, $fileType, $action, $candidate, 'denied');
            abort(404);
        }

        $record = $candidate->healthRecord;
        $path = $record?->{$config['column']};

        return $this->resolveFile(
            request: $request,
            path: $path,
            filename: $this->healthFilename($candidate, $config['label'], $path),
            fileType: $fileType,
            action: $action,
            candidate: $candidate
        );
    }

    private function paymentProofForStaffOrAdmin(Request $request, Payment $payment, string $action): array
    {
        $payment->loadMissing('candidate');

        if (! $payment->isManualChannel()) {
            $this->logAttempt($request, 'payment_proof', $action, $payment->candidate, 'denied');
            abort(404);
        }

        return $this->resolveFile(
            request: $request,
            path: $payment->proof_path,
            filename: $payment->proof_original_filename ?: 'bukti-pembayaran',
            fileType: 'payment_proof',
            action: $action,
            candidate: $payment->candidate
        );
    }

    private function resolveFile(
        Request $request,
        ?string $path,
        ?string $filename,
        string $fileType,
        string $action,
        ?Candidate $candidate
    ): array {
        if (! $path || ! Storage::disk('private')->exists($path)) {
            $this->logAttempt($request, $fileType, $action, $candidate, 'not_found');
            abort(404);
        }

        $this->logAttempt($request, $fileType, $action, $candidate, 'allowed');

        return [
            'path' => $path,
            'filename' => $filename,
        ];
    }

    private function healthDocumentConfig(string $docType): ?array
    {
        $normalized = str_replace('_', '-', $docType);

        return self::HEALTH_DOCUMENTS[$normalized] ?? null;
    }

    private function healthFilename(Candidate $candidate, string $docType, ?string $path): string
    {
        $extension = $path ? pathinfo($path, PATHINFO_EXTENSION) : null;

        return $candidate->candidate_code . '-' . $docType . ($extension ? ".{$extension}" : '');
    }

    private function safeFilename(?string $filename, string $path): string
    {
        $name = $filename ?: basename($path);
        $extension = pathinfo($name, PATHINFO_EXTENSION);
        $base = pathinfo($name, PATHINFO_FILENAME);
        $base = Str::slug($base) ?: 'file';

        return $extension ? "{$base}.{$extension}" : $base;
    }

    private function logAttempt(
        Request $request,
        string $fileType,
        string $action,
        ?Candidate $candidate,
        string $result
    ): void {
        /** @var User|null $user */
        $user = $request->user();

        Log::channel('security')->info('sensitive_file_access', [
            'user_id' => $user?->id,
            'role' => $user?->role,
            'action' => $action,
            'file_type' => $fileType,
            'target_candidate_id' => $candidate?->id,
            'target_candidate_code' => $candidate?->candidate_code,
            'result' => $result,
            'ip' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 255, ''),
        ]);
    }
}
