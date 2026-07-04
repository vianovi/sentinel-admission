<?php

namespace App\Http\Controllers\Dashboard\Candidate;

use App\Http\Controllers\Controller;
use App\Services\CandidateStatus\CandidateStatusService;
use App\Services\StatusPendaftaranService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StatusPendaftaranController extends Controller
{
    public function __construct(
        private readonly CandidateStatusService $statusService,
        private readonly StatusPendaftaranService $statusPendaftaran
    ) {}

    public function show(Request $request): Response
    {
        $user = $request->user();
        $candidate = $user->candidate()->first();

        if (! $candidate) {
            return Inertia::render('Dashboard/Candidate/StatusPendaftaran/Index', [
                'status_summary' => null,
            ]);
        }

        $this->statusService->syncAfterEvent($candidate, 'status-pendaftaran.candidate.viewed');

        return Inertia::render('Dashboard/Candidate/StatusPendaftaran/Index', [
            'status_summary' => $this->statusPendaftaran->forCandidate($candidate->fresh(), $user),
        ]);
    }
}
