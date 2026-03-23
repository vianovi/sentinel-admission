<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Models\CandidateDocument;
use App\Models\CandidateDocumentSecurity;
use App\Services\DocumentSecurityService;
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

        // Load semua dokumen kandidat (tanpa join ke security — performa)
        $documents = CandidateDocument::where('candidate_id', $candidate->id)
            ->whereNull('deleted_at')
            ->get(['id', 'doc_type', 'doc_group', 'original_filename',
                   'status', 'rejection_reason', 'created_at', 'updated_at'])
            ->keyBy('doc_type')  // key by doc_type untuk lookup O(1) di frontend
            ->toArray();

        // Achievement bisa multi — override keyBy dengan grouped array
        $achievementTypes = CandidateDocument::MULTI_UPLOAD_TYPES;
        $achievementDocs  = CandidateDocument::where('candidate_id', $candidate->id)
            ->whereIn('doc_type', $achievementTypes)
            ->whereNull('deleted_at')
            ->get(['id', 'doc_type', 'original_filename', 'status', 'rejection_reason', 'created_at'])
            ->groupBy('doc_type')
            ->toArray();

        // Gabungkan: hapus achievement dari single-key map, pakai grouped map
        foreach ($achievementTypes as $type) {
            unset($documents[$type]);
        }

        return Inertia::render('Dashboard/Candidate/DataDokumen', [
            // ── CandidateSidebar props (WAJIB sama persis di semua controller) ──
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
            // ── Document-specific props ──
            'documents'        => $documents,
            'achievementDocs'  => $achievementDocs,
            'isTransfer'       => (bool) $candidate->is_transfer,
            'completion'       => $this->calculateCompletion($candidate->id, (bool) $candidate->is_transfer),
        ]);
    }

    // =============================================
    // STORE — Upload dokumen
    // =============================================

    public function store(Request $request, string $docType): RedirectResponse
    {
        // ── Validasi doc_type ─────────────────────────────────────
        if (!CandidateDocument::isValidDocType($docType)) {
            return back()->withErrors(['file' => 'Jenis dokumen tidak valid.']);
        }

        $user      = $request->user();
        $candidate = $user->candidate()->firstOrFail();

        // ── Layer 3A: Laravel validation ─────────────────────────
        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:jpeg,jpg,png,pdf',
                'mimetypes:image/jpeg,image/png,application/pdf',
                'max:5120', // 5MB
            ],
        ]);

        $file          = $request->file('file');
        $uploadIp      = $request->ip();
        $userAgent     = $request->userAgent() ?? '';

        // ── Layer 3B + 3C: Magic bytes + Polyglot scan ───────────
        $securityResult = $this->security->runAll($file, $uploadIp, $userAgent);

        if (!$this->security->isSafeToStore($securityResult)) {
            // Error SILENT ke user — detail hanya di log (sudah dicatat di service)
            return back()->withErrors(['file' => 'Format file tidak didukung. Pastikan file berupa JPEG, PNG, atau PDF yang valid.']);
        }

        // ── Layer 4: UUID rename + private storage ────────────────
        $storedFilename = $this->security->generateStoredFilename(
            $securityResult['detected_mime']
        );
        $storagePath = "candidates/{$candidate->candidate_code}/{$storedFilename}";

        DB::beginTransaction();
        try {
            // Jika non-achievement: hapus file lama (soft delete)
            if (!CandidateDocument::allowsMultiple($docType)) {
                CandidateDocument::where('candidate_id', $candidate->id)
                    ->where('doc_type', $docType)
                    ->whereNull('deleted_at')
                    ->each(function ($doc) {
                        // Hapus file fisik yang lama
                        Storage::disk('private')->delete($doc->file_path);
                        $doc->delete(); // SoftDelete
                    });
            }

            // Simpan file ke private storage
            if (config('sentinel.layer_private_storage', true)) {
                $file->storeAs(
                    "candidates/{$candidate->candidate_code}",
                    $storedFilename,
                    'private'
                );
            } else {
                // LAB-HACK: simpan ke public storage
                Log::warning('[LAB-HACK] Private storage DISABLED — saving to public', [
                    'user_id' => $user->id,
                ]);
                $file->storeAs(
                    "candidates/{$candidate->candidate_code}",
                    $storedFilename,
                    'public'
                );
            }

            // Insert ke candidate_documents
            $document = CandidateDocument::create([
                'candidate_id'      => $candidate->id,
                'candidate_code'    => $candidate->candidate_code,
                'doc_type'          => $docType,
                'doc_group'         => CandidateDocument::getGroupForDocType($docType),
                'original_filename' => $file->getClientOriginalName(),
                'stored_filename'   => $storedFilename,
                'file_path'         => $storagePath,
                'mime_type'         => $securityResult['detected_mime'],
                'file_size_kb'      => (int) ceil($file->getSize() / 1024),
                'status'            => 'pending',
            ]);

            // Insert audit trail ke candidate_document_security (1-to-1)
            CandidateDocumentSecurity::create(array_merge(
                ['document_id' => $document->id],
                $securityResult
            ));

            DB::commit();

            return back()->with('success', 'Dokumen berhasil diupload dan sedang menunggu verifikasi.');

        } catch (\Exception $e) {
            DB::rollBack();
            // Hapus file yang mungkin sudah tersimpan
            Storage::disk('private')->delete($storagePath);

            Log::error('DocumentController@store failed', [
                'user_id'  => $user->id,
                'doc_type' => $docType,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['file' => 'Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.']);
        }
    }

    // =============================================
    // DESTROY — Hapus dokumen (soft delete)
    // =============================================

    public function destroy(Request $request, int $documentId): RedirectResponse
    {
        $user      = $request->user();
        $candidate = $user->candidate()->firstOrFail();

        // Pastikan dokumen ini milik kandidat yang sedang login (cegah IDOR)
        $document = CandidateDocument::where('id', $documentId)
            ->where('candidate_id', $candidate->id)
            ->firstOrFail();

        // Kandidat tidak bisa hapus dokumen yang sudah verified
        if ($document->status === 'verified') {
            return back()->withErrors(['file' => 'Dokumen yang sudah terverifikasi tidak dapat dihapus.']);
        }

        DB::beginTransaction();
        try {
            Storage::disk('private')->delete($document->file_path);
            $document->delete(); // SoftDelete — data tetap ada untuk audit

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
    // DOWNLOAD — Serve file via signed URL
    // =============================================

    public function download(Request $request, int $documentId)
    {
        $user      = $request->user();
        $candidate = $user->candidate()->firstOrFail();

        // Pastikan dokumen ini milik kandidat yang sedang login (cegah IDOR)
        $document = CandidateDocument::where('id', $documentId)
            ->where('candidate_id', $candidate->id)
            ->firstOrFail();

        if (!Storage::disk('private')->exists($document->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }

        // Force download — tidak pernah render di browser
        if (config('sentinel.layer_force_download', true)) {
            return Storage::disk('private')->download(
                $document->file_path,
                $document->original_filename,
                ['Content-Disposition' => 'attachment']
            );
        }

        // LAB-HACK: serve inline (buka di browser — membuka celah PDF XSS)
        Log::warning('[LAB-HACK] Force download DISABLED — serving inline', [
            'user_id'     => $user->id,
            'document_id' => $documentId,
        ]);
        return Storage::disk('private')->response($document->file_path);
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

        // Filter doc_types yang seharusnya tampil (conditional)
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
