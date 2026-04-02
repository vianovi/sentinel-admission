<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    public function index()
    {
        return Inertia::render('Landing/Welcome');
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
        // Strict whitelist: hanya images/ atau videos/ dengan nama file yang bersih
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

        // Video: stream dengan support range requests (penting untuk scrubbing di browser)
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