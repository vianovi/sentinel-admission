<?php
// =============================================================================
// LOKASI FILE: app/Http/Controllers/Candidate/PaymentController.php
// =============================================================================

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService
    ) {}

    // ─────────────────────────────────────────────────────────────────────
    // Show — Halaman Pembayaran Kandidat
    // ─────────────────────────────────────────────────────────────────────

    public function show(Request $request): Response
    {
        $user      = $request->user();
        $candidate = $user->candidate()->with('admissionWave')->first();

        $payment = Payment::where('candidate_id', $candidate->id)
            ->whereIn('status', [Payment::STATUS_PENDING, Payment::STATUS_PAID])
            ->latest()
            ->first();

        $config = $this->paymentService->resolveConfig($candidate->admission_wave_id);

        $proofUrl = null;
        if ($payment?->isManualChannel() && $payment->proof_path) {
            $proofUrl = $this->paymentService->getProofTemporaryUrl($payment);
        }

        $whatsappUrl = null;
        if ($config && $payment?->isManualChannel()) {
            $whatsappUrl = $config->generateWhatsAppUrl(
                $candidate->full_name,
                $candidate->candidate_code
            );
        }

        $wave = $candidate->admissionWave;

        return Inertia::render('Dashboard/Candidate/Pembayaran', [
            'user' => [
                'name'       => $user->name,
                'avatar_url' => $user->avatar_url,
                'initials'   => $user->initials,
            ],
            'candidate' => [
                'full_name'      => $candidate->full_name,
                'candidate_code' => $candidate->candidate_code,
                'status'         => $candidate->status,
                'program_choice' => $candidate->program_choice,
                'nisn'           => $candidate->nisn ?? null,
                'school_origin'  => $candidate->school_origin ?? null,
                'mother_name'    => $candidate->guardian?->mother_name ?? null,
                'admission_wave' => $wave ? [
                    'title'            => $wave->title,
                    'academic_year'    => $wave->academic_year ?? null,
                    'registration_fee' => (float) $wave->registration_fee,
                    'end_date'         => $wave->end_date?->toDateString() ?? null,
                ] : null,
            ],
            'payment'      => $payment ? $this->formatPayment($payment) : null,
            'config'       => $config ? $this->formatConfig($config) : null,
            'proof_url'    => $proofUrl,
            'whatsapp_url' => $whatsappUrl,
            'base_amount'  => (float) $wave?->registration_fee,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Create Payment
    // ─────────────────────────────────────────────────────────────────────

    public function create(Request $request): RedirectResponse
    {
        $request->validate([
            'channel' => ['required', 'in:gateway,transfer,cash'],
        ]);

        $candidate = $request->user()->candidate()->with('admissionWave')->first();
        $channel   = $request->input('channel');

        try {
            DB::transaction(function () use ($candidate, $channel) {
                Candidate::where('id', $candidate->id)->lockForUpdate()->first();

                if (Payment::where('candidate_id', $candidate->id)
                    ->where('status', Payment::STATUS_PENDING)
                    ->exists()) {
                    throw new \RuntimeException('DUPLICATE_PENDING');
                }

                if (Payment::where('candidate_id', $candidate->id)
                    ->where('status', Payment::STATUS_PAID)
                    ->exists()) {
                    throw new \RuntimeException('ALREADY_PAID');
                }

                if ($channel === Payment::CHANNEL_GATEWAY) {
                    $this->paymentService->createGatewayPayment($candidate);
                } else {
                    $this->paymentService->createManualPayment($candidate, $channel);
                }
            });

            return back()->with('success', 'Transaksi berhasil dibuat.');

        } catch (\RuntimeException $e) {
            $message = match ($e->getMessage()) {
                'DUPLICATE_PENDING' => 'Masih ada transaksi yang sedang diproses.',
                'ALREADY_PAID'      => 'Pembayaran sudah berhasil dilakukan.',
                default             => 'Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.',
            };
            return back()->withErrors(['channel' => $message]);

        } catch (\Exception $e) {
            Log::error('PaymentController@create failed', [
                'candidate_id' => $candidate->id,
                'channel'      => $channel,
                'error'        => $e->getMessage(),
            ]);
            return back()->withErrors([
                'channel' => 'Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.',
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Snap Token — Gateway Only
    // ─────────────────────────────────────────────────────────────────────

    public function snapToken(Request $request): \Illuminate\Http\JsonResponse
    {
        $candidate = $request->user()->candidate()->with(['admissionWave', 'user'])->first();

        $payment = Payment::where('candidate_id', $candidate->id)
            ->where('status', Payment::STATUS_PENDING)
            ->where('payment_channel', Payment::CHANNEL_GATEWAY)
            ->latest()
            ->first();

        if (! $payment) {
            return response()->json(['error' => 'Transaksi tidak ditemukan.'], 404);
        }

        if ($payment->isExpired()) {
            return response()->json(['error' => 'Transaksi sudah kadaluarsa.'], 422);
        }

        try {
            \Midtrans\Config::$serverKey    = config('midtrans.server_key');
            \Midtrans\Config::$isProduction = config('midtrans.is_production');
            \Midtrans\Config::$isSanitized  = true;
            \Midtrans\Config::$is3ds        = true;

            $params = [
                'transaction_details' => [
                    'order_id'     => $payment->order_id,
                    'gross_amount' => (int) $payment->final_amount,
                ],
                'customer_details' => [
                    'first_name' => $candidate->full_name,
                    'email'      => $candidate->user->email,
                    'phone'      => $candidate->phone_number,
                ],
                'callbacks' => [
                    'finish' => route('dashboard.pembayaran'),
                ],
            ];

            $snapToken = \Midtrans\Snap::getSnapToken($params);
            $payment->updateQuietly(['snap_token' => $snapToken]);

            return response()->json(['snap_token' => $snapToken]);

        } catch (\Exception $e) {
            Log::error('PaymentController@snapToken failed', [
                'payment_id' => $payment->id,
                'error'      => $e->getMessage(),
            ]);
            return response()->json([
                'error' => 'Gagal menghubungi payment gateway. Silakan coba lagi.',
            ], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Upload Proof — Manual Channel Only
    // ─────────────────────────────────────────────────────────────────────

    public function uploadProof(Request $request): RedirectResponse
    {
        $request->validate([
            'proof' => [
                'required',
                'file',
                'mimes:jpeg,jpg,png,pdf',
                'mimetypes:image/jpeg,image/png,application/pdf',
                'max:5120',
            ],
        ]);

        $candidate = $request->user()->candidate()->first();

        $payment = Payment::where('candidate_id', $candidate->id)
            ->where('status', Payment::STATUS_PENDING)
            ->whereIn('payment_channel', [Payment::CHANNEL_TRANSFER, Payment::CHANNEL_CASH])
            ->latest()
            ->first();

        if (! $payment) {
            return back()->withErrors(['proof' => 'Transaksi tidak ditemukan.']);
        }

        if (! $payment->canUploadProof()) {
            return back()->withErrors(['proof' => 'Status transaksi tidak mengizinkan upload bukti.']);
        }

        try {
            $this->paymentService->uploadProof($payment, $request->file('proof'));
            return back()->with('success', 'Bukti pembayaran berhasil diupload. Menunggu verifikasi staff.');

        } catch (\Exception $e) {
            Log::error('PaymentController@uploadProof failed', [
                'payment_id'   => $payment->id,
                'candidate_id' => $candidate->id,
                'error'        => $e->getMessage(),
            ]);
            return back()->withErrors([
                'proof' => 'Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.',
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Cancel Payment
    // ─────────────────────────────────────────────────────────────────────

    public function cancel(Request $request, Payment $payment): RedirectResponse
    {
        // Pastikan payment milik kandidat yang login
        $candidate = $request->user()->candidate()->first();

        if ($payment->candidate_id !== $candidate->id) {
            abort(403);
        }

        if (! $payment->isCancellable()) {
            return back()->withErrors(['payment' => 'Transaksi tidak bisa dibatalkan.']);
        }

        try {
            DB::transaction(function () use ($payment) {
                $payment->updateQuietly([
                    'status'        => Payment::STATUS_CANCELLED,
                    'manual_status' => null,
                ]);
            });

            return back()->with('success', 'Transaksi berhasil dibatalkan.');

        } catch (\Exception $e) {
            Log::error('PaymentController@cancel failed', [
                'payment_id'   => $payment->id,
                'candidate_id' => $candidate->id,
                'error'        => $e->getMessage(),
            ]);
            return back()->withErrors([
                'payment' => 'Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.',
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private Formatters
    // ─────────────────────────────────────────────────────────────────────

    private function formatPayment(Payment $payment): array
    {
        return [
            'id'                      => $payment->id,
            'order_id'                => $payment->order_id,
            'payment_channel'         => $payment->payment_channel,
            'base_amount'             => (float) $payment->base_amount,
            'fee_amount'              => (float) $payment->fee_amount,
            'final_amount'            => (float) $payment->final_amount,
            'snap_token'              => $payment->snap_token,
            'payment_method'          => $payment->payment_method,
            'status'                  => $payment->status,
            'manual_status'           => $payment->manual_status,
            'proof_original_filename' => $payment->proof_original_filename,
            'proof_uploaded_at'       => $payment->proof_uploaded_at?->toISOString(),
            'proof_attempt'           => $payment->proof_attempt,
            'bank_name'               => $payment->bank_name,
            'account_name'            => $payment->account_name,
            'transfer_date'           => $payment->transfer_date?->toDateString(),
            'rejection_reason'        => $payment->rejection_reason,
            'paid_at'                 => $payment->paid_at?->toISOString(),
            'expired_at'              => $payment->expired_at?->toISOString(),
            'is_expired'              => $payment->isExpired(),
            'can_upload_proof'        => $payment->canUploadProof(),
            'is_cancellable'          => $payment->isCancellable(),
        ];
    }

    private function formatConfig(?\App\Models\PaymentConfig $config): ?array
    {
        if (! $config) {
            return null;
        }

        return [
            'gateway_fee_type'       => $config->gateway_fee_type,
            'gateway_fee_value'      => (float) $config->gateway_fee_value,
            'gateway_fee_label'      => $config->gateway_fee_label,
            'bank_name'              => $config->bank_name,
            'bank_account_number'    => $config->bank_account_number,
            'bank_account_name'      => $config->bank_account_name,
            'bank_logo_key'          => $config->bank_logo_key,
            'bank_logo_label'        => $config->bank_logo_label,
            'whatsapp_contact_label' => $config->whatsapp_contact_label,
        ];
    }
}