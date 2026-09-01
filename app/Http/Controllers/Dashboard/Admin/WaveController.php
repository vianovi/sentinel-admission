<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WaveController extends Controller
{
    // =============================================
    // GET /dashboard/admin/waves
    // =============================================

    public function index(): Response
    {
        $waves = AdmissionWave::withCount([
            'candidates',
            'candidates as quota_filled' => function ($q) {
                $q->where('status', 'accepted');
            },
        ])
            ->latest()
            ->get()
            ->map(fn ($w) => [
                'id' => $w->id,
                'title' => $w->title,
                'academic_year' => $w->academic_year,
                'description' => $w->description,
                'start_date_raw' => $w->start_date?->format('Y-m-d'),
                'end_date_raw' => $w->end_date?->format('Y-m-d'),
                'start_date' => $w->start_date?->format('d M Y'),
                'end_date' => $w->end_date?->format('d M Y'),
                'exam_info' => $w->exam_info,
                'announcement_info' => $w->announcement_info,
                'reregistration_date_raw' => $w->reregistration_date?->format('Y-m-d'),
                'reregistration_date' => $w->reregistration_date?->format('d M Y'),
                'registration_fee' => (float) $w->registration_fee,
                'quota_target' => $w->quota_target,
                'available_majors' => $w->available_majors ?? [],
                'is_active' => $w->is_active,
                'majors_enabled' => $w->majors_enabled,
                'candidates_count' => $w->candidates_count,
                'quota_filled' => $w->quota_filled,
            ]);

        return Inertia::render('Dashboard/Admin/Waves', [
            'waves' => $waves,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateWave($request);

        DB::transaction(function () use ($validated) {
            if ($validated['is_active']) {
                AdmissionWave::query()->update(['is_active' => false]);
            }

            AdmissionWave::create($validated);
        });

        return back()->with('success', 'Gelombang pendaftaran berhasil dibuat.');
    }

    public function update(Request $request, AdmissionWave $wave): RedirectResponse
    {
        $validated = $this->validateWave($request);

        DB::transaction(function () use ($wave, $validated) {
            if ($validated['is_active']) {
                AdmissionWave::query()
                    ->whereKeyNot($wave->id)
                    ->update(['is_active' => false]);
            }

            $wave->update($validated);
        });

        return back()->with('success', 'Gelombang pendaftaran berhasil diperbarui.');
    }

    public function destroy(AdmissionWave $wave): RedirectResponse
    {
        if ($wave->candidates()->exists()) {
            return back()->with('error', 'Gelombang yang sudah memiliki kandidat tidak bisa dihapus.');
        }

        $wave->delete();

        return back()->with('success', 'Gelombang pendaftaran berhasil dihapus.');
    }

    public function toggle(AdmissionWave $wave): RedirectResponse
    {
        DB::transaction(function () use ($wave) {
            if (! $wave->is_active) {
                AdmissionWave::query()
                    ->whereKeyNot($wave->id)
                    ->update(['is_active' => false]);
            }

            $wave->update(['is_active' => ! $wave->is_active]);
        });

        return back()->with('success', $wave->fresh()->is_active
            ? 'Gelombang berhasil diaktifkan.'
            : 'Gelombang berhasil dinonaktifkan.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateWave(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'academic_year' => ['required', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:1000'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'exam_info' => ['nullable', 'string', 'max:1000'],
            'announcement_info' => ['nullable', 'string', 'max:1000'],
            'reregistration_date' => ['nullable', 'date', 'after_or_equal:end_date'],
            'registration_fee' => ['required', 'numeric', 'min:0', 'max:999999999'],
            'quota_target' => ['required', 'integer', 'min:1', 'max:100000'],
            'available_majors' => ['nullable', 'array'],
            'available_majors.*' => ['string', 'max:100'],
            'majors_enabled' => ['boolean'],
            'is_active' => ['boolean'],
        ]);
    }
}
