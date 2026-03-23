<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class DocumentSecurityService
{
    // =============================================
    // ALLOWED FILE FORMATS
    // =============================================

    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'application/pdf',
    ];

    private const MAGIC_SIGNATURES = [
        'image/jpeg'      => ['ffd8ff'],
        'image/png'       => ['89504e47'],
        'application/pdf' => ['25504446'], // %PDF
    ];

    private const MIME_TO_EXTENSION = [
        'image/jpeg'      => 'jpg',
        'image/png'       => 'png',
        'application/pdf' => 'pdf',
    ];

    private const DANGEROUS_PATTERNS = [
        '<?php',
        '<?=',
        'eval(',
        'system(',
        'exec(',
        'passthru(',
        'shell_exec(',
        'base64_decode(',
        'popen(',
        'proc_open(',
        'pcntl_exec(',
    ];

    // =============================================
    // PUBLIC: RUN ALL LAYERS
    // =============================================

    /**
     * Jalankan semua layer security check secara berurutan.
     * Return array hasil untuk disimpan ke candidate_document_security.
     *
     * @throws \Exception jika file tidak lolos validasi
     */
    public function runAll(UploadedFile $file, string $uploadIp, string $userAgent): array
    {
        // Layer 3B: Magic bytes
        $magicResult = $this->checkMagicBytes($file);

        // Layer 3C: Polyglot scan
        $polyglotResult = $this->scanPolyglot($file);

        // Layer: File hash (SHA-256)
        $fileHash = $this->generateHash($file);

        return [
            'magic_bytes_result' => $magicResult['result'],
            'polyglot_clean'     => $polyglotResult['clean'],
            'polyglot_detail'    => $polyglotResult['detail'],
            'detected_mime'      => $magicResult['detected_mime'],
            'file_hash'          => $fileHash,
            'upload_ip'          => $uploadIp,
            'user_agent'         => $userAgent,
            'scanned_at'         => now(),
        ];
    }

    // =============================================
    // LAYER 3B: MAGIC BYTES CHECK
    // =============================================

    public function checkMagicBytes(UploadedFile $file): array
    {
        // Sentinel Toggle — hanya aktif di branch lab-hack
        if (config('sentinel.layer_magic_bytes', true) === false) {
            Log::warning('[LAB-HACK] Magic bytes check DISABLED — layer 3B bypassed', [
                'user_id'  => auth()->id(),
                'filename' => $file->getClientOriginalName(),
            ]);
            return [
                'result'        => 'passed',
                'detected_mime' => $file->getMimeType(),
            ];
        }

        $handle = fopen($file->getRealPath(), 'rb');
        $header = bin2hex(fread($handle, 8));
        fclose($handle);

        $claimedMime = $file->getMimeType();

        // Jika MIME bukan yang kita izinkan, langsung reject
        if (!in_array($claimedMime, self::ALLOWED_MIMES)) {
            return [
                'result'        => 'rejected',
                'detected_mime' => 'unknown',
            ];
        }

        // Cek apakah header sesuai dengan signatures yang diharapkan
        $valid = false;
        foreach (self::MAGIC_SIGNATURES[$claimedMime] ?? [] as $sig) {
            if (str_starts_with($header, $sig)) {
                $valid = true;
                break;
            }
        }

        return [
            'result'        => $valid ? 'passed' : 'rejected',
            'detected_mime' => $valid ? $claimedMime : 'unknown',
        ];
    }

    // =============================================
    // LAYER 3C: POLYGLOT SCAN
    // =============================================

    public function scanPolyglot(UploadedFile $file): array
    {
        // Sentinel Toggle — hanya aktif di branch lab-hack
        if (config('sentinel.layer_polyglot_scan', true) === false) {
            Log::warning('[LAB-HACK] Polyglot scan DISABLED — layer 3C bypassed', [
                'user_id'  => auth()->id(),
                'filename' => $file->getClientOriginalName(),
            ]);
            return ['clean' => true, 'detail' => null];
        }

        $content = file_get_contents($file->getRealPath());

        foreach (self::DANGEROUS_PATTERNS as $pattern) {
            if (stripos($content, $pattern) !== false) {
                $offset = stripos($content, $pattern);
                // Log detail hanya ke server — TIDAK pernah ke user
                Log::warning('[SENTINEL] Polyglot pattern detected', [
                    'user_id'  => auth()->id(),
                    'pattern'  => $pattern,
                    'offset'   => $offset,
                    'filename' => $file->getClientOriginalName(),
                ]);
                return [
                    'clean'  => false,
                    'detail' => "Pattern '{$pattern}' found at offset {$offset}",
                ];
            }
        }

        return ['clean' => true, 'detail' => null];
    }

    // =============================================
    // HASH GENERATION
    // =============================================

    public function generateHash(UploadedFile $file): string
    {
        if (config('sentinel.layer_hash_check', true) === false) {
            Log::warning('[LAB-HACK] Hash generation DISABLED', ['user_id' => auth()->id()]);
            return '';
        }

        return hash_file('sha256', $file->getRealPath());
    }

    // =============================================
    // UUID RENAME
    // =============================================

    public function generateStoredFilename(string $detectedMime): string
    {
        if (config('sentinel.layer_uuid_rename', true) === false) {
            Log::warning('[LAB-HACK] UUID rename DISABLED — using random name', [
                'user_id' => auth()->id(),
            ]);
            return 'lab_' . uniqid() . '.' . (self::MIME_TO_EXTENSION[$detectedMime] ?? 'bin');
        }

        $uuid      = \Illuminate\Support\Str::uuid()->toString();
        $extension = self::MIME_TO_EXTENSION[$detectedMime] ?? 'bin';

        return "{$uuid}.{$extension}";
    }

    // =============================================
    // HELPERS
    // =============================================

    /**
     * Apakah hasil security scan ini AMAN untuk disimpan?
     * Jika false → file harus di-reject, tidak boleh disimpan ke storage.
     */
    public function isSafeToStore(array $securityResult): bool
    {
        if ($securityResult['magic_bytes_result'] === 'rejected') {
            return false;
        }

        if ($securityResult['polyglot_clean'] === false) {
            return false;
        }

        return true;
    }
}
