<?php

namespace App\Services\Trash;

use App\Models\RegistrationDraft;
use App\Models\SystemActivityLog;
use App\Models\SystemTrash;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TrashManagerService
{
    private string $disk = 'public';

    private string $mediaPath = 'exam/images';

    private string $trashMediaPath = 'trash/exam-images';

    /**
     * Move an exam media file to trash, stripping its tags from any related questions.
     */
    public function trashMedia(string $filename, ?User $actor = null): SystemTrash
    {
        $filename = basename($filename);
        $sourcePath = $this->mediaPath.'/'.$filename;

        if (! Storage::disk($this->disk)->exists($sourcePath)) {
            throw new Exception("File gambar '{$filename}' tidak ditemukan di bank media.");
        }

        $size = Storage::disk($this->disk)->size($sourcePath);
        $mime = Storage::disk($this->disk)->mimeType($sourcePath);

        if (! Storage::disk($this->disk)->exists($this->trashMediaPath)) {
            Storage::disk($this->disk)->makeDirectory($this->trashMediaPath);
        }

        $trashPath = $this->trashMediaPath.'/'.$filename;
        if (Storage::disk($this->disk)->exists($trashPath)) {
            $nameWithoutExt = pathinfo($filename, PATHINFO_FILENAME);
            $ext = pathinfo($filename, PATHINFO_EXTENSION);
            $trashPath = $this->trashMediaPath.'/'.$nameWithoutExt.'_'.time().'.'.$ext;
        }

        $affectedQuestions = $this->stripMediaFromQuestions($filename);
        $affectedQuestionIds = array_column($affectedQuestions, 'id');

        Storage::disk($this->disk)->move($sourcePath, $trashPath);

        $user = $actor ?? auth()->user();

        $trash = SystemTrash::create([
            'type' => 'exam_media',
            'name' => $filename,
            'identifier' => $filename,
            'original_path' => $sourcePath,
            'trash_path' => $trashPath,
            'file_size' => $size,
            'mime_type' => $mime,
            'metadata' => [
                'affected_question_ids' => $affectedQuestionIds,
                'affected_questions' => $affectedQuestions,
                'affected_questions_count' => count($affectedQuestionIds),
            ],
            'deleted_by' => $user?->id,
            'deleted_by_name' => $user?->name ?? 'Admin',
            'purge_at' => now()->addDays(30),
        ]);

        $actorName = $user?->name ?? 'Admin';
        $affectedDesc = count($affectedQuestionIds) > 0
            ? ', '.count($affectedQuestionIds).' relasi butir soal dibersihkan'
            : '';

        SystemActivityLog::log(
            action: 'media.deleted_to_trash',
            module: 'exam_media',
            description: "{$actorName} memindahkan gambar '{$filename}' ke Tempat Sampah (retensi 30 hari{$affectedDesc}).",
            targetLabel: $filename,
            metadata: [
                'trash_id' => $trash->id,
                'affected_questions' => $affectedQuestionIds,
                'file_size' => $size,
            ],
            targetType: 'ExamMedia',
            targetId: (string) $trash->id,
            actor: $user
        );

        return $trash;
    }

    /**
     * Restore an exam media file from trash back to bank media.
     */
    public function restoreMedia(int $trashId, ?User $actor = null): bool
    {
        $trash = SystemTrash::where('type', 'exam_media')->findOrFail($trashId);

        if (! Storage::disk($this->disk)->exists($trash->trash_path)) {
            throw new Exception('File fisik gambar di tempat sampah tidak ditemukan.');
        }

        $destPath = $trash->original_path;
        if (Storage::disk($this->disk)->exists($destPath)) {
            $nameWithoutExt = pathinfo($trash->name, PATHINFO_FILENAME);
            $ext = pathinfo($trash->name, PATHINFO_EXTENSION);
            $destPath = $this->mediaPath.'/'.$nameWithoutExt.'_restored_'.time().'.'.$ext;
        }

        Storage::disk($this->disk)->move($trash->trash_path, $destPath);

        $restoredQuestionIds = $destPath === $trash->original_path
            ? $this->restoreMediaToQuestions($trash->metadata['affected_questions'] ?? [])
            : [];

        $user = $actor ?? auth()->user();
        $actorName = $user?->name ?? 'Admin';

        SystemActivityLog::log(
            action: 'media.restored',
            module: 'exam_media',
            description: "{$actorName} memulihkan gambar '{$trash->name}' dari Tempat Sampah ke Bank Media.",
            targetLabel: $trash->name,
            metadata: [
                'restored_path' => $destPath,
                'previous_affected_questions' => $trash->metadata['affected_question_ids'] ?? [],
                'restored_question_ids' => $restoredQuestionIds,
            ],
            targetType: 'ExamMedia',
            targetId: (string) $trash->id,
            actor: $user
        );

        $trash->delete();

        return true;
    }

    /**
     * Permanently delete an exam media file from trash.
     */
    public function purgeMedia(int $trashId, ?User $actor = null): bool
    {
        $trash = SystemTrash::where('type', 'exam_media')->findOrFail($trashId);

        if ($trash->trash_path && Storage::disk($this->disk)->exists($trash->trash_path)) {
            Storage::disk($this->disk)->delete($trash->trash_path);
        }

        $user = $actor ?? auth()->user();
        $actorName = $user?->name ?? 'Admin';

        SystemActivityLog::log(
            action: 'media.purged',
            module: 'exam_media',
            description: "{$actorName} menghapus permanen gambar '{$trash->name}' dari Tempat Sampah.",
            targetLabel: $trash->name,
            metadata: [
                'file_size' => $trash->file_size,
            ],
            targetType: 'ExamMedia',
            targetId: (string) $trash->id,
            actor: $user
        );

        $trash->delete();

        return true;
    }

    /**
     * Move a candidate draft to trash.
     */
    public function trashCandidateDraft(int $draftId, ?User $actor = null): SystemTrash
    {
        $draft = RegistrationDraft::findOrFail($draftId);

        $user = $actor ?? auth()->user();
        $actorName = $user?->name ?? 'Admin';
        $candidateName = $draft->full_name ?? 'Draft #'.$draft->id;

        $snapshot = [
            'id' => $draft->id,
            'registration_code' => $draft->registration_code,
            'nisn' => $draft->nisn,
            'nik' => $draft->nik,
            'full_name' => $draft->full_name,
            'gender' => $draft->gender,
            'email' => $draft->email,
            'whatsapp_number' => $draft->whatsapp_number,
            'current_step' => $draft->current_step,
            'expires_at' => $draft->expires_at?->toIso8601String(),
        ];

        $draft->delete();

        $trash = SystemTrash::create([
            'type' => 'candidate_draft',
            'name' => $candidateName,
            'identifier' => (string) $draft->id,
            'metadata' => $snapshot,
            'deleted_by' => $user?->id,
            'deleted_by_name' => $actorName,
            'purge_at' => now()->addDays(30),
        ]);

        SystemActivityLog::log(
            action: 'candidate_draft.deleted_to_trash',
            module: 'candidate_draft',
            description: "{$actorName} memindahkan draft pendaftaran '{$candidateName}' ke Tempat Sampah.",
            targetLabel: $candidateName,
            metadata: $snapshot,
            targetType: 'RegistrationDraft',
            targetId: (string) $draft->id,
            actor: $user
        );

        return $trash;
    }

    /**
     * Restore a candidate draft from trash.
     */
    public function restoreCandidateDraft(int $trashId, ?User $actor = null): bool
    {
        $trash = SystemTrash::where('type', 'candidate_draft')->findOrFail($trashId);

        $draft = RegistrationDraft::onlyTrashed()->find($trash->identifier);
        if ($draft) {
            $draft->restore();
        }

        $user = $actor ?? auth()->user();
        $actorName = $user?->name ?? 'Admin';

        SystemActivityLog::log(
            action: 'candidate_draft.restored',
            module: 'candidate_draft',
            description: "{$actorName} memulihkan draft pendaftaran '{$trash->name}' dari Tempat Sampah.",
            targetLabel: $trash->name,
            metadata: $trash->metadata,
            targetType: 'RegistrationDraft',
            targetId: (string) $trash->identifier,
            actor: $user
        );

        $trash->delete();

        return true;
    }

    /**
     * Permanently purge a candidate draft from trash.
     */
    public function purgeCandidateDraft(int $trashId, ?User $actor = null): bool
    {
        $trash = SystemTrash::where('type', 'candidate_draft')->findOrFail($trashId);

        $draft = RegistrationDraft::withTrashed()->find($trash->identifier);
        if ($draft) {
            $draft->forceDelete();
        }

        $user = $actor ?? auth()->user();
        $actorName = $user?->name ?? 'Admin';

        SystemActivityLog::log(
            action: 'candidate_draft.purged',
            module: 'candidate_draft',
            description: "{$actorName} menghapus permanen draft pendaftaran '{$trash->name}' dari database.",
            targetLabel: $trash->name,
            metadata: $trash->metadata,
            targetType: 'RegistrationDraft',
            targetId: (string) $trash->identifier,
            actor: $user
        );

        $trash->delete();

        return true;
    }

    /**
     * Empty entire trash for a specific type or all.
     */
    public function emptyTrash(string $type = 'all', ?User $actor = null): int
    {
        $query = SystemTrash::query();
        if ($type !== 'all') {
            $query->where('type', $type);
        }

        $items = $query->get();
        $purgedCount = 0;

        foreach ($items as $item) {
            if ($item->type === 'exam_media') {
                if ($item->trash_path && Storage::disk($this->disk)->exists($item->trash_path)) {
                    Storage::disk($this->disk)->delete($item->trash_path);
                }
            } elseif ($item->type === 'candidate_draft') {
                $draft = RegistrationDraft::withTrashed()->find($item->identifier);
                $draft?->forceDelete();
            }

            $item->delete();
            $purgedCount++;
        }

        $user = $actor ?? auth()->user();
        $actorName = $user?->name ?? 'Admin';
        $typeLabel = match ($type) {
            'exam_media' => 'Bank Media',
            'candidate_draft' => 'Draft Pendaftaran',
            default => 'Seluruh Modul',
        };

        SystemActivityLog::log(
            action: 'trash.emptied',
            module: 'system',
            description: "{$actorName} mengosongkan Tempat Sampah ({$typeLabel}) — {$purgedCount} data dihapus permanen.",
            targetLabel: $typeLabel,
            metadata: ['purged_count' => $purgedCount, 'type' => $type],
            targetType: 'SystemTrash',
            actor: $user
        );

        return $purgedCount;
    }

    /**
     * Prune expired items (> 30 days retention).
     */
    public function pruneExpiredTrash(): int
    {
        $expiredItems = SystemTrash::where('purge_at', '<=', now())->get();
        $count = 0;

        foreach ($expiredItems as $item) {
            if ($item->type === 'exam_media') {
                if ($item->trash_path && Storage::disk($this->disk)->exists($item->trash_path)) {
                    Storage::disk($this->disk)->delete($item->trash_path);
                }
            } elseif ($item->type === 'candidate_draft') {
                $draft = RegistrationDraft::withTrashed()->find($item->identifier);
                $draft?->forceDelete();
            }

            $item->delete();
            $count++;
        }

        if ($count > 0) {
            SystemActivityLog::log(
                action: 'trash.auto_purged',
                module: 'system',
                description: "Sistem otomatis membersihkan {$count} data sampah yang telah melewati masa retensi 30 hari.",
                targetLabel: 'Auto-Purge 30 Hari',
                metadata: ['purged_count' => $count],
                targetType: 'SystemTrash',
                actor: null
            );
        }

        return $count;
    }

    /**
     * Find and strip image tags [GAMBAR: filename] and [IMG: filename] from all questions.
     *
     * @return array<int, array{id: int, before: array<string, mixed>, after: array<string, mixed>}> Affected question snapshots
     */
    private function stripMediaFromQuestions(string $filename): array
    {
        $pattern = '/\[(GAMBAR|IMG):\s*'.preg_quote($filename, '/').'\s*\]/i';

        $questions = DB::table('exam_questions')
            ->whereNull('deleted_at')
            ->where(function ($q) use ($filename) {
                $q->where('question_text', 'like', "%{$filename}%")
                    ->orWhere('explanation', 'like', "%{$filename}%")
                    ->orWhere('options', 'like', "%{$filename}%");
            })
            ->get(['id', 'question_text', 'explanation', 'options']);

        $affectedIds = [];

        foreach ($questions as $q) {
            $changed = false;
            $newText = preg_replace($pattern, '', $q->question_text);
            if ($newText !== $q->question_text) {
                $newText = preg_replace("/\n{3,}/", "\n\n", trim((string) $newText));
                $changed = true;
            }

            $newExplanation = $q->explanation;
            if ($newExplanation && preg_match($pattern, $newExplanation)) {
                $newExplanation = preg_replace($pattern, '', $newExplanation);
                $newExplanation = preg_replace("/\n{3,}/", "\n\n", trim((string) $newExplanation));
                $changed = true;
            }

            $newOptions = $q->options;
            if ($newOptions && str_contains($newOptions, $filename)) {
                $decoded = json_decode($newOptions, true);
                if (is_array($decoded)) {
                    $decodedCleaned = array_map(function ($opt) use ($pattern) {
                        return is_string($opt) ? preg_replace($pattern, '', $opt) : $opt;
                    }, $decoded);
                    $newOptions = json_encode($decodedCleaned);
                    $changed = true;
                }
            }

            if ($changed) {
                $before = [
                    'question_text' => $q->question_text,
                    'explanation' => $q->explanation,
                    'options' => $q->options,
                ];
                $after = [
                    'question_text' => $newText,
                    'explanation' => $newExplanation,
                    'options' => $newOptions,
                ];

                DB::table('exam_questions')
                    ->where('id', $q->id)
                    ->update($after + ['updated_at' => now()]);

                $affectedIds[] = [
                    'id' => $q->id,
                    'before' => $before,
                    'after' => $after,
                ];
            }
        }

        return $affectedIds;
    }

    /**
     * Restore question snapshots only when no admin changed the cleaned content meanwhile.
     *
     * @param  array<int, array{id?: mixed, before?: mixed, after?: mixed}>  $snapshots
     * @return array<int>
     */
    private function restoreMediaToQuestions(array $snapshots): array
    {
        $restoredIds = [];

        foreach ($snapshots as $snapshot) {
            if (! isset($snapshot['id']) || ! is_array($snapshot['before'] ?? null) || ! is_array($snapshot['after'] ?? null)) {
                continue;
            }

            $question = DB::table('exam_questions')
                ->where('id', $snapshot['id'])
                ->whereNull('deleted_at')
                ->first(['id', 'question_text', 'explanation', 'options']);

            if (! $question) {
                continue;
            }

            $current = [
                'question_text' => $question->question_text,
                'explanation' => $question->explanation,
                'options' => $question->options,
            ];

            if ($current !== $snapshot['after']) {
                continue;
            }

            DB::table('exam_questions')
                ->where('id', $question->id)
                ->update($snapshot['before'] + ['updated_at' => now()]);

            $restoredIds[] = $question->id;
        }

        return $restoredIds;
    }
}
