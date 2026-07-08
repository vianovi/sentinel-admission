<?php

use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\Payment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function staffCandidateV2Wave(): AdmissionWave
{
    return AdmissionWave::create([
        'title' => 'Gelombang Staff V2',
        'academic_year' => '2026/2027',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'registration_fee' => 150000,
        'quota_target' => 100,
        'is_active' => true,
    ]);
}

function staffCandidateV2Candidate(AdmissionWave $wave, array $overrides = []): Candidate
{
    $user = User::factory()->create(['role' => 'candidate']);
    $status = $overrides['status'] ?? 'draft';
    unset($overrides['status']);

    $candidate = Candidate::create(array_merge([
        'user_id' => $user->id,
        'admission_wave_id' => $wave->id,
        'candidate_code' => 'CDT-'.strtoupper(substr(uniqid(), -6)).'-26-G1',
        'nisn' => fake()->unique()->numerify('##########'),
        'nik' => fake()->unique()->numerify('################'),
        'full_name' => 'Kandidat Staff V2',
        'gender' => 'L',
        'place_of_birth' => 'Bandung',
        'date_of_birth' => '2010-01-01',
        'school_origin' => 'SMP Staff V2',
        'program_choice' => 'Reguler',
        'status' => 'draft',
    ], $overrides));

    $candidate->updateQuietly(['status' => $status]);

    return $candidate->fresh();
}

it('keeps staff candidate search grouped when status filters are active', function () {
    $wave = staffCandidateV2Wave();
    $staff = User::factory()->staff()->create();

    staffCandidateV2Candidate($wave, [
        'full_name' => 'Alpha Draft Match',
        'candidate_code' => 'CDT-ALPHA-DRAFT',
        'nisn' => '1111111111',
        'nik' => '1111111111111111',
        'status' => 'draft',
    ]);

    staffCandidateV2Candidate($wave, [
        'full_name' => 'Alpha Submitted Match',
        'candidate_code' => 'CDT-ALPHA-SUB',
        'nisn' => '2222222222',
        'nik' => '2222222222222222',
        'status' => 'submitted',
    ]);

    staffCandidateV2Candidate($wave, [
        'full_name' => 'Beta Submitted',
        'candidate_code' => 'CDT-BETA-SUB',
        'nisn' => '3333333333',
        'nik' => '3333333333333333',
        'status' => 'submitted',
    ]);

    $this->actingAs($staff)
        ->get('/dashboard/staff/candidates?search=Alpha&status=submitted')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Staff/Candidates')
            ->where('filters.search', 'Alpha')
            ->where('filters.status', 'submitted')
            ->has('candidates.data', 1)
            ->where('candidates.data.0.full_name', 'Alpha Submitted Match')
            ->where('candidates.data.0.operational.action_needed.key', 'core-data')
        );
});

it('provides an operational overview on the staff candidate detail page', function () {
    $wave = staffCandidateV2Wave();
    $staff = User::factory()->staff()->create();
    $candidate = staffCandidateV2Candidate($wave, [
        'full_name' => 'Detail Overview Candidate',
        'candidate_code' => 'CDT-DETAIL-V2',
        'nisn' => '4444444444',
        'nik' => '4444444444444444',
        'program_choice' => 'Boarding',
        'status' => 'draft',
    ]);

    $this->actingAs($staff)
        ->get("/dashboard/staff/candidates/{$candidate->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Staff/Show')
            ->where('overview.identity.full_name', 'Detail Overview Candidate')
            ->where('overview.identity.program_choice', 'Boarding')
            ->where('overview.primary_blocker.key', 'core-data')
            ->has('overview.readiness', 6)
            ->has('overview.quick_links')
        );
});

it('exposes a filterable operational queue on the staff action page', function () {
    $wave = staffCandidateV2Wave();
    $staff = User::factory()->staff()->create();

    staffCandidateV2Candidate($wave, [
        'full_name' => 'Verified Without Session',
        'candidate_code' => 'CDT-NO-SESSION',
        'nisn' => '5555555555',
        'nik' => '5555555555555555',
        'status' => 'verified',
    ]);

    $this->actingAs($staff)
        ->get('/dashboard/staff/change-requests?bucket=exam_unassigned')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Operations/ChangeRequests')
            ->where('scope', 'staff')
            ->where('operational_queue.active_bucket', 'exam_unassigned')
            ->has('operational_queue.items', 1)
            ->where('operational_queue.items.0.bucket', 'exam_unassigned')
            ->where('operational_queue.items.0.candidate.full_name', 'Verified Without Session')
        );
});

it('renders staff payment operations as a transaction workspace with manual fallback review', function () {
    $wave = staffCandidateV2Wave();
    $staff = User::factory()->staff()->create();
    $gatewayCandidate = staffCandidateV2Candidate($wave, [
        'full_name' => 'Gateway Payment Candidate',
        'candidate_code' => 'CDT-PAY-GATEWAY',
        'nisn' => '6666666666',
        'nik' => '6666666666666666',
        'status' => 'submitted',
    ]);
    $manualCandidate = staffCandidateV2Candidate($wave, [
        'full_name' => 'Manual Payment Candidate',
        'candidate_code' => 'CDT-PAY-MANUAL',
        'nisn' => '7777777777',
        'nik' => '7777777777777777',
        'status' => 'submitted',
    ]);

    Payment::create([
        'candidate_id' => $gatewayCandidate->id,
        'admission_wave_id' => $wave->id,
        'candidate_code' => $gatewayCandidate->candidate_code,
        'order_id' => 'ORDER-GATEWAY-OPS',
        'payment_channel' => Payment::CHANNEL_GATEWAY,
        'base_amount' => 150000,
        'fee_amount' => 4500,
        'final_amount' => 154500,
        'payment_method' => 'bank_transfer',
        'midtrans_transaction_id' => 'MIDTRANS-OPS-001',
        'metadata' => [
            'transaction_status' => 'pending',
            'fraud_status' => 'accept',
            'gross_amount' => '154500.00',
        ],
        'status' => Payment::STATUS_PENDING,
        'expired_at' => now()->addDay(),
    ]);

    $manualPayment = Payment::create([
        'candidate_id' => $manualCandidate->id,
        'admission_wave_id' => $wave->id,
        'candidate_code' => $manualCandidate->candidate_code,
        'order_id' => 'ORDER-MANUAL-OPS',
        'payment_channel' => Payment::CHANNEL_TRANSFER,
        'base_amount' => 150000,
        'fee_amount' => 0,
        'final_amount' => 150000,
        'status' => Payment::STATUS_PENDING,
        'manual_status' => Payment::MANUAL_PROOF_UPLOADED,
        'proof_path' => "sentinel/candidates/{$manualCandidate->candidate_code}/payments/proofs/proof.pdf",
        'proof_original_filename' => 'proof.pdf',
        'proof_uploaded_at' => now(),
        'proof_attempt' => 1,
        'expired_at' => now()->addDays(2),
    ]);

    $this->actingAs($staff)
        ->get('/dashboard/staff/payment-operations?action=manual_review')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Staff/PaymentOperations')
            ->where('filters.action', 'manual_review')
            ->where('summary.total', 2)
            ->where('summary.manual_review', 1)
            ->has('payments.data', 1)
            ->where('payments.data.0.id', $manualPayment->id)
            ->where('payments.data.0.payment_channel', Payment::CHANNEL_TRANSFER)
            ->where('payments.data.0.can_verify', true)
            ->where('payments.data.0.action_state.key', 'manual_review')
            ->where('payments.data.0.amounts.final_amount', 150000)
            ->where('payments.data.0.proof.original_filename', 'proof.pdf')
        );
});

it('keeps gateway transactions readonly in staff payment operations', function () {
    $wave = staffCandidateV2Wave();
    $staff = User::factory()->staff()->create();
    $candidate = staffCandidateV2Candidate($wave, [
        'full_name' => 'Readonly Gateway Candidate',
        'candidate_code' => 'CDT-PAY-READONLY',
        'nisn' => '8888888888',
        'nik' => '8888888888888888',
        'status' => 'submitted',
    ]);

    $payment = Payment::create([
        'candidate_id' => $candidate->id,
        'admission_wave_id' => $wave->id,
        'candidate_code' => $candidate->candidate_code,
        'order_id' => 'ORDER-GATEWAY-READONLY',
        'payment_channel' => Payment::CHANNEL_GATEWAY,
        'base_amount' => 150000,
        'fee_amount' => 4500,
        'final_amount' => 154500,
        'payment_method' => 'bank_transfer',
        'midtrans_transaction_id' => 'MIDTRANS-READONLY-001',
        'metadata' => [
            'transaction_status' => 'pending',
            'fraud_status' => 'accept',
            'gross_amount' => '154500.00',
            'status_code' => '201',
        ],
        'status' => Payment::STATUS_PENDING,
        'expired_at' => now()->addDay(),
    ]);

    $this->actingAs($staff)
        ->get('/dashboard/staff/payment-operations?action=gateway_pending')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Staff/PaymentOperations')
            ->where('filters.action', 'gateway_pending')
            ->has('payments.data', 1)
            ->where('payments.data.0.id', $payment->id)
            ->where('payments.data.0.payment_channel', Payment::CHANNEL_GATEWAY)
            ->where('payments.data.0.can_verify', false)
            ->where('payments.data.0.proof.url', null)
            ->where('payments.data.0.midtrans_transaction_id', 'MIDTRANS-READONLY-001')
            ->where('payments.data.0.provider.transaction_status', 'pending')
            ->where('payments.data.0.provider.gross_amount', 154500)
        );
});

it('opens the staff reports workspace with real operational summaries and disabled export shell', function () {
    $wave = staffCandidateV2Wave();
    $staff = User::factory()->staff()->create();
    $candidate = staffCandidateV2Candidate($wave, [
        'full_name' => 'Report Workspace Candidate',
        'candidate_code' => 'CDT-REPORT-OPS',
        'nisn' => '9999999999',
        'nik' => '9999999999999999',
        'status' => 'submitted',
    ]);

    Payment::create([
        'candidate_id' => $candidate->id,
        'admission_wave_id' => $wave->id,
        'candidate_code' => $candidate->candidate_code,
        'order_id' => 'ORDER-REPORT-OPS',
        'payment_channel' => Payment::CHANNEL_GATEWAY,
        'base_amount' => 150000,
        'fee_amount' => 4500,
        'final_amount' => 154500,
        'status' => Payment::STATUS_PAID,
        'paid_at' => now(),
    ]);

    $this->actingAs($staff)
        ->get('/dashboard/staff/reports')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Staff/Reports')
            ->where('summary.candidates.total', 1)
            ->where('summary.candidates.submitted', 1)
            ->where('summary.payments.total', 1)
            ->where('summary.payments.paid', 1)
            ->where('summary.payments.paid_amount', 154500)
            ->has('summary.actions.buckets')
            ->has('charts.trend', 14)
            ->has('charts.payment_channels', 3)
            ->has('wave_reports', 1)
            ->where('wave_reports.0.wave', 'Gelombang Staff V2')
            ->where('wave_reports.0.program', 'Reguler')
            ->where('wave_reports.0.total', 1)
            ->where('wave_reports.0.paid', 1)
            ->has('recent_candidates', 1)
            ->where('recent_candidates.0.full_name', 'Report Workspace Candidate')
        );
});

it('opens staff report export settings as a placeholder without active download', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get('/dashboard/staff/reports/export-settings')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Staff/ReportsExportSettings')
            ->has('export_groups', 3)
            ->where('export_groups.0.key', 'payment_only')
            ->where('export_groups.1.key', 'quick_rekap')
            ->where('export_groups.2.key', 'full_data')
            ->where('export_state.download_enabled', false)
            ->where('export_state.generator_status', 'placeholder')
            ->where('export_state.download_url', null)
            ->where('export_state.default_group', 'quick_rekap')
        );
});

it('opens the staff candidate status aggregate workbench', function () {
    $wave = staffCandidateV2Wave();
    $staff = User::factory()->staff()->create();
    $candidate = staffCandidateV2Candidate($wave, [
        'full_name' => 'Status Workbench Candidate',
        'candidate_code' => 'CDT-STATUS-WB',
        'nisn' => '1010101010',
        'nik' => '1010101010101010',
        'status' => 'verified',
    ]);

    $this->actingAs($staff)
        ->get('/dashboard/staff/candidate-status?status=verified')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Staff/CandidateStatus')
            ->where('filters.status', 'verified')
            ->where('summary.total', 1)
            ->has('summary.pipeline', 5)
            ->has('summary.readiness', 6)
            ->has('summary.waiting_sides')
            ->has('rows', 1)
            ->where('rows.0.id', $candidate->id)
            ->where('rows.0.full_name', 'Status Workbench Candidate')
            ->where('rows.0.status', 'verified')
            ->where('rows.0.primary_blocker.key', 'core-data')
            ->has('rows.0.lifecycle_steps')
            ->has('rows.0.readiness', 6)
            ->has('rows.0.links.status_detail')
        );
});
