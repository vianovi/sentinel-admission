<?php

// app/Events/WaveUpdated.php

namespace App\Events;

use App\Models\AdmissionWave;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Gunakan ShouldBroadcastNow agar instan
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WaveUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $wave; // Data ini yang akan diterima React

    public function __construct(AdmissionWave $wave)
    {
        // Pastikan formatnya sama dengan AdmissionWaveData di React
        $this->wave = $wave;
    }

    public function broadcastOn(): array
    {
        // Channel public, karena info kuota ini untuk semua visitor di landing page
        return [
            new Channel('public-waves'),
        ];
    }

    // Nama event yang akan di-listen frontend (opsional, defaultnya nama class)
    public function broadcastAs()
    {
        return 'wave.updated';
    }
}
