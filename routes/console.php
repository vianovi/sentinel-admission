<?php

use Illuminate\Support\Facades\Schedule;

// Soft delete expired drafts, then hard delete drafts trashed for over 30 days.
Schedule::command('drafts:prune')->dailyAt('02:00');

// Prune system trashed files & records older than 30 days
Schedule::command('system:prune-trash')->dailyAt('02:30');

// Sync and auto-submit candidate exam attempts whose time limit has expired every minute
Schedule::command('exam:sync-expired')->everyMinute();

Schedule::command('exam:rotate-public-tokens')->everyMinute()->withoutOverlapping();
