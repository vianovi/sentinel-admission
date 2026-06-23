<?php

use Illuminate\Support\Facades\Schedule;

// Soft delete expired drafts, then hard delete drafts trashed for over 30 days.
Schedule::command('drafts:prune')->dailyAt('02:00');
