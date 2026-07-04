<?php

namespace App\Http\Controllers\Dashboard\Candidate;

use App\Http\Controllers\Controller;
use App\Services\CandidatePanel\CandidateHelpCenterService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HelpController extends Controller
{
    public function __construct(
        private readonly CandidateHelpCenterService $helpCenter
    ) {}

    public function show(Request $request): Response
    {
        $user = $request->user();
        $candidate = $user->candidate()->first();

        return Inertia::render('Dashboard/Candidate/Bantuan', [
            'help_center' => $this->helpCenter->make($candidate, $user),
        ]);
    }
}
