<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DashboardMetricsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $source = 'system'
    ) {}

    /**
     * Dispatch the event safely without throwing if Reverb/WebSocket server is offline.
     */
    public static function dispatchSafely(string $source = 'system'): void
    {
        try {
            broadcast(new self($source));
        } catch (\Throwable $e) {
            Log::debug("DashboardMetricsUpdated broadcast skipped: {$e->getMessage()}");
        }
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('dashboard.metrics'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'DashboardMetricsUpdated';
    }
}
