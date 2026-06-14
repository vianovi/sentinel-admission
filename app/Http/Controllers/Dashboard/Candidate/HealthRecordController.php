<?php

namespace App\Http\Controllers\Dashboard\Candidate;

use App\Http\Controllers\Controller;
use App\Models\HealthRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class HealthRecordController extends Controller
{
    // =============================================
    // ALLOWED FILE TYPES & MAGIC BYTES
    // =============================================

    private const ALLOWED_MIMES      = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    private const MAX_FILE_SIZE      = 2048; // KB

    private const MAGIC_BYTES = [
        'jpg'  => "\xFF\xD8\xFF",
        'jpeg' => "\xFF\xD8\xFF",
        'png'  => "\x89PNG",
        'webp' => 'RIFF',
        'pdf'  => '%PDF',
    ];

    private const UPLOAD_FIELDS = [
        'surat_sehat'     => 'surat_sehat_path',
        'bpjs_card'       => 'bpjs_card_path',
        'vaccine_card'    => 'vaccine_card_path',
        'chronic_disease' => 'chronic_disease_doc_path',
    ];

    // =============================================
    // SHOW — GET /dashboard/data-kesehatan
    // =============================================

    public function show()
    {
        $user      = Auth::user();
        $candidate = $user->candidate()->with('admissionWave')->first();

        if (! $candidate) {
            return redirect()->route('dashboard.index');
        }

        $healthRecord = $candidate->healthRecord;

        return Inertia::render('Dashboard/Candidate/DataKesehatan', [
            'healthRecord' => $healthRecord
                ? $this->formatForFrontend($healthRecord)
                : null,
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
        ]);
    }

    // =============================================
    // SAVE — POST /dashboard/data-kesehatan
    // =============================================

    public function save(Request $request)
    {
        $candidate = Auth::user()->candidate;

        if (! $candidate) {
            return back()->withErrors(['general' => 'Data kandidat tidak ditemukan.']);
        }

        $validated = $request->validate(
            $this->validationRules(),
            $this->validationMessages()
        );

        $healthRecord = HealthRecord::firstOrNew(['candidate_id' => $candidate->id]);

        $healthRecord->fill(
            collect($validated)
                ->except(array_keys(self::UPLOAD_FIELDS))
                ->toArray()
        );

        $healthRecord->candidate_id = $candidate->id;
        $healthRecord->save();

        return back()->with('success', 'Data kesehatan berhasil disimpan.');
    }

    // =============================================
    // UPLOAD DOKUMEN — POST /dashboard/data-kesehatan/dokumen/{docType}
    // =============================================

    public function uploadDocument(Request $request, string $docType)
    {
        if (! array_key_exists($docType, self::UPLOAD_FIELDS)) {
            return response()->json(['message' => 'Tipe dokumen tidak valid.'], 422);
        }

        $request->validate([
            'file' => [
                'required', 'file',
                'max:' . self::MAX_FILE_SIZE,
                'mimes:' . implode(',', self::ALLOWED_EXTENSIONS),
                'mimetypes:' . implode(',', self::ALLOWED_MIMES),
            ],
        ], [
            'file.required' => 'File tidak boleh kosong.',
            'file.max'      => 'Ukuran file maksimal 2MB.',
            'file.mimes'    => 'Format file harus JPG, PNG, WebP, atau PDF.',
        ]);

        $file = $request->file('file');

        if (! $this->passesMagicBytesCheck($file)) {
            Log::warning('Health record upload blocked: magic bytes mismatch', [
                'candidate_id'  => Auth::user()->candidate?->id,
                'doc_type'      => $docType,
                'original_name' => $file->getClientOriginalName(),
            ]);
            return response()->json(['message' => 'File tidak valid.'], 422);
        }

        if (! $this->passesPolyglotScan($file)) {
            Log::warning('Health record upload blocked: polyglot pattern detected', [
                'candidate_id' => Auth::user()->candidate?->id,
                'doc_type'     => $docType,
            ]);
            return response()->json(['message' => 'File tidak valid.'], 422);
        }

        $candidate = Auth::user()->candidate;

        if (! $candidate) {
            return response()->json(['message' => 'Data kandidat tidak ditemukan.'], 422);
        }

        $column      = self::UPLOAD_FIELDS[$docType];
        $ext         = $this->getExtFromMagicBytes($file);
        $filename    = Str::uuid() . '.' . $ext;
        $storagePath = "health-documents/{$candidate->id}/{$filename}";

        DB::beginTransaction();
        try {
            $healthRecord = HealthRecord::firstOrCreate(
                ['candidate_id' => $candidate->id]
            );

            $oldPath = $healthRecord->$column;

            $file->storeAs("health-documents/{$candidate->id}", $filename, 'private');

            $healthRecord->$column = $storagePath;
            $healthRecord->save();

            DB::commit();

            if ($oldPath && Storage::disk('private')->exists($oldPath)) {
                Storage::disk('private')->delete($oldPath);
            }

            return response()->json([
                'message'  => 'Dokumen berhasil diunggah.',
                'file_url' => route('dashboard.data-kesehatan.preview', ['docType' => $docType]),
                'column'   => $column,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            if (Storage::disk('private')->exists($storagePath)) {
                Storage::disk('private')->delete($storagePath);
            }

            Log::error('Health record upload failed', [
                'candidate_id' => $candidate->id,
                'doc_type'     => $docType,
                'error'        => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.'], 500);
        }
    }

    // =============================================
    // DELETE DOKUMEN — DELETE /dashboard/data-kesehatan/dokumen/{docType}
    // =============================================

    public function deleteDocument(string $docType)
    {
        if (! array_key_exists($docType, self::UPLOAD_FIELDS)) {
            return response()->json(['message' => 'Tipe dokumen tidak valid.'], 422);
        }

        $candidate    = Auth::user()->candidate;
        $healthRecord = $candidate?->healthRecord;

        if (! $healthRecord) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        $column = self::UPLOAD_FIELDS[$docType];

        DB::beginTransaction();
        try {
            $oldPath = $healthRecord->$column;

            $healthRecord->$column = null;
            $healthRecord->save();

            DB::commit();

            if ($oldPath && Storage::disk('private')->exists($oldPath)) {
                Storage::disk('private')->delete($oldPath);
            }

            return response()->json(['message' => 'Dokumen berhasil dihapus.']);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Health record delete document failed', [
                'candidate_id' => $candidate->id,
                'doc_type'     => $docType,
                'error'        => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.'], 500);
        }
    }

    // =============================================
    // PRIVATE HELPERS
    // =============================================

    private function formatForFrontend(HealthRecord $record): array
    {
        return [
            'blood_type'               => $record->blood_type,
            'blood_type_label'         => $record->blood_type_label,
            'rhesus'                   => $record->rhesus,
            'rhesus_label'             => $record->rhesus_label,
            'height_cm'                => $record->height_cm,
            'weight_kg'                => $record->weight_kg,
            'bmi'                      => $record->bmi,
            'bmi_category'             => $record->bmi_category,
            'general_health_condition' => $record->general_health_condition,
            'mental_health_notes'      => $record->mental_health_notes,
            'eye_right_type'           => $record->eye_right_type,
            'eye_right_value'          => $record->eye_right_value,
            'eye_right_label'          => $record->eye_right_label,
            'eye_left_type'            => $record->eye_left_type,
            'eye_left_value'           => $record->eye_left_value,
            'eye_left_label'           => $record->eye_left_label,
            'eye_condition_since'      => $record->eye_condition_since,
            'major_illnesses'          => $record->major_illnesses,
            'last_illness'             => $record->last_illness,
            'allergy_food'             => $record->allergy_food,
            'allergy_medicine'         => $record->allergy_medicine,
            'allergy_condition'        => $record->allergy_condition,
            'physical_disabilities'    => $record->physical_disabilities,
            'chronic_disease_doc_url'  => $record->chronic_disease_doc_url,
            'special_notes'            => $record->special_notes,
            'parent_concern_notes'     => $record->parent_concern_notes,
            'surat_sehat_url'          => $record->surat_sehat_url,
            'bpjs_card_url'            => $record->bpjs_card_url,
            'vaccine_card_url'         => $record->vaccine_card_url,
            'is_complete'              => $record->isComplete(),
            'completion_percentage'    => $record->completionPercentage(),
        ];
    }

    private function validationRules(): array
    {
        return [
            'blood_type'               => ['nullable', 'in:A,B,AB,O,unknown'],
            'rhesus'                   => ['nullable', 'in:positive,negative,unknown'],
            'height_cm'                => ['nullable', 'integer', 'min:50', 'max:250'],
            'weight_kg'                => ['nullable', 'integer', 'min:10', 'max:300'],
            'general_health_condition' => ['nullable', 'string', 'max:1000'],
            'mental_health_notes'      => ['nullable', 'string', 'max:1000'],
            'eye_right_type'           => ['nullable', 'in:normal,minus,plus,silinder,unknown'],
            'eye_right_value'          => ['nullable', 'numeric', 'min:0.25', 'max:20'],
            'eye_left_type'            => ['nullable', 'in:normal,minus,plus,silinder,unknown'],
            'eye_left_value'           => ['nullable', 'numeric', 'min:0.25', 'max:20'],
            'eye_condition_since'      => ['nullable', 'integer', 'min:1990', 'max:' . date('Y')],
            'major_illnesses'          => ['nullable', 'string', 'max:2000'],
            'last_illness'             => ['nullable', 'string', 'max:2000'],
            'allergy_food'             => ['nullable', 'string', 'max:1000'],
            'allergy_medicine'         => ['nullable', 'string', 'max:1000'],
            'allergy_condition'        => ['nullable', 'string', 'max:1000'],
            'physical_disabilities'    => ['nullable', 'string', 'max:1000'],
            'special_notes'            => ['nullable', 'string', 'max:2000'],
            'parent_concern_notes'     => ['nullable', 'string', 'max:2000'],
        ];
    }

    private function validationMessages(): array
    {
        return [
            'height_cm.min'           => 'Tinggi badan minimal 50 cm.',
            'height_cm.max'           => 'Tinggi badan maksimal 250 cm.',
            'weight_kg.min'           => 'Berat badan minimal 10 kg.',
            'weight_kg.max'           => 'Berat badan maksimal 300 kg.',
            'eye_condition_since.min' => 'Tahun kondisi mata tidak valid.',
            'eye_condition_since.max' => 'Tahun tidak boleh melebihi tahun ini.',
            'eye_right_value.min'     => 'Nilai mata kanan tidak valid.',
            'eye_right_value.max'     => 'Nilai mata kanan tidak valid.',
            'eye_left_value.min'      => 'Nilai mata kiri tidak valid.',
            'eye_left_value.max'      => 'Nilai mata kiri tidak valid.',
        ];
    }

    private function passesMagicBytesCheck(\Illuminate\Http\UploadedFile $file): bool
    {
        $ext   = strtolower($file->getClientOriginalExtension());
        $magic = self::MAGIC_BYTES[$ext] ?? null;
        if (! $magic) return false;

        $handle = fopen($file->getRealPath(), 'rb');
        $header = fread($handle, 8);
        fclose($handle);

        if ($ext === 'webp') {
            return str_starts_with($header, 'RIFF') && str_contains(substr($header, 0, 12), 'WEBP');
        }

        return str_starts_with($header, $magic);
    }

    private function passesPolyglotScan(\Illuminate\Http\UploadedFile $file): bool
    {
        $content  = file_get_contents($file->getRealPath());
        $patterns = ['<?php', '<?=', '<script', 'eval(', 'system(', 'exec(', 'base64_decode('];

        foreach ($patterns as $pattern) {
            if (stripos($content, $pattern) !== false) return false;
        }

        return true;
    }

    private function getExtFromMagicBytes(\Illuminate\Http\UploadedFile $file): string
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $header = fread($handle, 12);
        fclose($handle);

        if (str_starts_with($header, '%PDF'))         return 'pdf';
        if (str_starts_with($header, "\xFF\xD8\xFF")) return 'jpg';
        if (str_starts_with($header, "\x89PNG"))      return 'png';
        if (str_starts_with($header, 'RIFF'))         return 'webp';

        return strtolower($file->getClientOriginalExtension());
    }
}
