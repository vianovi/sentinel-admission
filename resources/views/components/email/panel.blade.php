@props([
    'title',
    'tone' => 'navy',
])

@php
    $panelStyles = [
        'navy' => ['background' => '#f1f5fb', 'border' => '#d9e3f1', 'title' => '#132f68', 'text' => '#53627a'],
        'gold' => ['background' => '#fff9e8', 'border' => '#f2df9f', 'title' => '#795600', 'text' => '#685b38'],
    ];
    $styles = $panelStyles[$tone] ?? $panelStyles['navy'];
@endphp

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; margin:0 0 22px; border-collapse:separate; border:1px solid {{ $styles['border'] }}; border-radius:10px; background-color:{{ $styles['background'] }};">
    <tr>
        <td style="padding:16px 18px;">
            <div style="margin-bottom:5px; color:{{ $styles['title'] }}; font-size:12px; font-weight:700; line-height:1.5; text-transform:uppercase; letter-spacing:0.8px;">
                {{ $title }}
            </div>
            <div style="color:{{ $styles['text'] }}; font-size:13px; line-height:1.7;">
                {{ $slot }}
            </div>
        </td>
    </tr>
</table>
