<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use App\Services\Exam\ExamMonitoringService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringController extends Controller
{
    public function __construct(
        private readonly ExamMonitoringService $monitoring
    ) {}

    public function index(): Response
    {
        return Inertia::render('Dashboard/Admin/Exam/Monitoring', [
            'snapshot' => $this->monitoring->snapshot(),
            'feed_url' => route('admin.exams.monitoring.feed'),
            'display_url' => route('admin.exams.monitoring.display'),
        ]);
    }

    public function display(): Response
    {
        return Inertia::render('Dashboard/Admin/Exam/MonitoringDisplay', [
            'snapshot' => $this->monitoring->snapshot(),
            'feed_url' => route('admin.exams.monitoring.feed'),
        ]);
    }

    public function feed(): JsonResponse
    {
        return response()->json($this->monitoring->snapshot());
    }
}
