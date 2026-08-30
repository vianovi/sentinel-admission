<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class NationalHolidayService
{
    /**
     * Ambil libur nasional/cuti bersama Indonesia dan cache per tahun.
     * Primary API lebih kaya untuk cuti bersama; fallback global menjaga halaman tetap jalan.
     *
     * @return array<int, array{date: string, name: string, type: string, source: string}>
     */
    public function holidaysForYear(int $year): array
    {
        return Cache::remember(
            "calendar:indonesia-holidays:{$year}",
            now()->addDays(7),
            fn () => $this->fetchHolidays($year)
        );
    }

    /**
     * @param  array<int>  $years
     * @return array<int, array{date: string, name: string, type: string, source: string}>
     */
    public function holidaysForYears(array $years): array
    {
        return collect($years)
            ->unique()
            ->sort()
            ->flatMap(fn (int $year) => $this->holidaysForYear($year))
            ->unique(fn (array $holiday) => $holiday['date'].'|'.$holiday['name'])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{date: string, name: string, type: string, source: string}>
     */
    private function fetchHolidays(int $year): array
    {
        $primary = $this->fetchFromTanggalMerah($year);

        if ($primary !== []) {
            return $primary;
        }

        return $this->fetchFromNagerDate($year);
    }

    /**
     * @return array<int, array{date: string, name: string, type: string, source: string}>
     */
    private function fetchFromTanggalMerah(int $year): array
    {
        try {
            $response = Http::timeout(5)
                ->retry(1, 250)
                ->acceptJson()
                ->get('https://tanggalmerah.upset.dev/api/holidays', [
                    'year' => $year,
                ]);

            if (! $response->ok()) {
                return [];
            }

            return collect($response->json('data', []))
                ->map(fn (array $item) => [
                    'date' => (string) ($item['date'] ?? ''),
                    'name' => (string) ($item['name'] ?? 'Hari libur nasional'),
                    'type' => ($item['type'] ?? 'holiday') === 'leave' ? 'leave' : 'holiday',
                    'source' => 'tanggalmerah.upset.dev',
                ])
                ->filter(fn (array $item) => $item['date'] !== '')
                ->values()
                ->all();
        } catch (Throwable $exception) {
            Log::warning('Primary holiday API failed.', [
                'year' => $year,
                'message' => $exception->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * @return array<int, array{date: string, name: string, type: string, source: string}>
     */
    private function fetchFromNagerDate(int $year): array
    {
        try {
            $response = Http::timeout(5)
                ->retry(1, 250)
                ->acceptJson()
                ->get("https://date.nager.at/api/v3/PublicHolidays/{$year}/ID");

            if (! $response->ok()) {
                return [];
            }

            return collect($response->json())
                ->map(fn (array $item) => [
                    'date' => (string) ($item['date'] ?? ''),
                    'name' => (string) ($item['localName'] ?? $item['name'] ?? 'Hari libur nasional'),
                    'type' => 'holiday',
                    'source' => 'date.nager.at',
                ])
                ->filter(fn (array $item) => $item['date'] !== '')
                ->values()
                ->all();
        } catch (Throwable $exception) {
            Log::warning('Fallback holiday API failed.', [
                'year' => $year,
                'message' => $exception->getMessage(),
            ]);

            return [];
        }
    }
}
