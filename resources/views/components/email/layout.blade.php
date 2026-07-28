@props([
    'title' => config('app.name'),
    'preheader' => null,
])

@php
    $brand = config('email.brand');
    $logo = (string) ($brand['logo'] ?? '/assets/icons/brand/logo-email.png');
    $logoUrl = str_starts_with($logo, 'http://') || str_starts_with($logo, 'https://')
        ? $logo
        : url(ltrim($logo, '/'));
@endphp

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>{{ $title }}</title>
    <style>
        @media screen and (max-width: 620px) {
            .email-shell { width: 100% !important; }
            .email-gutter { padding-left: 20px !important; padding-right: 20px !important; }
            .email-card { border-left: 0 !important; border-right: 0 !important; border-radius: 0 !important; }
            .email-header { padding: 28px 20px !important; }
            .email-body { padding: 34px 20px !important; }
            .email-footer { padding: 24px 20px 32px !important; }
            .email-button { width: 100% !important; }
            .email-button a { display: block !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; width:100%; background-color:#f4f7fb; color:#17233b; font-family:Arial, Helvetica, sans-serif; -webkit-font-smoothing:antialiased;">
    @if($preheader)
        <div style="display:none; max-height:0; max-width:0; overflow:hidden; opacity:0; color:transparent; font-size:1px; line-height:1px;">
            {{ $preheader }}
        </div>
    @endif

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse; background-color:#f4f7fb;">
        <tr>
            <td class="email-gutter" align="center" style="padding:32px 16px;">
                <table class="email-shell" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%; max-width:600px; border-collapse:separate;">
                    <tr>
                        <td class="email-card" style="overflow:hidden; border:1px solid #e3e8f0; border-radius:18px; background-color:#ffffff; box-shadow:0 10px 28px rgba(20, 39, 76, 0.08);">
                            @include('components.email.header', ['brand' => $brand, 'logoUrl' => $logoUrl])

                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse;">
                                <tr>
                                    <td class="email-body" style="padding:40px 48px 36px;">
                                        {{ $slot }}
                                    </td>
                                </tr>
                            </table>

                            @include('components.email.footer', ['brand' => $brand])
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
