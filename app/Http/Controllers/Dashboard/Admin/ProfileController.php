<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Support\SentinelStoragePaths;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    // =============================================
    // GET /dashboard/admin/profile
    // =============================================

    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Dashboard/Admin/Profile', [
            'user' => [
                'id'              => $user->id,
                'name'            => $user->name,
                'email'           => $user->email,
                'role'            => $user->role,
                'is_active'       => $user->is_active,
                'avatar_url'      => $user->avatar_url,
                'initials'        => $user->initials,
                'whatsapp_number' => $user->whatsapp_number,
                'created_at'      => $user->created_at->format('d F Y'),
            ],
        ]);
    }

    // =============================================
    // PUT /dashboard/admin/profile
    // =============================================

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'whatsapp_number'  => ['nullable', 'string', 'regex:/^08[0-9]{8,12}$/'],
            'current_password' => ['nullable', 'string'],
            'new_password'     => ['nullable', 'confirmed', Password::min(8)],
        ], [
            'whatsapp_number.regex' => 'Nomor WhatsApp harus diawali 08 dan terdiri dari 10-14 digit.',
        ]);

        if ($request->filled('new_password')) {
            if (! Hash::check($request->current_password, $user->password)) {
                return back()->withErrors(['current_password' => 'Password saat ini tidak sesuai.']);
            }
            $user->password = Hash::make($validated['new_password']);
        }

        $user->name            = $validated['name'];
        $user->whatsapp_number = $validated['whatsapp_number'] ?? $user->whatsapp_number;
        $user->save();

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    // =============================================
    // POST /dashboard/admin/profile/avatar
    // Security: mime → magic bytes → polyglot scan → UUID rename
    // =============================================

    private const AVATAR_SIGNATURES = [
        "\xFF\xD8\xFF"      => ['mime' => 'image/jpeg', 'ext' => 'jpg'],
        "\x89PNG\r\n\x1A\n" => ['mime' => 'image/png',  'ext' => 'png'],
    ];

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => [
                'required', 'file',
                'mimes:jpg,jpeg,png',
                'mimetypes:image/jpeg,image/png',
                'max:3072',
            ],
        ], [
            'avatar.mimes'     => 'Format avatar hanya boleh JPG atau PNG.',
            'avatar.mimetypes' => 'Format avatar hanya boleh JPG atau PNG.',
            'avatar.max'       => 'Ukuran foto maksimal adalah 3MB.',
        ]);

        $file   = $request->file('avatar');
        $handle = fopen($file->getRealPath(), 'rb');
        $header = fread($handle, 12);
        fclose($handle);

        $detected = null;
        foreach (self::AVATAR_SIGNATURES as $signature => $meta) {
            if (str_starts_with($header, $signature)) {
                if ($signature === 'RIFF' && substr($header, 8, 4) !== 'WEBP') continue;
                $detected = $meta;
                break;
            }
        }

        if (! $detected) {
            return back()->withErrors(['avatar' => 'File tidak valid.']);
        }

        $content   = file_get_contents($file->getRealPath());
        $forbidden = ['<?php', '<?=', '<script', '<%', 'eval(', 'base64_decode(', 'system(', 'exec(', 'passthru(', 'shell_exec('];
        foreach ($forbidden as $pattern) {
            if (stripos($content, $pattern) !== false) {
                return back()->withErrors(['avatar' => 'File tidak valid.']);
            }
        }

        $user = $request->user();

        $oldPath = $user->avatar;
        $directory = SentinelStoragePaths::adminAvatarDirectory($user->id);
        $path = $directory . '/' . Str::uuid() . '.' . $detected['ext'];

        if (! Storage::disk('private')->put($path, file_get_contents($file->getRealPath()))) {
            return back()->withErrors(['avatar' => 'Gagal menyimpan avatar. Silakan coba lagi.']);
        }

        $user->avatar = $path;
        $user->save();
        $user->touch();

        if ($oldPath && $oldPath !== $path && Storage::disk('private')->exists($oldPath)) {
            Storage::disk('private')->delete($oldPath);
        }

        return back()->with('success', 'Avatar berhasil diperbarui.');
    }

    public function serveAvatar(Request $request)
    {
        $user = $request->user();

        if (! $user->avatar || ! Storage::disk('private')->exists($user->avatar)) {
            abort(404);
        }

        return Storage::disk('private')->response($user->avatar, null, [
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma'        => 'no-cache',
            'Expires'       => '0',
        ]);
    }
}
