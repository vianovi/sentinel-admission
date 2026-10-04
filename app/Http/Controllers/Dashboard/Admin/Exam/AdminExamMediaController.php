<?php

namespace App\Http\Controllers\Dashboard\Admin\Exam;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use ZipArchive;

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
                    'url' => '/exam-media/'.basename($file),
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
        if (! $ext) {
            $newName .= '.'.pathinfo($oldName, PATHINFO_EXTENSION);
        }

        $newName = Str::slug(pathinfo($newName, PATHINFO_FILENAME)).'.'.pathinfo($newName, PATHINFO_EXTENSION);

        $oldPath = $this->path.'/'.$oldName;
        $newPath = $this->path.'/'.$newName;

        if (! Storage::disk($this->disk)->exists($oldPath)) {
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
        $path = $this->path.'/'.$name;

        if (Storage::disk($this->disk)->exists($path)) {
            Storage::disk($this->disk)->delete($path);
        }

        return redirect()->back()->with('success', 'File berhasil dihapus.');
    }

    /** Return all exam packages (for assign modal dropdown). */
    public function packages(): \Illuminate\Http\JsonResponse
    {
        $packages = \Illuminate\Support\Facades\DB::table('exam_packages')
            ->select('id', 'title', 'code')
            ->orderBy('title')
            ->get();

        return response()->json($packages);
    }

    /** Return questions for a given package (for assign modal list). */
    public function questions(int $packageId): \Illuminate\Http\JsonResponse
    {
        $questions = \Illuminate\Support\Facades\DB::table('exam_questions')
            ->where('exam_package_id', $packageId)
            ->whereNull('deleted_at')
            ->select('id', 'sort_order', 'question_text')
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($q) => [
                'id' => $q->id,
                'sort_order' => $q->sort_order,
                'preview' => mb_substr(strip_tags($q->question_text), 0, 80),
                'has_image' => str_contains($q->question_text, '[GAMBAR:') || str_contains($q->question_text, '[IMG:'),
            ]);

        return response()->json($questions);
    }

    /** Inject [GAMBAR: filename] tag into the specified question's question_text. */
    public function assign(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->validate([
            'filename' => 'required|string',
            'question_id' => 'required|integer|exists:exam_questions,id',
            'position' => 'nullable|in:prepend,append',
        ]);

        $filename = basename($data['filename']);
        $position = $data['position'] ?? 'append';
        $tag = "[GAMBAR: {$filename}]";

        $question = \Illuminate\Support\Facades\DB::table('exam_questions')
            ->whereNull('deleted_at')
            ->find($data['question_id']);

        if (! $question) {
            return response()->json(['error' => 'Soal tidak ditemukan.'], 404);
        }

        // Avoid duplicating the exact same tag
        if (str_contains($question->question_text, $tag)) {
            return response()->json(['message' => 'Tag gambar sudah ada di soal ini.', 'already_exists' => true]);
        }

        $newText = $position === 'prepend'
            ? $tag."\n".$question->question_text
            : $question->question_text."\n".$tag;

        \Illuminate\Support\Facades\DB::table('exam_questions')
            ->where('id', $question->id)
            ->update(['question_text' => $newText, 'updated_at' => now()]);

        return response()->json(['message' => "Tag {$tag} berhasil ditambahkan ke soal #{$question->sort_order}."]);
    }

    private function extractZip($zipFile): int
    {
        $zip = new ZipArchive;
        $extractedCount = 0;

        if ($zip->open($zipFile->getPathname()) === true) {
            $tempDir = storage_path('app/temp/zip_'.uniqid());
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
        $newFilename = $name.'.'.$ext;

        $counter = 1;
        while (Storage::disk($this->disk)->exists($this->path.'/'.$newFilename)) {
            $newFilename = $name.'-'.$counter.'.'.$ext;
            $counter++;
        }

        return $newFilename;
    }

    private function ensureDirectoryExists(): void
    {
        if (! Storage::disk($this->disk)->exists($this->path)) {
            Storage::disk($this->disk)->makeDirectory($this->path);
        }
    }
}
