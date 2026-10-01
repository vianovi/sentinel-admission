<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use ZipArchive;
use Inertia\Inertia;
use Illuminate\Support\Str;

class AdminExamMediaController extends Controller
{
    private string $disk = 'public';
    private string $path = 'exam/images';

    public function index()
    {
        $this->ensureDirectoryExists();
        
        $files = Storage::disk($this->disk)->files($this->path);
        
        $media = collect($files)
            ->filter(fn ($file) => in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']))
            ->map(function ($file) {
                return [
                    'name' => basename($file),
                    'url' => '/storage/' . ltrim($file, '/'),
                    'size' => Storage::disk($this->disk)->size($file),
                    'last_modified' => Storage::disk($this->disk)->lastModified($file),
                ];
            })
            ->sortByDesc('last_modified')
            ->values();

        return Inertia::render('Dashboard/Admin/Exam/MediaManager', [
            'media' => $media,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'files.*' => 'required|file|mimes:jpeg,png,jpg,gif,svg,webp,zip|max:51200', // max 50MB per file/zip
        ]);

        $this->ensureDirectoryExists();
        $uploadedCount = 0;

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                if ($file->getClientOriginalExtension() === 'zip') {
                    $uploadedCount += $this->extractZip($file);
                } else {
                    $filename = $file->getClientOriginalName();
                    $filename = $this->getUniqueFilename($filename);
                    $file->storeAs($this->path, $filename, $this->disk);
                    $uploadedCount++;
                }
            }
        }

        return redirect()->back()->with('success', "Berhasil mengunggah {$uploadedCount} gambar.");
    }

    public function rename(Request $request)
    {
        $request->validate([
            'old_name' => 'required|string',
            'new_name' => 'required|string',
        ]);

        $oldName = basename($request->old_name);
        $newName = basename($request->new_name);

        $ext = pathinfo($newName, PATHINFO_EXTENSION);
        if (!$ext) {
            $newName .= '.' . pathinfo($oldName, PATHINFO_EXTENSION);
        }

        $newName = Str::slug(pathinfo($newName, PATHINFO_FILENAME)) . '.' . pathinfo($newName, PATHINFO_EXTENSION);

        $oldPath = $this->path . '/' . $oldName;
        $newPath = $this->path . '/' . $newName;

        if (!Storage::disk($this->disk)->exists($oldPath)) {
            return redirect()->back()->with('error', 'File asal tidak ditemukan.');
        }

        if (Storage::disk($this->disk)->exists($newPath)) {
            return redirect()->back()->with('error', 'Nama file baru sudah digunakan.');
        }

        Storage::disk($this->disk)->move($oldPath, $newPath);

        return redirect()->back()->with('success', 'File berhasil diubah namanya.');
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
        ]);

        $name = basename($request->name);
        $path = $this->path . '/' . $name;

        if (Storage::disk($this->disk)->exists($path)) {
            Storage::disk($this->disk)->delete($path);
        }

        return redirect()->back()->with('success', 'File berhasil dihapus.');
    }

    private function extractZip($zipFile): int
    {
        $zip = new ZipArchive;
        $extractedCount = 0;

        if ($zip->open($zipFile->getPathname()) === true) {
            $tempDir = storage_path('app/temp/zip_' . uniqid());
            File::makeDirectory($tempDir, 0755, true);
            
            $zip->extractTo($tempDir);
            $zip->close();

            $allFiles = File::allFiles($tempDir);
            foreach ($allFiles as $file) {
                $ext = strtolower($file->getExtension());
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'])) {
                    $filename = $this->getUniqueFilename($file->getFilename());
                    Storage::disk($this->disk)->putFileAs($this->path, $file, $filename);
                    $extractedCount++;
                }
            }

            File::deleteDirectory($tempDir);
        }

        return $extractedCount;
    }

    private function getUniqueFilename(string $filename): string
    {
        $name = pathinfo($filename, PATHINFO_FILENAME);
        $ext = pathinfo($filename, PATHINFO_EXTENSION);
        
        $name = Str::slug($name);
        $newFilename = $name . '.' . $ext;
        
        $counter = 1;
        while (Storage::disk($this->disk)->exists($this->path . '/' . $newFilename)) {
            $newFilename = $name . '-' . $counter . '.' . $ext;
            $counter++;
        }

        return $newFilename;
    }

    private function ensureDirectoryExists(): void
    {
        if (!Storage::disk($this->disk)->exists($this->path)) {
            Storage::disk($this->disk)->makeDirectory($this->path);
        }
    }
}
