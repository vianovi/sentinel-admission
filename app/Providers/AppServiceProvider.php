<?php

namespace App\Providers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use App\Models\Candidate;
use App\Observers\CandidateObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('upload', function ($request) {
            return Limit::perMinute(10)->by($request->user()?->id);
        });

        Vite::prefetch(concurrency: 3);

        if (env('FORCE_HTTPS', false)) {
            URL::forceScheme('https');
        }

        Candidate::observe(CandidateObserver::class);

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