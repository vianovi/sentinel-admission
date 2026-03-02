<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user      = $request->user();
        $candidate = $user->candidate()
            ->with(['admissionWave', 'documents', 'payments'])
            ->first();

        // Kalau belum punya data candidate (edge case)
        if (! $candidate) {
            return Inertia::render('Dashboard/Index', [
                'candidate'      => null,
                'documents'      => [],
                'payment'        => null,
                'email_verified' => $user->hasVerifiedEmail(),
            ]);
        }

        // Payment terakhir
        $payment = $candidate->payments->sortByDesc('created_at')->first();

        return Inertia::render('Dashboard/Index', [
            'candidate' => [
                'id'                => $candidate->id,
                'full_name'         => $candidate->full_name,
                'nisn'              => $candidate->nisn,
                'nik'               => $candidate->nik,
                'gender'            => $candidate->gender,
                'gender_label'      => $candidate->genderLabel(),
                'place_of_birth'    => $candidate->place_of_birth,
                'date_of_birth'     => $candidate->date_of_birth?->format('d F Y'),
                'school_origin'     => $candidate->school_origin,
                'address_full'      => $candidate->address_full,
                'status'            => $candidate->status,
                'admission_wave'    => $candidate->admissionWave ? [
                    'title'        => $candidate->admissionWave->title,
                    'academic_year'=> $candidate->admissionWave->academic_year,
                    'end_date'     => $candidate->admissionWave->end_date?->format('d F Y'),
                ] : null,
            ],
            'documents' => $candidate->documents->map(fn ($d) => [
                'id'            => $d->id,
                'document_type' => $d->document_type,
                'document_owner'=> $d->document_owner,
                'status'        => $d->status,   // pending | valid | invalid
                'admin_note'    => $d->admin_note,
                'file_path'     => $d->file_path,
                'created_at'    => $d->created_at->diffForHumans(),
            ])->values(),
            'payment' => $payment ? [
                'id'               => $payment->id,
                'transaction_code' => $payment->transaction_code,
                'payment_method'   => $payment->payment_method,
                'expected_amount'  => $payment->expected_amount,
                'amount'           => $payment->amount,
                'status'           => $payment->status,   // pending | paid | failed
                'verified_at'      => $payment->verified_at?->format('d F Y'),
                'admin_note'       => $payment->admin_note,
            ] : null,
            'email_verified' => $user->hasVerifiedEmail(),
        ]);
    }
}
