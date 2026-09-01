<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::with('candidate');

        // 1. Search logic
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('whatsapp_number', 'like', "%{$search}%")
                    ->orWhereHas('candidate', function ($cQuery) use ($search) {
                        $cQuery->where('candidate_code', 'like', "%{$search}%")
                            ->orWhere('nik', 'like', "%{$search}%")
                            ->orWhere('nisn', 'like', "%{$search}%");
                    });
            });
        }

        // 2. Role filter
        if ($request->filled('role') && $request->input('role') !== 'all') {
            $query->where('role', $request->input('role'));
        }

        // 3. Status filter (aktif, nonaktif, menunggu_verifikasi)
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $status = $request->input('status');
            if ($status === 'aktif') {
                $query->where('is_active', true)->where(function ($q) {
                    $q->where('role', '!=', 'candidate')
                        ->orWhereHas('candidate', fn ($c) => $c->whereNotIn('status', ['draft', 'submitted']));
                });
            } elseif ($status === 'nonaktif') {
                $query->where('is_active', false);
            } elseif ($status === 'menunggu_verifikasi') {
                $query->where('is_active', true)
                    ->where('role', 'candidate')
                    ->whereHas('candidate', fn ($c) => $c->where('status', 'submitted'));
            }
        }

        // 4. Program Studi Filter (Khusus Candidate)
        if ($request->filled('program_choice') && $request->input('program_choice') !== 'all') {
            $program = $request->input('program_choice');
            $query->whereHas('candidate', fn ($c) => $c->where('program_choice', $program));
        }

        // 5. Sortir
        $sort = $request->input('sort', 'terbaru');
        if ($sort === 'terbaru') {
            $query->latest();
        } elseif ($sort === 'abjad') {
            $query->orderBy('name', 'asc');
        } elseif ($sort === 'terlama') {
            $query->oldest();
        }

        $users = $query->paginate(15)->withQueryString()->through(fn ($user) => [
            'id' => $user->id,
            'identifier' => $user->role === 'candidate' && $user->candidate
                ? ($user->candidate->candidate_code ?? $user->candidate->nisn ?? 'CAND-'.$user->id)
                : strtoupper(substr($user->role, 0, 3)).'-'.str_pad($user->id, 4, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'whatsapp_number' => $user->whatsapp_number,
            'is_active' => $user->is_active,
            'account_status' => ! $user->is_active
                ? 'nonaktif'
                : ($user->role === 'candidate' && $user->candidate?->status === 'submitted' ? 'menunggu_verifikasi' : 'aktif'),
            'program_choice' => $user->candidate?->program_choice,
            'created_at' => $user->created_at->format('Y-m-d H:i:s'),
            'avatar_url' => $user->avatar_url,
            'initials' => $user->initials,
        ]);

        // Gather list of unique program choices for the filter dropdown
        $programChoices = Candidate::whereNotNull('program_choice')->distinct()->pluck('program_choice')->values()->toArray();

        // Optimize stats queries into a single database aggregate where possible
        $userAggregates = User::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as suspended,
            SUM(CASE WHEN role = 'candidate' THEN 1 ELSE 0 END) as candidate_count,
            SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as student_count,
            SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) as staff_count,
            SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count
        ")->first();

        // 1 separate query for pending verification due to relation
        $pendingVerificationCount = Candidate::where('status', 'submitted')
            ->whereHas('user', fn ($q) => $q->where('role', 'candidate')->where('is_active', true))
            ->count();

        // Registration trend last 6 months (optimized with select rather than eager fetch everything)
        $trendData = User::where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->select('id', 'created_at')
            ->get()
            ->groupBy(fn ($u) => $u->created_at->format('M Y'))
            ->map(fn ($g, $m) => ['month' => $m, 'total' => $g->count()])
            ->values()
            ->toArray();

        return Inertia::render('Dashboard/Admin/Users', [
            'users' => $users,
            'filters' => (object) $request->only(['search', 'role', 'status', 'program_choice', 'sort']),
            'programChoices' => $programChoices,
            'stats' => [
                'total' => (int) $userAggregates->total,
                'active' => (int) $userAggregates->active,
                'suspended' => (int) $userAggregates->suspended,
                'pending_verification' => $pendingVerificationCount,
                'role_distribution' => [
                    'candidate' => (int) $userAggregates->candidate_count,
                    'student' => (int) $userAggregates->student_count,
                    'staff' => (int) $userAggregates->staff_count,
                    'admin' => (int) $userAggregates->admin_count,
                ],
                'registration_trend' => $trendData,
            ],
        ]);
    }

    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->id === $user->id) {
            return back()->with('error', 'Anda tidak dapat menangguhkan (suspend) akun Anda sendiri.');
        }

        $user->update([
            'is_active' => ! $user->is_active,
        ]);

        $status = $user->is_active ? 'diaktifkan' : 'ditangguhkan (suspend)';

        return back()->with('success', "Akun pengguna {$user->name} berhasil {$status}.");
    }
}
