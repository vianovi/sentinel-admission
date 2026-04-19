<?php

namespace App\Http\Controllers\Dashboard\Candidate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    // =========================================================================
    // SHOW PROFILE — GET /dashboard/profile
    // =========================================================================

    public function show(Request $request): Response
    {
        $user      = $request->user();
        $candidate = $user->candidate()->with('admissionWave')->first();

        return Inertia::render('Dashboard/Candidate/Profile', [
            'user' => [
                'id'                => $user->id,
                'name'              => $user->name,
                'email'             => $user->email,
                'avatar_url'        => $user->avatar_url,
                'initials'          => $user->initials,
                'whatsapp_number'   => $user->whatsapp_number,
                'has_pending_email' => $user->hasPendingEmailRequest(),
                'pending_email'     => $user->pending_email,
                'email_verified'    => $user->hasVerifiedEmail(),
            ],
            'candidate' => $candidate ? [
                'full_name'      => $candidate->full_name,
                'nisn'           => $candidate->nisn,
                'nik'            => $candidate->nik,
                'status'         => $candidate->status,
                'address_full'   => $candidate->address_full,
                'admission_wave' => $candidate->admissionWave ? [
                    'title'         => $candidate->admissionWave->title,
                    'academic_year' => $candidate->admissionWave->academic_year,
                ] : null,
            ] : null,
        ]);
    }

    // =========================================================================
    // UPDATE PROFILE — PUT /dashboard/profile
    // =========================================================================

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'current_password' => ['nullable', 'string'],
            'new_password'     => ['nullable', 'confirmed', Password::min(8)],
        ]);

        if ($request->filled('new_password')) {
            if (! Hash::check($request->current_password, $user->password)) {
                return back()->withErrors(['current_password' => 'Password saat ini tidak sesuai.']);
            }
            $user->password = Hash::make($validated['new_password']);
        }

        $user->name = $validated['name'];
        $user->save();

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    // =========================================================================
    // UPDATE AVATAR — POST /dashboard/profile/avatar
    // Security: mime → magic bytes → polyglot scan → UUID rename
    // =========================================================================

    private const AVATAR_SIGNATURES = [
        "\xFF\xD8\xFF"      => ['mime' => 'image/jpeg', 'ext' => 'jpg'],
        "\x89PNG\r\n\x1A\n" => ['mime' => 'image/png',  'ext' => 'png'],
        "RIFF"              => ['mime' => 'image/webp',  'ext' => 'webp'],
    ];

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => [
                'required', 'file',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:1024',
            ],
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

        if ($user->avatar && Storage::disk('private')->exists($user->avatar)) {
            Storage::disk('private')->delete($user->avatar);
        }

        $path = 'avatars/' . $user->id . '/' . Str::uuid() . '.' . $detected['ext'];
        Storage::disk('private')->put($path, file_get_contents($file->getRealPath()));
        $user->update(['avatar' => $path]);

        return back()->with('success', 'Avatar berhasil diperbarui.');
    }

    // =========================================================================
    // SERVE AVATAR — GET /dashboard/profile/avatar
    // =========================================================================

    public function serveAvatar(Request $request)
    {
        $user = $request->user();

        if (! $user->avatar || ! Storage::disk('private')->exists($user->avatar)) {
            abort(404);
        }

        return Storage::disk('private')->response($user->avatar);
    }

    // =========================================================================
    // REQUEST GANTI EMAIL — POST /dashboard/profile/email
    // =========================================================================

    public function requestEmailChange(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'new_email' => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
                Rule::unique('users', 'pending_email')->ignore($user->id),
            ],
        ]);

        $user->update([
            'pending_email'              => $request->new_email,
            'pending_email_token'        => Str::random(64),
            'pending_email_requested_at' => now(),
        ]);

        return back()->with('success', 'Permintaan ganti email telah dikirim. Menunggu persetujuan staff.');
    }

    // =========================================================================
    // CANCEL REQUEST GANTI EMAIL — DELETE /dashboard/profile/email
    // =========================================================================

    public function cancelEmailChange(Request $request)
    {
        $request->user()->update([
            'pending_email'              => null,
            'pending_email_token'        => null,
            'pending_email_requested_at' => null,
        ]);

        return back()->with('success', 'Permintaan ganti email dibatalkan.');
    }
}
