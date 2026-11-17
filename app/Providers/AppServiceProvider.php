<?php

namespace App\Providers;

use App\Models\Candidate;
use App\Models\Guardian;
use App\Models\HealthRecord;
use App\Models\Payment;
use App\Models\User;
use App\Observers\CandidateObserver;
use App\Observers\GuardianObserver;
use App\Observers\HealthRecordObserver;
use App\Observers\PaymentObserver;
use App\Observers\UserObserver;
use App\Support\EmailDesignSystem;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if ($this->app->environment('local')) {
            $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
            $this->app->register(TelescopeServiceProvider::class);
        }
    }

    public function boot(): void
    {
        \Illuminate\Database\Eloquent\Model::shouldBeStrict(! $this->app->isProduction());

        RateLimiter::for('upload', function ($request) {
            return Limit::perMinute(10)->by($request->user()?->id);
        });

        RateLimiter::for('sensitive-file', function ($request) {
            return Limit::perMinute(60)->by(($request->user()?->id ?? 'guest').'|'.$request->ip());
        });

        RateLimiter::for('verification', function (Request $request) {
            return [
                Limit::perMinutes(10, 1)
                    ->by('verification:user:'.$request->user()->id)
                    ->response(fn (Request $request, array $headers) => back()
                        ->with('error', 'Email verifikasi baru dapat dikirim ulang setelah beberapa menit.')),
                Limit::perMinute(10)
                    ->by('verification:ip:'.$request->ip())
                    ->response(fn (Request $request, array $headers) => back()
                        ->with('error', 'Terlalu banyak permintaan dari jaringan ini. Silakan coba lagi beberapa saat.')),
            ];
        });

        RateLimiter::for('public-exam-join', function (Request $request) {
            $token = strtoupper((string) $request->route('token'));
            $entryKey = (string) $request->input('entry_key', 'unknown-device');
            $response = fn (Request $request, array $headers) => response()->json([
                'message' => 'Terlalu banyak permintaan masuk dari perangkat ini. Tunggu sebentar lalu tekan Mulai Ujian satu kali.',
            ], 429, $headers);

            return [
                Limit::perMinute(10)
                    ->by('public-exam-join:device:'.hash('sha256', $token.'|'.$entryKey))
                    ->response($response),
                Limit::perMinute(300)
                    ->by('public-exam-join:network:'.$token.'|'.$request->ip())
                    ->response($response),
            ];
        });

        Vite::prefetch(concurrency: 3);

        if (env('FORCE_HTTPS', false)) {
            URL::forceScheme('https');
        }

        Candidate::observe(CandidateObserver::class);
        Guardian::observe(GuardianObserver::class);
        HealthRecord::observe(HealthRecordObserver::class);
        Payment::observe(PaymentObserver::class);
        User::observe(UserObserver::class);

        VerifyEmail::toMailUsing(
            static fn (object $notifiable, string $verificationUrl) => EmailDesignSystem::verification($notifiable, $verificationUrl)
        );

        ResetPassword::toMailUsing(
            static fn (object $notifiable, string $token) => EmailDesignSystem::passwordReset($notifiable, $token)
        );

        Request::setTrustedProxies(
            ['127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'REMOTE_ADDR'],
            Request::HEADER_X_FORWARDED_FOR |
            Request::HEADER_X_FORWARDED_HOST |
            Request::HEADER_X_FORWARDED_PORT |
            Request::HEADER_X_FORWARDED_PROTO |
            Request::HEADER_X_FORWARDED_PREFIX
        );
    }
}
