<?php

namespace App\Http\Controllers\Dashboard\Candidate;

use App\Http\Controllers\Controller;
use App\Services\CandidateStatus\CandidateStatusService;
use App\Support\CandidateDashboardData;
use App\Support\CandidateRequestPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IndexController extends Controller
{
    public function __construct(
        private readonly CandidateStatusService $statusService
    ) {}

    // =========================================================================
    // DASHBOARD INDEX — GET /dashboard
    // =========================================================================

    public function index(Request $request): Response
    {
        $user      = $request->user();
        $user->loadMissing('pendingEmailReviewer');
        $candidate = $user->candidate()
            ->with([
                'admissionWave:id,title,academic_year,end_date,registration_fee',
                'registrationDraft:id,registration_code',
                'guardian:id,candidate_id,mother_name,mother_phone,mother_job_ktp,mother_income_range,income_type,father_status,mother_status,no_kk,marital_status,house_ownership,family_dependents,father_name,father_phone,father_job_ktp,father_income_range',
                'healthRecord:id,candidate_id,blood_type,rhesus,height_cm,weight_kg,general_health_condition,eye_right_type,eye_left_type,major_illnesses,last_illness,allergy_food,allergy_medicine,allergy_condition,physical_disabilities',
                'documents:id,candidate_id,doc_type,doc_group,status,rejection_reason,created_at,updated_at',
                'payments:id,candidate_id,order_id,payment_channel,base_amount,fee_amount,final_amount,payment_method,status,manual_status,proof_original_filename,proof_uploaded_at,bank_name,account_name,transfer_date,verified_at,rejection_reason,paid_at,expired_at,created_at',
            ])
            ->first();
        $emailChangeRequest = CandidateRequestPresenter::formatEmailChangeRequest($user);
        $dataChangeResult = CandidateRequestPresenter::formatDataChangeResult($candidate?->data_change_request);
        $pendingDataChangeRequest = CandidateRequestPresenter::formatPendingDataChangeRequest($candidate?->data_change_request);

        if (! $candidate) {
            return Inertia::render('Dashboard/Index', [
                'candidate'      => null,
                'dashboard'      => null,
                'email_verified' => $user->hasVerifiedEmail(),
                'email_change_request' => $emailChangeRequest,
                'data_change_request_result' => $dataChangeResult,
                'data_change_request_pending' => $pendingDataChangeRequest,
                'flash' => [
                    'success' => $request->session()->get('success'),
                    'error' => $request->session()->get('error'),
                ],
            ]);
        }

        $this->statusService->syncAfterEvent($candidate, 'candidate.dashboard.viewed');

        return Inertia::render('Dashboard/Index', [
            'candidate' => ['id' => $candidate->id],
            'dashboard' => CandidateDashboardData::make($candidate, $user),
            'email_verified' => $user->hasVerifiedEmail(),
            'email_change_request' => $emailChangeRequest,
            'data_change_request_result' => $dataChangeResult,
            'data_change_request_pending' => $pendingDataChangeRequest,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }
}
