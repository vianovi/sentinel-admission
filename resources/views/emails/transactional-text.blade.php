{{ $brand['name'] ?? 'Al-Muntaha School' }}
Sistem Penerimaan Murid Baru

{{ $title }}
@if($greeting)
{{ $greeting }}
@endif
@foreach($description as $paragraph)
{{ $paragraph }}
@endforeach
@if($actionUrl && $actionText)
{{ $actionText }}: {{ $actionUrl }}
@endif
@if($panel)
{{ $panel['title'] ?? 'Informasi' }}: {{ $panel['body'] ?? '' }}
@endif
@if($warning)
{{ $warning['title'] ?? 'Perhatian' }}: {{ $warning['body'] ?? '' }}
@endif
@if($information)
{{ $information['title'] ?? 'Informasi' }}: {{ $information['body'] ?? '' }}
@endif
@foreach($outroLines as $line)
{{ $line }}
@endforeach
@if($secondaryText)
{{ $secondaryText }}
@endif

Butuh bantuan?
WhatsApp: {{ $brand['whatsapp'] ?? '[WhatsApp Placeholder]' }}
Email: {{ $brand['support_email'] ?? '[Support Email Placeholder]' }}
Website: {{ $brand['website'] ?? 'https://spmb.playground-ku.my.id' }}

© {{ date('Y') }} {{ $brand['name'] ?? 'Al-Muntaha School' }}. Semua hak dilindungi.
