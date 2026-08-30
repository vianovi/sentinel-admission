<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use App\Models\CandidateCalendarEvent;
use App\Models\CandidateCalendarSetting;
use App\Services\NationalHolidayService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function __construct(
        private readonly NationalHolidayService $holidayService,
    ) {}

    public function show(Request $request): Response
    {
        $user = $request->user();
        $settings = CandidateCalendarSetting::firstOrCreate(
            ['user_id' => $user->id],
            ['hide_javanese_calendar' => false],
        );

        return Inertia::render('Dashboard/Admin/Calendar', [
            'settings' => [
                'hide_javanese_calendar' => $settings->hide_javanese_calendar,
            ],
            'endpoints' => [
                'events' => route('admin.calendar.events'),
                'store' => route('admin.calendar.store'),
                'settings' => route('admin.calendar.settings.update'),
            ],
        ]);
    }

    public function events(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after:start'],
        ]);

        $start = Carbon::parse($validated['start'])->startOfDay();
        $endExclusive = Carbon::parse($validated['end'])->startOfDay();
        $endInclusive = $endExclusive->copy()->subDay()->endOfDay();

        // Get Global Admin events
        $customEvents = CandidateCalendarEvent::query()
            ->whereNull('candidate_id')
            ->whereBetween('event_date', [$start->toDateString(), $endInclusive->toDateString()])
            ->latest('event_date')
            ->get()
            ->map(fn ($event) => $this->formatCustomEvent($event))
            ->all();

        // Get active admission waves
        $activeWaves = AdmissionWave::query()
            ->where('is_active', true)
            ->get();

        $waveEvents = [];
        foreach ($activeWaves as $wave) {
            $waveEvents = array_merge($waveEvents, $this->buildAdmissionWaveEvents($wave, $start, $endInclusive));
        }

        $holidays = $this->holidayService->holidaysForYears(range((int) $start->year, (int) $endInclusive->year));
        $holidayEvents = $this->buildHolidayEvents($holidays, $start, $endInclusive);

        return response()->json([
            'events' => array_merge($customEvents, $waveEvents, $holidayEvents),
            'meta' => [
                'dates' => $this->buildDateMeta($start, $endInclusive, $holidays),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'event_date' => ['required', 'date'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'all_day' => ['required', 'boolean'],
            'type' => ['required', Rule::in(CandidateCalendarEvent::TYPES)],
            'status' => ['required', Rule::in(CandidateCalendarEvent::STATUSES)],
            'location' => ['nullable', 'string', 'max:160'],
        ]);

        CandidateCalendarEvent::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'candidate_id' => null, // Global event
            'event_date' => Carbon::parse($validated['event_date'])->toDateString(),
        ]);

        return back()->with('success', 'Agenda kalender global berhasil ditambahkan.');
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'hide_javanese_calendar' => ['required', 'boolean'],
        ]);

        CandidateCalendarSetting::updateOrCreate(
            ['user_id' => $request->user()->id],
            ['hide_javanese_calendar' => $validated['hide_javanese_calendar']],
        );

        return back()->with('success', 'Preferensi tampilan kalender tersimpan.');
    }

    private function formatCustomEvent(CandidateCalendarEvent $event): array
    {
        return [
            'id' => 'custom-'.$event->id,
            'source_id' => $event->id,
            'source' => 'custom',
            'title' => $event->title,
            'description' => $event->description,
            'start' => $event->starts_at?->toIso8601String() ?? $event->event_date->toDateString(),
            'end' => $event->ends_at?->toIso8601String(),
            'allDay' => $event->all_day,
            'type' => $event->type,
            'status' => $event->status,
            'location' => $event->location,
            'editable' => true,
        ];
    }

    private function buildAdmissionWaveEvents(AdmissionWave $wave, Carbon $start, Carbon $endInclusive): array
    {
        $events = [];
        $waveStart = $wave->start_date?->copy()->startOfDay();
        $waveEnd = $wave->end_date?->copy()->endOfDay();

        if ($waveStart && $waveEnd && $waveEnd->gte($start) && $waveStart->lte($endInclusive)) {
            $events[] = [
                'id' => 'wave-registration-'.$wave->id,
                'source' => 'admission_wave',
                'title' => 'Periode pendaftaran '.$wave->title,
                'description' => $wave->description,
                'start' => $waveStart->toDateString(),
                'end' => $waveEnd->copy()->addDay()->toDateString(),
                'allDay' => true,
                'type' => 'registration',
                'status' => $this->statusForRange($waveStart, $waveEnd),
                'location' => null,
                'editable' => false,
            ];

            $events[] = [
                'id' => 'wave-deadline-'.$wave->id,
                'source' => 'admission_wave',
                'title' => 'Batas akhir pendaftaran',
                'description' => 'Deadline pendaftaran untuk '.$wave->title,
                'start' => $wave->end_date->toDateString(),
                'end' => null,
                'allDay' => true,
                'type' => 'registration',
                'status' => $this->statusForDeadline($wave->end_date),
                'location' => null,
                'editable' => false,
            ];
        }

        if ($wave->reregistration_date && $wave->reregistration_date->betweenIncluded($start, $endInclusive)) {
            $events[] = [
                'id' => 'wave-reregistration-'.$wave->id,
                'source' => 'admission_wave',
                'title' => 'Deadline daftar ulang',
                'description' => 'Batas daftar ulang untuk '.$wave->title,
                'start' => $wave->reregistration_date->toDateString(),
                'end' => null,
                'allDay' => true,
                'type' => 'payment',
                'status' => $this->statusForDeadline($wave->reregistration_date),
                'location' => null,
                'editable' => false,
            ];
        }

        return $events;
    }

    private function buildHolidayEvents(array $holidays, Carbon $start, Carbon $endInclusive): array
    {
        return collect($holidays)
            ->filter(function (array $holiday) use ($start, $endInclusive) {
                $date = Carbon::parse($holiday['date']);

                return $date->betweenIncluded($start, $endInclusive);
            })
            ->map(fn (array $holiday) => [
                'id' => 'holiday-'.$holiday['date'].'-'.md5($holiday['name']),
                'source' => 'holiday_api',
                'title' => $holiday['name'],
                'description' => $holiday['type'] === 'leave'
                    ? 'Cuti bersama nasional'
                    : 'Hari libur nasional',
                'start' => $holiday['date'],
                'end' => null,
                'allDay' => true,
                'type' => 'holiday',
                'status' => Carbon::parse($holiday['date'])->isPast() ? 'completed' : 'scheduled',
                'location' => null,
                'editable' => false,
                'holidayType' => $holiday['type'],
            ])
            ->values()
            ->all();
    }

    private function buildDateMeta(Carbon $start, Carbon $endInclusive, array $holidays): array
    {
        $holidaysByDate = collect($holidays)->groupBy('date');
        $meta = [];

        foreach (CarbonPeriod::create($start, $endInclusive) as $date) {
            $isoDate = $date->toDateString();
            $dayHolidays = $holidaysByDate->get($isoDate, collect())->values();

            $meta[$isoDate] = [
                'date' => $isoDate,
                'isWeekend' => $date->isWeekend(),
                'isHoliday' => $dayHolidays->isNotEmpty(),
                'isRedDate' => $date->isWeekend() || $dayHolidays->isNotEmpty(),
                'holidayNames' => $dayHolidays->pluck('name')->values(),
                'holidayTypes' => $dayHolidays->pluck('type')->values(),
                'workdayLabel' => $date->isWeekend() || $dayHolidays->isNotEmpty()
                    ? 'Tanggal merah'
                    : 'Hari aktif',
            ];
        }

        return $meta;
    }

    private function statusForRange(Carbon $start, Carbon $end): string
    {
        $today = now()->startOfDay();

        if ($today->lt($start)) {
            return 'scheduled';
        }

        if ($today->betweenIncluded($start, $end)) {
            return 'active';
        }

        return 'completed';
    }

    private function statusForDeadline(Carbon $deadline): string
    {
        $today = now()->startOfDay();
        $date = $deadline->copy()->startOfDay();

        if ($date->lt($today)) {
            return 'completed';
        }

        if ($today->diffInDays($date) <= 7) {
            return 'urgent';
        }

        return 'scheduled';
    }
}
