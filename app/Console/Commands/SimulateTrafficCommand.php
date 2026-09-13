<?php

namespace App\Console\Commands;

use App\Services\Demo\TrafficSimulatorService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SimulateTrafficCommand extends Command
{
    protected $signature = 'demo:simulate-traffic
        {--count=50 : Jumlah kandidat yang akan disimulasikan}
        {--mode=stream : Mode eksekusi: stream (bertahap), burst (cepat), benchmark (ukur performa database)}
        {--delay=1.5 : Jeda waktu antar kandidat dalam detik (khusus mode stream)}
        {--status=random : Target status: random, draft, submitted, verified, paid, accepted, rejected}
        {--preset= : Preset distribusi status acak: balanced, backlog, financial}
        {--wave=active : Pilihan gelombang: active, random, atau ID numerik}
        {--auto-create-wave : Otomatis buat gelombang demo jika tidak ada gelombang aktif}';

    protected $description = 'Simulasi lalu lintas pendaftar, unggah berkas, dan pembayaran secara live/real-time';

    public function handle(TrafficSimulatorService $simulator): int
    {
        $count = max(1, (int) $this->option('count'));
        $mode = strtolower((string) $this->option('mode'));
        $delay = max(0.1, (float) $this->option('delay'));
        $statusOption = strtolower((string) $this->option('status'));
        $preset = $this->option('preset') ? strtolower((string) $this->option('preset')) : null;
        $waveOption = (string) $this->option('wave');
        $autoCreateWave = (bool) $this->option('auto-create-wave');

        $this->components->info("Memulai Sentinel Admission Traffic Simulator (Target: {$count} kandidat)");

        // 1. Resolve Wave
        $wave = $simulator->resolveWave($waveOption);
        if (! $wave) {
            $this->warn('Tidak ada gelombang pendaftaran aktif ditemukan di database.');

            $create = $autoCreateWave || ($this->input->isInteractive() && $this->confirm('Apakah ingin otomatis membuat "Gelombang Demo Simulasi 2026/2027"?', true));

            if (! $create) {
                $this->error('Simulasi dibatalkan karena tidak ada gelombang aktif yang dapat digunakan.');

                return self::FAILURE;
            }

            $wave = $simulator->createDemoWave();
            $this->components->info("Gelombang demo berhasil dibuat: [{$wave->id}] {$wave->title}");
        } else {
            $this->line("Menggunakan Gelombang: <fg=cyan>[{$wave->id}] {$wave->title}</>");
        }

        $this->table(
            ['Parameter', 'Nilai'],
            [
                ['Jumlah Kandidat', $count],
                ['Mode Eksekusi', strtoupper($mode)],
                ['Jeda Per Langkah', $mode === 'stream' ? "{$delay} detik" : 'Tanpa jeda (burst)'],
                ['Target Status', strtoupper($statusOption)],
                ['Preset Bobot', $preset ? strtoupper($preset) : 'Natural Funnel (Default)'],
                ['Broadcasting', 'Reverb WebSockets Active (Port 8085)'],
            ]
        );

        $statusCounters = [
            'draft' => 0,
            'submitted' => 0,
            'verified' => 0,
            'paid' => 0,
            'accepted' => 0,
            'rejected' => 0,
        ];

        ini_set('memory_limit', '512M');
        $startTime = microtime(true);
        $startMemory = memory_get_usage(true);

        $queryCount = 0;
        $queryTimeTotal = 0.0;

        if ($mode === 'benchmark') {
            DB::listen(function ($query) use (&$queryCount, &$queryTimeTotal) {
                $queryCount++;
                $queryTimeTotal += $query->time;
            });
        }

        $bar = $this->output->createProgressBar($count);
        $bar->setFormat(" %current%/%max% [%bar%] %percent:3s%% -- %message%\n");
        $bar->start();

        for ($i = 1; $i <= $count; $i++) {
            $stepStart = microtime(true);

            $result = $simulator->simulateCandidate($wave, $statusOption, $preset);
            $candidate = $result['candidate'];
            $finalStatus = $result['final_status'];

            if (isset($statusCounters[$finalStatus])) {
                $statusCounters[$finalStatus]++;
            }

            $stepDurationMs = round((microtime(true) - $stepStart) * 1000, 1);
            $bar->setMessage("ID: {$candidate->candidate_code} | {$candidate->full_name} -> <fg=green>{$finalStatus}</> ({$stepDurationMs}ms)");
            $bar->advance();

            if ($mode === 'stream' && $i < $count) {
                usleep((int) ($delay * 1_000_000));
            }

            if ($i % 50 === 0) {
                gc_collect_cycles();
            }
        }

        $bar->finish();
        $this->newLine(2);

        $totalDuration = round(microtime(true) - $startTime, 2);
        $peakMemory = round(memory_get_peak_usage(true) / (1024 * 1024), 2);

        $this->components->info("Simulasi Sukses Selesai dalam {$totalDuration} detik!");

        $this->table(
            ['Status Hasil Injeksi', 'Jumlah Kandidat', 'Persentase'],
            collect($statusCounters)
                ->filter(fn ($val) => $val > 0)
                ->map(fn ($val, $key) => [
                    strtoupper($key),
                    $val,
                    round(($val / $count) * 100, 1).'%',
                ])
                ->values()
                ->toArray()
        );

        if ($mode === 'benchmark') {
            $avgQueryTime = $queryCount > 0 ? round($queryTimeTotal / $queryCount, 3) : 0;
            $rps = round($count / max(0.001, $totalDuration), 2);

            $this->newLine();
            $this->line('<fg=yellow;options=bold>📊 METRIK PERFORMA DATABASE (BENCHMARK):</>');
            $this->table(
                ['Metrik Performa', 'Hasil'],
                [
                    ['Total Waktu Eksekusi', "{$totalDuration} detik"],
                    ['Throughput Pendaftar', "{$rps} kandidat / detik"],
                    ['Total Query Database', "{$queryCount} queries"],
                    ['Rata-rata Waktu Query', "{$avgQueryTime} ms"],
                    ['Peak Memory PHP', "{$peakMemory} MB"],
                ]
            );
        }

        $this->line('<fg=gray>Catatan: Untuk menghapus data demo ini, jalankan: </><fg=yellow>php artisan demo:wipe</>');

        return self::SUCCESS;
    }
}
