<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        // Status breakdown
        $statusBreakdown = Candidate::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $totalCandidates = Candidate::count();
        $totalPayments = Payment::where('status', 'paid')->sum('final_amount');

        $paymentStatuses = Payment::query()
            ->select('status', DB::raw('COUNT(*) as total'), DB::raw('SUM(final_amount) as total_amount'))
            ->groupBy('status')
            ->get();

        // 30 days trend
        $trend = Candidate::query()
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as total'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => Carbon::parse($row->date)->format('d M'),
                'total' => $row->total,
            ]);

        return Inertia::render('Dashboard/Admin/Reports', [
            'summary' => [
                'candidates' => [
                    'total' => $totalCandidates,
                    'draft' => (int) ($statusBreakdown['draft'] ?? 0),
                    'verified' => (int) ($statusBreakdown['verified'] ?? 0),
                    'accepted' => (int) ($statusBreakdown['accepted'] ?? 0),
                    'rejected' => (int) ($statusBreakdown['rejected'] ?? 0),
                ],
                'payments' => [
                    'total_revenue' => $totalPayments,
                    'breakdown' => $paymentStatuses,
                ],
            ],
            'charts' => [
                'trend' => $trend,
            ],
        ]);
    }
}
