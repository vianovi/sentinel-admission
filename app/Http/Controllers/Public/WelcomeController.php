<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use App\Support\SentinelStoragePaths;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class WelcomeController extends Controller
{
    public function index(): Response
    {
        $activeWave = AdmissionWave::where('is_active', true)
            ->withCount('candidates')
            ->first();

        return Inertia::render('Landing/Welcome', [
            'activeWave' => $activeWave ? [
                'id'                  => $activeWave->id,
                'title'               => $activeWave->title,
                'academic_year'       => $activeWave->academic_year,
                'registration_fee'    => $activeWave->registration_fee,
                'quota_target'        => $activeWave->quota_target,
                'candidates_count'    => $activeWave->candidates_count,
                'start_date'          => $activeWave->start_date,
                'end_date'            => $activeWave->end_date,
                'exam_info'           => $activeWave->exam_info,
                'announcement_info'   => $activeWave->announcement_info,
                'reregistration_date' => $activeWave->reregistration_date,
                'is_active'           => $activeWave->is_active,
            ] : null,
        ]);
    }

    /**
     * Serve landing showcase media from private storage.
     *
     * Accepts paths like:
     *   /media/gallery/images/photo-01.webp
     *   /media/gallery/videos/video-01.mp4
     *
     * Security:
     *   - Whitelist-only: hanya allow subfolder images/ atau videos/
     *   - Filename hanya boleh: huruf, angka, dash, underscore, titik
     *   - Tidak ada path traversal (../, //, dll)
     */
    public function serveGallery(string $filename): BinaryFileResponse|HttpResponse
    {
        if (! preg_match('/^(images|videos)\/[\w\-]+\.(webp|jpg|jpeg|png|mp4)$/i', $filename)) {
            abort(404);
        }

        $relativePath = SentinelStoragePaths::cinematicShowcaseDirectory() . '/' . ltrim($filename, '/');

        abort_if(! Storage::disk('private')->exists($relativePath), 404);

        $path = Storage::disk('private')->path($relativePath);

        $mimeMap = [
            'webp' => 'image/webp',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'mp4'  => 'video/mp4',
        ];

        $ext      = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $mimeType = $mimeMap[$ext] ?? 'application/octet-stream';

        if ($ext === 'mp4') {
            return response()->file($path, [
                'Content-Type'  => $mimeType,
                'Cache-Control' => 'public, max-age=86400',
                'Accept-Ranges' => 'bytes',
            ]);
        }

        return response()->file($path, [
            'Content-Type'  => $mimeType,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
