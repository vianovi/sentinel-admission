<?php

use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\HealthRecord;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function verificationStaff(): User
{
    return User::factory()->staff()->create([
        'email' => 'staff-verification@example.test',
    ]);
}

function verificationCandidate(array $overrides = []): Candidate
{
    $wave = AdmissionWave::create([
        'title' => 'Gelombang 1',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 150000,
        'quota_target' => 100,
        'is_active' => true,
    ]);

    $user = User::factory()->create([
        'role' => 'candidate',
        'email' => 'candidate-'.uniqid().'@gmail.com',
    ]);

    return Candidate::create(array_merge([
        'user_id' => $user->id,
        'admission_wave_id' => $wave->id,
        'candidate_code' => 'CDT-'.strtoupper(substr(uniqid(), -4)).'-26-G1',
        'nisn' => fake()->unique()->numerify('##########'),
        'nik' => fake()->unique()->numerify('################'),
        'full_name' => 'Kandidat Verifikasi',
        'gender' => 'L',
        'place_of_birth' => 'Bandung',
        'date_of_birth' => '2010-01-01',
        'school_origin' => 'SMP Test',
        'status' => 'submitted',
    ], $overrides));
}

function verificationDocument(Candidate $candidate, string $type, string $status = 'verified'): CandidateDocument
{
    return CandidateDocument::create([
        'candidate_id' => $candidate->id,
        'candidate_code' => $candidate->candidate_code,
        'doc_type' => $type,
        'doc_group' => CandidateDocument::getGroupForDocType($type) ?? 'identity',
        'original_filename' => "{$type}.pdf",
        'stored_filename' => "{$type}.pdf",
        'file_path' => "sentinel/candidates/{$candidate->candidate_code}/documents/{$type}.pdf",
        'mime_type' => 'application/pdf',
        'file_size_kb' => 1,
        'status' => $status,
    ]);
}

function verifiedRequiredDocuments(Candidate $candidate, array $except = []): void
{
    $types = [
        'photo_formal',
        'birth_certificate',
        'family_card',
        'parent_id_card',
        'graduation_certificate',
        'report_card',
        'parent_statement',
    ];

    foreach (array_diff($types, $except) as $type) {
        verificationDocument($candidate, $type);
    }
}

function paidTransferPayment(Candidate $candidate, array $overrides = []): Payment
{
    return Payment::create(array_merge([
        'candidate_id' => $candidate->id,
        'admission_wave_id' => $candidate->admission_wave_id,
        'candidate_code' => $candidate->candidate_code,
        'order_id' => $candidate->candidate_code.'-'.uniqid(),
        'payment_channel' => Payment::CHANNEL_TRANSFER,
        'base_amount' => 150000,
        'fee_amount' => 0,
        'final_amount' => 150000,
        'status' => Payment::STATUS_PAID,
        'manual_status' => Payment::MANUAL_VERIFIED,
        'proof_path' => "sentinel/candidates/{$candidate->candidate_code}/payments/proofs/proof.pdf",
        'proof_original_filename' => 'proof.pdf',
        'proof_uploaded_at' => now(),
        'proof_attempt' => 1,
        'paid_at' => now(),
        'verified_at' => now(),
    ], $overrides));
}

it('does not verify a candidate when only uploaded documents are verified', function () {
    $staff = verificationStaff();
    $candidate = verificationCandidate();
    $document = verificationDocument($candidate, 'photo_formal', 'pending');

    $this->actingAs($staff)
        ->post("/dashboard/staff/documents/{$document->id}/verify", [
            'status' => 'verified',
        ])
        ->assertRedirect();

    expect($candidate->fresh()->status)->toBe('submitted');
});

it('verifies a candidate only after required documents health document and payment are complete', function () {
    $staff = verificationStaff();
    $candidate = verificationCandidate();

    verifiedRequiredDocuments($candidate, ['parent_statement']);
    HealthRecord::create([
        'candidate_id' => $candidate->id,
        'candidate_code' => $candidate->candidate_code,
        'bpjs_card_path' => "sentinel/candidates/{$candidate->candidate_code}/health/bpjs-card/bpjs.pdf",
    ]);
    paidTransferPayment($candidate);

    $document = verificationDocument($candidate, 'parent_statement', 'pending');

    $this->actingAs($staff)
        ->post("/dashboard/staff/documents/{$document->id}/verify", [
            'status' => 'verified',
        ])
        ->assertRedirect();

    expect($candidate->fresh()->status)->toBe('verified');
});

it('re-evaluates candidate verification after staff verifies a transfer payment', function () {
    $staff = verificationStaff();
    $candidate = verificationCandidate();

    verifiedRequiredDocuments($candidate);
    HealthRecord::create([
        'candidate_id' => $candidate->id,
        'candidate_code' => $candidate->candidate_code,
        'bpjs_card_path' => "sentinel/candidates/{$candidate->candidate_code}/health/bpjs-card/bpjs.pdf",
    ]);

    $payment = paidTransferPayment($candidate, [
        'status' => Payment::STATUS_PENDING,
        'manual_status' => Payment::MANUAL_PROOF_UPLOADED,
        'paid_at' => null,
        'verified_at' => null,
    ]);

    $this->actingAs($staff)
        ->post("/dashboard/staff/payments/{$payment->id}/verify", [
            'status' => 'verified',
        ])
        ->assertRedirect();

    expect($candidate->fresh()->status)->toBe('verified')
        ->and($payment->fresh()->status)->toBe(Payment::STATUS_PAID);
});
