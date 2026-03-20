import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans:    ['DM Sans', ...defaultTheme.fontFamily.sans],
                display: ['Sora', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // ── Brand colors ──────────────────────────────────────────
                navy:      '#0f172a',
                gold:      '#d4a017',
                goldhover: '#b5850b',
                light:     '#f1f5f9',

                // ── Shell tokens (Sidebar kiri, Topbar) ───────────────────
                // Sedikit lebih gelap/structural dari content
                'shell-bg':      'var(--shell-bg)',
                'shell-surface': 'var(--shell-surface)',
                'shell-border':  'var(--shell-border)',

                // ── Content tokens (DataDiri, DataKesehatan, dll) ─────────
                // Sedikit lebih lifted dari shell — satu keluarga, beda tipis
                'content-bg':      'var(--content-bg)',
                'content-surface': 'var(--content-surface)',
                'content-card':    'var(--content-card)',
                'content-border':  'var(--content-border)',
                'content-muted':   'var(--content-muted)',
            },
            boxShadow: {
                soft: '0 10px 40px -10px rgba(0,0,0,0.08)',
                glow: '0 0 20px rgba(212, 160, 23, 0.3)',
            },
        },
    },
    plugins: [forms],
};