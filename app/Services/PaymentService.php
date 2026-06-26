<?php
// =============================================================================
// LOKASI FILE: app/Services/PaymentService.php
// =============================================================================


namespace App\Services;

use App\Models\Payment;
use App\Models\PaymentConfig;
use App\Models\Candidate;
use App\Support\SentinelStoragePaths;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PaymentService
{
    public function __construct(
        private readonly DocumentSecurityService $securityService
    ) {}

    // ─────────────────────────────────────────────────────────────────────
    // Config Resolution
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Ambil payment config yang aktif untuk wave tertentu.
     * Priority: config spesifik wave > global default.
     * Return null kalau tidak ada config sama sekali.
     */
    public function resolveConfig(int $waveId): ?PaymentConfig
    {
        return PaymentConfig::forWave($waveId)->first();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Payment Creation
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Buat transaksi baru untuk channel gateway (Midtrans).
     * Fee dihitung otomatis dari config.
     */
    public function createGatewayPayment(Candidate $candidate): Payment
    {
        $wave   = $candidate->admissionWave;
        $config = $this->resolveConfig($wave->id);

        $baseAmount  = (float) $wave->registration_fee;
        $feeAmount   = $config ? $config->calculateFee($baseAmount) : 0.0;
        $finalAmount = $baseAmount + $feeAmount;

        return DB::transaction(function () use ($candidate, $wave, $baseAmount, $feeAmount, $finalAmount) {
            return Payment::create([
                'candidate_id'     => $candidate->id,
                'admission_wave_id'=> $wave->id,
                'candidate_code'   => $candidate->candidate_code,
                'order_id'         => $this->generateOrderId($candidate->candidate_code),
                'payment_channel'  => Payment::CHANNEL_GATEWAY,
                'base_amount'      => $baseAmount,
                'fee_amount'       => $feeAmount,
                'final_amount'     => $finalAmount,
                'status'           => Payment::STATUS_PENDING,
                // manual_status intentionally null untuk gateway
                'expired_at'       => now()->addHours(24),
            ]);
        });
    }

    /**
     * Buat transaksi baru untuk channel manual (transfer/cash).
     * Tidak ada fee untuk manual channel.
     */
    public function createManualPayment(Candidate $candidate, string $channel): Payment
    {
        if (! in_array($channel, [Payment::CHANNEL_TRANSFER, Payment::CHANNEL_CASH])) {
            throw new \InvalidArgumentException("Invalid manual channel: {$channel}");
        }

        $wave        = $candidate->admissionWave;
        $baseAmount  = (float) $wave->registration_fee;

        return DB::transaction(function () use ($candidate, $wave, $baseAmount, $channel) {
            return Payment::create([
                'candidate_id'     => $candidate->id,
                'admission_wave_id'=> $wave->id,
                'candidate_code'   => $candidate->candidate_code,
                'order_id'         => $this->generateOrderId($candidate->candidate_code),
                'payment_channel'  => $channel,
                'base_amount'      => $baseAmount,
                'fee_amount'       => 0,
                'final_amount'     => $baseAmount,
                'status'           => Payment::STATUS_PENDING,
                'manual_status'    => Payment::MANUAL_WAITING_PROOF,
                'expired_at'       => now()->addDays(3),
            ]);
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Proof Upload — Sentinel Security Berlapis
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Upload bukti pembayaran untuk channel manual.
     * Wajib ikut Sentinel 4-layer security sama seperti dokumen kandidat.
     *
     * @throws \Exception kalau validasi keamanan gagal
     */
    public function uploadProof(Payment $payment, UploadedFile $file): Payment
    {
        // Guard: hanya manual channel yang boleh upload proof
        if (! $payment->isManualChannel()) {
            throw new \LogicException('Proof upload only allowed for manual payment channels.');
        }

        // Guard: pastikan status membolehkan upload
        if (! $payment->canUploadProof()) {
            throw new \LogicException('Payment is not in a state that allows proof upload.');
        }

        // ── Sentinel Layer B: Magic Bytes ────────────────────────────────
        $magicResult = $this->securityService->checkMagicBytes($file);
        if ($magicResult['result'] !== 'passed') {
            Log::warning('PaymentService: magic bytes check failed for proof upload', [
                'payment_id' => $payment->id,
                'candidate'  => $payment->candidate_code,
                'detected_mime' => $magicResult['detected_mime'] ?? null,
            ]);
            throw new \Exception('Format file tidak didukung.');
        }

        // ── Sentinel Layer C: Polyglot Scan ──────────────────────────────
        $polyglotResult = $this->securityService->scanPolyglot($file);
        if (! $polyglotResult['clean']) {
            Log::warning('PaymentService: polyglot scan failed for proof upload', [
                'payment_id' => $payment->id,
                'candidate'  => $payment->candidate_code,
                'detail'     => $polyglotResult['detail'],
            ]);
            throw new \Exception('Format file tidak didukung.');
        }

        // ── Sentinel Layer D: UUID Rename + Private Storage ───────────────


        $storedFilename = $this->securityService->generateStoredFilename($magicResult['detected_mime']);
        $storageDirectory = SentinelStoragePaths::paymentProofDirectory($payment->candidate_code);
        $storedPath     = "{$storageDirectory}/{$storedFilename}";

        $oldPath = $payment->proof_path;

        try {
            $file->storeAs(
                $storageDirectory,
                $storedFilename,
                'private'
            );

            DB::transaction(function () use ($payment, $file, $storedPath) {
                $payment->updateQuietly([
                    'proof_path'              => $storedPath,
                    'proof_original_filename' => $file->getClientOriginalName(),
                    'proof_uploaded_at'       => now(),
                    'proof_attempt'           => $payment->proof_attempt + 1,
                    'manual_status'           => Payment::MANUAL_PROOF_UPLOADED,
                    'rejection_reason'        => null,
                ]);
            });
        } catch (\Throwable $e) {
            Storage::disk('private')->delete($storedPath);
            throw $e;
        }

        if ($oldPath && $oldPath !== $storedPath && Storage::disk('private')->exists($oldPath)) {
            Storage::disk('private')->delete($oldPath);
        }

        return $payment->fresh();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Staff Actions
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Staff verifikasi bukti pembayaran — set paid.
     */
    public function verifyProof(Payment $payment, int $staffId): Payment
    {
        if (! $payment->isProofUploaded()) {
            throw new \LogicException('Payment proof is not in proof_uploaded state.');
        }

        DB::transaction(function () use ($payment, $staffId) {
            $payment->updateQuietly([
                'manual_status' => Payment::MANUAL_VERIFIED,
                'status'        => Payment::STATUS_PAID,
                'verified_by'   => $staffId,
                'verified_at'   => now(),
                'paid_at'       => now(),
                'rejection_reason' => null,
            ]);
        });

        return $payment->fresh();
    }

    /**
     * Staff tolak bukti pembayaran — user perlu upload ulang.
     * Rejection reason wajib diisi.
     */
    public function rejectProof(Payment $payment, int $staffId, string $reason): Payment
    {
        if (empty(trim($reason))) {
            throw new \InvalidArgumentException('Rejection reason cannot be empty.');
        }

        if (! $payment->isProofUploaded()) {
            throw new \LogicException('Payment proof is not in proof_uploaded state.');
        }

        DB::transaction(function () use ($payment, $staffId, $reason) {
            $payment->updateQuietly([
                'manual_status'    => Payment::MANUAL_REJECTED,
                'verified_by'      => $staffId,
                'verified_at'      => now(),
                'rejection_reason' => $reason,
            ]);
        });

        return $payment->fresh();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Midtrans Webhook Handler
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Handle notifikasi dari Midtrans webhook.
     * Validasi signature key sebelum update status.
     *
     * @throws \Exception kalau signature tidak valid
     */
    public function handleMidtransWebhook(array $payload): void
    {
        // Validasi signature Midtrans
        $this->validateMidtransSignature($payload);

        $payment = Payment::where('order_id', $payload['order_id'])->first();

        if (! $payment) {
            Log::warning('PaymentService: webhook received for unknown order_id', [
                'order_id' => $payload['order_id'],
            ]);
            return;
        }

        // Guard: hanya proses kalau channel gateway
        if (! $payment->isGateway()) {
            Log::warning('PaymentService: webhook received for non-gateway payment', [
                'payment_id'      => $payment->id,
                'payment_channel' => $payment->payment_channel,
            ]);
            return;
        }

        // Guard: jangan update kalau sudah final (paid/failed/expired)
        if (in_array($payment->status, [
            Payment::STATUS_PAID,
            Payment::STATUS_FAILED,
            Payment::STATUS_EXPIRED,
        ])) {
            return;
        }

        $transactionStatus = $payload['transaction_status'] ?? '';
        $fraudStatus       = $payload['fraud_status'] ?? '';

        $newStatus = match (true) {
            $transactionStatus === 'capture' && $fraudStatus === 'accept' => Payment::STATUS_PAID,
            $transactionStatus === 'settlement'                           => Payment::STATUS_PAID,
            $transactionStatus === 'cancel'                               => Payment::STATUS_CANCELLED,
            $transactionStatus === 'deny'                                 => Payment::STATUS_FAILED,
            $transactionStatus === 'expire'                               => Payment::STATUS_EXPIRED,
            default                                                       => null,
        };

        if ($newStatus === null) {
            return;
        }

        DB::transaction(function () use ($payment, $newStatus, $payload) {
            $payment->updateQuietly([
                'status'                   => $newStatus,
                'payment_method'           => $payload['payment_type'] ?? null,
                'midtrans_transaction_id'  => $payload['transaction_id'] ?? null,
                'paid_at'                  => $newStatus === Payment::STATUS_PAID ? now() : null,
                'metadata'                 => $payload,
            ]);
        });

        Log::info('PaymentService: webhook processed', [
            'payment_id' => $payment->id,
            'order_id'   => $payment->order_id,
            'new_status' => $newStatus,
        ]);
    }

    public function syncGatewayPaymentStatus(Payment $payment): Payment
    {
        if (! $payment->isGateway()) {
            return $payment->fresh() ?? $payment;
        }

        if (in_array($payment->status, [
            Payment::STATUS_PAID,
            Payment::STATUS_FAILED,
            Payment::STATUS_EXPIRED,
            Payment::STATUS_CANCELLED,
        ], true)) {
            return $payment->fresh() ?? $payment;
        }

        try {
            \Midtrans\Config::$serverKey = config('midtrans.server_key');
            \Midtrans\Config::$isProduction = config('midtrans.is_production');

            $response = \Midtrans\Transaction::status($payment->order_id);
            $payload = json_decode(json_encode($response), true) ?? [];

            $transactionStatus = $payload['transaction_status'] ?? '';
            $fraudStatus = $payload['fraud_status'] ?? '';

            $newStatus = match (true) {
                $transactionStatus === 'capture' && $fraudStatus === 'accept' => Payment::STATUS_PAID,
                $transactionStatus === 'settlement'                           => Payment::STATUS_PAID,
                $transactionStatus === 'cancel'                               => Payment::STATUS_CANCELLED,
                $transactionStatus === 'deny'                                 => Payment::STATUS_FAILED,
                $transactionStatus === 'expire'                               => Payment::STATUS_EXPIRED,
                $transactionStatus === 'failure'                              => Payment::STATUS_FAILED,
                default                                                       => Payment::STATUS_PENDING,
            };

            if (
                $payment->status !== $newStatus
                || empty($payment->payment_method)
                || empty($payment->midtrans_transaction_id)
            ) {
                DB::transaction(function () use ($payment, $newStatus, $payload) {
                    $payment->updateQuietly([
                        'status'                  => $newStatus,
                        'payment_method'          => $payload['payment_type'] ?? $payment->payment_method,
                        'midtrans_transaction_id' => $payload['transaction_id'] ?? $payment->midtrans_transaction_id,
                        'paid_at'                 => $newStatus === Payment::STATUS_PAID
                            ? ($payment->paid_at ?? now())
                            : null,
                        'metadata'                => $payload,
                    ]);
                });
            }
        } catch (\Throwable $e) {
            Log::warning('PaymentService: gateway sync failed', [
                'payment_id' => $payment->id,
                'order_id'   => $payment->order_id,
                'error'      => $e->getMessage(),
            ]);
        }

        return $payment->fresh() ?? $payment;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Proof File Access
    // ─────────────────────────────────────────────────────────────────────

    public function getProofAccessUrl(Payment $payment): ?string
    {
        if (! $payment->proof_path || ! $payment->isManualChannel()) {
            return null;
        }

        if (! Storage::disk('private')->exists($payment->proof_path)) {
            Log::warning('PaymentService: proof file not found', [
                'payment_id' => $payment->id,
            ]);
            return null;
        }

        return route('dashboard.pembayaran.proof', $payment);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────────────────────────────

    private function generateOrderId(string $candidateCode): string
    {
        return $candidateCode . '-' . now()->timestamp;
    }

    /**
     * Validasi signature Midtrans webhook.
     * Formula: SHA512(order_id + status_code + gross_amount + server_key)
     *
     * @throws \Exception kalau signature tidak valid
     */
    private function validateMidtransSignature(array $payload): void
    {
        $serverKey = config('midtrans.server_key');

        $signatureKey = hash('sha512',
            ($payload['order_id']    ?? '') .
            ($payload['status_code'] ?? '') .
            ($payload['gross_amount']?? '') .
            $serverKey
        );

        if (! hash_equals($signatureKey, $payload['signature_key'] ?? '')) {
            Log::error('PaymentService: invalid Midtrans webhook signature', [
                'order_id' => $payload['order_id'] ?? 'unknown',
            ]);
            throw new \Exception('Invalid webhook signature.');
        }
    }
}
