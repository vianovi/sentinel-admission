<?php

namespace App\Http\Controllers\Dashboard\Candidate;

use App\Http\Controllers\Controller;
use App\Models\CandidateDocument;
use App\Models\CandidateDocumentSecurity;
use App\Services\DocumentSecurityService;
use App\Support\SentinelStoragePaths;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    public function __construct(
        private readonly DocumentSecurityService $security
    ) {}

    // =============================================
    // INDEX — Render halaman Dokumen
    // =============================================

    public function index(Request $request): Response
    {
        $user      = $request->user();
        $candidate = $user->candidate()->with('admissionWave')->firstOrFail();

        $documents = CandidateDocument::where('candidate_id', $candidate->id)
            ->whereNull('deleted_at')
            ->get(['id', 'doc_type', 'doc_group', 'original_filename',
                   'status', 'rejection_reason', 'created_at', 'updated_at'])
            ->keyBy('doc_type')
            ->toArray();

        $achievementTypes = CandidateDocument::MULTI_UPLOAD_TYPES;
        $achievementDocs  = CandidateDocument::where('candidate_id', $candidate->id)
            ->whereIn('doc_type', $achievementTypes)
            ->whereNull('deleted_at')
            ->get(['id', 'doc_type', 'original_filename', 'status', 'rejection_reason', 'created_at'])
            ->groupBy('doc_type')
            ->toArray();

        foreach ($achievementTypes as $type) {
            unset($documents[$type]);
        }

        return Inertia::render('Dashboard/Candidate/DataDokumen', [
            'user' => [
                'name'       => $user->name,
                'avatar_url' => $user->avatar_url,
                'initials'   => $user->initials,
            ],
            'candidate' => [
                'full_name'           => $candidate->full_name,
                'nisn'                => $candidate->nisn,
                'nik'                 => $candidate->nik,
                'gender_label'        => $candidate->genderLabel(),
                'date_of_birth_label' => $candidate->date_of_birth?->format('d F Y'),
                'school_origin'       => $candidate->school_origin,
                'status'              => $candidate->status,
                'program_choice'      => $candidate->program_choice,
                'admission_wave'      => $candidate->admissionWave
                    ? ['title' => $candidate->admissionWave->title]
                    : null,
            ],
            'documents'       => $documents,
            'achievementDocs' => $achievementDocs,
            'isTransfer'      => (bool) $candidate->is_transfer,
            'completion'      => $this->calculateCompletion($candidate->id, (bool) $candidate->is_transfer),
        ]);
    }

    // =============================================
    // STORE — Upload dokumen
    // =============================================

    public function store(Request $request, string $docType)
    {
        $isJson = $request->wantsJson();

        if (! CandidateDocument::isValidDocType($docType)) {
            if ($isJson) return response()->json(['errors' => ['file' => 'Jenis dokumen tidak valid.']], 422);
            return back()->withErrors(['file' => 'Jenis dokumen tidak valid.']);
        }

        $user      = $request->user();
        $candidate = $user->candidate()->firstOrFail();

        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:jpeg,jpg,png,pdf',
                'mimetypes:image/jpeg,image/png,application/pdf',
                'max:5120',
            ],
        ]);

        $file      = $request->file('file');
        $uploadIp  = $request->ip();
        $userAgent = $request->userAgent() ?? '';

        $securityResult = $this->security->runAll($file, $uploadIp, $userAgent);

        if (! $this->security->isSafeToStore($securityResult)) {
            $msg = 'Format file tidak didukung. Pastikan file berupa JPEG, PNG, atau PDF yang valid.';
            if ($isJson) return response()->json(['errors' => ['file' => $msg]], 422);
            return back()->withErrors(['file' => $msg]);
        }

        $storedFilename = $this->security->generateStoredFilename(
            $securityResult['detected_mime']
        );
        $docGroup = CandidateDocument::getGroupForDocType($docType) ?? 'general';
        $storageDirectory = SentinelStoragePaths::candidateDocumentDirectory(
            $candidate->candidate_code,
            $docGroup,
            $docType
        );
        $storagePath = "{$storageDirectory}/{$storedFilename}";

        $oldPaths = collect();

        DB::beginTransaction();
        try {
            if (! CandidateDocument::allowsMultiple($docType)) {
                $oldDocuments = CandidateDocument::where('candidate_id', $candidate->id)
                    ->where('doc_type', $docType)
                    ->whereNull('deleted_at')
                    ->get();

                $oldPaths = $oldDocuments->pluck('file_path')->filter();

                $oldDocuments->each(function ($doc) {
                    $doc->delete();
                });
            }

            $file->storeAs(
                $storageDirectory,
                $storedFilename,
                'private'
            );

            $document = CandidateDocument::create([
                'candidate_id'      => $candidate->id,
                'candidate_code'    => $candidate->candidate_code,
                'doc_type'          => $docType,
                'doc_group'         => $docGroup,
                'original_filename' => $file->getClientOriginalName(),
                'stored_filename'   => $storedFilename,
                'file_path'         => $storagePath,
                'mime_type'         => $securityResult['detected_mime'],
                'file_size_kb'      => (int) ceil($file->getSize() / 1024),
                'status'            => 'pending',
            ]);

            CandidateDocumentSecurity::create(array_merge(
                ['document_id' => $document->id],
                $securityResult
            ));

            DB::commit();

            $oldPaths->each(function (string $oldPath) use ($storagePath) {
                if ($oldPath !== $storagePath && Storage::disk('private')->exists($oldPath)) {
                    Storage::disk('private')->delete($oldPath);
                }
            });

            if ($isJson) return response()->json(['message' => 'Dokumen berhasil diupload.'], 200);
            return back()->with('success', 'Dokumen berhasil diupload dan sedang menunggu verifikasi.');

        } catch (\Exception $e) {
            DB::rollBack();
            Storage::disk('private')->delete($storagePath);

            Log::error('DocumentController@store failed', [
                'user_id'  => $user->id,
                'doc_type' => $docType,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);

            $msg = 'Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.';
            if ($isJson) return response()->json(['errors' => ['file' => $msg]], 500);
            return back()->withErrors(['file' => $msg]);
        }
    }

    // =============================================
    // DESTROY — Hapus dokumen (soft delete)
    // =============================================

    public function destroy(Request $request, int $documentId): RedirectResponse
    {
        $user      = $request->user();
        $candidate = $user->candidate()->firstOrFail();

        $document = CandidateDocument::where('id', $documentId)
            ->where('candidate_id', $candidate->id)
            ->firstOrFail();

        if ($document->status === 'verified') {
            return back()->withErrors(['file' => 'Dokumen yang sudah terverifikasi tidak dapat dihapus.']);
        }

        DB::beginTransaction();
        try {
            Storage::disk('private')->delete($document->file_path);
            $document->delete();

            DB::commit();
            return back()->with('success', 'Dokumen berhasil dihapus.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DocumentController@destroy failed', [
                'user_id'     => $user->id,
                'document_id' => $documentId,
                'error'       => $e->getMessage(),
            ]);
            return back()->withErrors(['file' => 'Gagal menghapus dokumen. Silakan coba lagi.']);
        }
    }

    // =============================================
    // PRIVATE: COMPLETION CALCULATION
    // =============================================

    private function calculateCompletion(int $candidateId, bool $isTransfer): int
    {
        $uploadedTypes = CandidateDocument::where('candidate_id', $candidateId)
            ->whereNull('deleted_at')
            ->pluck('doc_type')
            ->unique()
            ->toArray();

        $allTypes = collect(CandidateDocument::DOC_TYPES)
            ->filter(function ($meta, $type) use ($isTransfer) {
                if (isset($meta['conditional']) && $meta['conditional'] === true) {
                    return $isTransfer;
                }
                return true;
            })
            ->keys()
            ->toArray();

        if (count($allTypes) === 0) return 0;

        $uploaded = count(array_intersect($uploadedTypes, $allTypes));
        return (int) round(($uploaded / count($allTypes)) * 100);
    }
}
