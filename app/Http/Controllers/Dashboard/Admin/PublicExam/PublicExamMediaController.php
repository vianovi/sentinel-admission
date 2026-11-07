<?php

namespace App\Http\Controllers\Dashboard\Admin\PublicExam;

use App\Http\Controllers\Controller;
use App\Models\SystemActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PublicExamMediaController extends Controller
{
    private string $disk = 'public';

    private string $path = 'exam-public/images';

    public function index(): Response
    {
        $this->ensureDirectoryExists();

        $files = Storage::disk($this->disk)->files($this->path);

        $questionsWithImages = DB::table('exam_public_questions')
            ->whereNull('deleted_at')
            ->where('question_text', 'like', '%[GAMBAR:%')
            ->orWhere('question_text', 'like', '%[IMG:%')
            ->pluck('question_text');

        $media = collect($files)
            ->filter(fn ($file) => in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'], true))
            ->map(function ($file) use ($questionsWithImages) {
                $name = basename($file);
                $pattern = '/\[(GAMBAR|IMG):\s*'.preg_quote($name, '/').'\s*\]/i';
                $usageCount = $questionsWithImages->filter(fn ($text) => preg_match($pattern, (string) $text))->count();

                return [
                    'name' => $name,
                    'url' => '/exam-media/'.$name,
                    'size' => Storage::disk($this->disk)->size($file),
                    'last_modified' => Storage::disk($this->disk)->lastModified($file),
                    'usage_count' => $usageCount,
                ];
            })
            ->sortByDesc('last_modified')
            ->values();

        return Inertia::render('Dashboard/Admin/PublicExam/MediaManager', [
            'media' => $media,
            'total_used_count' => $media->where('usage_count', '>', 0)->count(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'files' => ['required', 'array', 'min:1'],
            'files.*' => ['required', 'file', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:51200'],
        ]);

        $this->ensureDirectoryExists();
        $uploadedCount = 0;

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $filename = $this->getUniqueFilename($file->getClientOriginalName());
                $file->storeAs($this->path, $filename, $this->disk);
                $uploadedCount++;
            }
        }

        if ($uploadedCount > 0) {
            $user = auth()->user();
            SystemActivityLog::log(
                action: 'public_exam_media.uploaded',
                module: 'public_exam_media',
                description: ($user?->name ?? 'Admin')." mengunggah {$uploadedCount} gambar ke Bank Media Ujian Publik.",
                targetLabel: "{$uploadedCount} File",
                metadata: ['count' => $uploadedCount],
                targetType: 'PublicExamMedia'
            );
        }

        return redirect()->back()->with('success', "Berhasil mengunggah {$uploadedCount} gambar ke Bank Media Ujian Publik.");
    }

    public function rename(Request $request): RedirectResponse
    {
        $request->validate([
            'old_name' => ['required', 'string'],
            'new_name' => ['required', 'string', 'max:255'],
        ]);

        $oldName = basename($request->input('old_name'));
        $rawNewName = basename($request->input('new_name'));

        $ext = pathinfo($rawNewName, PATHINFO_EXTENSION);
        if (! $ext) {
            $rawNewName .= '.'.pathinfo($oldName, PATHINFO_EXTENSION);
        }

        $cleanFilename = Str::slug(pathinfo($rawNewName, PATHINFO_FILENAME));
        $finalExt = strtolower(pathinfo($rawNewName, PATHINFO_EXTENSION));
        $newName = $cleanFilename.'.'.$finalExt;

        $oldPath = $this->path.'/'.$oldName;
        $newPath = $this->path.'/'.$newName;

        if (! Storage::disk($this->disk)->exists($oldPath)) {
            return redirect()->back()->with('error', 'File asal tidak ditemukan di Bank Media Ujian Publik.');
        }

        if ($oldName !== $newName && Storage::disk($this->disk)->exists($newPath)) {
            return redirect()->back()->with('error', 'Nama file baru sudah digunakan di Bank Media Ujian Publik.');
        }

        if ($oldName !== $newName) {
            Storage::disk($this->disk)->move($oldPath, $newPath);

            // Update any question in exam_public_questions referencing old filename
            $oldTagPattern = '/\[(GAMBAR|IMG):\s*'.preg_quote($oldName, '/').'\s*\]/i';
            $newTag = "[GAMBAR: {$newName}]";

            $questions = DB::table('exam_public_questions')
                ->whereNull('deleted_at')
                ->where(function ($q) use ($oldName) {
                    $q->where('question_text', 'like', "%{$oldName}%");
                })
                ->get(['id', 'question_text']);

            foreach ($questions as $q) {
                DB::table('exam_public_questions')->where('id', $q->id)->update([
                    'question_text' => preg_replace($oldTagPattern, $newTag, (string) $q->question_text),
                    'updated_at' => now(),
                ]);
            }

            $user = auth()->user();
            SystemActivityLog::log(
                action: 'public_exam_media.renamed',
                module: 'public_exam_media',
                description: ($user?->name ?? 'Admin')." mengubah nama gambar '{$oldName}' menjadi '{$newName}'.",
                targetLabel: $newName,
                metadata: ['old_name' => $oldName, 'new_name' => $newName],
                targetType: 'PublicExamMedia'
            );
        }

        return redirect()->back()->with('success', 'File berhasil diubah namanya.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string'],
        ]);

        $name = basename($request->input('name'));
        $filePath = $this->path.'/'.$name;

        if (! Storage::disk($this->disk)->exists($filePath)) {
            return redirect()->back()->with('error', 'File tidak ditemukan di Bank Media Ujian Publik.');
        }

        Storage::disk($this->disk)->delete($filePath);

        // Clean tags from exam_public_questions
        $tagPattern = '/\s*\[(GAMBAR|IMG):\s*'.preg_quote($name, '/').'\s*\]\s*/i';
        $affectedQuestions = DB::table('exam_public_questions')
            ->whereNull('deleted_at')
            ->where('question_text', 'like', "%{$name}%")
            ->get(['id', 'question_text']);

        foreach ($affectedQuestions as $q) {
            DB::table('exam_public_questions')->where('id', $q->id)->update([
                'question_text' => trim((string) preg_replace($tagPattern, ' ', (string) $q->question_text)),
                'updated_at' => now(),
            ]);
        }

        $user = auth()->user();
        SystemActivityLog::log(
            action: 'public_exam_media.deleted',
            module: 'public_exam_media',
            description: ($user?->name ?? 'Admin')." menghapus gambar '{$name}' dari Bank Media Ujian Publik.",
            targetLabel: $name,
            metadata: ['name' => $name, 'affected_questions_count' => $affectedQuestions->count()],
            targetType: 'PublicExamMedia'
        );

        return redirect()->back()->with('success', "Gambar '{$name}' berhasil dihapus.");
    }

    public function packages(): JsonResponse
    {
        $packages = DB::table('exam_public_packages as package')
            ->join('exam_public_subjects as subject', 'subject.id', '=', 'package.exam_public_subject_id')
            ->select('package.id', 'package.title', 'package.code', 'subject.name as subject_name')
            ->orderBy('subject.name')
            ->orderBy('package.title')
            ->get();

        return response()->json($packages);
    }

    public function questions(int $packageId): JsonResponse
    {
        $questions = DB::table('exam_public_questions')
            ->where('exam_public_package_id', $packageId)
            ->whereNull('deleted_at')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'sort_order', 'question_text'])
            ->map(function ($q) {
                return [
                    'id' => $q->id,
                    'sort_order' => $q->sort_order,
                    'preview' => Str::limit(strip_tags((string) $q->question_text), 80),
                    'has_image' => (bool) preg_match('/\[(GAMBAR|IMG):/i', (string) $q->question_text),
                ];
            });

        return response()->json($questions);
    }

    public function assign(Request $request): JsonResponse
    {
        $request->validate([
            'filename' => ['required', 'string'],
            'question_id' => ['required', 'integer'],
            'position' => ['required', 'in:prepend,append'],
        ]);

        $filename = basename($request->input('filename'));
        $questionId = (int) $request->input('question_id');
        $position = $request->input('position');

        $question = DB::table('exam_public_questions')->where('id', $questionId)->whereNull('deleted_at')->first();
        if (! $question) {
            return response()->json(['message' => 'Soal ujian publik tidak ditemukan.'], 404);
        }

        $tag = "[GAMBAR: {$filename}]";
        $currentText = (string) $question->question_text;

        if (str_contains($currentText, $tag) || preg_match('/\[(GAMBAR|IMG):\s*'.preg_quote($filename, '/').'\s*\]/i', $currentText)) {
            return response()->json([
                'already_exists' => true,
                'message' => 'Tag gambar sudah ada pada butir soal ini.',
            ]);
        }

        $newText = $position === 'prepend'
            ? $tag."\n".$currentText
            : $currentText."\n".$tag;

        DB::table('exam_public_questions')->where('id', $questionId)->update([
            'question_text' => trim($newText),
            'updated_at' => now(),
        ]);

        return response()->json([
            'already_exists' => false,
            'message' => "Gambar '{$filename}' berhasil dihubungkan ke soal #{$question->sort_order}.",
        ]);
    }

    private function ensureDirectoryExists(): void
    {
        if (! Storage::disk($this->disk)->exists($this->path)) {
            Storage::disk($this->disk)->makeDirectory($this->path);
        }
    }

    private function getUniqueFilename(string $originalName): string
    {
        $name = pathinfo($originalName, PATHINFO_FILENAME);
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $slug = Str::slug($name);

        $filename = "{$slug}.{$ext}";
        $counter = 1;

        while (Storage::disk($this->disk)->exists("{$this->path}/{$filename}")) {
            $filename = "{$slug}-{$counter}.{$ext}";
            $counter++;
        }

        return $filename;
    }
}
