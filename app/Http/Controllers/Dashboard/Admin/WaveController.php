<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use App\Models\Candidate;
use Inertia\Inertia;
use Inertia\Response;

class WaveController extends Controller
{
    // =============================================
    // GET /dashboard/admin/waves
    // =============================================

    public function index(): Response
    {
        $waves = AdmissionWave::withCount('candidates')
            ->latest()
            ->get()
            ->map(fn ($w) => [
                'id'               => $w->id,
                'title'            => $w->title,
                'academic_year'    => $w->academic_year,
                'start_date'       => $w->start_date?->format('d M Y'),
                'end_date'         => $w->end_date?->format('d M Y'),
                'quota_target'     => $w->quota_target,
                'is_active'        => $w->is_active,
                'majors_enabled'   => $w->majors_enabled,
                'candidates_count' => $w->candidates_count,
                'quota_filled'     => Candidate::where('admission_wave_id', $w->id)
                    ->where('status', 'accepted')
                    ->count(),
            ]);

        return Inertia::render('Dashboard/Admin/Waves', [
            'waves' => $waves,
        ]);
    }
}
