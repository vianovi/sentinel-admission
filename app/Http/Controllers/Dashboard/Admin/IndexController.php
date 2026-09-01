<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class IndexController extends Controller
{
    // =============================================
    // GET /dashboard/admin
    // =============================================

    public function index(): Response
    {
        $activeWave = AdmissionWave::where('is_active', true)->first();

        $statusCounts = Candidate::select('status', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        return Inertia::render('Dashboard/Admin/Index', [
            'stats' => [
                'total_candidates' => $statusCounts->sum(),
                'total_staff' => User::where('role', 'staff')->count(),
                'quota_target' => $activeWave?->quota_target ?? 0,
                'quota_filled' => $statusCounts->get('accepted', 0),
                'pending_verify' => $statusCounts->get('submitted', 0),
                'by_status' => [
                    'draft' => $statusCounts->get('draft', 0),
                    'submitted' => $statusCounts->get('submitted', 0),
                    'verified' => $statusCounts->get('verified', 0),
                    'accepted' => $statusCounts->get('accepted', 0),
                    'rejected' => $statusCounts->get('rejected', 0),
                ],
            ],
            'active_wave' => $activeWave ? [
                'id' => $activeWave->id,
                'title' => $activeWave->title,
                'academic_year' => $activeWave->academic_year,
                'end_date' => $activeWave->end_date?->format('d F Y'),
                'quota_target' => $activeWave->quota_target,
            ] : null,
            'recent_candidates' => Candidate::with('user')
                ->latest()->take(5)->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'full_name' => $c->full_name,
                    'nisn' => $c->nisn,
                    'status' => $c->status,
                    'created_at' => $c->created_at->diffForHumans(),
                ]),
            'staff_list' => User::where('role', 'staff')
                ->latest()->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'email' => $s->email,
                    'is_active' => $s->is_active,
                    'created_at' => $s->created_at->format('d M Y'),
                ]),
        ]);
    }

    // =============================================
    // POST /dashboard/admin/staff/{user}/toggle
    // =============================================

    public function toggleStaff(User $user): RedirectResponse
    {
        abort_if($user->role !== 'staff', 403);

        $user->update(['is_active' => ! $user->is_active]);

        $status = $user->is_active ? 'diaktifkan' : 'disuspend';

        return back()->with('success', "Akun staff berhasil {$status}.");
    }

    // =============================================
    // DELETE /dashboard/admin/candidates/{candidate}
    // =============================================

    public function deleteCandidate(Candidate $candidate): RedirectResponse
    {
        $candidate->delete();

        return back()->with('success', 'Data kandidat berhasil dihapus.');
    }

    // =============================================
    // POST /dashboard/admin/waves/{wave}/toggle
    // =============================================

    public function toggleWave(AdmissionWave $wave): RedirectResponse
    {
        if (! $wave->is_active) {
            AdmissionWave::where('id', '!=', $wave->id)
                ->update(['is_active' => false]);
        }

        $wave->update(['is_active' => ! $wave->is_active]);

        $status = $wave->is_active ? 'dibuka' : 'ditutup';

        return back()->with('success', "Gelombang pendaftaran berhasil {$status}.");
    }
}
