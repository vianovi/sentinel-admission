<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    // =============================================
    // GET /dashboard/admin
    // =============================================
    public function index(): Response
    {
        $activeWave = AdmissionWave::where('is_active', true)->first();

        return Inertia::render('Dashboard/Admin/Index', [
            'stats' => [
                'total_candidates' => Candidate::count(),
                'total_staff'      => User::where('role', 'staff')->count(),
                'quota_target'     => $activeWave?->quota_target ?? 0,
                'quota_filled'     => Candidate::where('status', 'accepted')->count(),
                'pending_verify'   => Candidate::where('status', 'submitted')->count(),
                'by_status'        => [
                    'draft'     => Candidate::where('status', 'draft')->count(),
                    'submitted' => Candidate::where('status', 'submitted')->count(),
                    'verified'  => Candidate::where('status', 'verified')->count(),
                    'accepted'  => Candidate::where('status', 'accepted')->count(),
                    'rejected'  => Candidate::where('status', 'rejected')->count(),
                ],
            ],
            'active_wave'        => $activeWave ? [
                'id'           => $activeWave->id,
                'title'        => $activeWave->title,
                'academic_year'=> $activeWave->academic_year,
                'end_date'     => $activeWave->end_date?->format('d F Y'),
                'quota_target' => $activeWave->quota_target,
            ] : null,
            'recent_candidates'  => Candidate::with('user')
                ->latest()->take(5)->get()
                ->map(fn ($c) => [
                    'id'        => $c->id,
                    'full_name' => $c->full_name,
                    'nisn'      => $c->nisn,
                    'status'    => $c->status,
                    'created_at'=> $c->created_at->diffForHumans(),
                ]),
            'staff_list' => User::where('role', 'staff')
                ->latest()->get()
                ->map(fn ($s) => [
                    'id'         => $s->id,
                    'name'       => $s->name,
                    'email'      => $s->email,
                    'is_active'  => $s->is_active,
                    'created_at' => $s->created_at->format('d M Y'),
                ]),
        ]);
    }

    // =============================================
    // POST /dashboard/admin/staff/{user}/toggle
    // Suspend / aktifkan akun staff
    // =============================================
    public function toggleStaff(User $user): RedirectResponse
    {
        // Hanya bisa toggle role staff
        abort_if($user->role !== 'staff', 403);

        $user->update(['is_active' => ! $user->is_active]);

        $status = $user->is_active ? 'diaktifkan' : 'disuspend';

        return back()->with('success', "Akun staff berhasil {$status}.");
    }

    // =============================================
    // DELETE /dashboard/admin/candidates/{candidate}
    // Hapus data kandidat
    // =============================================
    public function deleteCandidate(Candidate $candidate): RedirectResponse
    {
        $candidate->delete();

        return back()->with('success', 'Data kandidat berhasil dihapus.');
    }

    // =============================================
    // POST /dashboard/admin/waves/{wave}/toggle
    // Buka / tutup gelombang pendaftaran
    // =============================================
    public function toggleWave(AdmissionWave $wave): RedirectResponse
    {
        // Nonaktifkan semua gelombang lain dulu
        if (! $wave->is_active) {
            AdmissionWave::where('id', '!=', $wave->id)
                ->update(['is_active' => false]);
        }

        $wave->update(['is_active' => ! $wave->is_active]);

        $status = $wave->is_active ? 'dibuka' : 'ditutup';

        return back()->with('success', "Gelombang pendaftaran berhasil {$status}.");
    }
}
