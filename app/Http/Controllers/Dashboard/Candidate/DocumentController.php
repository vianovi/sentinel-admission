<?php

namespace App\Http\Controllers\Dashboard\Candidate;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\CandidateDocumentSecurity;
use App\Services\CandidateStatus\CandidateGateService;
use App\Services\CandidateStatus\CandidateStatusService;
use App\Services\CandidateStatus\CandidateVerificationEvaluator;
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
        private readonly DocumentSecurityService $security,
        private readonly CandidateVerificationEvaluator $verificationEvaluator,
        private readonly CandidateGateService $gateService,
        private readonly CandidateStatusService $statusService
    ) {}

    // =============================================
    // INDEX — Render halaman Dokumen
    // =============================================

    public function index(Request $request): Response
    {
        $user      = $request->user();
        $candidate = $user->candidate()->with('admissionWave')->firstOrFail();
        $this->statusService->syncAfterEvent($candidate, 'documents.index');
        $candidate->refresh();

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
            'completion'      => $this->calculateCompletion($candidate->id),
            'gate'            => $this->gateService->documents($candidate, $user),
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
        $this->statusService->syncAfterEvent($candidate, 'document.upload.gate_check');
        $candidate->refresh();
        $gate      = $this->gateService->documents($candidate, $user);

        if (! $gate['allowed']) {
            return $this->lockedResponse($request, $gate['reason'] ?? 'Halaman dokumen masih terkunci.');
        }

        $validated = $request->validate(
            [
                'file' => [
                    'required',
                    'file',
                    'mimes:jpeg,jpg,png,pdf',
                    'mimetypes:image/jpeg,image/png,application/pdf',
                    'max:5120',
                ],
            ],
            [
                'file.required'   => 'File dokumen wajib diunggah.',
                'file.file'       => 'Berkas yang diunggah tidak valid.',
                'file.mimes'      => 'Format tidak didukung. Gunakan file JPEG, PNG, atau PDF.',
                'file.mimetypes'  => 'Format tidak didukung. Gunakan file JPEG, PNG, atau PDF.',
                'file.max'        => 'Ukuran file terlalu besar. Maksimal yang diizinkan adalah 5MB.',
            ]
        );

        $file      = $request->file('file');
        $uploadIp  = $request->ip();
        $userAgent = $request->userAgent() ?? '';

        $securityResult = $this->security->runAll($file, $uploadIp, $userAgent);

        if (! $this->security->isSafeToStore($securityResult)) {
            Log::error('Document upload security check failed', [
                'user_id' => $user->id,
                'candidate_code' => $candidate->candidate_code,
                'doc_type' => $docType,
                'magic_bytes' => $securityResult['magic_bytes_result'],
                'polyglot_clean' => $securityResult['polyglot_clean'],
                'polyglot_detail' => $securityResult['polyglot_detail'],
            ]);
            $msg = 'Berkas dokumen gagal diunggah karena tidak memenuhi standar format atau keamanan sistem kami.';
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

            $this->statusService->syncAfterEvent($candidate, 'document.uploaded');

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
        $this->statusService->syncAfterEvent($candidate, 'document.delete.gate_check');
        $candidate->refresh();
        $gate      = $this->gateService->documents($candidate, $user);

        if (! $gate['allowed']) {
            return back()->withErrors(['gate' => $gate['reason'] ?? 'Halaman dokumen masih terkunci.']);
        }

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
            $this->statusService->syncAfterEvent($candidate, 'document.deleted');
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

    private function calculateCompletion(int $candidateId): int
    {
        $candidate = Candidate::find($candidateId);

        if (! $candidate) {
            return 0;
        }

        $uploadedTypes = CandidateDocument::where('candidate_id', $candidateId)
            ->whereNull('deleted_at')
            ->pluck('doc_type')
            ->unique()
            ->toArray();

        $allTypes = $this->verificationEvaluator->requiredDocumentTypes($candidate);

        if (count($allTypes) === 0) return 0;

        $uploaded = count(array_intersect($uploadedTypes, $allTypes));
        return (int) round(($uploaded / count($allTypes)) * 100);
    }

    private function lockedResponse(Request $request, string $message)
    {
        if ($request->wantsJson()) {
            return response()->json([
                'message' => $message,
                'errors' => ['gate' => $message],
            ], 403);
        }

        return back()->withErrors(['gate' => $message]);
    }
}
