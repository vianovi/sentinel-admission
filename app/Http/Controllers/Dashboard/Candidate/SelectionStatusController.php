<?php

namespace App\Http\Controllers\Dashboard\Candidate;

use App\Http\Controllers\Controller;
use App\Services\CandidatePanel\CandidateSelectionCenterService;
use App\Services\CandidateStatus\CandidateStatusService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SelectionStatusController extends Controller
{
    public function __construct(
        private readonly CandidateSelectionCenterService $selectionCenter,
        private readonly CandidateStatusService $statusService
    ) {}

    public function show(Request $request): Response
    {
        $user = $request->user();
        $candidate = $user->candidate()->firstOrFail();
        $this->statusService->syncAfterEvent($candidate, 'selection-status.viewed');
        $candidate->refresh();

        return Inertia::render('Dashboard/Candidate/SelectionStatus', [
            'selection_status' => $this->selectionCenter->status($candidate, $user),
        ]);
    }
}
