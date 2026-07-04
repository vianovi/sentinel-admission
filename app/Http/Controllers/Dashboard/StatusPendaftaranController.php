<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
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

    public function show(Request $request, Candidate $candidate): Response
    {
        $scope = str_starts_with((string) $request->route()?->getName(), 'admin.')
            ? 'admin'
            : 'staff';

        $this->statusService->syncAfterEvent($candidate, "status-pendaftaran.{$scope}.viewed");

        return Inertia::render('Dashboard/StatusPendaftaran/Internal', [
            'scope' => $scope,
            'base_path' => "/dashboard/{$scope}",
            'status_summary' => $this->statusPendaftaran->forInternal($candidate->fresh(), $scope),
        ]);
    }
}
