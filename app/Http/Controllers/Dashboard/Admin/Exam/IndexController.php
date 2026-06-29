<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use App\Models\Exam\ExamAttempt;
use App\Models\Exam\ExamImportBatch;
use App\Models\Exam\ExamPackage;
use App\Models\Exam\ExamQuestion;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSubject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IndexController extends Controller
{
    public function index(Request $request): Response
    {
        $packagesByStatus = ExamPackage::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $attemptsByStatus = ExamAttempt::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('Dashboard/Admin/Exam/Index', [
            'stats' => [
                'subjects' => ExamSubject::count(),
                'packages' => ExamPackage::count(),
                'published_packages' => (int) ($packagesByStatus['published'] ?? 0),
                'sessions' => ExamSession::count(),
                'open_sessions' => ExamSession::where('status', 'published')
                    ->where('opens_at', '<=', now())
                    ->where('closes_at', '>', now())
                    ->count(),
                'questions' => ExamQuestion::where('is_active', true)->count(),
                'attempts_in_progress' => (int) ($attemptsByStatus['in_progress'] ?? 0),
                'attempts_submitted' => (int) (($attemptsByStatus['submitted'] ?? 0) + ($attemptsByStatus['auto_submitted'] ?? 0)),
            ],
            'recent_imports' => ExamImportBatch::with(['package:id,title', 'uploader:id,name'])
                ->latest()
                ->take(6)
                ->get()
                ->map(fn (ExamImportBatch $batch) => [
                    'id' => $batch->id,
                    'package_title' => $batch->package?->title,
                    'uploaded_by' => $batch->uploader?->name,
                    'original_filename' => $batch->original_filename,
                    'status' => $batch->status,
                    'total_rows' => $batch->total_rows,
                    'imported_rows' => $batch->imported_rows,
                    'failed_rows' => $batch->failed_rows,
                    'created_at' => $batch->created_at?->format('d M Y H:i'),
                ]),
            'upcoming_sessions' => ExamSession::with(['package:id,title'])
                ->whereIn('status', ['draft', 'published'])
                ->orderBy('opens_at')
                ->take(6)
                ->get()
                ->map(fn (ExamSession $session) => [
                    'id' => $session->id,
                    'title' => $session->title,
                    'package_title' => $session->package?->title,
                    'status' => $session->status,
                    'opens_at' => $session->opens_at?->format('d M Y H:i'),
                    'closes_at' => $session->closes_at?->format('d M Y H:i'),
                    'duration_minutes' => $session->duration_minutes,
                ]),
        ]);
    }
}
