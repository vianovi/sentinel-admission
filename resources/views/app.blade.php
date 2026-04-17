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
            FIX PERF #4: Ganti all.min.css → solid.min.css (~200KB vs ~1.8MB).
            Seluruh project hanya menggunakan icon dari family "solid" (fa-solid).
            Tidak ada icon regular/brands/light yang dipakai — full bundle tidak diperlukan.

            Teknik media="print" dipertahankan: load FA di background (non-blocking),
            swap ke "all" setelah selesai → icon tetap muncul, tidak delay LCP.
        --}}
        <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/solid.min.css"
            media="print"
            onload="this.media='all'"
        />
        {{-- Fallback: jika JavaScript dinonaktifkan, load FA secara langsung --}}
        <noscript>
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/solid.min.css"
            >
        </noscript>

        {{-- Fonts: Sora (Display) + DM Sans (Body) --}}
        <link
            href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
            rel="stylesheet"
        >

        {{--
            FIX DEAD CODE #5: Favicon disederhanakan.
            Dihapus: 16x16, 32x32, 48x48 — browser mengambil ukuran ini otomatis dari favicon.ico.
            Dipertahankan:
              - favicon.ico   → fallback universal semua browser lama
              - 180x180       → Apple Touch Icon (iOS/iPadOS home screen)
              - 192x192       → Android/Chrome PWA
              - 512x512       → PWA splash screen
        --}}
        <link rel="icon"             type="image/x-icon" href="/favicon.ico">
        <link rel="apple-touch-icon" sizes="180x180"     href="/apple-touch-icon.png">
        <link rel="icon"             type="image/png"    sizes="192x192" href="/favicon-192x192.png">
        <link rel="icon"             type="image/png"    sizes="512x512" href="/favicon-512x512.png">

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
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>