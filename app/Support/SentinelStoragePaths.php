<?php

namespace App\Support;

class SentinelStoragePaths
{
    public static function candidateDocumentDirectory(string $candidateCode, ?string $group, string $docType): string
    {
        return self::join(
            'sentinel',
            'candidates',
            $candidateCode,
            'documents',
            $group ?: 'general',
            $docType
        );
    }

    public static function candidateHealthDirectory(string $candidateCode, string $docType): string
    {
        return self::join('sentinel', 'candidates', $candidateCode, 'health', $docType);
    }

    public static function paymentProofDirectory(string $candidateCode): string
    {
        return self::join('sentinel', 'candidates', $candidateCode, 'payments', 'proofs');
    }

    public static function candidateAvatarDirectory(string $candidateCode): string
    {
        return self::join('sentinel', 'candidates', $candidateCode, 'avatar');
    }

    public static function staffAvatarDirectory(int $userId): string
    {
        return self::join('sentinel', 'staff', (string) $userId, 'avatar');
    }

    public static function adminAvatarDirectory(int $userId): string
    {
        return self::join('sentinel', 'admins', (string) $userId, 'avatar');
    }

    public static function tempUploadsDirectory(): string
    {
        return self::join('sentinel', 'temp', 'uploads');
    }

    public static function cinematicShowcaseDirectory(): string
    {
        return self::join('assets', 'cinematic_showcase');
    }

    private static function join(string ...$segments): string
    {
        return implode('/', array_map([self::class, 'segment'], $segments));
    }

    private static function segment(string $value): string
    {
        $value = trim($value);
        $value = preg_replace('/[^A-Za-z0-9_-]+/', '-', $value) ?: '';
        $value = trim($value, '-_');

        return $value !== '' ? $value : 'unknown';
    }
}
