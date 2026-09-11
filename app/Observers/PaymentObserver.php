<?php

namespace App\Observers;

use App\Events\DashboardMetricsUpdated;
use App\Models\Payment;

class PaymentObserver
{
    public function created(Payment $payment): void
    {
        DashboardMetricsUpdated::dispatchSafely('payment.created');
    }

    public function updated(Payment $payment): void
    {
        if ($payment->isDirty('status') || $payment->isDirty('manual_status') || $payment->isDirty('paid_at')) {
            DashboardMetricsUpdated::dispatchSafely('payment.updated');
        }
    }

    public function deleted(Payment $payment): void
    {
        DashboardMetricsUpdated::dispatchSafely('payment.deleted');
    }
}
