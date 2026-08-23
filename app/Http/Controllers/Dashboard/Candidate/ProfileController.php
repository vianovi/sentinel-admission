<?php

namespace App\Http\Controllers\Dashboard\Candidate;

use App\Http\Controllers\Controller;
use App\Support\CandidateRequestPresenter;
use App\Support\SentinelStoragePaths;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
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
        $user->loadMissing('pendingEmailReviewer');
        $candidate = $user->candidate()->with('admissionWave')->first();
        $emailChangeRequest = CandidateRequestPresenter::formatEmailChangeRequest($user);
        $dataChangeResult = CandidateRequestPresenter::formatDataChangeResult($candidate?->data_change_request);

        return Inertia::render('Dashboard/Candidate/Profile', [
            'user' => [
                'id'                => $user->id,
                'name'              => $user->name,
                'email'             => $user->email,
                'avatar_url'        => $user->avatar_url,
                'initials'          => $user->initials,
                'whatsapp_number'   => $user->whatsapp_number,
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
            'email_change_request' => $emailChangeRequest,
            'data_change_request_result' => $dataChangeResult,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
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
            if (substr($header, 0, strlen($signature)) === $signature) {
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

        $candidate = $user->candidate()->firstOrFail();
        $oldPath = $user->avatar;
        $directory = SentinelStoragePaths::candidateAvatarDirectory($candidate->candidate_code);
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

    // =========================================================================
    // SERVE AVATAR — GET /dashboard/profile/avatar
    // =========================================================================

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

    // =========================================================================
    // REQUEST GANTI EMAIL — POST /dashboard/profile/email
    // =========================================================================

    public function requestEmailChange(Request $request)
    {
        $user = $request->user();

        if (! $user->canRequestEmailChange()) {
            return back()->with('error', 'Masih ada permintaan perubahan email yang harus diselesaikan terlebih dahulu.');
        }

        $request->validate([
            'new_email' => [
                'required', 'email:rfc', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
                Rule::unique('users', 'pending_email')->ignore($user->id),
            ],
        ]);

        $user->update([
            'pending_email'              => $request->new_email,
            'pending_email_token'        => Str::random(64),
            'pending_email_status'       => 'pending',
            'pending_email_reviewed_by'  => null,
            'pending_email_reviewed_at'  => null,
            'pending_email_rejection_reason' => null,
            'pending_email_requested_at' => now(),
        ]);

        return back()->with('success', 'Permintaan ganti email telah dikirim. Menunggu persetujuan staff.');
    }

    // =========================================================================
    // CANCEL REQUEST GANTI EMAIL — DELETE /dashboard/profile/email
    // =========================================================================

    public function cancelEmailChange(Request $request)
    {
        $user = $request->user();

        if (! $user->hasPendingEmailRequest()) {
            return back()->with('error', 'Hanya permintaan email yang masih pending yang bisa dibatalkan.');
        }

        $user->update([
            'pending_email'              => null,
            'pending_email_token'        => null,
            'pending_email_status'       => null,
            'pending_email_reviewed_by'  => null,
            'pending_email_reviewed_at'  => null,
            'pending_email_rejection_reason' => null,
            'pending_email_requested_at' => null,
        ]);

        return back()->with('success', 'Permintaan ganti email dibatalkan.');
    }

    public function applyApprovedEmailChange(Request $request)
    {
        $user = $request->user();

        if (! $user->canApplyApprovedEmailChange()) {
            return back()->with('error', 'Belum ada perubahan email yang siap diterapkan.');
        }

        $pendingEmail = trim((string) $user->pending_email);

        $validator = Validator::make([
            'pending_email' => $pendingEmail,
        ], [
            'pending_email' => [
                'required',
                'email:rfc',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
                Rule::unique('users', 'pending_email')->ignore($user->id),
            ],
        ]);

        if ($validator->fails()) {
            return back()->with('error', $validator->errors()->first('pending_email'));
        }

        $user->forceFill([
            'email' => $pendingEmail,
            'email_verified_at' => now(),
            'pending_email' => null,
            'pending_email_token' => null,
            'pending_email_status' => null,
            'pending_email_reviewed_by' => null,
            'pending_email_reviewed_at' => null,
            'pending_email_rejection_reason' => null,
            'pending_email_requested_at' => null,
        ])->save();

        return back()->with('success', 'Email login berhasil diperbarui dan sudah diverifikasi manual oleh staff/admin.');
    }
}
