<?php

namespace App\Services\Demo;

use App\Events\DashboardMetricsUpdated;
use App\Models\AdmissionWave;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\CandidateDocumentSecurity;
use App\Models\Exam\ExamSession;
use App\Models\Exam\ExamSessionCandidate;
use App\Models\Guardian;
use App\Models\HealthRecord;
use App\Models\Payment;
use App\Models\PaymentConfig;
use App\Models\RegistrationDraft;
use App\Models\User;
use App\Services\CandidateStatus\CandidateStatusService;
use App\Support\SentinelStoragePaths;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TrafficSimulatorService
{
    public const PRESET_BALANCED = 'balanced';

    public const PRESET_BACKLOG = 'backlog';

    public const PRESET_FINANCIAL = 'financial';

    private const FIRST_NAMES_MALE = [
        'Ahmad', 'Budi', 'Dimas', 'Fajar', 'Galang', 'Hafidz', 'Irfan', 'Kurniawan',
        'Muhammad', 'Rendi', 'Satria', 'Wahyu', 'Zulfikar', 'Reza', 'Fikri', 'Aditya',
        'Bagus', 'Candra', 'Dwi', 'Eko', 'Farhan', 'Gilang', 'Ilham', 'Joko',
    ];

    private const FIRST_NAMES_FEMALE = [
        'Aisyah', 'Annisa', 'Dewi', 'Fitri', 'Indah', 'Nadia', 'Putri', 'Rina',
        'Siti', 'Tari', 'Wulan', 'Zahra', 'Nurul', 'Salma', 'Anindya', 'Bella',
        'Citra', 'Dian', 'Eva', 'Gita', 'Hana', 'Intan', 'Lestari', 'Maya',
    ];

    private const LAST_NAMES = [
        'Pratama', 'Santoso', 'Ramadhan', 'Saputra', 'Alamsyah', 'Hakim', 'Hidayat',
        'Maulana', 'Haikal', 'Kusuma', 'Nugroho', 'Wibowo', 'Siregar', 'Nasution',
        'Wijaya', 'Setiawan', 'Kurnia', 'Subagyo', 'Firmansyah', 'Putra', 'Putri',
        'Lestari', 'Rahmawati', 'Handayani', 'Permatasari', 'Amelia', 'Fauziyah',
    ];

    private const SCHOOL_LIST = [
        'SMP Negeri 1 Jakarta',
        'SMP Negeri 2 Surabaya',
        'SMP Negeri 5 Bandung',
        'SMP Islam Al-Azhar 1',
        'MTs Negeri 1 Yogyakarta',
        'SMP Taruna Nusantara',
        'SMP Stella Duce',
        'SMP Negeri 3 Semarang',
        'MTs Negeri 2 Malang',
        'SMP BPK Penabur',
        'SMP Negeri 4 Medan',
        'SMP Labschool Rawamangun',
        'SMP Muhammadiyah 1 Surakarta',
        'SMP Negeri 1 Denpasar',
        'MTs Negeri 1 Palembang',
    ];

    private const REQUIRED_DOCUMENTS = [
        ['type' => 'photo_formal', 'group' => 'identity', 'ext' => 'jpg', 'mime' => 'image/jpeg', 'name' => 'Pas_Foto_Resmi.jpg'],
        ['type' => 'birth_certificate', 'group' => 'identity', 'ext' => 'pdf', 'mime' => 'application/pdf', 'name' => 'Akta_Kelahiran.pdf'],
        ['type' => 'family_card', 'group' => 'identity', 'ext' => 'pdf', 'mime' => 'application/pdf', 'name' => 'Kartu_Keluarga.pdf'],
        ['type' => 'parent_id_card', 'group' => 'identity', 'ext' => 'jpg', 'mime' => 'image/jpeg', 'name' => 'KTP_Orang_Tua.jpg'],
        ['type' => 'graduation_certificate', 'group' => 'academic', 'ext' => 'pdf', 'mime' => 'application/pdf', 'name' => 'Ijazah_SKL.pdf'],
        ['type' => 'report_card', 'group' => 'academic', 'ext' => 'pdf', 'mime' => 'application/pdf', 'name' => 'Buku_Rapor.pdf'],
        ['type' => 'parent_statement', 'group' => 'administration', 'ext' => 'pdf', 'mime' => 'application/pdf', 'name' => 'Surat_Pernyataan_Ortu.pdf'],
    ];

    public function __construct(
        private readonly CandidateStatusService $statusService
    ) {}

    /**
     * Resolve target active wave or create one if needed.
     */
    public function resolveWave(?string $waveOption = null): ?AdmissionWave
    {
        if ($waveOption === 'random') {
            return AdmissionWave::inRandomOrder()->first();
        }

        if (is_numeric($waveOption)) {
            return AdmissionWave::find((int) $waveOption);
        }

        // Default: find active wave
        $activeWave = AdmissionWave::where('is_active', true)
            ->where('end_date', '>=', now()->toDateString())
            ->first();

        if (! $activeWave) {
            $activeWave = AdmissionWave::where('is_active', true)->first();
        }

        return $activeWave;
    }

    /**
     * Create a demo simulation wave if none exists.
     */
    public function createDemoWave(): AdmissionWave
    {
        return DB::transaction(function () {
            $wave = AdmissionWave::create([
                'title' => 'Gelombang Demo Simulasi 2026/2027',
                'academic_year' => '2026/2027',
                'description' => 'Gelombang otomatis untuk keperluan simulasi dan demo testing live traffic.',
                'start_date' => now()->subDays(5)->toDateString(),
                'end_date' => now()->addDays(45)->toDateString(),
                'registration_fee' => 250000,
                'quota_target' => 250,
                'available_majors' => ['IPA', 'IPS', 'Rekayasa Perangkat Lunak', 'Teknik Jaringan Komputer'],
                'majors_enabled' => true,
                'is_active' => true,
            ]);

            $creator = User::whereIn('role', ['admin', 'staff'])->first()
                ?? User::firstOrCreate(
                    ['email' => 'admin@sentinel.id'],
                    [
                        'name' => 'Administrator',
                        'password' => Hash::make('password123'),
                        'role' => 'admin',
                        'is_active' => true,
                    ]
                );

            PaymentConfig::firstOrCreate(
                ['admission_wave_id' => $wave->id],
                [
                    'bank_name' => 'BCA',
                    'bank_account_number' => '1234567890',
                    'bank_account_name' => 'Yayasan Pendidikan Sentinel',
                    'bank_logo_key' => 'bca',
                    'gateway_fee_type' => PaymentConfig::FEE_TYPE_FLAT,
                    'gateway_fee_value' => 4500,
                    'gateway_fee_label' => 'Biaya Layanan',
                    'is_active' => true,
                    'created_by' => $creator->id,
                ]
            );

            return $wave;
        });
    }

    /**
     * Determine target status based on status option and preset.
     */
    public function resolveTargetStatus(string $requestedStatus = 'random', ?string $preset = null): string
    {
        $validStatuses = ['random', 'draft', 'submitted', 'verified', 'paid', 'accepted', 'rejected'];
        $requested = strtolower(trim($requestedStatus));

        if ($requested !== 'random' && in_array($requested, $validStatuses, true)) {
            return $requested;
        }

        // If random, pick status based on preset weights
        $rand = mt_rand(1, 100);

        if ($preset === self::PRESET_BACKLOG) {
            return match (true) {
                $rand <= 10 => 'draft',
                $rand <= 80 => 'submitted', // 70% in queue
                $rand <= 90 => 'verified',
                default => 'paid',
            };
        }

        if ($preset === self::PRESET_FINANCIAL) {
            return match (true) {
                $rand <= 10 => 'draft',
                $rand <= 20 => 'submitted',
                $rand <= 35 => 'verified',
                default => 'paid', // 65% paid/paying
            };
        }

        if ($preset === self::PRESET_BALANCED) {
            return match (true) {
                $rand <= 25 => 'draft',
                $rand <= 50 => 'submitted',
                $rand <= 75 => 'verified',
                default => 'paid',
            };
        }

        // Natural pipeline funnel default
        return match (true) {
            $rand <= 15 => 'draft',
            $rand <= 45 => 'submitted',
            $rand <= 65 => 'verified',
            $rand <= 90 => 'paid',
            default => 'accepted',
        };
    }

    /**
     * Simulate a single candidate lifecycle progression.
     *
     * @return array{user: User, candidate: Candidate, final_status: string}
     */
    public function simulateCandidate(
        AdmissionWave $wave,
        string $requestedStatus = 'random',
        ?string $preset = null
    ): array {
        $targetStatus = $this->resolveTargetStatus($requestedStatus, $preset);

        return DB::transaction(function () use ($wave, $targetStatus) {
            // ─── 1. Identity & Registration Draft ────────────────────────
            $gender = mt_rand(0, 1) === 1 ? 'L' : 'P';
            $firstName = $gender === 'L'
                ? self::FIRST_NAMES_MALE[array_rand(self::FIRST_NAMES_MALE)]
                : self::FIRST_NAMES_FEMALE[array_rand(self::FIRST_NAMES_FEMALE)];
            $lastName = self::LAST_NAMES[array_rand(self::LAST_NAMES)];
            $fullName = "{$firstName} {$lastName}";

            $uniq = Str::lower(Str::random(6));
            $email = "demo_{$uniq}_".time().'@demo.spmb.com';
            $nisn = '99'.str_pad((string) mt_rand(10000000, 99999999), 8, '0', STR_PAD_LEFT);
            // Ensure unique NISN
            while (Candidate::where('nisn', $nisn)->exists() || RegistrationDraft::where('nisn', $nisn)->exists()) {
                $nisn = '99'.str_pad((string) mt_rand(10000000, 99999999), 8, '0', STR_PAD_LEFT);
            }

            $phone = '08'.mt_rand(11, 99).mt_rand(1000000, 9999999);
            $school = self::SCHOOL_LIST[array_rand(self::SCHOOL_LIST)];
            $programs = $wave->available_majors ?: ['IPA', 'IPS'];
            $program = is_array($programs) ? $programs[array_rand($programs)] : 'IPA';

            // User creation
            $user = User::create([
                'name' => $fullName,
                'email' => $email,
                'password' => Hash::make('password123'),
                'role' => 'candidate',
                'whatsapp_number' => $phone,
                'is_active' => true,
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();

            // Draft step 1 & 2
            $dob = '2008-'.str_pad((string) mt_rand(1, 12), 2, '0', STR_PAD_LEFT).'-'.str_pad((string) mt_rand(1, 28), 2, '0', STR_PAD_LEFT);
            $nik = '3201'.str_pad((string) mt_rand(100000000000, 999999999999), 12, '0', STR_PAD_LEFT);

            $draft = RegistrationDraft::createFromStep1([
                'nisn' => $nisn,
                'nik' => $nik,
                'full_name' => $fullName,
                'gender' => $gender,
                'place_of_birth' => 'Bandung',
                'date_of_birth' => $dob,
            ], $wave->id);

            $draft->updateFromStep2([
                'mother_name' => 'Ibu '.$lastName,
                'whatsapp_number' => $phone,
                'email' => $email,
                'addr_jalan' => 'Jl. Pendidikan No. '.mt_rand(1, 120),
                'addr_rt' => '01',
                'addr_rw' => '05',
                'addr_desa' => 'Dago',
                'addr_kec' => 'Coblong',
                'addr_kab' => 'Kota Bandung',
                'addr_prov' => 'Jawa Barat',
            ]);

            $regCode = RegistrationDraft::generateCode($wave->id);
            $draft->update([
                'registration_code' => $regCode,
                'current_step' => 3,
                'school_origin' => $school,
            ]);

            // Candidate from draft
            $candidate = Candidate::createFromDraft($draft, $user->id);
            $guardian = Guardian::createFromDraft($draft, $candidate->id);
            $draft->delete();

            // Check if user requested to stop at draft (initial registration only)
            if ($targetStatus === 'draft') {
                DashboardMetricsUpdated::dispatchSafely('demo_candidate_draft');

                return [
                    'user' => $user,
                    'candidate' => $candidate->fresh(),
                    'final_status' => 'draft',
                ];
            }

            // Populate all required candidate fields for completion evaluator
            $candidate->update([
                'phone_number' => $phone,
                'religion' => 'Islam',
                'family_card_number' => '3201010101010001',
                'postal_code' => '40135',
                'school_npsn' => '20101010',
                'program_choice' => $program,
                'major_choice' => $program,
                'address_full' => 'Jl. Pendidikan No. '.mt_rand(1, 120),
            ]);

            // Populate guardian complete fields
            $guardian->update([
                'mother_status' => 'hidup',
                'mother_name' => 'Ibu '.$lastName,
                'mother_nik' => '3201010101010002',
                'mother_place_of_birth' => 'Bandung',
                'mother_date_of_birth' => '1984-06-12',
                'mother_education' => 'd4_s1',
                'mother_job_ktp' => 'PNS',
                'mother_job_actual' => 'Guru',
                'mother_income_range' => '5jt_10jt',
                'mother_phone' => $phone,
                'mother_province' => 'Jawa Barat',
                'mother_city' => 'Kota Bandung',
                'mother_district' => 'Coblong',
                'mother_village' => 'Dago',
                'mother_address' => 'Jl. Pendidikan No. '.mt_rand(1, 120),
                'mother_postal_code' => '40135',
                'father_status' => 'hidup',
                'father_name' => 'Bapak '.$lastName,
                'father_nik' => '3201010101010003',
                'father_place_of_birth' => 'Bandung',
                'father_date_of_birth' => '1980-04-18',
                'father_education' => 'd4_s1',
                'father_job_ktp' => 'Karyawan Swasta',
                'father_job_actual' => 'Manajer Operasional',
                'father_phone' => $phone,
                'alamat_shared' => true,
                'no_kk' => '3201010101010001',
                'income_type' => 'combined',
                'marital_status' => 'nikah_tercatat',
            ]);

            // Complete health record
            HealthRecord::create([
                'candidate_id' => $candidate->id,
                'candidate_code' => $candidate->candidate_code,
                'blood_type' => 'O',
                'rhesus' => 'positive',
                'height_cm' => mt_rand(155, 178),
                'weight_kg' => mt_rand(48, 68),
                'general_health_condition' => 'Sehat wal afiat',
                'eye_right_type' => 'normal',
                'eye_left_type' => 'normal',
                'major_illnesses' => 'Tidak ada',
                'last_illness' => 'Flu biasa',
                'allergy_food' => 'Tidak ada',
                'allergy_medicine' => 'Tidak ada',
                'allergy_condition' => 'Tidak ada',
                'physical_disabilities' => 'Tidak ada',
            ]);

            // ─── 2. Upload Documents & Transition to Submitted ───────────
            $this->uploadCandidateDocuments($candidate);
            $this->statusService->syncAfterEvent($candidate, 'demo.documents_uploaded');
            $candidate->refresh();

            if ($targetStatus === 'submitted') {
                DashboardMetricsUpdated::dispatchSafely('demo_candidate_submitted');

                return [
                    'user' => $user,
                    'candidate' => $candidate->fresh(),
                    'final_status' => 'submitted',
                ];
            }

            // ─── 3. Staff Verification of Documents & Payment ────────────
            $staffId = User::whereIn('role', ['staff', 'admin'])->value('id') ?? 1;
            CandidateDocument::where('candidate_id', $candidate->id)->update([
                'status' => 'verified',
                'verified_by' => $staffId,
                'verified_at' => now(),
            ]);

            // ─── 4. Payment Creation (Required for Verified Status) ──────
            $paymentChannel = match (mt_rand(1, 3)) {
                1 => Payment::CHANNEL_GATEWAY,
                2 => Payment::CHANNEL_TRANSFER,
                default => Payment::CHANNEL_CASH,
            };

            $baseAmount = (float) ($wave->registration_fee ?: 250000);
            $feeAmount = $paymentChannel === Payment::CHANNEL_GATEWAY ? 4500.0 : 0.0;
            $finalAmount = $baseAmount + $feeAmount;

            $payment = Payment::create([
                'candidate_id' => $candidate->id,
                'admission_wave_id' => $wave->id,
                'candidate_code' => $candidate->candidate_code,
                'order_id' => "{$candidate->candidate_code}-".time().'-'.mt_rand(10, 99),
                'payment_channel' => $paymentChannel,
                'payment_method' => $paymentChannel === Payment::CHANNEL_GATEWAY ? 'qris' : 'manual',
                'base_amount' => $baseAmount,
                'fee_amount' => $feeAmount,
                'final_amount' => $finalAmount,
                'status' => Payment::STATUS_PAID,
                'manual_status' => $paymentChannel === Payment::CHANNEL_TRANSFER ? Payment::MANUAL_VERIFIED : null,
                'paid_at' => now(),
                'verified_by' => in_array($paymentChannel, [Payment::CHANNEL_TRANSFER, Payment::CHANNEL_CASH], true) ? $staffId : null,
                'verified_at' => now(),
            ]);

            $this->statusService->syncAfterEvent($candidate, 'demo.payment_completed');
            $candidate->refresh();

            if ($targetStatus === 'verified' || $targetStatus === 'paid') {
                DashboardMetricsUpdated::dispatchSafely('demo_candidate_verified');

                // If explicitly requested 'paid', or naturally advancing, assign CBT exam session
                if ($targetStatus === 'paid') {
                    $session = ExamSession::where('status', 'published')->first() ?? ExamSession::first();
                    if ($session) {
                        ExamSessionCandidate::firstOrCreate(
                            [
                                'exam_session_id' => $session->id,
                                'candidate_id' => $candidate->id,
                            ],
                            [
                                'assigned_by' => $staffId,
                                'status' => ExamSessionCandidate::STATUS_ELIGIBLE,
                                'assigned_at' => now(),
                            ]
                        );
                    }
                }

                return [
                    'user' => $user,
                    'candidate' => $candidate->fresh(),
                    'final_status' => $candidate->status,
                ];
            }

            // ─── 5. Exam Readiness / CBT Session Assignment ─────────────
            $session = ExamSession::where('status', 'published')->first() ?? ExamSession::first();

            if ($session) {
                ExamSessionCandidate::firstOrCreate(
                    [
                        'exam_session_id' => $session->id,
                        'candidate_id' => $candidate->id,
                    ],
                    [
                        'assigned_by' => $staffId,
                        'status' => ExamSessionCandidate::STATUS_ELIGIBLE,
                        'assigned_at' => now(),
                    ]
                );
            }

            if ($targetStatus === 'accepted') {
                $candidate->update(['status' => 'accepted']);
            } elseif ($targetStatus === 'rejected') {
                $candidate->update(['status' => 'rejected']);
            }

            DashboardMetricsUpdated::dispatchSafely('demo_candidate_completed');

            return [
                'user' => $user,
                'candidate' => $candidate->fresh(),
                'final_status' => $candidate->status,
            ];
        });
    }

    /**
     * Upload real valid dummy documents from fixtures to private storage.
     */
    private function uploadCandidateDocuments(Candidate $candidate): void
    {
        $fixturePdf = file_exists(resource_path('fixtures/demo/sample.pdf'))
            ? resource_path('fixtures/demo/sample.pdf')
            : storage_path('app/demo-fixtures/sample.pdf');

        $fixtureJpg = file_exists(resource_path('fixtures/demo/sample.jpg'))
            ? resource_path('fixtures/demo/sample.jpg')
            : storage_path('app/demo-fixtures/sample.jpg');

        $hasPdf = file_exists($fixturePdf);
        $hasJpg = file_exists($fixtureJpg);

        foreach (self::REQUIRED_DOCUMENTS as $docInfo) {
            $docType = $docInfo['type'];
            $group = $docInfo['group'];
            $ext = $docInfo['ext'];
            $mime = $docInfo['mime'];
            $filename = "{$docType}_{$candidate->candidate_code}.{$ext}";

            $directory = SentinelStoragePaths::candidateDocumentDirectory($candidate->candidate_code, $group, $docType);
            $storagePath = "{$directory}/{$filename}";

            // Write actual file content from fixture
            if ($ext === 'jpg' && $hasJpg) {
                $content = file_get_contents($fixtureJpg);
            } elseif ($hasPdf) {
                $content = file_get_contents($fixturePdf);
            } else {
                $content = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n198\n%%EOF\n";
            }

            Storage::disk('private')->put($storagePath, $content);
            $fileSizeKb = max(1, (int) round(strlen($content) / 1024));

            $document = CandidateDocument::create([
                'candidate_id' => $candidate->id,
                'candidate_code' => $candidate->candidate_code,
                'doc_type' => $docType,
                'doc_group' => $group,
                'original_filename' => $docInfo['name'],
                'stored_filename' => $filename,
                'file_path' => $storagePath,
                'mime_type' => $mime,
                'file_size_kb' => $fileSizeKb,
                'status' => 'pending',
            ]);

            CandidateDocumentSecurity::create([
                'document_id' => $document->id,
                'magic_bytes_result' => 'passed',
                'polyglot_clean' => true,
                'polyglot_detail' => 'Demo verified clean payload',
                'detected_mime' => $mime,
                'file_hash' => hash('sha256', $content),
                'upload_ip' => '127.0.0.1',
                'user_agent' => 'SentinelTrafficSimulator/2.0',
                'scanned_at' => now(),
            ]);
        }
    }

    /**
     * Wipe all demo candidate data matching @demo.spmb.com.
     *
     * @return array{deleted_users: int, deleted_candidates: int, deleted_payments: int}
     */
    public function wipeDemoData(): array
    {
        return DB::transaction(function () {
            $demoUsers = User::where('email', 'like', '%@demo.spmb.com')->get();
            $userCount = $demoUsers->count();

            $candidateIds = Candidate::whereIn('user_id', $demoUsers->pluck('id'))->pluck('id');
            $candidateCodes = Candidate::whereIn('user_id', $demoUsers->pluck('id'))->pluck('candidate_code');
            $candidateCount = $candidateIds->count();

            $paymentCount = Payment::whereIn('candidate_id', $candidateIds)->count();

            // Clean storage folders for each demo candidate
            foreach ($candidateCodes as $code) {
                if ($code) {
                    Storage::disk('private')->deleteDirectory("sentinel/candidates/{$code}");
                }
            }

            // Delete users (cascades to candidates, guardians, health, payments, documents)
            User::whereIn('id', $demoUsers->pluck('id'))->delete();

            DashboardMetricsUpdated::dispatchSafely('demo_wiped');

            return [
                'deleted_users' => $userCount,
                'deleted_candidates' => $candidateCount,
                'deleted_payments' => $paymentCount,
            ];
        });
    }
}
