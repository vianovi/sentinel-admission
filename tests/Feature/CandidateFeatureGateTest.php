<?php

use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\Guardian;
use App\Models\HealthRecord;
use App\Models\Payment;
use App\Models\User;
use App\Services\CandidateStatus\CandidateGateService;
use App\Services\CandidateStatus\CandidateStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function gateWave(): AdmissionWave
{
    return AdmissionWave::create([
        'title' => 'Gelombang Gate',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 150000,
        'quota_target' => 100,
        'is_active' => true,
    ]);
}

function gateUser(bool $verified = true): User
{
    $factory = User::factory();

    if (! $verified) {
        $factory = $factory->unverified();
    }

    return $factory->create([
        'role' => 'candidate',
        'email' => 'gate-'.uniqid().'@gmail.com',
    ]);
}

function gateCandidate(User $user, array $overrides = []): Candidate
{
    return Candidate::create(array_merge([
        'user_id' => $user->id,
        'admission_wave_id' => gateWave()->id,
        'candidate_code' => 'CDT-'.strtoupper(substr(uniqid(), -6)).'-26-G1',
        'nisn' => fake()->unique()->numerify('##########'),
        'nik' => fake()->unique()->numerify('################'),
        'full_name' => 'Kandidat Gate',
        'gender' => 'P',
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

function gateSubmitCandidate(User $user, array $candidateOverrides = [], array $healthOverrides = []): Candidate
{
    $candidate = gateCandidate($user, $candidateOverrides);

    Guardian::create([
        'candidate_id' => $candidate->id,
        'candidate_code' => $candidate->candidate_code,
        'mother_name' => 'Ibu Gate',
        'income_type' => 'separate',
        'father_status' => 'hidup',
        'father_name' => 'Ayah Gate',
        'father_nik' => '3201010101010101',
        'father_place_of_birth' => 'Bandung',
        'father_date_of_birth' => '1980-01-01',
        'father_education' => 'sma_smk_sederajat',
        'father_job_ktp' => 'Wiraswasta',
        'father_job_actual' => 'Wiraswasta',
        'father_income_range' => 'tidak_ingin_memberitahu',
        'father_phone' => '081234567892',
        'mother_status' => 'hidup',
        'mother_nik' => '3201010101010102',
        'mother_place_of_birth' => 'Bandung',
        'mother_date_of_birth' => '1982-01-01',
        'mother_education' => 'sma_smk_sederajat',
        'mother_job_ktp' => 'Ibu Rumah Tangga',
        'mother_job_actual' => 'Ibu Rumah Tangga',
        'mother_income_range' => 'tidak_ingin_memberitahu',
        'mother_phone' => '081234567891',
        'mother_province' => 'Jawa Barat',
        'mother_city' => 'Bandung',
        'mother_district' => 'Coblong',
        'mother_village' => 'Dago',
        'mother_address' => 'Jl. Gate',
        'mother_postal_code' => '12345',
        'no_kk' => $candidate->family_card_number,
        'marital_status' => 'nikah_tercatat',
    ]);

    HealthRecord::create(array_merge([
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
    ], $healthOverrides));

    return $candidate->fresh();
}

function gateDocument(Candidate $candidate, string $type, string $status = 'verified'): CandidateDocument
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

function gateVerifiedRequiredDocuments(Candidate $candidate): void
{
    foreach ([
        'photo_formal',
        'birth_certificate',
        'family_card',
        'parent_id_card',
        'graduation_certificate',
        'report_card',
        'parent_statement',
    ] as $type) {
        gateDocument($candidate, $type);
    }
}

function gatePayment(Candidate $candidate, string $status = Payment::STATUS_PAID, string $channel = Payment::CHANNEL_TRANSFER): Payment
{
    return Payment::create([
        'candidate_id' => $candidate->id,
        'admission_wave_id' => $candidate->admission_wave_id,
        'candidate_code' => $candidate->candidate_code,
        'order_id' => $candidate->candidate_code.'-'.uniqid(),
        'payment_channel' => $channel,
        'base_amount' => 150000,
        'fee_amount' => 0,
        'final_amount' => 150000,
        'status' => $status,
        'manual_status' => $channel === Payment::CHANNEL_GATEWAY ? null : Payment::MANUAL_VERIFIED,
        'proof_uploaded_at' => $channel === Payment::CHANNEL_GATEWAY ? null : now(),
        'proof_attempt' => $channel === Payment::CHANNEL_GATEWAY ? 0 : 1,
        'paid_at' => $status === Payment::STATUS_PAID ? now() : null,
        'verified_at' => $channel === Payment::CHANNEL_GATEWAY ? null : now(),
        'expired_at' => now()->addDay(),
    ]);
}

function gateVerifiedCandidate(User $user): Candidate
{
    $candidate = gateSubmitCandidate($user, [], ['bpjs_card_path' => 'health/bpjs.pdf']);
    gateVerifiedRequiredDocuments($candidate);
    gatePayment($candidate);
    app(CandidateStatusService::class)->syncAfterEvent($candidate, 'test.gate_verified_fixture');

    return $candidate->fresh();
}

function gatePdfUpload(): UploadedFile
{
    return UploadedFile::fake()->createWithContent('dokumen.pdf', "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n");
}

it('locks document upload while candidate is draft', function () {
    $user = gateUser();
    gateCandidate($user, ['program_choice' => null]);

    $this->actingAs($user)
        ->post('/dashboard/data-dokumen/photo_formal')
        ->assertRedirect()
        ->assertSessionHasErrors('gate');
});

it('locks document upload while email is unverified', function () {
    $user = gateUser(false);
    gateSubmitCandidate($user);

    $this->actingAs($user)
        ->post('/dashboard/data-dokumen/photo_formal')
        ->assertRedirect()
        ->assertSessionHasErrors(['gate' => 'Verifikasi email terlebih dahulu untuk mengunggah dokumen.']);
});

it('allows document upload when candidate is submitted and email verified', function () {
    Storage::fake('private');

    $user = gateUser();
    $candidate = gateSubmitCandidate($user);

    $this->actingAs($user)
        ->post('/dashboard/data-dokumen/photo_formal', ['file' => gatePdfUpload()])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($candidate->documents()->where('doc_type', 'photo_formal')->exists())->toBeTrue();
});

it('locks payment creation while candidate is draft', function () {
    $user = gateUser();
    gateCandidate($user, ['program_choice' => null]);

    $this->actingAs($user)
        ->post('/dashboard/pembayaran', ['channel' => Payment::CHANNEL_TRANSFER])
        ->assertRedirect()
        ->assertSessionHasErrors('gate');
});

it('locks payment creation while email is unverified', function () {
    $user = gateUser(false);
    $candidate = gateSubmitCandidate($user);
    gateVerifiedRequiredDocuments($candidate);

    $this->actingAs($user)
        ->post('/dashboard/pembayaran', ['channel' => Payment::CHANNEL_TRANSFER])
        ->assertRedirect()
        ->assertSessionHasErrors(['gate' => 'Verifikasi email terlebih dahulu sebelum melakukan pembayaran.']);
});

it('locks payment creation when mandatory documents are not uploaded', function () {
    $user = gateUser();
    gateSubmitCandidate($user); // Documents not uploaded

    $this->actingAs($user)
        ->post('/dashboard/pembayaran', ['channel' => Payment::CHANNEL_TRANSFER])
        ->assertRedirect()
        ->assertSessionHasErrors(['gate' => 'Unggah semua dokumen wajib terlebih dahulu sebelum melakukan pembayaran.']);
});

it('allows payment creation when candidate is submitted and email verified', function () {
    $user = gateUser();
    $candidate = gateSubmitCandidate($user);
    gateVerifiedRequiredDocuments($candidate);

    $this->actingAs($user)
        ->post('/dashboard/pembayaran', ['channel' => Payment::CHANNEL_TRANSFER])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($candidate->payments()->where('status', Payment::STATUS_PENDING)->exists())->toBeTrue();
});

it('shows a locked exam page until candidate is verified', function () {
    $user = gateUser();
    gateSubmitCandidate($user);

    $this->actingAs($user)
        ->get('/dashboard/seleksi')
        ->assertOk()
        ->assertSee('Dokumen dan pembayaran harus diverifikasi terlebih dahulu.');
});

it('locks exam access with custom message if candidate has session but payment is not paid', function () {
    $user = gateUser();
    $candidate = gateSubmitCandidate($user);
    $subject = \App\Models\Exam\ExamSubject::create(['code' => 'UMUM01', 'name' => 'Math']);
    $package = \App\Models\Exam\ExamPackage::create(['exam_subject_id' => $subject->id, 'title' => 'Pkg', 'duration_minutes' => 60, 'passing_score' => 70, 'max_attempts' => 1, 'status' => 'published']);
    $session = \App\Models\Exam\ExamSession::create(['exam_package_id' => $package->id, 'title' => 'S1', 'status' => 'published', 'opens_at' => now(), 'closes_at' => now()->addHour(), 'duration_minutes' => 60, 'passing_score' => 70, 'max_attempts' => 1]);
    \App\Models\Exam\ExamSessionCandidate::create([
        'exam_session_id' => $session->id,
        'candidate_id' => $candidate->id,
        'status' => 'eligible',
    ]);

    $this->actingAs($user)
        ->get('/dashboard/seleksi')
        ->assertOk()
        ->assertSee('Sesi ujian tersedia, silakan selesaikan pembayaran pendaftaran untuk memulai.');
});

it('allows exam access when candidate is submitted, has session, and payment is paid', function () {
    $user = gateUser();
    $candidate = gateSubmitCandidate($user);
    gatePayment($candidate, \App\Models\Payment::STATUS_PAID, \App\Models\Payment::CHANNEL_TRANSFER);

    $subject = \App\Models\Exam\ExamSubject::create(['code' => 'UMUM01', 'name' => 'Math']);
    $package = \App\Models\Exam\ExamPackage::create(['exam_subject_id' => $subject->id, 'title' => 'Pkg', 'duration_minutes' => 60, 'passing_score' => 70, 'max_attempts' => 1, 'status' => 'published']);
    $session = \App\Models\Exam\ExamSession::create(['exam_package_id' => $package->id, 'title' => 'S1', 'status' => 'published', 'opens_at' => now(), 'closes_at' => now()->addHour(), 'duration_minutes' => 60, 'passing_score' => 70, 'max_attempts' => 1]);
    \App\Models\Exam\ExamSessionCandidate::create([
        'exam_session_id' => $session->id,
        'candidate_id' => $candidate->id,
        'status' => 'eligible',
    ]);

    $this->actingAs($user)
        ->get('/dashboard/seleksi')
        ->assertOk()
        ->assertDontSee('Sesi ujian tersedia, silakan selesaikan pembayaran pendaftaran untuk memulai.')
        ->assertDontSee('Dokumen dan pembayaran harus diverifikasi terlebih dahulu.');
});

it('shows a locked exam page while email is unverified', function () {
    $user = gateUser(false);
    gateVerifiedCandidate($user);

    $this->actingAs($user)
        ->get('/dashboard/seleksi')
        ->assertOk()
        ->assertSee('Verifikasi email terlebih dahulu untuk mengakses ujian seleksi.');
});

it('returns human-readable gate reasons', function () {
    $user = gateUser(false);
    $candidate = gateCandidate($user, ['program_choice' => null]);

    $summary = app(CandidateGateService::class)->summary($candidate, $user);

    expect($summary['documents']['reasons'])->toContain(
        'Lengkapi Data Diri, Data Wali, dan Data Kesehatan terlebih dahulu.',
        'Verifikasi email terlebih dahulu untuk mengunggah dokumen.'
    )
        ->and($summary['payment']['reasons'])->toContain(
            'Lengkapi data pendaftaran terlebih dahulu sebelum melakukan pembayaran.',
            'Verifikasi email terlebih dahulu sebelum melakukan pembayaran.'
        )
        ->and($summary['exam']['reasons'])->toContain(
            'Lengkapi data pendaftaran terlebih dahulu.',
            'Verifikasi email terlebih dahulu untuk mengakses ujian seleksi.'
        );
});

it('syncs candidate verification when a gateway webhook marks payment paid', function () {
    config(['midtrans.server_key' => 'test-server-key']);

    $user = gateUser();
    $candidate = gateSubmitCandidate($user, [], ['bpjs_card_path' => 'health/bpjs.pdf']);
    gateVerifiedRequiredDocuments($candidate);
    $payment = gatePayment($candidate, Payment::STATUS_PENDING, Payment::CHANNEL_GATEWAY);

    $payload = [
        'order_id' => $payment->order_id,
        'status_code' => '200',
        'gross_amount' => '150000.00',
        'transaction_status' => 'settlement',
        'fraud_status' => 'accept',
        'payment_type' => 'bank_transfer',
        'transaction_id' => 'midtrans-'.uniqid(),
    ];
    $payload['signature_key'] = hash(
        'sha512',
        $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'test-server-key'
    );

    $this->postJson('/payment/webhook', $payload)
        ->assertOk();

    expect($payment->fresh()->status)->toBe(Payment::STATUS_PAID)
        ->and($candidate->fresh()->status)->toBe('verified');
});
