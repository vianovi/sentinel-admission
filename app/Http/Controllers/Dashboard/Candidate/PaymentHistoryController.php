<?php

namespace App\Http\Controllers\Dashboard\Candidate;

use App\Http\Controllers\Controller;
use App\Services\CandidatePanel\CandidatePaymentHistoryService;
use App\Services\CandidateStatus\CandidateStatusService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentHistoryController extends Controller
{
    public function __construct(
        private readonly CandidatePaymentHistoryService $history,
        private readonly CandidateStatusService $statusService
    ) {}

    public function index(Request $request): Response
    {
        $candidate = $request->user()->candidate()->firstOrFail();
        $this->statusService->syncAfterEvent($candidate, 'payment-history.viewed');

        return Inertia::render('Dashboard/Candidate/PaymentHistory', [
            'summary' => $this->history->summary($candidate),
            'payments' => $this->history->paginated($candidate),
        ]);
    }
}
