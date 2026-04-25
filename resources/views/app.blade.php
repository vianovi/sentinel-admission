{{-- resources/views/app.blade.php --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title inertia>{{ config('app.name') }}</title>

        {{--
            PERF: preconnect ke semua external domain yang dipakai.
            Memberitahu browser buka koneksi lebih awal sebelum resource ditemukan.
        --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>

        {{--
            Font Awesome — load dengan media="print" trick agar tidak block rendering.
            Pakai all.min.css: mencakup base font-face + semua icon family (solid, regular, brands).
            solid.min.css saja tidak cukup karena tidak include font-face declaration
            yang dibutuhkan browser untuk render glyph icon.
        --}}
        <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
            media="print"
            onload="this.media='all'"
        />
        {{-- Fallback: jika JavaScript dinonaktifkan --}}
        <noscript>
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
            >
        </noscript>

        {{-- Fonts: Sora (Display) + DM Sans (Body) --}}
        <link
            href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
            rel="stylesheet"
        >

        {{--
            Favicon — semua ukuran dipertahankan.
            16x16, 32x32, 48x48 tetap ada karena beberapa browser lama dan
            aplikasi (Slack, Discord embed, dll) secara eksplisit request ukuran ini.
            favicon.ico sebagai fallback universal.
        --}}
        <link rel="icon"             type="image/x-icon" href="/favicon.ico">
        <link rel="icon"             type="image/png"    sizes="16x16"  href="/favicon-16x16.png">
        <link rel="icon"             type="image/png"    sizes="32x32"  href="/favicon-32x32.png">
        <link rel="icon"             type="image/png"    sizes="48x48"  href="/favicon-48x48.png">
        <link rel="apple-touch-icon" sizes="180x180"                    href="/apple-touch-icon.png">
        <link rel="icon"             type="image/png"    sizes="192x192" href="/favicon-192x192.png">
        <link rel="icon"             type="image/png"    sizes="512x512" href="/favicon-512x512.png">

        {{--
            PERF: DNS Prefetch — percepat koneksi ke CDN eksternal
        --}}
        <link rel="dns-prefetch" href="//fonts.googleapis.com">
        <link rel="dns-prefetch" href="//fonts.gstatic.com">
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com">

        {{--
            Midtrans Snap.js — hanya di-load di halaman Pembayaran.
            Pola ini sudah benar, pertahankan untuk semua script pihak ketiga.
        --}}
        @if(isset($page['component']) && $page['component'] === 'Dashboard/Candidate/Pembayaran')
            <script
                src="https://app.sandbox.midtrans.com/snap/snap.js"
                data-client-key="{{ config('midtrans.client_key') }}"
            ></script>
        @endif

        @routes
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>