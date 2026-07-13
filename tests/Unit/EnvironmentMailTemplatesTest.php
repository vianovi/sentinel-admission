<?php

function loadEnvironmentTemplate(string $filename): array
{
    $values = [];
    $path = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.$filename;

    foreach (file($path, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
        if ($line === '' || str_starts_with(ltrim($line), '#') || ! str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $values[trim($key)] = trim(trim($value), "\"'");
    }

    return $values;
}

it('keeps development mail inside Mailtrap Email Sandbox', function () {
    $environment = loadEnvironmentTemplate('.env.example');

    expect($environment)
        ->toMatchArray([
            'APP_ENV' => 'local',
            'APP_URL' => 'http://localhost:8080',
            'SESSION_SECURE_COOKIE' => 'false',
            'QUEUE_CONNECTION' => 'sync',
            'MAIL_MAILER' => 'smtp',
            'MAIL_SCHEME' => 'smtp',
            'MAIL_ENCRYPTION' => 'tls',
            'MAIL_HOST' => 'sandbox.smtp.mailtrap.io',
            'MAIL_PORT' => '2525',
        ])
        ->and($environment['MAIL_FROM_ADDRESS'])->toEndWith('.test');
});

it('configures demo for Resend SMTP without a sandbox fallback or committed secret', function () {
    $environment = loadEnvironmentTemplate('.env.tunnel.example');

    expect($environment)
        ->toMatchArray([
            'APP_ENV' => 'demo',
            'SESSION_SECURE_COOKIE' => 'true',
            'QUEUE_CONNECTION' => 'sync',
            'MAIL_MAILER' => 'smtp',
            'MAIL_SCHEME' => 'smtp',
            'MAIL_ENCRYPTION' => 'tls',
            'MAIL_HOST' => 'smtp.resend.com',
            'MAIL_PORT' => '587',
            'MAIL_USERNAME' => 'resend',
            'MAIL_PASSWORD' => 'your-resend-api-key',
        ])
        ->and($environment['APP_URL'])->toStartWith('https://')
        ->and($environment['MAIL_FROM_ADDRESS'])->toContain('your-verified-domain.example')
        ->and($environment['MAIL_HOST'])->not->toContain('mailtrap');
});

it('configures initial production for Resend SMTP with synchronous delivery', function () {
    $environment = loadEnvironmentTemplate('.env.production.example');

    expect($environment)
        ->toMatchArray([
            'APP_ENV' => 'production',
            'APP_DEBUG' => 'false',
            'SESSION_SECURE_COOKIE' => 'true',
            'QUEUE_CONNECTION' => 'sync',
            'MAIL_MAILER' => 'smtp',
            'MAIL_ENCRYPTION' => 'tls',
            'MAIL_HOST' => 'smtp.resend.com',
            'MAIL_PORT' => '587',
            'MAIL_USERNAME' => 'resend',
            'MAIL_PASSWORD' => 'your-resend-api-key',
        ])
        ->and($environment['APP_URL'])->toStartWith('https://')
        ->and($environment['MAIL_HOST'])->not->toContain('mailtrap');
});
