@props(['brand', 'logoUrl'])

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse; background-color:#ffffff;">
    <tr>
        <td class="email-header" align="center" style="padding:34px 48px 28px; border-bottom:4px solid #e0ad27; text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse;">
                <tr>
                    <td align="center" style="text-align:center;">
                        <img src="{{ $logoUrl }}" width="88" height="88" alt="Logo {{ $brand['name'] ?? 'Al-Muntaha School' }}" style="display:block; width:88px; height:88px; margin:0 auto 14px; border:0;">
                        <div style="color:#132f68; font-size:19px; font-weight:700; line-height:1.35; letter-spacing:0.1px;">
                            {{ $brand['name'] ?? 'Al-Muntaha School' }}
                        </div>
                        <div style="margin-top:6px; color:#53627a; font-size:13px; font-weight:700; line-height:1.5;">
                            {{ $brand['program_title'] ?? 'Sistem Penerimaan Santri Baru' }}
                        </div>
                        <div style="margin-top:2px; color:#7a879b; font-size:12px; line-height:1.5;">
                            Tahun Ajaran {{ $brand['academic_year'] ?? '2027/2028' }}
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
