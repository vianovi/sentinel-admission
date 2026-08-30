<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    // =============================================
    // GET /dashboard/admin/staff-list
    // =============================================

    public function index(): Response
    {
        $staffList = User::where('role', 'staff')
            ->latest()
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'email' => $s->email,
                'is_active' => $s->is_active,
                'whatsapp_number' => $s->whatsapp_number,
                'created_at' => $s->created_at->format('d M Y'),
            ]);

        return Inertia::render('Dashboard/Admin/Staff', [
            'staff_list' => $staffList,
            'total_active' => $staffList->where('is_active', true)->count(),
            'total' => $staffList->count(),
        ]);
    }
}
