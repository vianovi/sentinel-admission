<?php

use App\Models\Candidate;
use App\Models\RegistrationDraft;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Contracts\Notifications\Dispatcher;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Mockery\MockInterface;

const RESET_LINK_SENT_MESSAGE = 'Permintaan reset telah diproses. Jika email terdaftar, silakan periksa kotak masuk dan folder spam.';

function mailRegistrationDraft(array $overrides = []): RegistrationDraft
{
    return RegistrationDraft::create(array_merge([
        'secret_token' => str_repeat('m', 64),
        'expires_at' => now()->addDay(),
        'current_step' => 3,
        'registration_code' => 'REG-MAIL-26-G1',
        'nisn' => '9876543210',
        'nik' => '3210010101100001',
        'full_name' => 'Kandidat Email Dinamis',
        'gender' => 'P',
        'place_of_birth' => 'Bandung',
        'date_of_birth' => '2010-01-01',
        'mother_name' => 'Ibu Kandidat',
        'whatsapp_number' => '081234567890',
        'email' => 'registration-recipient@example.net',
        'address_full' => 'Bandung, Jawa Barat',
        'address_detail' => ['provinsi' => 'Jawa Barat'],
        'school_origin' => 'SMP Contoh',
    ], $overrides));
}

it('follows the active environment session security for draft cookies', function (bool $secure) {
    config(['session.secure' => $secure]);

    $response = $this->postJson('/daftar/step1', [
        'full_name' => 'Kandidat Cookie',
        'nisn' => '9876543299',
        'nik' => '3210010101100099',
        'gender' => 'P',
        'place_of_birth' => 'Bandung',
        'date_of_birth' => '2010-01-01',
    ]);

    $response->assertOk();

    $draftCookie = collect($response->headers->getCookies())
        ->first(fn ($cookie) => $cookie->getName() === 'draft_token');

    expect($draftCookie)->not->toBeNull()
        ->and($draftCookie->isSecure())->toBe($secure);
})->with([
    'development HTTP' => false,
    'demo or production HTTPS' => true,
]);

it('uses the validated registration draft email as the verification recipient', function () {
    Notification::fake();

    $draft = mailRegistrationDraft();

    $response = $this
        ->withCookie('draft_token', $draft->secret_token)
        ->post('/register', [
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

    $response->assertRedirect(route('dashboard.index'));
    $response->assertSessionHas(
        'success',
        'Akun berhasil dibuat. Email verifikasi telah dikirim. Silakan periksa kotak masuk dan folder spam.'
    );

    $user = User::where('email', 'registration-recipient@example.net')->firstOrFail();

    $this->assertAuthenticatedAs($user);

    Notification::assertSentTo(
        $user,
        VerifyEmail::class,
        function (VerifyEmail $notification, array $channels) use ($user): bool {
            expect($channels)->toContain('mail')
                ->and($user->routeNotificationFor('mail', $notification))->toBe('registration-recipient@example.net')
                ->and($notification->toMail($user)->mailer)->toBeNull();

            return true;
        }
    );
});

it('revalidates a malformed draft email before creating the account', function () {
    Notification::fake();

    $draft = mailRegistrationDraft([
        'email' => "candidate@example.net\r\nBcc: injected@example.net",
    ]);

    $response = $this
        ->withCookie('draft_token', $draft->secret_token)
        ->post('/register', [
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

    $response->assertSessionHasErrors('email');
    $this->assertDatabaseMissing('users', [
        'name' => 'Kandidat Email Dinamis',
    ]);
    Notification::assertNothingSent();
});

it('keeps a completed registration usable when its first verification send fails', function () {
    $draft = mailRegistrationDraft([
        'secret_token' => str_repeat('n', 64),
        'registration_code' => 'REG-FAIL-26-G1',
        'nisn' => '9876543211',
        'nik' => '3210010101100002',
        'email' => 'registration-retry@example.net',
    ]);

    $this->mock(Dispatcher::class, function (MockInterface $mock): void {
        $mock->shouldReceive('send')
            ->once()
            ->andThrow(new \RuntimeException('Technical SMTP failure'));
    });

    Log::spy();

    $response = $this
        ->withCookie('draft_token', $draft->secret_token)
        ->post('/register', [
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

    $response->assertRedirect(route('dashboard.index'));
    $response->assertSessionHas(
        'error',
        'Akun berhasil dibuat, tetapi email verifikasi belum dapat dikirim. Gunakan menu Verifikasi Email untuk mencoba lagi.'
    );

    $user = User::where('email', 'registration-retry@example.net')->firstOrFail();

    $this->assertAuthenticatedAs($user);

    Log::shouldHaveReceived('error')
        ->once()
        ->withArgs(function (string $message, array $context) use ($user): bool {
            return $message === 'Registration verification email delivery failed.'
                && $context['user_id'] === $user->id
                && $context['exception'] instanceof \RuntimeException;
        });
});

it('sends verification mail to the authenticated users stored email through the default mailer', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create([
        'email' => 'candidate-recipient@example.net',
    ]);

    config(['app.url' => 'https://demo.example.test']);
    URL::forceRootUrl(config('app.url'));

    $response = $this
        ->actingAs($user)
        ->post('/email/verification-notification');

    $response->assertRedirect();
    $response->assertSessionHas('status', 'verification-link-sent');

    Notification::assertSentTo(
        $user,
        VerifyEmail::class,
        function (VerifyEmail $notification, array $channels) use ($user): bool {
            $mailMessage = $notification->toMail($user);

            expect($channels)->toContain('mail')
                ->and($user->routeNotificationFor('mail', $notification))->toBe('candidate-recipient@example.net')
                ->and($mailMessage->mailer)->toBeNull()
                ->and($mailMessage->actionUrl)->toStartWith('https://demo.example.test/email/verify/');

            return true;
        }
    );

    URL::forceRootUrl(null);
});

it('rate limits verification resend per account', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create([
        'email' => 'verification-rate-limit@example.net',
    ]);

    $this->actingAs($user)
        ->post('/email/verification-notification')
        ->assertRedirect()
        ->assertSessionHas('status', 'verification-link-sent');

    $this->actingAs($user)
        ->post('/email/verification-notification')
        ->assertRedirect()
        ->assertSessionHas('error', 'Email verifikasi baru dapat dikirim ulang setelah beberapa menit.');

    Notification::assertSentToTimes($user, VerifyEmail::class, 1);
});

it('sends password reset mail to the account resolved by its stored email', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email' => 'password-recipient@example.net',
    ]);

    $response = $this->post(route('password.email'), [
        'email' => $user->email,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('status', RESET_LINK_SENT_MESSAGE);

    Notification::assertSentTo(
        $user,
        ResetPassword::class,
        function (ResetPassword $notification, array $channels) use ($user): bool {
            $mailMessage = $notification->toMail($user);

            expect($channels)->toContain('mail')
                ->and($user->routeNotificationFor('mail', $notification))->toBe('password-recipient@example.net')
                ->and($mailMessage->mailer)->toBeNull();

            return true;
        }
    );
});

it('does not disclose whether a password reset address is registered', function () {
    Notification::fake();

    $response = $this->post(route('password.email'), [
        'email' => 'not-registered@example.net',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('status', RESET_LINK_SENT_MESSAGE);
    Notification::assertNothingSent();
});

it('does not disclose a registered password reset address when mail delivery fails', function () {
    $user = User::factory()->create([
        'email' => 'password-failure@example.net',
    ]);

    $this->mock(Dispatcher::class, function (MockInterface $mock): void {
        $mock->shouldReceive('send')
            ->once()
            ->andThrow(new \RuntimeException('Technical SMTP failure'));
    });

    Log::spy();

    $response = $this->post(route('password.email'), [
        'email' => $user->email,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('status', RESET_LINK_SENT_MESSAGE);
    $response->assertSessionHasNoErrors();

    Log::shouldHaveReceived('error')
        ->once()
        ->withArgs(function (string $message, array $context): bool {
            return $message === 'Password reset email delivery failed.'
                && $context['exception'] instanceof \RuntimeException;
        });
});

it('rejects malformed email addresses before attempting delivery', function () {
    Notification::fake();

    $response = $this->post(route('password.email'), [
        'email' => "candidate@example.net\r\nBcc: injected@example.net",
    ]);

    $response->assertSessionHasErrors('email');
    Notification::assertNothingSent();
});

it('logs mail transport failures and returns a safe verification error', function () {
    $user = User::factory()->unverified()->create();

    $this->mock(Dispatcher::class, function (MockInterface $mock): void {
        $mock->shouldReceive('send')
            ->once()
            ->andThrow(new \RuntimeException('Technical SMTP failure'));
    });

    Log::spy();

    $response = $this
        ->actingAs($user)
        ->post(route('verification.send'));

    $response->assertRedirect();
    $response->assertSessionHas(
        'error',
        'Email verifikasi belum dapat dikirim. Silakan coba lagi beberapa saat.'
    );
    $response->assertSessionMissing('status');

    Log::shouldHaveReceived('error')
        ->once()
        ->withArgs(function (string $message, array $context) use ($user): bool {
            return $message === 'Email verification delivery failed.'
                && $context['user_id'] === $user->id
                && $context['exception'] instanceof \RuntimeException;
        });
});

it('keeps candidate email changes on the existing manual staff approval path', function () {
    Notification::fake();

    $candidateUser = User::factory()->create([
        'email' => 'current-candidate@example.net',
    ]);
    $candidate = Candidate::create([
        'user_id' => $candidateUser->id,
        'candidate_code' => 'CDT-EML1-26-G1',
        'nisn' => '9876543288',
        'nik' => '3210010101100088',
        'full_name' => 'Kandidat Perubahan Email',
        'gender' => 'P',
        'place_of_birth' => 'Bandung',
        'date_of_birth' => '2010-01-01',
        'status' => 'draft',
    ]);

    $this->actingAs($candidateUser)
        ->post(route('dashboard.profile.email.request'), [
            'new_email' => 'approved-candidate@example.net',
        ])
        ->assertRedirect();

    expect($candidateUser->fresh())
        ->pending_email->toBe('approved-candidate@example.net')
        ->pending_email_status->toBe('pending')
        ->email->toBe('current-candidate@example.net');
    Notification::assertNothingSent();

    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('staff.change-requests.email.approve', $candidate))
        ->assertRedirect();

    expect($candidateUser->fresh())
        ->pending_email_status->toBe('approved')
        ->email->toBe('current-candidate@example.net');
    Notification::assertNothingSent();
});

it('rejects malformed candidate email change requests', function () {
    Notification::fake();

    $candidateUser = User::factory()->create();

    $this->actingAs($candidateUser)
        ->post(route('dashboard.profile.email.request'), [
            'new_email' => "candidate@example.net\r\nBcc: injected@example.net",
        ])
        ->assertSessionHasErrors('new_email');

    expect($candidateUser->fresh()->pending_email)->toBeNull();
    Notification::assertNothingSent();
});
