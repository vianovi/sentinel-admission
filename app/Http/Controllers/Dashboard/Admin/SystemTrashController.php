<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemTrash;
use App\Services\Trash\TrashManagerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SystemTrashController extends Controller
{
    /**
     * Tab: Sampah Bank Media
     */
    public function media(Request $request): Response
    {
        $search = $request->input('search');

        $query = SystemTrash::where('type', 'exam_media')
            ->latest('id');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $items = $query->paginate(15)->withQueryString();

        $totalBytes = (int) SystemTrash::where('type', 'exam_media')->sum('file_size');
        $expiringSoon = SystemTrash::where('type', 'exam_media')
            ->where('purge_at', '<=', now()->addDays(7))
            ->count();

        $stats = [
            'total_files' => SystemTrash::where('type', 'exam_media')->count(),
            'total_size' => $this->formatBytes($totalBytes),
            'expiring_soon' => $expiringSoon,
        ];

        return Inertia::render('Dashboard/Admin/System/TrashMedia', [
            'items' => $items,
            'filters' => [
                'search' => $search ?? '',
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Tab: Sampah Draft Kandidat
     */
    public function candidates(Request $request): Response
    {
        $search = $request->input('search');

        $query = SystemTrash::where('type', 'candidate_draft')
            ->latest('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('metadata', 'like', "%{$search}%");
            });
        }

        $items = $query->paginate(15)->withQueryString();

        $expiringSoon = SystemTrash::where('type', 'candidate_draft')
            ->where('purge_at', '<=', now()->addDays(7))
            ->count();

        $stats = [
            'total_drafts' => SystemTrash::where('type', 'candidate_draft')->count(),
            'expiring_soon' => $expiringSoon,
        ];

        return Inertia::render('Dashboard/Admin/System/TrashCandidates', [
            'items' => $items,
            'filters' => [
                'search' => $search ?? '',
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Preview image file in trash
     */
    public function preview(SystemTrash $trash): BinaryFileResponse
    {
        if ($trash->type !== 'exam_media' || ! $trash->trash_path) {
            abort(404);
        }

        if (! Storage::disk('public')->exists($trash->trash_path)) {
            abort(404, 'File gambar di tempat sampah tidak ditemukan.');
        }

        return response()->file(Storage::disk('public')->path($trash->trash_path));
    }

    /**
     * Restore item from trash
     */
    public function restore(SystemTrash $trash, TrashManagerService $trashService): RedirectResponse
    {
        try {
            if ($trash->type === 'exam_media') {
                $trashService->restoreMedia($trash->id);

                return redirect()->back()->with('success', "Gambar '{$trash->name}' berhasil dipulihkan ke Bank Media.");
            } elseif ($trash->type === 'candidate_draft') {
                $trashService->restoreCandidateDraft($trash->id);

                return redirect()->back()->with('success', "Draft '{$trash->name}' berhasil dipulihkan.");
            }

            return redirect()->back()->with('error', 'Tipe data sampah tidak didukung.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Permanently purge single item
     */
    public function purge(SystemTrash $trash, TrashManagerService $trashService): RedirectResponse
    {
        try {
            if ($trash->type === 'exam_media') {
                $trashService->purgeMedia($trash->id);

                return redirect()->back()->with('success', "Gambar '{$trash->name}' telah dihapus secara permanen.");
            } elseif ($trash->type === 'candidate_draft') {
                $trashService->purgeCandidateDraft($trash->id);

                return redirect()->back()->with('success', "Draft '{$trash->name}' telah dihapus secara permanen.");
            }

            return redirect()->back()->with('error', 'Tipe data sampah tidak didukung.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Empty entire trash (all or by type)
     */
    public function emptyAll(Request $request, TrashManagerService $trashService): RedirectResponse
    {
        $type = $request->input('type', 'all');

        try {
            $purged = $trashService->emptyTrash($type);

            return redirect()->back()->with('success', "Berhasil mengosongkan {$purged} data sampah secara permanen.");
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 1).' '.$units[$i];
    }
}
