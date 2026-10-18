<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemActivityLog;
use App\Models\SystemTrash;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $module = $request->input('module');
        $period = $request->input('period', 'all');

        $query = SystemActivityLog::with('actor:id,name,email,role')
            ->latest('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('actor_name', 'like', "%{$search}%")
                    ->orWhere('target_label', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%");
            });
        }

        if ($module && $module !== 'all') {
            $query->where('module', $module);
        }

        if ($period === 'today') {
            $query->whereDate('created_at', today());
        } elseif ($period === '7days') {
            $query->where('created_at', '>=', now()->subDays(7));
        } elseif ($period === '30days') {
            $query->where('created_at', '>=', now()->subDays(30));
        }

        $logs = $query->paginate(20)->withQueryString();

        $stats = [
            'total_30_days' => SystemActivityLog::where('created_at', '>=', now()->subDays(30))->count(),
            'media_activities' => SystemActivityLog::where('module', 'exam_media')->where('created_at', '>=', now()->subDays(30))->count(),
            'candidate_activities' => SystemActivityLog::where('module', 'candidate_draft')->where('created_at', '>=', now()->subDays(30))->count(),
            'total_in_trash' => SystemTrash::count(),
        ];

        return Inertia::render('Dashboard/Admin/System/ActivityLogs', [
            'logs' => $logs,
            'filters' => [
                'search' => $search ?? '',
                'module' => $module ?? 'all',
                'period' => $period,
            ],
            'stats' => $stats,
        ]);
    }
}
