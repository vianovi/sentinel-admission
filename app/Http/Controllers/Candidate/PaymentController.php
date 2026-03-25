<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Midtrans\Config;
use Midtrans\Snap;

class PaymentController extends Controller
{
    public function __construct()
    {
        Config::$serverKey    = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized  = true;
        Config::$is3ds        = true;
    }

    // =========================================================================
    // SHOW — GET /dashboard/pembayaran
    // =========================================================================

    public function show(Request $request): Response
    {
        $user      = $request->user();
        $candidate = $user->candidate()->with(['admissionWave', 'payments' => function ($q) {
            $q->latest()->limit(5);
        }])->firstOrFail();

        // Gate: hanya kandidat submitted/verified yang boleh akses
        if (! in_array($candidate->status, ['submitted', 'verified', 'accepted'])) {
            return Inertia::render('Errors/NotFound', ['comingSoon' => true]);
        }

        $wave           = $candidate->admissionWave;
        $activePayment  = $candidate->payments()->pending()->latest()->first();
        $paidPayment    = $candidate->payments()->paid()->latest()->first();

        return Inertia::render('Dashboard/Candidate/Pembayaran', [
            'user' => [
                'name'       => $user->name,
                'avatar_url' => $user->avatar_url,
                'initials'   => $user->initials,
            ],
            'candidate' => [
                'full_name'           => $candidate->full_name,
                'nisn'                => $candidate->nisn,
                'nik'                 => $candidate->nik,
                'gender_label'        => $candidate->genderLabel(),
                'date_of_birth_label' => $candidate->date_of_birth?->format('d F Y'),
                'school_origin'       => $candidate->school_origin,
                'status'              => $candidate->status,
                'program_choice'      => $candidate->program_choice,
                'admission_wave'      => $wave ? ['title' => $wave->title] : null,
            ],
            'wave' => $wave ? [
                'title'            => $wave->title,
                'academic_year'    => $wave->academic_year,
                'registration_fee' => $wave->registration_fee,
            ] : null,
            'active_payment' => $activePayment ? [
                'id'           => $activePayment->id,
                'order_id'     => $activePayment->order_id,
                'snap_token'   => $activePayment->snap_token,
                'amount'       => $activePayment->amount,
                'status'       => $activePayment->status,
                'expired_at'   => $activePayment->expired_at?->toIso8601String(),
                'payment_method' => $activePayment->payment_method,
            ] : null,
            'paid_payment' => $paidPayment ? [
                'order_id'       => $paidPayment->order_id,
                'amount'         => $paidPayment->amount,
                'payment_method' => $paidPayment->payment_method,
                'paid_at'        => $paidPayment->paid_at?->format('d F Y, H:i'),
            ] : null,
        ]);
    }

    // =========================================================================
    // CREATE — POST /dashboard/pembayaran
    // Buat transaksi baru. Cancel transaksi pending sebelumnya jika ada.
    // =========================================================================

    public function create(Request $request)
    {
        $user      = $request->user();
        $candidate = $user->candidate()->with('admissionWave')->firstOrFail();

        // Gate: hanya submitted
        if ($candidate->status !== 'submitted') {
            return back()->withErrors(['payment' => 'Status pendaftaran tidak memenuhi syarat untuk pembayaran.']);
        }

        $wave = $candidate->admissionWave;
        if (! $wave) {
            return back()->withErrors(['payment' => 'Data gelombang pendaftaran tidak ditemukan.']);
        }

        // Sudah punya pembayaran yang berhasil?
        if ($candidate->payments()->paid()->exists()) {
            return back()->withErrors(['payment' => 'Pembayaran sudah berhasil dilakukan.']);
        }

        DB::transaction(function () use ($candidate, $wave) {
            // Cancel semua transaksi pending lama ke Midtrans
            $pendingPayments = $candidate->payments()->pending()->get();
            foreach ($pendingPayments as $pending) {
                try {
                    \Midtrans\Transaction::cancel($pending->order_id);
                } catch (\Exception $e) {
                    // Silent — mungkin sudah expired di sisi Midtrans
                    Log::warning("Midtrans cancel failed for order {$pending->order_id}: " . $e->getMessage());
                }
                $pending->update(['status' => 'cancelled']);
            }

            // Generate order_id unik
            $orderId = $candidate->candidate_code . '-' . time();

            // Buat transaksi ke Midtrans
            $snapToken = Snap::getSnapToken([
                'transaction_details' => [
                    'order_id'     => $orderId,
                    'gross_amount' => (int) $wave->registration_fee,
                ],
                'customer_details' => [
                    'first_name' => $candidate->full_name,
                    'email'      => $candidate->user->email,
                    'phone'      => $candidate->phone_number ?? $candidate->user->whatsapp_number,
                ],
                'item_details' => [
                    [
                        'id'       => 'reg-fee',
                        'price'    => (int) $wave->registration_fee,
                        'quantity' => 1,
                        'name'     => 'Biaya Pendaftaran ' . $wave->title,
                    ],
                ],
                'expiry' => [
                    'unit'     => 'hours',
                    'duration' => 24,
                ],
            ]);

            // Simpan ke DB
            Payment::create([
                'candidate_id'     => $candidate->id,
                'admission_wave_id' => $wave->id,
                'candidate_code'   => $candidate->candidate_code,
                'order_id'         => $orderId,
                'snap_token'       => $snapToken,
                'amount'           => $wave->registration_fee,
                'status'           => 'pending',
                'expired_at'       => now()->addHours(24),
            ]);
        });

        return back()->with('success', 'Transaksi berhasil dibuat.');
    }

    // =========================================================================
    // CANCEL — DELETE /dashboard/pembayaran/{payment}
    // User batalkan transaksi pending — untuk ganti metode pembayaran
    // =========================================================================

    public function cancel(Request $request, Payment $payment)
    {
        $candidate = $request->user()->candidate()->firstOrFail();

        // IDOR protection
        if ($payment->candidate_id !== $candidate->id) {
            abort(403);
        }

        if (! $payment->isCancellable()) {
            return back()->withErrors(['payment' => 'Transaksi tidak dapat dibatalkan.']);
        }

        try {
            \Midtrans\Transaction::cancel($payment->order_id);
        } catch (\Exception $e) {
            Log::warning("Midtrans cancel failed for order {$payment->order_id}: " . $e->getMessage());
        }

        $payment->update(['status' => 'cancelled']);

        return back()->with('success', 'Transaksi dibatalkan. Silakan buat transaksi baru.');
    }
}
