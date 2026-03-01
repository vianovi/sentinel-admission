<?php

namespace App\Http\Controllers;

use App\Models\AdmissionWave;
use App\Models\Candidate;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    public function index(): Response
    {
        /**
         * Aku ambil gelombang yang sedang aktif.
         * Hanya boleh ada 1 yang aktif di waktu yang sama —
         * ini sudah dijaga oleh AdmissionWaveSeeder via bulk update is_active = false.
         */
        $activeWave = AdmissionWave::where('is_active', true)
            ->withCount('candidates')  // quota_filled realtime via relasi
            ->first();

        return Inertia::render('Landing/Welcome', [
            'activeWave' => $activeWave ? [
                'id'                   => $activeWave->id,
                'title'                => $activeWave->title,
                'academic_year'        => $activeWave->academic_year,
                'registration_fee'     => $activeWave->registration_fee,
                'quota_target'         => $activeWave->quota_target,
                'candidates_count'     => $activeWave->candidates_count,
                'start_date'           => $activeWave->start_date,
                'end_date'             => $activeWave->end_date,
                'exam_info'            => $activeWave->exam_info,
                'announcement_info'    => $activeWave->announcement_info,
                'reregistration_date'  => $activeWave->reregistration_date,
                'is_active'            => $activeWave->is_active,
            ] : null,
        ]);
    }
}