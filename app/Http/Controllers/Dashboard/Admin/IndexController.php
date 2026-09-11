<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
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

        $statusCounts = Candidate::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $paidPayments = Payment::where('status', Payment::STATUS_PAID);
        $totalRevenue = (float) $paidPayments->sum('final_amount');
        $paidCount = $paidPayments->count();

        $paymentMethodCounts = Payment::select('payment_channel', DB::raw('count(*) as count'))
            ->groupBy('payment_channel')
            ->pluck('count', 'payment_channel');

        // Registration Trend (7 days)
        $subDays = 6;
        $trendRaw = Candidate::where('created_at', '>=', now()->subDays($subDays)->startOfDay())
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date');

        $registrationTrend = [];
        for ($i = $subDays; $i >= 0; $i--) {
            $dateObj = now()->subDays($i);
            $dateKey = $dateObj->format('Y-m-d');
            $registrationTrend[] = [
                'date' => $dateObj->translatedFormat('d M'),
                'count' => $trendRaw->get($dateKey, 0),
            ];
        }

        $draftCount = $statusCounts->get('draft', 0);
        $submittedCount = $statusCounts->get('submitted', 0);
        $verifiedCount = $statusCounts->get('verified', 0);
        $acceptedCount = $statusCounts->get('accepted', 0);
        $rejectedCount = $statusCounts->get('rejected', 0);
        $totalCandidates = $statusCounts->sum();

        return Inertia::render('Dashboard/Admin/Index', [
            'stats' => [
                'total_users' => User::count(),
                'total_candidates' => $totalCandidates,
                'total_staff' => User::where('role', 'staff')->count(),
                'quota_target' => $activeWave?->quota_target ?? 0,
                'quota_filled' => $acceptedCount,
                'pending_verify' => $submittedCount,
                'paid_count' => $paidCount,
                'total_revenue' => $totalRevenue,
                'by_status' => [
                    'draft' => $draftCount,
                    'submitted' => $submittedCount,
                    'verified' => $verifiedCount,
                    'accepted' => $acceptedCount,
                    'rejected' => $rejectedCount,
                ],
            ],
            'registration_trend' => $registrationTrend,
            'payment_stats' => [
                'gateway' => $paymentMethodCounts->get(Payment::CHANNEL_GATEWAY, 0),
                'transfer' => $paymentMethodCounts->get(Payment::CHANNEL_TRANSFER, 0),
                'cash' => $paymentMethodCounts->get(Payment::CHANNEL_CASH, 0),
            ],
            'active_wave' => $activeWave ? [
                'id' => $activeWave->id,
                'title' => $activeWave->title,
                'academic_year' => $activeWave->academic_year,
                'end_date' => $activeWave->end_date?->format('d F Y'),
                'quota_target' => $activeWave->quota_target,
            ] : null,
            'recent_candidates' => Candidate::with(['user', 'admissionWave:id,title'])
                ->latest()->take(6)->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'full_name' => $c->full_name,
                    'candidate_code' => $c->candidate_code,
                    'nisn' => $c->nisn,
                    'status' => $c->status,
                    'wave' => $c->admissionWave?->title ?? '-',
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
