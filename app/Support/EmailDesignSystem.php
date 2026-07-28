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
                'validityText' => null,
                'secondaryText' => null,
                'outroLines' => [],
            ], $content));

        $fromAddress = (string) config('mail.from.address', '');
        $fromName = (string) (config('mail.from.name') ?: config('app.name'));

        if ($fromAddress !== '') {
            $message->from($fromAddress, $fromName);
        }

        if (! empty($content['actionText']) && ! empty($content['actionUrl'])) {
            $message->action($content['actionText'], $content['actionUrl']);
        }

        return $message;
    }

    public static function verification(object $notifiable, string $verificationUrl): MailMessage
    {
        return self::transactional([
            'subject' => 'Verifikasi Alamat Email',
            'preheader' => 'Verifikasi alamat email Anda untuk Sistem Penerimaan Santri Baru.',
            'title' => '📧 Verifikasi Alamat Email',
            'greeting' => "Assalamu'alaikum Warahmatullahi Wabarakatuh,",
            'description' => [
                'Terima kasih telah melakukan pendaftaran di Sistem Penerimaan Santri Baru Al-Muntaha School.',
                'Untuk menjaga keamanan akun Anda, silakan verifikasi alamat email dengan menekan tombol berikut.',
            ],
            'actionText' => 'Verifikasi Email',
            'actionUrl' => $verificationUrl,
            'validityText' => 'Link ini berlaku selama '.config('auth.verification.expire', 60).' menit.',
            'secondaryText' => 'Jika Anda tidak membuat akun ini, abaikan email ini. Tidak ada tindakan lebih lanjut yang diperlukan.',
        ]);
    }

    public static function passwordReset(object $notifiable, string $token): MailMessage
    {
        $resetUrl = url(route('password.reset', [
            'token' => $token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));
        $expiration = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return self::transactional([
            'subject' => 'Atur Ulang Password SPMB',
            'preheader' => 'Gunakan tautan aman untuk membuat password baru.',
            'title' => '🔐 Atur Ulang Password',
            'greeting' => "Assalamu'alaikum Warahmatullahi Wabarakatuh,",
            'description' => [
                'Kami menerima permintaan untuk mengatur ulang password akun Sistem Penerimaan Santri Baru Anda.',
                'Silakan tekan tombol berikut untuk membuat password baru dan mendapatkan kembali akses ke akun Anda.',
            ],
            'actionText' => 'Atur Ulang Password',
            'actionUrl' => $resetUrl,
            'validityText' => "Link ini berlaku selama {$expiration} menit.",
            'secondaryText' => 'Jika Anda tidak meminta pengaturan ulang password, Anda dapat mengabaikan email ini. Password Anda tidak akan berubah.',
        ]);
    }
}
