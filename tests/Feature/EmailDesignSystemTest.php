<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;

function renderEmailMessage(object $message): array
{
    return [
        'html' => view($message->view['html'], $message->data())->render(),
        'text' => view($message->view['text'], $message->data())->render(),
    ];
}

it('renders the verification notification through the shared email design system', function () {
    $user = User::factory()->unverified()->create([
        'name' => 'Alya Rahma',
        'email' => 'alya@example.test',
    ]);

    $message = (new VerifyEmail)->toMail($user);
    $rendered = renderEmailMessage($message);

    expect($message->subject)->toBe('Verifikasi Email Akun SPMB')
        ->and($message->actionText)->toBe('Verifikasi Email')
        ->and($rendered['html'])
        ->toContain('Al-Muntaha School')
        ->toContain('Sistem Penerimaan Murid Baru')
        ->toContain('Verifikasi email Anda')
        ->toContain('#132f68')
        ->toContain('#e0ad27')
        ->toContain('[WhatsApp Placeholder]')
        ->toContain('[Support Email Placeholder]')
        ->toContain('https://spmb.playground-ku.my.id')
        ->and($rendered['text'])
        ->toContain('Verifikasi Email:')
        ->toContain('Alya Rahma');
});

it('renders the password reset notification through the shared email design system', function () {
    $user = User::factory()->create([
        'name' => 'Farhan Akbar',
        'email' => 'farhan@example.test',
    ]);

    $message = (new ResetPassword('test-reset-token'))->toMail($user);
    $rendered = renderEmailMessage($message);

    expect($message->subject)->toBe('Permintaan Atur Ulang Password SPMB')
        ->and($message->actionText)->toBe('Atur Ulang Password')
        ->and($message->actionUrl)->toContain('test-reset-token')
        ->and($rendered['html'])
        ->toContain('Atur ulang password')
        ->toContain('Catatan keamanan')
        ->toContain('Tautan ini berlaku selama')
        ->toContain('Butuh bantuan?')
        ->and($rendered['text'])
        ->toContain('Atur Ulang Password:')
        ->toContain('Farhan Akbar');
});

it('escapes recipient content in the HTML email body', function () {
    $user = User::factory()->unverified()->create([
        'name' => '<script>alert("x")</script>',
        'email' => 'safe-output@example.test',
    ]);

    $rendered = renderEmailMessage((new VerifyEmail)->toMail($user));

    expect($rendered['html'])
        ->not->toContain('<script>alert("x")</script>')
        ->toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
});
