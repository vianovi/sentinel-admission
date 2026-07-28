{{ $brand['name'] ?? 'Al-Muntaha School' }}
{{ $brand['program_title'] ?? 'Sistem Penerimaan Santri Baru' }}
Tahun Ajaran {{ $brand['academic_year'] ?? '2027/2028' }}

{{ $title }}
@if($greeting)
{{ $greeting }}
@endif
@foreach($description as $paragraph)
{{ $paragraph }}
@endforeach
@if($actionUrl && $actionText)
{{ $actionText }}: {{ $actionUrl }}
@if($validityText)
{{ $validityText }}
@endif

Apabila tombol tidak dapat dibuka, salin tautan berikut ke browser:
{{ $actionUrl }}
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
📧 {{ $brand['whatsapp'] ?? '085185001661 -> Admin SPMB' }}
Email: {{ $brand['support_email'] ?? '[Support Email Placeholder]' }}
🌐 {{ parse_url($brand['website'] ?? 'https://spmb.playground-ku.my.id', PHP_URL_HOST) ?: ($brand['website'] ?? 'https://spmb.playground-ku.my.id') }}

© {{ $brand['copyright_year'] ?? '2027' }} {{ $brand['name'] ?? 'Al-Muntaha School' }}
{{ $brand['program_title'] ?? 'Sistem Penerimaan Santri Baru' }}
