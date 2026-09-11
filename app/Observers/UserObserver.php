<?php

namespace App\Observers;

use App\Events\DashboardMetricsUpdated;
use App\Models\User;

class UserObserver
{
    public function created(User $user): void
    {
        DashboardMetricsUpdated::dispatchSafely('user.created');
    }

    public function updated(User $user): void
    {
        if ($user->isDirty('is_active') || $user->isDirty('role') || $user->isDirty('email_verified_at')) {
            DashboardMetricsUpdated::dispatchSafely('user.updated');
        }
    }

    public function deleted(User $user): void
    {
        DashboardMetricsUpdated::dispatchSafely('user.deleted');
    }
}
