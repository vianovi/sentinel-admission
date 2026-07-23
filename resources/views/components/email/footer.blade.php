@props(['brand'])

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse; border-top:1px solid #e8edf4; background-color:#fbfcfe;">
    <tr>
        <td class="email-footer" style="padding:26px 48px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse;">
                <tr>
                    <td style="padding-bottom:18px; color:#5e6b82; font-size:12px; line-height:1.7;">
                        <strong style="color:#243454; font-size:12px;">Butuh bantuan?</strong><br>
                        WhatsApp &nbsp; {{ $brand['whatsapp'] ?? '[WhatsApp Placeholder]' }}<br>
                        Email &nbsp; {{ $brand['support_email'] ?? '[Support Email Placeholder]' }}<br>
                        Website &nbsp; <a href="{{ $brand['website'] ?? 'https://spmb.playground-ku.my.id' }}" style="color:#132f68; font-weight:700; text-decoration:none;">{{ $brand['website'] ?? 'https://spmb.playground-ku.my.id' }}</a>
                    </td>
                </tr>
                <tr>
                    <td style="border-top:1px solid #e8edf4; padding-top:16px; color:#8792a5; font-size:11px; line-height:1.6;">
                        © {{ date('Y') }} {{ $brand['name'] ?? 'Al-Muntaha School' }}. Semua hak dilindungi.
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
