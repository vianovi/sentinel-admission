<?php

// =============================================================================
// LOKASI FILE: app/Http/Controllers/Webhook/MidtransController.php
// =============================================================================

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService
    ) {}

    // =========================================================================
    // WEBHOOK — POST /payment/webhook
    //
    // Endpoint ini dipanggil Midtrans setiap kali status transaksi berubah.
    // TIDAK pakai auth middleware — Midtrans tidak kirim session/token Laravel.
    // Keamanan dijaga via signature verification.
    // =========================================================================

    public function handle(Request $request)
    {
        try {
            $this->paymentService->handleMidtransWebhook($request->all());

            return response()->json(['message' => 'OK']);

        } catch (\Exception $e) {
            Log::error('Midtrans webhook error: '.$e->getMessage());

            if ($e->getMessage() === 'Invalid webhook signature.') {
                return response()->json(['message' => 'Invalid signature'], 403);
            }

            return response()->json(['message' => 'Internal error'], 500);
        }
    }
}
