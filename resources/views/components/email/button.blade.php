@props([
    'href',
    'label',
])

<table class="email-button" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 32px; border-collapse:separate;">
    <tr>
        <td align="center" bgcolor="#e0ad27" style="border-radius:9px; background-color:#e0ad27; box-shadow:0 5px 12px rgba(188, 139, 19, 0.2);">
            <a href="{{ $href }}" target="_blank" rel="noopener" style="display:inline-block; padding:14px 24px; border:1px solid #d39f1f; border-radius:9px; color:#162746; font-size:14px; font-weight:700; line-height:1.2; text-align:center; text-decoration:none;">
                {{ $label }}
            </a>
        </td>
    </tr>
</table>
