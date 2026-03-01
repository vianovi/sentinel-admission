<?php

use Illuminate\Support\Facades\Schedule;

// Hard delete expired registration drafts — jalan setiap hari jam 02:00
Schedule::command('drafts:prune')->dailyAt('02:00');
