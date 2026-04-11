// resources/js/hooks/useIdleLogout.ts

import { useEffect, useRef, useCallback } from 'react'
import { router } from '@inertiajs/react'
import Swal from 'sweetalert2'

interface UseIdleLogoutOptions {
    /**
     * Detik idle sebelum modal warning muncul.
     * Default: 1200 (20 menit)
     */
    timeoutSeconds?: number
    /**
     * Detik countdown di dalam modal sebelum auto-logout.
     * Default: 300 (5 menit)
     */
    warningSeconds?: number
}

/**
 * useIdleLogout
 *
 * Satu timer — warning modal yang handle countdown & logout.
 * visibilitychange dipakai untuk deteksi user kembali setelah lama pergi.
 *
 * Flow normal:
 *   idle 20 menit
 *   → modal muncul + countdown 5 menit
 *   → "Tetap Login": reset timer, modal tutup
 *   → "Logout": POST /logout (destroy session)
 *   → countdown habis: POST /logout otomatis
 *
 * Flow visibilitychange (mobile / pindah tab):
 *   user balik ke tab setelah pergi > 20 menit
 *   → langsung modal tanpa nunggu timer
 *   → countdown 5 menit berlaku sama
 *
 * Mount di: DashboardLayout.tsx + DashboardSplitLayout.tsx
 */
export function useIdleLogout({
    timeoutSeconds = 1200,
    warningSeconds = 300,
}: UseIdleLogoutOptions = {}) {

    const idleTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isWarningShown  = useRef(false)
    const lastActiveRef   = useRef<number>(Date.now())

    // ── Logout — destroy session via Laravel ─────────────────────────────────
    const doLogout = useCallback(() => {
        Swal.close()
        router.post(route('logout'))
    }, [])

    // ── Warning modal — satu timer countdown di dalam modal ──────────────────
    const showWarning = useCallback(() => {
        if (isWarningShown.current) return
        isWarningShown.current = true

        let remaining  = warningSeconds
        let intervalId: ReturnType<typeof setInterval> | null = null

        swalDark.fire({
            title:             'Sesi Hampir Berakhir',
            html:              buildHtml(remaining),
            showCancelButton:  true,
            confirmButtonText: '<i class="fa-solid fa-rotate-right mr-2"></i>Tetap Login',
            cancelButtonText:  '<i class="fa-solid fa-right-from-bracket mr-2"></i>Logout',
            allowOutsideClick: false,
            allowEscapeKey:    false,
            reverseButtons:    false,
            didOpen: () => {
                intervalId = setInterval(() => {
                    remaining -= 1

                    // Update countdown text
                    const el = document.getElementById('idle-countdown')
                    if (el) el.textContent = formatTime(remaining)

                    // Update progress bar
                    const bar = document.getElementById('idle-progress')
                    if (bar) {
                        const pct = (remaining / warningSeconds) * 100
                        bar.style.width = `${pct}%`
                        bar.style.background = pct > 50
                            ? '#2563eb'
                            : pct > 20
                                ? '#f59e0b'
                                : '#ef4444'
                    }

                    // Countdown habis → logout dari dalam modal
                    if (remaining <= 0) {
                        if (intervalId) clearInterval(intervalId)
                        doLogout()
                    }
                }, 1000)
            },
            willClose: () => {
                if (intervalId) clearInterval(intervalId)
            },
        }).then((result) => {
            if (result.isConfirmed) {
                // "Tetap Login" → reset
                isWarningShown.current = false
                lastActiveRef.current  = Date.now()
                resetTimer()
            } else {
                // "Logout" atau tombol cancel
                doLogout()
            }
        })
    }, [warningSeconds, doLogout])

    // ── Reset idle timer ─────────────────────────────────────────────────────
    const resetTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)

        idleTimerRef.current = setTimeout(() => {
            showWarning()
        }, timeoutSeconds * 1000)
    }, [timeoutSeconds, showWarning])

    // ── Activity listener ────────────────────────────────────────────────────
    useEffect(() => {
        const EVENTS = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const

        const handleActivity = () => {
            if (isWarningShown.current) return
            lastActiveRef.current = Date.now()
            resetTimer()
        }

        // ── visibilitychange — handle mobile / pindah tab ────────────────────
        const handleVisibility = () => {
            if (document.visibilityState !== 'visible') return

            // Hitung sudah berapa lama user pergi
            const elapsed = (Date.now() - lastActiveRef.current) / 1000

            if (elapsed >= timeoutSeconds) {
                // Sudah melewati batas idle → langsung tampilkan modal
                if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
                showWarning()
            } else if (elapsed >= timeoutSeconds - warningSeconds) {
                // Sudah masuk zona warning → reset timer dengan sisa waktu yang sesuai
                if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
                const remaining = timeoutSeconds - elapsed
                idleTimerRef.current = setTimeout(() => {
                    showWarning()
                }, remaining * 1000)
            }
            // Belum masuk zona apapun → biarkan timer jalan normal
        }

        // Start timer saat mount
        resetTimer()

        EVENTS.forEach(ev => window.addEventListener(ev, handleActivity, { passive: true }))
        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
            EVENTS.forEach(ev => window.removeEventListener(ev, handleActivity))
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [resetTimer, showWarning, timeoutSeconds, warningSeconds])
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const swalDark = Swal.mixin({
    background:         '#0f172a',
    color:              '#e2e8f0',
    confirmButtonColor: '#2563eb',
    cancelButtonColor:  '#334155',
    customClass: {
        popup:         '!rounded-2xl !border !border-white/10',
        confirmButton: '!rounded-xl !px-6',
        cancelButton:  '!rounded-xl !px-6',
    },
})

/** Format detik jadi mm:ss */
function formatTime(seconds: number): string {
    const m = Math.floor(Math.max(seconds, 0) / 60)
    const s = Math.max(seconds, 0) % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function buildHtml(initial: number): string {
    return `
        <p class="text-slate-400 text-sm leading-relaxed mb-4">
            Kamu tidak aktif. Sesi akan otomatis berakhir dalam:
        </p>
        <div class="text-4xl font-bold text-white font-mono mb-5" id="idle-countdown">
            ${formatTime(initial)}
        </div>
        <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
                id="idle-progress"
                style="width:100%; background:#2563eb; transition: width 1s linear, background 1s linear;"
                class="h-full rounded-full"
            ></div>
        </div>
        <p class="text-slate-500 text-xs mt-4">
            Klik <b class="text-white">Tetap Login</b> untuk melanjutkan sesi.
        </p>
    `
}