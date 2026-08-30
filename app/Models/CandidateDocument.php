<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class CandidateDocument extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'candidate_id',
        'candidate_code',
        'doc_type',
        'doc_group',
        'original_filename',
        'stored_filename',
        'file_path',
        'mime_type',
        'file_size_kb',
        'status',
        'rejection_reason',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    // =============================================
    // DOC GROUP DESCRIPTIONS
    // =============================================

    const DOC_GROUPS = [
        'identity' => 'Kelompok A — Identitas & Kependudukan',
        'academic' => 'Kelompok B — Akademik',
        'achievement' => 'Kelompok C — Prestasi (multi-upload)',
        'welfare' => 'Kelompok D — Bantuan & Afirmasi',
        'administration' => 'Kelompok E — Administrasi & Pernyataan',
    ];

    // =============================================
    // DOC TYPE REGISTRY
    // =============================================

    const DOC_TYPES = [
        // ─── Kelompok A — identity ────────────────────────────────
        'photo_formal' => [
            'group' => 'identity',
            'label' => 'Pas Foto Resmi',
            'hint' => 'Untuk kartu peserta & arsip digital',
        ],
        'birth_certificate' => [
            'group' => 'identity',
            'label' => 'Akta Kelahiran',
            'hint' => 'Verifikasi identitas resmi',
        ],
        'family_card' => [
            'group' => 'identity',
            'label' => 'Kartu Keluarga (KK)',
            'hint' => 'Verifikasi data keluarga & domisili',
        ],
        'parent_id_card' => [
            'group' => 'identity',
            'label' => 'KTP Orang Tua / Wali',
            'hint' => 'Legalitas pendaftaran oleh wali',
        ],

        // ─── Kelompok B — academic ────────────────────────────────
        'graduation_certificate' => [
            'group' => 'academic',
            'label' => 'Ijazah / SKL',
            'hint' => 'Bukti kelulusan jenjang sebelumnya',
        ],
        'report_card' => [
            'group' => 'academic',
            'label' => 'Rapor Semester Terakhir',
            'hint' => 'Rekam jejak akademik terkini',
        ],
        'academic_transcript' => [
            'group' => 'academic',
            'label' => 'Transkrip Nilai Lengkap',
            'hint' => 'Gambaran akademik menyeluruh untuk evaluasi',
        ],
        // transfer_letter masuk academic — dokumen riwayat pendidikan,
        // bukan eksklusif boarding. Berlaku untuk semua jenis sekolah.
        'transfer_letter' => [
            'group' => 'academic',
            'label' => 'Surat Keterangan Pindah',
            'hint' => 'Wajib jika kamu mendaftar sebagai siswa pindahan',
            'conditional' => true,
            'condition_field' => 'is_transfer',
        ],

        // ─── Kelompok C — achievement (multi-upload) ─────────────
        'achievement_academic' => [
            'group' => 'achievement',
            'label' => 'Sertifikat Prestasi Akademik',
            'hint' => 'OSN, olimpiade sains, karya tulis ilmiah, dll',
        ],
        'achievement_nonacademic' => [
            'group' => 'achievement',
            'label' => 'Sertifikat Prestasi Non-Akademik',
            'hint' => 'O2SN, FLS2N, olahraga, seni, debat, dll',
        ],
        'achievement_religious' => [
            'group' => 'achievement',
            'label' => 'Sertifikat Prestasi Keagamaan',
            'hint' => 'MTQ, tahfidz, lomba keagamaan',
        ],

        // ─── Kelompok D — welfare (pilih salah satu) ─────────────
        'kip_card' => [
            'group' => 'welfare',
            'label' => 'Kartu Indonesia Pintar (KIP)',
            'hint' => 'Untuk pengusulan PIP — bantuan biaya pendidikan dari pemerintah',
        ],
        'welfare_card' => [
            'group' => 'welfare',
            'label' => 'Kartu KKS / PKH',
            'hint' => 'Bukti keluarga penerima program kesejahteraan sosial',
        ],
        'poverty_letter' => [
            'group' => 'welfare',
            'label' => 'Surat Keterangan Tidak Mampu (SKTM)',
            'hint' => 'Alternatif jika belum punya KIP/KKS, diurus di kelurahan',
        ],

        // ─── Kelompok E — administration ─────────────────────────
        // Dokumen administratif & pernyataan — universal untuk semua jenis sekolah
        'parent_statement' => [
            'group' => 'administration',
            'label' => 'Surat Pernyataan Orang Tua',
            'hint' => 'Persetujuan & kesanggupan mengikuti tata tertib sekolah',
        ],
        'recommendation_letter' => [
            'group' => 'administration',
            'label' => 'Surat Rekomendasi',
            'hint' => 'Dari guru atau kepala sekolah (opsional)',
        ],
    ];

    // =============================================
    // MULTI UPLOAD POLICY
    // =============================================

    const MULTI_UPLOAD_TYPES = [
        'achievement_academic',
        'achievement_nonacademic',
        'achievement_religious',
    ];

    public static function allowsMultiple(string $docType): bool
    {
        return in_array($docType, self::MULTI_UPLOAD_TYPES);
    }

    public static function isConditional(string $docType): bool
    {
        return isset(self::DOC_TYPES[$docType]['conditional'])
            && self::DOC_TYPES[$docType]['conditional'] === true;
    }

    public static function isValidDocType(string $docType): bool
    {
        return array_key_exists($docType, self::DOC_TYPES);
    }

    public static function getGroupForDocType(string $docType): ?string
    {
        return self::DOC_TYPES[$docType]['group'] ?? null;
    }

    // =============================================
    // RELASI
    // =============================================

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function security(): HasOne
    {
        return $this->hasOne(CandidateDocumentSecurity::class, 'document_id');
    }
}
