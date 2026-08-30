<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use App\Models\Candidate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateController extends Controller
{
    // =============================================
    // GET /dashboard/admin/candidates
    // =============================================

    public function index(Request $request): Response
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');
        $wave = $request->input('wave', '');
        $program = $request->input('program', '');

        $query = Candidate::with(['admissionWave', 'documents'])
            ->when($search, fn ($q) => $q
                ->where('full_name', 'like', "%{$search}%")
                ->orWhere('nisn', 'like', "%{$search}%")
                ->orWhere('candidate_code', 'like', "%{$search}%")
            )
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($wave, fn ($q) => $q->where('admission_wave_id', $wave))
            ->when($program, fn ($q) => $q->where('program_choice', $program))
            ->latest();

        return Inertia::render('Dashboard/Admin/Candidates', [
            'candidates' => $query->paginate(20)->through(fn ($c) => [
                'id' => $c->id,
                'candidate_code' => $c->candidate_code,
                'full_name' => $c->full_name,
                'nisn' => $c->nisn,
                'gender_label' => $c->genderLabel(),
                'school_origin' => $c->school_origin,
                'program_choice' => $c->program_choice,
                'status' => $c->status,
                'admission_wave' => $c->admissionWave?->title,
                'doc_count' => $c->documents->count(),
                'doc_pending' => $c->documents->where('status', 'pending')->count(),
                'created_at' => $c->created_at->format('d M Y'),
            ]),
            'waves' => AdmissionWave::select('id', 'title')->latest()->get(),
            'filters' => compact('search', 'status', 'wave', 'program'),
        ]);
    }
}
