<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\AdmissionWave;
use Inertia\Inertia;
use Inertia\Response;

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
     * Serve gallery media (images & videos) from private storage.
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
    public function serveGallery(string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\Response
    {
        if (! preg_match('/^(images|videos)\/[\w\-]+\.(webp|jpg|jpeg|png|mp4)$/i', $filename)) {
            abort(404);
        }

        $path = storage_path('app/private/Media_Showcase/' . $filename);

        abort_if(! file_exists($path), 404);

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