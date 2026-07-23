<?php

namespace App\Support;

use Illuminate\Notifications\Messages\MailMessage;

final class EmailDesignSystem
{
    /**
     * Build a transactional message using the shared email presentation.
     *
     * The public shape intentionally supports future notifications without
     * coupling their business logic to a particular Blade template.
     *
     * @param  array<string, mixed>  $content
     */
    public static function transactional(array $content): MailMessage
    {
        $message = (new MailMessage)
            ->subject((string) ($content['subject'] ?? config('app.name')))
            ->view([
                'html' => 'emails.transactional',
                'text' => 'emails.transactional-text',
            ], array_merge([
                'brand' => config('email.brand'),
                'preheader' => null,
                'title' => config('app.name'),
                'greeting' => null,
                'description' => [],
                'actionText' => null,
                'actionUrl' => null,
                'panel' => null,
                'warning' => null,
                'information' => null,
                'secondaryText' => null,
                'outroLines' => [],
            ], $content));

        if (! empty($content['actionText']) && ! empty($content['actionUrl'])) {
            $message->action($content['actionText'], $content['actionUrl']);
        }

        return $message;
    }

    public static function verification(object $notifiable, string $verificationUrl): MailMessage
    {
        $recipientName = self::recipientName($notifiable);

        return self::transactional([
            'subject' => 'Verifikasi Email Akun SPMB',
            'preheader' => 'Konfirmasi alamat email Anda untuk mengaktifkan akses SPMB.',
            'title' => 'Verifikasi email Anda',
            'greeting' => "Halo {$recipientName},",
            'description' => [
                'Terima kasih telah mendaftarkan akun di portal SPMB Al-Muntaha School.',
                'Silakan konfirmasi alamat email ini agar kami dapat menjaga keamanan akun dan mengirimkan informasi pendaftaran kepada Anda.',
            ],
            'actionText' => 'Verifikasi Email',
            'actionUrl' => $verificationUrl,
            'panel' => [
                'title' => 'Satu langkah lagi',
                'body' => 'Tombol di atas akan membuka halaman verifikasi secara aman. Setelah selesai, Anda dapat melanjutkan proses pendaftaran melalui dashboard.',
            ],
            'warning' => [
                'title' => 'Tautan memiliki masa berlaku',
                'body' => 'Demi keamanan, tautan verifikasi ini berlaku selama '.config('auth.verification.expire', 60).' menit.',
            ],
            'secondaryText' => 'Jika Anda tidak membuat akun ini, abaikan email ini. Tidak ada tindakan lebih lanjut yang diperlukan.',
        ]);
    }

    public static function passwordReset(object $notifiable, string $token): MailMessage
    {
        $recipientName = self::recipientName($notifiable);
        $resetUrl = url(route('password.reset', [
            'token' => $token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));
        $expiration = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return self::transactional([
            'subject' => 'Permintaan Atur Ulang Password SPMB',
            'preheader' => 'Gunakan tautan aman untuk membuat password baru.',
            'title' => 'Atur ulang password',
            'greeting' => "Halo {$recipientName},",
            'description' => [
                'Kami menerima permintaan untuk mengatur ulang password akun SPMB Anda.',
                'Pilih tombol di bawah untuk membuat password baru dan mendapatkan kembali akses ke akun Anda.',
            ],
            'actionText' => 'Atur Ulang Password',
            'actionUrl' => $resetUrl,
            'information' => [
                'title' => 'Catatan keamanan',
                'body' => "Tautan ini berlaku selama {$expiration} menit dan hanya dapat digunakan satu kali.",
            ],
            'secondaryText' => 'Jika Anda tidak meminta pengaturan ulang password, Anda dapat mengabaikan email ini. Password Anda tidak akan berubah.',
        ]);
    }

    private static function recipientName(object $notifiable): string
    {
        $name = trim((string) ($notifiable->name ?? ''));

        return $name !== '' ? $name : 'Peserta SPMB';
    }
}
