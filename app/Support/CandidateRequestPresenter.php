<?php

namespace App\Support;

use App\Models\User;
use Carbon\Carbon;

class CandidateRequestPresenter
{
    private const DATA_FIELD_LABELS = [
        'full_name' => 'Nama Lengkap',
        'nisn' => 'NISN',
        'nik' => 'NIK',
        'gender' => 'Jenis Kelamin',
        'place_of_birth' => 'Tempat Lahir',
        'date_of_birth' => 'Tanggal Lahir',
        'address_detail' => 'Alamat',
        'school_origin' => 'Asal Sekolah',
    ];

    public static function formatDataChangeResult(?array $request): ?array
    {
        if (empty($request)) {
            return null;
        }

        $status = $request['status'] ?? null;

        if (! in_array($status, ['approved', 'rejected'], true)) {
            return null;
        }

        $field = (string) ($request['field'] ?? '');

        return [
            'field' => $field,
            'field_label' => self::DATA_FIELD_LABELS[$field] ?? $field,
            'old_value' => self::normalizeValue($request['old_value'] ?? null),
            'new_value' => self::normalizeValue($request['new_value'] ?? null),
            'reason' => self::nullableString($request['reason'] ?? null),
            'status' => $status,
            'reviewed_by' => $request['reviewed_by'] ?? $request['processed_by'] ?? null,
            'reviewed_by_name' => self::nullableString($request['reviewed_by_name'] ?? null),
            'reviewed_at' => self::formatDateTime($request['reviewed_at'] ?? $request['processed_at'] ?? null),
            'rejection_reason' => self::nullableString($request['rejection_reason'] ?? null),
            'review_note' => self::nullableString($request['review_note'] ?? null),
        ];
    }

    public static function formatPendingDataChangeRequest(?array $request): ?array
    {
        if (empty($request) || ($request['status'] ?? null) !== 'pending') {
            return null;
        }

        $field = (string) ($request['field'] ?? '');

        return [
            'field' => $field,
            'field_label' => self::DATA_FIELD_LABELS[$field] ?? $field,
            'old_value' => self::normalizeValue($request['old_value'] ?? null),
            'new_value' => self::normalizeValue($request['new_value'] ?? null),
            'reason' => self::nullableString($request['reason'] ?? null),
            'requested_at' => self::formatDateTime($request['requested_at'] ?? null),
        ];
    }

    public static function formatEmailChangeRequest(User $user): ?array
    {
        if (! $user->pending_email) {
            return null;
        }

        $status = $user->pending_email_status ?? 'pending';

        return [
            'status' => $status,
            'current_email' => $user->email,
            'pending_email' => $user->pending_email,
            'requested_at' => self::formatDateTime($user->pending_email_requested_at),
            'reviewed_by' => $user->pending_email_reviewed_by,
            'reviewed_by_name' => $user->pendingEmailReviewer?->name,
            'reviewed_at' => self::formatDateTime($user->pending_email_reviewed_at),
            'rejection_reason' => self::nullableString($user->pending_email_rejection_reason),
            'can_apply' => $user->canApplyApprovedEmailChange(),
            'can_cancel' => $user->hasPendingEmailRequest(),
        ];
    }

    private static function normalizeValue(mixed $value): string
    {
        if (is_array($value)) {
            return implode(', ', array_filter($value, fn ($item) => self::nullableString($item) !== null));
        }

        return self::nullableString($value) ?? '-';
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $string = trim((string) $value);

        return $string !== '' ? $string : null;
    }

    private static function formatDateTime(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        try {
            return Carbon::parse($value)->format('d M Y · H:i');
        } catch (\Throwable) {
            return self::nullableString($value);
        }
    }
}
