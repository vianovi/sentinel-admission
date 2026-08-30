<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request): Response
    {
        $query = User::query();

        // Search logic
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('whatsapp_number', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        // Status filter
        if ($request->filled('status')) {
            $status = $request->input('status') === 'active' ? 1 : 0;
            $query->where('is_active', $status);
        }

        $users = $query->latest()->paginate(15)->withQueryString()->through(fn ($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'whatsapp_number' => $user->whatsapp_number,
            'is_active' => $user->is_active,
            'created_at' => $user->created_at->format('Y-m-d H:i:s'),
            'avatar_url' => $user->avatar_url,
            'initials' => $user->initials,
        ]);

        return Inertia::render('Dashboard/Admin/Users', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'status']),
            'stats' => [
                'total' => User::count(),
                'active' => User::where('is_active', true)->count(),
                'suspended' => User::where('is_active', false)->count(),
                'admin' => User::where('role', 'admin')->count(),
                'staff' => User::where('role', 'staff')->count(),
                'candidate' => User::where('role', 'candidate')->count(),
            ],
        ]);
    }

    /**
     * Toggle the active status of a user (Suspend/Activate).
     */
    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        // Prevent an admin from suspending themselves
        if ($request->user()->id === $user->id) {
            return back()->with('error', 'Anda tidak dapat menangguhkan (suspend) akun Anda sendiri.');
        }

        $user->update([
            'is_active' => ! $user->is_active,
        ]);

        $status = $user->is_active ? 'diaktifkan' : 'ditangguhkan (suspend)';

        return back()->with('success', "Akun pengguna {$user->name} berhasil {$status}.");
    }
}
