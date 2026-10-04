<?php

namespace App\Exceptions\Exam;

use RuntimeException;

class ExamAccessException extends RuntimeException
{
    public function __construct(
        private readonly string $reason,
        string $message = 'Akses ujian tidak tersedia.'
    ) {
        parent::__construct($message);
    }

    public function reason(): string
    {
        return $this->reason;
    }

    public function userMessage(): string
    {
        if ($this->message !== 'Akses ujian tidak tersedia.' && ! empty($this->message)) {
            return $this->message;
        }

        return match ($this->reason) {
            'NOT_ELIGIBLE' => 'Kamu belum memiliki akses untuk sesi ujian ini.',
            'BLOCKED' => 'Akses ujian kamu sedang dibatasi. Hubungi panitia.',
            'SEQUENTIAL_LOCKED' => 'Harus menyelesaikan paket ujian sebelumnya terlebih dahulu.',
            'NOT_OPEN' => 'Sesi ujian belum dibuka atau sudah ditutup.',
            'PACKAGE_NOT_READY' => 'Paket ujian belum siap digunakan.',
            'NO_QUESTIONS' => 'Paket ujian belum memiliki soal aktif.',
            'MAX_ATTEMPTS' => 'Batas percobaan ujian sudah tercapai.',
            'NAME_ALREADY_SUBMITTED' => 'Peserta dengan nama ini sudah pernah menyelesaikan ujian pada sesi ini. Pengerjaan ulang tidak diperbolehkan demi menjaga kejujuran seleksi.',
            'ATTEMPT_LOCKED' => 'Percobaan ujian ini sudah dikunci.',
            'ATTEMPT_EXPIRED' => 'Waktu ujian sudah berakhir.',
            'QUESTION_NOT_FOUND' => 'Soal tidak tersedia dalam percobaan ujian ini.',
            'INVALID_OPTION' => 'Pilihan jawaban tidak valid.',
            default => 'Akses ujian tidak tersedia.',
        };
    }
}
