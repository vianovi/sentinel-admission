<?php

use App\Models\User;
use App\Support\EmailDesignSystem;
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

    expect($message->subject)->toBe('Verifikasi Alamat Email')
        ->and($message->actionText)->toBe('Verifikasi Email')
        ->and($message->from)->toBe([
            config('mail.from.address'),
            config('mail.from.name'),
        ])
        ->and($rendered['html'])
        ->toContain('Al-Muntaha School')
        ->toContain('Sistem Penerimaan Santri Baru')
        ->toContain('Tahun Ajaran 2027/2028')
        ->toContain('📧 Verifikasi Alamat Email')
        ->toContain('Assalamu&#039;alaikum Warahmatullahi Wabarakatuh')
        ->toContain('Apabila tombol tidak dapat dibuka')
        ->toContain('#132f68')
        ->toContain('#e0ad27')
        ->toContain('085185001661 -&gt; Admin SPMB')
        ->toContain('[Support Email Placeholder]')
        ->toContain('spmb.playground-ku.my.id')
        ->and($rendered['text'])
        ->toContain('Verifikasi Email:')
        ->toContain('Tahun Ajaran 2027/2028');
});

it('renders the password reset notification through the shared email design system', function () {
    $user = User::factory()->create([
        'name' => 'Farhan Akbar',
        'email' => 'farhan@example.test',
    ]);

    $message = (new ResetPassword('test-reset-token'))->toMail($user);
    $rendered = renderEmailMessage($message);

    expect($message->subject)->toBe('Atur Ulang Password SPMB')
        ->and($message->actionText)->toBe('Atur Ulang Password')
        ->and($message->actionUrl)->toContain('test-reset-token')
        ->and($rendered['html'])
        ->toContain('Atur Ulang Password')
        ->toContain('Link ini berlaku selama')
        ->toContain('Apabila tombol tidak dapat dibuka')
        ->toContain('Butuh bantuan?')
        ->and($rendered['text'])
        ->toContain('Atur Ulang Password:');
});

it('escapes dynamic content in the HTML email body', function () {
    $message = EmailDesignSystem::transactional([
        'subject' => 'Test email',
        'greeting' => '<script>alert("x")</script>',
    ]);
    $rendered = renderEmailMessage($message);

    expect($rendered['html'])
        ->not->toContain('<script>alert("x")</script>')
        ->toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
});
