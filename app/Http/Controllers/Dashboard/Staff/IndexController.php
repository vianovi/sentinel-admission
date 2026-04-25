<?php

namespace App\Http\Controllers\Dashboard\Staff;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class IndexController extends Controller
{
    // =============================================
    // GET /dashboard/staff
    // =============================================

    public function index(): Response
    {
        return Inertia::render('Dashboard/Staff/Index', [
            'stats' => [
                'total'     => Candidate::count(),
                'draft'     => Candidate::where('status', 'draft')->count(),
                'submitted' => Candidate::where('status', 'submitted')->count(),
                'verified'  => Candidate::where('status', 'verified')->count(),
                'accepted'  => Candidate::where('status', 'accepted')->count(),
                'rejected'  => Candidate::where('status', 'rejected')->count(),
            ],
            'recent_submissions' => Candidate::with('admissionWave')
                ->where('status', 'submitted')
                ->latest()
                ->take(5)
                ->get()
                ->map(fn ($c) => [
                    'id'             => $c->id,
                    'candidate_code' => $c->candidate_code,
                    'full_name'      => $c->full_name,
                    'school_origin'  => $c->school_origin,
                    'admission_wave' => $c->admissionWave?->title,
                    'created_at'     => $c->created_at->format('d M Y'),
                ]),
        ]);
    }

    // =============================================
    // GET /dashboard/staff/candidates
    // =============================================

    public function candidates(Request $request): Response
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');
        $wave   = $request->input('wave', '');

        $query = Candidate::with(['admissionWave', 'documents'])
            ->when($search, fn ($q) => $q
                ->where('full_name', 'like', "%{$search}%")
                ->orWhere('nisn', 'like', "%{$search}%")
                ->orWhere('candidate_code', 'like', "%{$search}%")
            )
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($wave,   fn ($q) => $q->where('admission_wave_id', $wave))
            ->latest();

        return Inertia::render('Dashboard/Staff/Candidates', [
            'candidates' => $query->paginate(20)->through(fn ($c) => [
                'id'             => $c->id,
                'candidate_code' => $c->candidate_code,
                'full_name'      => $c->full_name,
                'nisn'           => $c->nisn,
                'gender_label'   => $c->genderLabel(),
                'school_origin'  => $c->school_origin,
                'status'         => $c->status,
                'admission_wave' => $c->admissionWave?->title,
                'doc_count'      => $c->documents->count(),
                'doc_pending'    => $c->documents->where('status', 'pending')->count(),
                'created_at'     => $c->created_at->format('d M Y'),
            ]),
            'waves'   => AdmissionWave::select('id', 'title')->latest()->get(),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'wave'   => $wave,
            ],
        ]);
    }

    // =============================================
    // GET /dashboard/staff/candidates/{candidate}
    // =============================================

    public function show(Candidate $candidate): Response
    {
        $candidate->load(['user', 'admissionWave', 'documents.verifiedBy', 'guardian', 'healthRecord', 'payments']);

        return Inertia::render('Dashboard/Staff/Show', [
            'candidate' => [
                'id'             => $candidate->id,
                'candidate_code' => $candidate->candidate_code,
                'full_name'      => $candidate->full_name,
                'nisn'           => $candidate->nisn,
                'nik'            => $candidate->nik,
                'gender_label'   => $candidate->genderLabel(),
                'place_of_birth' => $candidate->place_of_birth,
                'date_of_birth'  => $candidate->date_of_birth?->format('d F Y'),
                'school_origin'  => $candidate->school_origin,
                'status'         => $candidate->status,
                'program_choice' => $candidate->program_choice,
                'email'          => $candidate->user?->email,
                'admission_wave' => $candidate->admissionWave?->title,
            ],
            'documents' => $candidate->documents->map(fn ($d) => [
                'id'                => $d->id,
                'doc_type'          => $d->doc_type,
                'doc_group'         => $d->doc_group,
                'original_filename' => $d->original_filename,
                'file_path'         => $d->file_path,
                'status'            => $d->status,
                'rejection_reason'  => $d->rejection_reason,
                'verified_by'       => $d->verifiedBy?->name,
                'verified_at'       => $d->verified_at?->format('d M Y H:i'),
            ])->values(),
            'guardian' => $candidate->guardian ? [
                'father_name'    => $candidate->guardian->father_name,
                'father_phone'   => $candidate->guardian->father_phone,
                'mother_name'    => $candidate->guardian->mother_name,
                'mother_phone'   => $candidate->guardian->mother_phone,
                'guardian_name'  => $candidate->guardian->guardian_name,
                'guardian_phone' => $candidate->guardian->guardian_phone,
                'no_kk'          => $candidate->guardian->no_kk,
            ] : null,
            'health_record' => $candidate->healthRecord ? [
                'blood_type'               => $candidate->healthRecord->blood_type,
                'rhesus'                   => $candidate->healthRecord->rhesus,
                'height_cm'                => $candidate->healthRecord->height_cm,
                'weight_kg'                => $candidate->healthRecord->weight_kg,
                'general_health_condition' => $candidate->healthRecord->general_health_condition,
            ] : null,
        ]);
    }

    // =============================================
    // POST /dashboard/staff/documents/{document}/verify
    // =============================================

    public function verifyDocument(Request $request, CandidateDocument $document): RedirectResponse
    {
        $request->validate([
            'status'           => ['required', 'in:verified,rejected'],
            'rejection_reason' => ['nullable', 'required_if:status,rejected', 'string', 'max:500'],
        ]);

        $document->update([
            'status'           => $request->status,
            'rejection_reason' => $request->status === 'rejected' ? $request->rejection_reason : null,
            'verified_by'      => Auth::id(),
            'verified_at'      => now(),
        ]);

        $candidate   = $document->candidate;
        $allVerified = $candidate->documents()->where('status', '!=', 'verified')->doesntExist();

        if ($allVerified && $candidate->documents()->count() > 0) {
            $candidate->update(['status' => 'verified']);
        }

        return back()->with('success', 'Dokumen berhasil diverifikasi.');
    }

    // =============================================
    // POST /dashboard/staff/candidates/{candidate}/status
    // =============================================

    public function updateStatus(Request $request, Candidate $candidate): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:accepted,rejected'],
            'reason' => ['nullable', 'required_if:status,rejected', 'string', 'max:500'],
        ]);

        if ($candidate->status !== 'verified') {
            return back()->withErrors([
                'status' => 'Status kandidat hanya bisa diubah setelah kandidat berstatus terverifikasi.',
            ]);
        }

        $candidate->update(['status' => $validated['status']]);

        return back()->with('success', 'Status kandidat berhasil diperbarui.');
    }
}
