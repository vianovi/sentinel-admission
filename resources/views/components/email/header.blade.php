@props(['brand', 'logoUrl'])

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse; background-color:#132f68;">
    <tr>
        <td class="email-header" style="padding:30px 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse;">
                <tr>
                    <td width="58" valign="middle" style="width:58px; vertical-align:middle;">
                        <img src="{{ $logoUrl }}" width="52" height="52" alt="Logo {{ $brand['name'] ?? 'Al-Muntaha School' }}" style="display:block; width:52px; height:52px; border:0; border-radius:12px; object-fit:cover;">
                    </td>
                    <td valign="middle" style="padding-left:14px; vertical-align:middle;">
                        <div style="color:#ffffff; font-size:18px; font-weight:700; line-height:1.3; letter-spacing:0.1px;">
                            {{ $brand['name'] ?? 'Al-Muntaha School' }}
                        </div>
                        <div style="margin-top:5px; color:#f6cf55; font-size:11px; font-weight:700; line-height:1.4; letter-spacing:1.6px; text-transform:uppercase;">
                            Sistem Penerimaan Murid Baru
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
