<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StaffDashboardController extends Controller
{
    // =============================================
    // GET /dashboard/staff
    // =============================================
    public function index(Request $request): Response
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $query = Candidate::with(['user', 'admissionWave', 'documents'])
            ->when($search, fn ($q) => $q
                ->where('full_name', 'like', "%{$search}%")
                ->orWhere('nisn', 'like', "%{$search}%")
            )
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest();

        return Inertia::render('Dashboard/Staff/Index', [
            'stats' => [
                'total'      => Candidate::count(),
                'draft'      => Candidate::where('status', 'draft')->count(),
                'submitted'  => Candidate::where('status', 'submitted')->count(),
                'verified'   => Candidate::where('status', 'verified')->count(),
                'accepted'   => Candidate::where('status', 'accepted')->count(),
                'rejected'   => Candidate::where('status', 'rejected')->count(),
            ],
            'candidates' => $query->paginate(20)->through(fn ($c) => [
                'id'             => $c->id,
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
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    // =============================================
    // GET /dashboard/staff/candidates/{candidate}
    // Detail kandidat untuk verifikasi
    // =============================================
    public function show(Candidate $candidate): Response
    {
        $candidate->load(['user', 'admissionWave', 'documents', 'guardian', 'payments']);

        return Inertia::render('Dashboard/Staff/Show', [
            'candidate' => [
                'id'             => $candidate->id,
                'full_name'      => $candidate->full_name,
                'nisn'           => $candidate->nisn,
                'nik'            => $candidate->nik,
                'gender_label'   => $candidate->genderLabel(),
                'place_of_birth' => $candidate->place_of_birth,
                'date_of_birth'  => $candidate->date_of_birth?->format('d F Y'),
                'school_origin'  => $candidate->school_origin,
                'address_full'   => $candidate->address_full,
                'status'         => $candidate->status,
                'email'          => $candidate->user?->email,
                'admission_wave' => $candidate->admissionWave?->title,
            ],
            'documents' => $candidate->documents->map(fn ($d) => [
                'id'             => $d->id,
                'document_type'  => $d->document_type,
                'document_owner' => $d->document_owner,
                'file_path'      => $d->file_path,
                'status'         => $d->status,
                'admin_note'     => $d->admin_note,
            ])->values(),
            'guardian' => $candidate->guardian ? [
                'mother_name'      => $candidate->guardian->mother_name,
                'father_name'      => $candidate->guardian->father_name,
                'whatsapp_number'  => $candidate->guardian->whatsapp_number,
            ] : null,
        ]);
    }

    // =============================================
    // POST /dashboard/staff/documents/{document}/verify
    // Verifikasi satu dokumen
    // =============================================
    public function verifyDocument(Request $request, CandidateDocument $document): RedirectResponse
    {
        $request->validate([
            'status'     => ['required', 'in:valid,invalid'],
            'admin_note' => ['nullable', 'string', 'max:500'],
        ]);

        $document->update([
            'status'     => $request->status,
            'admin_note' => $request->admin_note,
        ]);

        // Kalau semua dokumen valid → update status candidate ke verified
        $candidate  = $document->candidate;
        $allValid   = $candidate->documents->every(fn ($d) => $d->status === 'valid');

        if ($allValid && $candidate->documents->count() > 0) {
            $candidate->update(['status' => 'verified']);
        }

        return back()->with('success', 'Dokumen berhasil diverifikasi.');
    }

    // =============================================
    // POST /dashboard/staff/candidates/{candidate}/status
    // Update status kandidat (accepted/rejected)
    // =============================================
    public function updateStatus(Request $request, Candidate $candidate): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'in:accepted,rejected'],
        ]);

        $candidate->update(['status' => $request->status]);

        return back()->with('success', 'Status kandidat berhasil diperbarui.');
    }
}
