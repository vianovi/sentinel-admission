<?php

use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\Guardian;
use App\Models\HealthRecord;
use App\Models\Payment;
use App\Models\User;
use App\Services\CandidateStatus\CandidateStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function statusFlowWave(): AdmissionWave
{
    return AdmissionWave::create([
        'title' => 'Gelombang Lifecycle',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 150000,
        'quota_target' => 100,
        'is_active' => true,
    ]);
}

function statusFlowUser(bool $verified = true): User
{
    $factory = User::factory();

    if (! $verified) {
        $factory = $factory->unverified();
    }

    return $factory->create([
        'role' => 'candidate',
        'email' => 'lifecycle-'.uniqid().'@gmail.com',
    ]);
}

function statusFlowCandidate(array $overrides = [], ?User $user = null): Candidate
{
    $user ??= statusFlowUser();
    $code = 'CDT-'.strtoupper(substr(uniqid(), -6)).'-26-G1';

    return Candidate::create(array_merge([
        'user_id' => $user->id,
        'admission_wave_id' => statusFlowWave()->id,
        'candidate_code' => $code,
        'nisn' => fake()->unique()->numerify('##########'),
        'nik' => fake()->unique()->numerify('################'),
        'full_name' => 'Kandidat Lifecycle',
        'gender' => 'L',
        'place_of_birth' => 'Bandung',
        'date_of_birth' => '2010-01-01',
        'school_origin' => 'SMP Test',
        'phone_number' => '081234567890',
        'religion' => 'Islam',
        'family_card_number' => fake()->unique()->numerify('################'),
        'postal_code' => '12345',
        'school_npsn' => '12345678',
        'program_choice' => 'Reguler',
        'status' => 'draft',
    ], $overrides));
}

function statusFlowGuardian(Candidate $candidate, array $overrides = []): Guardian
{
    return Guardian::create(array_merge([
        'candidate_id' => $candidate->id,
        'candidate_code' => $candidate->candidate_code,
        'mother_name' => 'Ibu Lifecycle',
        'income_type' => 'separate',
        'father_status' => 'hidup',
        'mother_status' => 'hidup',
        'no_kk' => $candidate->family_card_number,
        'marital_status' => 'nikah_tercatat',
    ], $overrides));
}

function statusFlowHealth(Candidate $candidate, array $overrides = []): HealthRecord
{
    return HealthRecord::create(array_merge([
        'candidate_id' => $candidate->id,
        'candidate_code' => $candidate->candidate_code,
        'blood_type' => 'A',
        'rhesus' => 'positive',
        'height_cm' => 160,
        'weight_kg' => 50,
        'general_health_condition' => 'Sehat',
        'eye_right_type' => 'normal',
        'eye_left_type' => 'normal',
        'major_illnesses' => 'Tidak ada',
        'last_illness' => 'Flu ringan',
        'allergy_food' => 'Tidak ada',
        'allergy_medicine' => 'Tidak ada',
        'allergy_condition' => 'Tidak ada',
        'physical_disabilities' => 'Tidak ada',
    ], $overrides));
}

function statusFlowDocument(Candidate $candidate, string $type, string $status = 'verified'): CandidateDocument
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

function statusFlowVerifiedRequiredDocuments(Candidate $candidate, array $except = []): void
{
    foreach (array_diff([
        'photo_formal',
        'birth_certificate',
        'family_card',
        'parent_id_card',
        'graduation_certificate',
        'report_card',
        'parent_statement',
    ], $except) as $type) {
        statusFlowDocument($candidate, $type);
    }
}

function statusFlowPaidPayment(Candidate $candidate): Payment
{
    return Payment::create([
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
    ]);
}

function statusFlowCompleteSubmittedCandidate(array $candidateOverrides = [], array $healthOverrides = []): Candidate
{
    $candidate = statusFlowCandidate($candidateOverrides);
    statusFlowGuardian($candidate);
    statusFlowHealth($candidate, $healthOverrides);

    return $candidate->fresh();
}

it('moves a candidate from draft to submitted when core requirements are complete', function () {
    $candidate = statusFlowCandidate();
    statusFlowGuardian($candidate);

    expect($candidate->fresh()->status)->toBe('draft');

    statusFlowHealth($candidate);

    expect($candidate->fresh()->status)->toBe('submitted');
});

it('does not remain stuck when the last completed field is marital status', function () {
    $candidate = statusFlowCandidate();
    $guardian = statusFlowGuardian($candidate, ['marital_status' => null]);
    statusFlowHealth($candidate);

    expect($candidate->fresh()->status)->toBe('draft');

    $guardian->update(['marital_status' => 'nikah_tercatat']);

    expect($candidate->fresh()->status)->toBe('submitted');
});

it('does not remain stuck when the last completed field is conditional guardian data', function () {
    $candidate = statusFlowCandidate();
    $guardian = statusFlowGuardian($candidate, [
        'marital_status' => 'cerai_hidup',
        'guardian_name' => 'Wali Lifecycle',
        'guardian_relation' => 'Paman',
        'guardian_date_of_birth' => '1980-01-01',
        'guardian_education' => 'sma_smk_sederajat',
        'guardian_phone' => '081234567891',
        'guardian_province' => 'Jawa Barat',
        'guardian_city' => 'Bandung',
        'guardian_district' => 'Coblong',
        'guardian_village' => 'Dago',
        'guardian_address' => 'Jl. Lifecycle',
        'guardian_postal_code' => null,
    ]);
    statusFlowHealth($candidate);

    expect($candidate->fresh()->status)->toBe('draft');

    $guardian->update(['guardian_postal_code' => '12345']);

    expect($candidate->fresh()->status)->toBe('submitted');
});

it('does not move to submitted when conditional guardian fields are missing', function () {
    $candidate = statusFlowCandidate();
    statusFlowGuardian($candidate, [
        'marital_status' => 'cerai_mati',
        'guardian_name' => 'Wali Lifecycle',
    ]);
    statusFlowHealth($candidate);

    expect($candidate->fresh()->status)->toBe('draft');
});

it('does not move to submitted when health requirements are incomplete', function () {
    $candidate = statusFlowCandidate();
    statusFlowGuardian($candidate);
    statusFlowHealth($candidate, ['allergy_condition' => null]);

    expect($candidate->fresh()->status)->toBe('draft');
});

it('does not jump unsafely from draft to verified when core requirements are incomplete', function () {
    $candidate = statusFlowCandidate(['program_choice' => null]);
    statusFlowGuardian($candidate);
    statusFlowHealth($candidate, ['bpjs_card_path' => 'health/bpjs.pdf']);
    statusFlowVerifiedRequiredDocuments($candidate);
    statusFlowPaidPayment($candidate);

    $result = app(CandidateStatusService::class)->syncAfterEvent($candidate, 'test.unsafe_draft_verified');

    expect($candidate->fresh()->status)->toBe('draft')
        ->and($result->verification->complete())->toBeTrue();
});

it('moves to verified only after required documents health document and payment are complete', function () {
    $candidate = statusFlowCompleteSubmittedCandidate([], ['bpjs_card_path' => 'health/bpjs.pdf']);
    statusFlowVerifiedRequiredDocuments($candidate, ['parent_statement']);
    statusFlowPaidPayment($candidate);

    app(CandidateStatusService::class)->syncAfterEvent($candidate, 'test.missing_document');
    expect($candidate->fresh()->status)->toBe('submitted');

    statusFlowDocument($candidate, 'parent_statement');
    app(CandidateStatusService::class)->syncAfterEvent($candidate, 'test.document_completed');

    expect($candidate->fresh()->status)->toBe('verified');
});

it('does not overwrite accepted or rejected final statuses', function () {
    $accepted = statusFlowCompleteSubmittedCandidate([], ['bpjs_card_path' => 'health/bpjs.pdf']);
    $accepted->updateQuietly(['status' => 'accepted']);

    $rejected = statusFlowCompleteSubmittedCandidate([], ['bpjs_card_path' => 'health/bpjs.pdf']);
    $rejected->updateQuietly(['status' => 'rejected']);

    app(CandidateStatusService::class)->syncAfterEvent($accepted, 'test.final_status');
    app(CandidateStatusService::class)->syncAfterEvent($rejected, 'test.final_status');

    expect($accepted->fresh()->status)->toBe('accepted')
        ->and($rejected->fresh()->status)->toBe('rejected');
});

it('requires a transfer letter for transfer candidates', function () {
    $candidate = statusFlowCompleteSubmittedCandidate(
        ['is_transfer' => true],
        ['bpjs_card_path' => 'health/bpjs.pdf']
    );
    statusFlowVerifiedRequiredDocuments($candidate);
    statusFlowPaidPayment($candidate);

    $result = app(CandidateStatusService::class)->syncAfterEvent($candidate, 'test.transfer_missing');

    expect($candidate->fresh()->status)->toBe('submitted')
        ->and($result->verification->missingKeys())->toContain('document.transfer_letter');

    statusFlowDocument($candidate, 'transfer_letter');
    app(CandidateStatusService::class)->syncAfterEvent($candidate, 'test.transfer_completed');

    expect($candidate->fresh()->status)->toBe('verified');
});

it('demotes a non-final verified candidate when verification requirements are no longer complete', function () {
    $candidate = statusFlowCompleteSubmittedCandidate([], ['bpjs_card_path' => 'health/bpjs.pdf']);
    statusFlowVerifiedRequiredDocuments($candidate);
    statusFlowPaidPayment($candidate);
    app(CandidateStatusService::class)->syncAfterEvent($candidate, 'test.verified');

    $document = $candidate->documents()->where('doc_type', 'family_card')->firstOrFail();
    $document->update(['status' => 'rejected']);
    app(CandidateStatusService::class)->syncAfterEvent($candidate, 'test.document_rejected');

    expect($candidate->fresh()->status)->toBe('submitted');
});

it('is idempotent across repeated sync calls', function () {
    $candidate = statusFlowCompleteSubmittedCandidate([], ['bpjs_card_path' => 'health/bpjs.pdf']);
    statusFlowVerifiedRequiredDocuments($candidate);
    statusFlowPaidPayment($candidate);

    $first = app(CandidateStatusService::class)->syncAfterEvent($candidate, 'test.first_sync');
    $second = app(CandidateStatusService::class)->syncAfterEvent($candidate, 'test.second_sync');

    expect($candidate->fresh()->status)->toBe('verified')
        ->and($first->changed())->toBeTrue()
        ->and($second->changed())->toBeFalse();
});
