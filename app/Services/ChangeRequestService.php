<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\User;
use DomainException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ChangeRequestService
{
    private const DATA_FIELDS = [
        'full_name' => [
            'label' => 'Nama Lengkap',
            'rules' => ['required', 'string', 'max:255'],
        ],
        'nisn' => [
            'label' => 'NISN',
            'rules' => ['required', 'digits:10'],
        ],
        'nik' => [
            'label' => 'NIK',
            'rules' => ['required', 'digits:16'],
        ],
        'gender' => [
            'label' => 'Jenis Kelamin',
            'rules' => ['required', 'in:L,P'],
        ],
        'place_of_birth' => [
            'label' => 'Tempat Lahir',
            'rules' => ['required', 'string', 'max:100'],
        ],
        'date_of_birth' => [
            'label' => 'Tanggal Lahir',
            'rules' => ['required', 'date', 'before:today'],
        ],
        'address_detail' => [
            'label' => 'Alamat',
            'rules' => ['required', 'string', 'max:500'],
        ],
        'school_origin' => [
            'label' => 'Asal Sekolah',
            'rules' => ['required', 'string', 'max:255'],
        ],
    ];

    public function getPendingDataRequests(): Collection
    {
        return Candidate::with(['user:id,email', 'admissionWave:id,title'])
            ->whereNotNull('data_change_request')
            ->latest()
            ->get()
            ->filter(fn (Candidate $candidate) => $candidate->hasPendingChangeRequest())
            ->map(function (Candidate $candidate) {
                $request = $candidate->data_change_request;
                $field = $request['field'] ?? '';

                return [
                    'candidate_id' => $candidate->id,
                    'candidate_code' => $candidate->candidate_code,
                    'candidate_name' => $candidate->full_name,
                    'candidate_status' => $candidate->status,
                    'account_email' => $candidate->user?->email,
                    'admission_wave' => $candidate->admissionWave?->title,
                    'field' => $field,
                    'field_label' => self::DATA_FIELDS[$field]['label'] ?? $field,
                    'old_value' => $this->formatRequestValue($candidate, $field, $request['old_value'] ?? null),
                    'new_value' => $this->formatRequestValue($candidate, $field, $request['new_value'] ?? null),
                    'reason' => (string) ($request['reason'] ?? '-'),
                    'requested_at' => $this->formatDateTime($request['requested_at'] ?? null),
                    '_requested_at_sort' => (string) ($request['requested_at'] ?? ''),
                ];
            })
            ->sortByDesc('_requested_at_sort')
            ->values()
            ->map(fn (array $item) => collect($item)->except('_requested_at_sort')->all());
    }

    public function getPendingEmailRequests(): Collection
    {
        return User::with(['candidate.admissionWave'])
            ->where('role', 'candidate')
            ->whereNotNull('pending_email')
            ->latest()
            ->get()
            ->filter(fn (User $user) => $user->candidate !== null && $user->hasPendingEmailRequest())
            ->map(fn (User $user) => [
                'candidate_id' => $user->candidate->id,
                'candidate_code' => $user->candidate->candidate_code,
                'candidate_name' => $user->candidate->full_name,
                'candidate_status' => $user->candidate->status,
                'current_email' => $user->email,
                'pending_email' => $user->pending_email,
                'admission_wave' => $user->candidate->admissionWave?->title,
                'requested_at' => $user->pending_email_requested_at?->format('d M Y · H:i') ?? '-',
                '_requested_at_sort' => $user->pending_email_requested_at?->toIso8601String() ?? '',
            ])
            ->sortByDesc('_requested_at_sort')
            ->values()
            ->map(fn (array $item) => collect($item)->except('_requested_at_sort')->all());
    }

    public function approveDataRequest(Candidate $candidate, User $actor): void
    {
        $request = $this->getPendingDataRequestPayload($candidate);
        $field = $request['field'];
        $newValue = trim((string) ($request['new_value'] ?? ''));

        $validator = Validator::make(
            ['new_value' => $newValue],
            ['new_value' => self::DATA_FIELDS[$field]['rules']]
        );

        if ($validator->fails()) {
            throw ValidationException::withMessages([
                'new_value' => [$validator->errors()->first('new_value')],
            ]);
        }

        $oldValueDisplay = $this->formatRequestValue($candidate, $field, $request['old_value'] ?? null);
        $newValueDisplay = $this->formatRequestValue($candidate, $field, $newValue);

        DB::transaction(function () use ($candidate, $actor, $request, $field, $newValue, $oldValueDisplay, $newValueDisplay) {
            $candidate->fill($this->buildCandidateUpdates($candidate, $field, $newValue));
            $candidate->data_change_request = [
                ...$request,
                'old_value' => $oldValueDisplay,
                'new_value' => $newValueDisplay,
                'status' => 'approved',
                'reviewed_by' => $actor->id,
                'reviewed_by_name' => $actor->name,
                'reviewed_at' => now()->toIso8601String(),
                'review_note' => null,
                'processed_at' => now()->toIso8601String(),
                'processed_by' => $actor->id,
                'processed_by_role' => $actor->role,
                'rejection_reason' => null,
            ];
            $candidate->save();
        });
    }

    public function rejectDataRequest(Candidate $candidate, User $actor, string $reason): void
    {
        $request = $this->getPendingDataRequestPayload($candidate);
        $rejectionReason = trim($reason);

        if ($rejectionReason === '') {
            throw ValidationException::withMessages([
                'reason' => ['Alasan penolakan wajib diisi.'],
            ]);
        }

        $field = $request['field'];

        $candidate->update([
            'data_change_request' => [
                ...$request,
                'old_value' => $this->formatRequestValue($candidate, $field, $request['old_value'] ?? null),
                'new_value' => $this->formatRequestValue($candidate, $field, $request['new_value'] ?? null),
                'status' => 'rejected',
                'reviewed_by' => $actor->id,
                'reviewed_by_name' => $actor->name,
                'reviewed_at' => now()->toIso8601String(),
                'review_note' => null,
                'processed_at' => now()->toIso8601String(),
                'processed_by' => $actor->id,
                'processed_by_role' => $actor->role,
                'rejection_reason' => $rejectionReason,
            ],
        ]);
    }

    public function approveEmailRequest(Candidate $candidate, User $actor): void
    {
        $user = $candidate->user;

        if (! $user || ! $user->hasPendingEmailRequest()) {
            throw new DomainException('Permintaan perubahan email tidak ditemukan atau sudah diproses.');
        }

        $pendingEmail = trim((string) $user->pending_email);

        $validator = Validator::make([
            'pending_email' => $pendingEmail,
        ], [
            'pending_email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
                Rule::unique('users', 'pending_email')->ignore($user->id),
            ],
        ]);

        if ($validator->fails()) {
            throw ValidationException::withMessages([
                'pending_email' => [$validator->errors()->first('pending_email')],
            ]);
        }

        DB::transaction(function () use ($user, $actor, $pendingEmail) {
            $user->forceFill([
                'pending_email_token' => null,
                'pending_email_status' => 'approved',
                'pending_email_reviewed_by' => $actor->id,
                'pending_email_reviewed_at' => now(),
                'pending_email_rejection_reason' => null,
            ])->save();

            Log::info('Candidate email change manually verified by dashboard workflow.', [
                'candidate_user_id' => $user->id,
                'pending_email' => $pendingEmail,
                'approved_by' => $actor->id,
                'approved_by_role' => $actor->role,
            ]);
        });
    }

    public function rejectEmailRequest(Candidate $candidate, User $actor, string $reason): void
    {
        $user = $candidate->user;

        if (! $user || ! $user->hasPendingEmailRequest()) {
            throw new DomainException('Permintaan perubahan email tidak ditemukan atau sudah diproses.');
        }

        $rejectionReason = trim($reason);

        if ($rejectionReason === '') {
            throw ValidationException::withMessages([
                'reason' => ['Alasan penolakan wajib diisi.'],
            ]);
        }

        Log::info('Candidate email change rejected by dashboard workflow.', [
            'candidate_user_id' => $user->id,
            'rejected_by' => $actor->id,
            'rejected_by_role' => $actor->role,
            'reason' => $rejectionReason,
            'pending_email' => $user->pending_email,
        ]);

        $user->forceFill([
            'pending_email_token' => null,
            'pending_email_status' => 'rejected',
            'pending_email_reviewed_by' => $actor->id,
            'pending_email_reviewed_at' => now(),
            'pending_email_rejection_reason' => $rejectionReason,
        ])->save();
    }

    private function getPendingDataRequestPayload(Candidate $candidate): array
    {
        $request = $candidate->data_change_request;
        $field = $request['field'] ?? null;

        if (! $candidate->hasPendingChangeRequest() || ! $field || ! isset(self::DATA_FIELDS[$field])) {
            throw new DomainException('Pengajuan perubahan data tidak ditemukan atau sudah diproses.');
        }

        return $request;
    }

    private function buildCandidateUpdates(Candidate $candidate, string $field, string $newValue): array
    {
        return match ($field) {
            'date_of_birth' => [
                'date_of_birth' => $newValue,
            ],
            'address_detail' => $this->buildAddressUpdates($candidate, $newValue),
            default => [
                $field => $newValue,
            ],
        };
    }

    private function buildAddressUpdates(Candidate $candidate, string $newValue): array
    {
        $current = is_array($candidate->address_detail) ? $candidate->address_detail : [];
        $detail = [
            'jalan' => $newValue,
            'rt' => $current['rt'] ?? '',
            'rw' => $current['rw'] ?? '',
            'kelurahan' => $current['kelurahan'] ?? '',
            'kecamatan' => $current['kecamatan'] ?? '',
            'kabupaten' => $current['kabupaten'] ?? '',
            'provinsi' => $current['provinsi'] ?? '',
        ];

        return [
            'address_detail' => $detail,
            'address_full' => $this->buildAddressFull($detail),
        ];
    }

    private function formatRequestValue(Candidate $candidate, string $field, mixed $value): string
    {
        if ($field === 'gender') {
            return match ((string) $value) {
                'L' => 'Laki-laki',
                'P' => 'Perempuan',
                default => (string) $value,
            };
        }

        if ($field === 'date_of_birth') {
            if (! $value) {
                return '-';
            }

            try {
                return \Carbon\Carbon::parse((string) $value)->format('d F Y');
            } catch (\Throwable) {
                return (string) $value;
            }
        }

        if ($field === 'address_detail') {
            if (is_array($value)) {
                return $this->buildAddressFull($value);
            }

            $stringValue = trim((string) $value);

            if ($stringValue === '' || $stringValue === 'Array') {
                return $candidate->address_full ?: $this->buildAddressFull(
                    is_array($candidate->address_detail) ? $candidate->address_detail : []
                );
            }

            return $stringValue;
        }

        $stringValue = trim((string) $value);

        return $stringValue !== '' ? $stringValue : '-';
    }

    private function formatDateTime(mixed $value): string
    {
        if (! $value) {
            return '-';
        }

        try {
            return \Carbon\Carbon::parse((string) $value)->format('d M Y · H:i');
        } catch (\Throwable) {
            return (string) $value;
        }
    }

    private function buildAddressFull(array $detail): string
    {
        $rtRw = trim(implode('/', array_filter([
            $detail['rt'] ?? '',
            $detail['rw'] ?? '',
        ])));

        return implode(', ', array_filter([
            $detail['jalan'] ?? '',
            $rtRw ? 'RT/RW ' . $rtRw : null,
            $detail['kelurahan'] ?? '',
            ($detail['kecamatan'] ?? '') ? 'Kec. ' . $detail['kecamatan'] : null,
            $detail['kabupaten'] ?? '',
            $detail['provinsi'] ?? '',
        ]));
    }
}
