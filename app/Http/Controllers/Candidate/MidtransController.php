<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\Notification;

class MidtransController extends Controller
{
    // =========================================================================
    // WEBHOOK — POST /payment/webhook
    //
    // Endpoint ini dipanggil Midtrans setiap kali status transaksi berubah.
    // TIDAK pakai auth middleware — Midtrans tidak kirim session/token Laravel.
    // Keamanan dijaga via signature verification.
    // =========================================================================

    public function handle(Request $request)
    {
        Config::$serverKey    = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');

        try {
            $notification = new Notification();

            $orderId           = $notification->order_id;
            $transactionStatus = $notification->transaction_status;
            $fraudStatus       = $notification->fraud_status;
            $paymentType       = $notification->payment_type;
            $transactionId     = $notification->transaction_id;
            $grossAmount       = $notification->gross_amount;

            // Verifikasi signature
            // Format: SHA512(order_id + status_code + gross_amount + server_key)
            $signatureKey = hash('sha512',
                $orderId .
                $notification->status_code .
                $grossAmount .
                config('midtrans.server_key')
            );

            if ($signatureKey !== $notification->signature_key) {
                Log::warning("Midtrans webhook: invalid signature for order {$orderId}");
                return response()->json(['message' => 'Invalid signature'], 403);
            }

            // Cari payment di DB
            $payment = Payment::where('order_id', $orderId)->first();
            if (! $payment) {
                Log::warning("Midtrans webhook: order not found {$orderId}");
                return response()->json(['message' => 'Order not found'], 404);
            }

            // Idempotency — kalau sudah paid, skip
            if ($payment->isPaid()) {
                return response()->json(['message' => 'Already processed']);
            }

            // Tentukan status berdasarkan response Midtrans
            $newStatus = $this->resolveStatus($transactionStatus, $fraudStatus);

            $payment->update([
                'status'                  => $newStatus,
                'payment_method'          => $paymentType,
                'midtrans_transaction_id' => $transactionId,
                'paid_at'                 => $newStatus === 'paid' ? now() : null,
                'metadata'                => $request->all(),
            ]);

            // Kalau paid → log untuk staff
            if ($newStatus === 'paid') {
                Log::info("Payment confirmed: order {$orderId}, candidate {$payment->candidate_code}");
            }

            return response()->json(['message' => 'OK']);

        } catch (\Exception $e) {
            Log::error("Midtrans webhook error: " . $e->getMessage());
            return response()->json(['message' => 'Internal error'], 500);
        }
    }

    // ─────────────────────────────────────────────
    // Resolve status Midtrans → status lokal kita
    // ─────────────────────────────────────────────

    private function resolveStatus(string $transactionStatus, ?string $fraudStatus): string
    {
        return match (true) {
            $transactionStatus === 'capture' && $fraudStatus === 'accept' => 'paid',
            $transactionStatus === 'settlement'                           => 'paid',
            $transactionStatus === 'cancel'                               => 'cancelled',
            $transactionStatus === 'deny'                                 => 'failed',
            $transactionStatus === 'expire'                               => 'expired',
            $transactionStatus === 'failure'                              => 'failed',
            default                                                       => 'pending',
        };
    }
}
