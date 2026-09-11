// =============================================================================
// LOKASI FILE: resources/js/Pages/Dashboard/Candidate/Pembayaran.tsx
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { animate }                     from 'animejs'
import { Head, router }                from '@inertiajs/react'
import axios                           from 'axios'
import Swal                            from 'sweetalert2'
import DashboardSplitLayout            from '@/Layouts/DashboardSplitLayout'
import PaymentSidebar                  from '@/Components/Dashboard/Candidate/Pembayaran/PaymentSidebar'
import DraftGate                       from '@/Components/Dashboard/Candidate/Pembayaran/DraftGate'
import ChannelSelection                from '@/Components/Dashboard/Candidate/Pembayaran/ChannelSelection'
import GatewayCheckout                 from '@/Components/Dashboard/Candidate/Pembayaran/GatewayCheckout'
import ManualCheckout                  from '@/Components/Dashboard/Candidate/Pembayaran/ManualCheckout'
import PaymentSuccess                  from '@/Components/Dashboard/Candidate/Pembayaran/PaymentSuccess'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type UserData = {
    name:       string
    avatar_url: string | null
    initials:   string
}

type WaveInfo = {
    title:            string
    academic_year:    string | null
    registration_fee: number
    end_date:         string | null
}

type CandidateData = {
    full_name:      string
    candidate_code: string
    status:         string
    program_choice: string | null
    nisn:           string | null
    school_origin:  string | null
    mother_name:    string | null
    admission_wave: WaveInfo | null
}

type PaymentData = {
    id:                       number
    order_id:                 string
    payment_channel:          'gateway' | 'transfer' | 'cash'
    base_amount:              number
    fee_amount:               number
    final_amount:             number
    snap_token:               string | null
    payment_method:           string | null
    status:                   string
    manual_status:            string | null
    proof_original_filename:  string | null
    proof_uploaded_at:        string | null
    proof_attempt:            number
    rejection_reason:         string | null
    paid_at:                  string | null
    expired_at:               string | null
    is_expired:               boolean
    can_upload_proof:         boolean
    is_cancellable:           boolean
}

type ConfigData = {
    gateway_fee_type:        string
    gateway_fee_value:       number
    gateway_fee_label:       string
    bank_name:               string | null
    bank_account_number:     string | null
    bank_account_name:       string | null
    bank_logo_key:           string | null
    bank_logo_label:         string
    whatsapp_contact_label:  string | null
}

type Props = {
    user:          UserData
    candidate:     CandidateData
    payment:       PaymentData | null
    config:        ConfigData | null
    gateway: {
        client_key: string | null
        script_url: string
    }
    proof_url:     string | null
    whatsapp_url:  string | null
    base_amount:   number
    gate:          { allowed: boolean; locked: boolean; reason: string | null; reasons: string[] }
    flash?:        { success?: string; error?: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// SWAL DARK
// ─────────────────────────────────────────────────────────────────────────────

const swalDark = Swal.mixin({
    background:         '#0f172a',
    color:              '#e2e8f0',
    confirmButtonColor: '#d4a017',
    cancelButtonColor:  '#334155',
    customClass: {
        confirmButton: '!rounded-xl !font-semibold !px-6',
        cancelButton:  '!rounded-xl !font-semibold !px-6',
        popup:         '!rounded-2xl !border !border-white/10',
        title:         '!text-white',
    },
})

// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT HEADER — narasi berubah sesuai channel
// Tampil saat di GatewayCheckout atau ManualCheckout (menggantikan welcome section)
// ─────────────────────────────────────────────────────────────────────────────

const CHECKOUT_NARASI: Record<string, { icon: string; title: string; desc: string; color: string; bg: string }> = {
    gateway: {
        icon:  'fa-solid fa-bolt',
        title: 'Hampir selesai! Selesaikan pembayaran gateway-mu.',
        desc:  'Klik tombol bayar di bawah. Popup Midtrans akan muncul — pilih metode favoritmu dan selesaikan dalam hitungan menit.',
        color: 'dark:text-orange-400 text-orange-600',
        bg:    'dark:border-orange-500/20 border-orange-200/60 dark:bg-orange-500/[0.04] bg-orange-50/60',
    },
    transfer: {
        icon:  'fa-solid fa-building-columns',
        title: 'Transfer ke rekening sekolah, lalu upload buktinya.',
        desc:  'Salin nomor rekening dan nominal di bawah. Sertakan berita transfer yang tertera agar pembayaranmu mudah dicocokkan.',
        color: 'dark:text-blue-400 text-blue-600',
        bg:    'dark:border-blue-500/20 border-blue-200/60 dark:bg-blue-500/[0.04] bg-blue-50/60',
    },
    cash: {
        icon:  'fa-solid fa-school',
        title: 'Datang ke sekolah, bayar, dan upload kwitansinya.',
        desc:  'Sebutkan nama dan kode kandidatmu ke petugas PSB. Setelah bayar, upload foto kwitansi resmi di bawah.',
        color: 'dark:text-emerald-400 text-emerald-600',
        bg:    'dark:border-emerald-500/20 border-emerald-200/60 dark:bg-emerald-500/[0.04] bg-emerald-50/60',
    },
}

function CheckoutNarasi({ channel }: { channel: string }) {
    const info = CHECKOUT_NARASI[channel] ?? CHECKOUT_NARASI.gateway
    return (
        <div className={`mb-5 p-4 rounded-2xl border relative overflow-hidden ${info.bg}`}>
            <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm
                    dark:bg-white/[0.06] bg-white/80 ${info.color}`}>
                    <i className={info.icon} />
                </div>
                <div>
                    <p className={`text-sm font-bold mb-1 ${info.color}`}>{info.title}</p>
                    <p className="text-[12px] dark:text-slate-400 text-slate-600 leading-relaxed">{info.desc}</p>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

type PageState = 'selection' | 'gateway' | 'manual'

type PaymentStatusResponse = {
    payment: PaymentData | null
    proof_url: string | null
    whatsapp_url: string | null
}

export default function PembayaranPage({
    user, candidate, payment, config, gateway, proof_url, whatsapp_url, base_amount, gate, flash,
}: Props) {
    const [processing, setProcessing] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const [livePayment, setLivePayment] = useState<PaymentData | null>(payment)
    const [liveProofUrl, setLiveProofUrl] = useState<string | null>(proof_url)
    const [liveWhatsappUrl, setLiveWhatsappUrl] = useState<string | null>(whatsapp_url)
    const [snapReady, setSnapReady] = useState<boolean>(() => typeof window !== 'undefined' && !!(window as any).snap)
    const [snapPopupOpen, setSnapPopupOpen] = useState(false)
    const contentRef                  = useRef<HTMLDivElement>(null)
    const pollTimerRef                = useRef<number | null>(null)
    const snapLoaderRef               = useRef<Promise<void> | null>(null)
    const snapPopupOpenRef            = useRef(false)
    const deferredStatusRef           = useRef<PaymentStatusResponse | null>(null)
    const snapFinalizeTimerRef        = useRef<number | null>(null)

    const deriveState = (currentPayment: PaymentData | null): PageState => {
        if (!currentPayment || currentPayment.status !== 'pending' || currentPayment.is_expired) return 'selection'
        if (currentPayment.payment_channel === 'gateway') return 'gateway'
        return 'manual'
    }

    const [pageState, setPageState] = useState<PageState>(() => deriveState(payment))

    const isDraft = candidate.status === 'draft'
    const isPaid  = livePayment?.status === 'paid'
    const isPaymentLocked = gate?.locked && !isPaid

    useEffect(() => {
        setLivePayment(payment)
        setLiveProofUrl(proof_url)
        setLiveWhatsappUrl(whatsapp_url)
    }, [payment, proof_url, whatsapp_url])

    useEffect(() => {
        const nextState = deriveState(livePayment)
        setPageState(prev => (prev === nextState ? prev : nextState))
    }, [livePayment])

    // ── Entrance animation ────────────────────────────────────────────────
    useEffect(() => {
        if (!contentRef.current) return
        animate(contentRef.current, {
            opacity:    [0, 1],
            translateY: [12, 0],
            duration:   400,
            ease:       'outExpo',
        })
    }, [pageState])

    // ── Flash ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (flash?.success) {
            swalDark.fire({
                icon: 'success', title: 'Berhasil', text: flash.success,
                timer: 2500, showConfirmButton: false,
                toast: true, position: 'top-end', timerProgressBar: true,
            })
        }
        if (flash?.error) {
            swalDark.fire({ icon: 'error', title: 'Terjadi Kesalahan', text: flash.error })
        }
    }, [flash])

    const ensureSnapReady = useCallback(async (): Promise<void> => {
        if ((window as any).snap) {
            setSnapReady(true)
            return
        }

        if (!gateway.client_key) {
            throw new Error('MIDTRANS_CLIENT_KEY_MISSING')
        }
        const clientKey = gateway.client_key

        if (snapLoaderRef.current) {
            await snapLoaderRef.current
            return
        }

        snapLoaderRef.current = new Promise<void>((resolve, reject) => {
            const existingScript = document.querySelector<HTMLScriptElement>('script[data-midtrans-snap="true"]')

            const finalizeReady = () => {
                setSnapReady(true)
                resolve()
            }

            const waitForSnap = (attempt = 0) => {
                if ((window as any).snap) {
                    finalizeReady()
                    return
                }

                if (attempt >= 40) {
                    reject(new Error('MIDTRANS_SNAP_TIMEOUT'))
                    return
                }

                window.setTimeout(() => waitForSnap(attempt + 1), 250)
            }

            const handleLoad = () => waitForSnap()
            const handleError = () => reject(new Error('MIDTRANS_SNAP_LOAD_FAILED'))

            if (existingScript) {
                existingScript.addEventListener('load', handleLoad, { once: true })
                existingScript.addEventListener('error', handleError, { once: true })
                waitForSnap()
                return
            }

            const script = document.createElement('script')
            script.src = gateway.script_url
            script.setAttribute('data-client-key', clientKey)
            script.setAttribute('data-midtrans-snap', 'true')
            script.async = true
            script.addEventListener('load', handleLoad, { once: true })
            script.addEventListener('error', handleError, { once: true })
            document.body.appendChild(script)
        })

        try {
            await snapLoaderRef.current
        } finally {
            snapLoaderRef.current = null
        }
    }, [gateway.client_key, gateway.script_url])

    useEffect(() => {
        if (!gateway.client_key) return
        void ensureSnapReady().catch(() => {
            setSnapReady(false)
        })
    }, [ensureSnapReady, gateway.client_key])

    const stopGatewayPolling = () => {
        if (pollTimerRef.current !== null) {
            window.clearTimeout(pollTimerRef.current)
            pollTimerRef.current = null
        }
    }

    const isSnapPopupVisible = useCallback((): boolean => {
        if (typeof document === 'undefined') {
            return false
        }

        const selectors = [
            'iframe[src*="midtrans"]',
            'iframe[name*="snap"]',
            '#snap-midtrans',
            '.snap-midtrans',
            '[id*="snap-midtrans"]',
            '[class*="snap-midtrans"]',
        ]

        return selectors.some(selector => {
            try {
                return Array.from(document.querySelectorAll<HTMLElement>(selector)).some(element => {
                    const rect = element.getBoundingClientRect()
                    const style = window.getComputedStyle(element)

                    return (
                        style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0' &&
                        rect.width > 0 &&
                        rect.height > 0
                    )
                })
            } catch {
                return false
            }
        })
    }, [])

    const applyPaymentStatus = useCallback((
        snapshot: PaymentStatusResponse,
        options: { allowDefer?: boolean } = {}
    ): PaymentData | null => {
        const allowDefer = options.allowDefer ?? true
        const nextPayment = snapshot.payment

        if (
            allowDefer &&
            snapPopupOpenRef.current &&
            nextPayment?.payment_channel === 'gateway' &&
            nextPayment.status === 'paid'
        ) {
            deferredStatusRef.current = snapshot
            return nextPayment
        }

        deferredStatusRef.current = null
        setLivePayment(nextPayment)
        setLiveProofUrl(snapshot.proof_url)
        setLiveWhatsappUrl(snapshot.whatsapp_url)

        return nextPayment
    }, [])

    const fetchPaymentStatus = useCallback(async (): Promise<PaymentStatusResponse | null> => {
        if (isPaymentLocked) {
            return null
        }

        try {
            const response = await axios.get<PaymentStatusResponse>(route('dashboard.pembayaran.status'), {
                headers: { Accept: 'application/json' },
            })
            return response.data
        } catch (error) {
            console.error('Failed to refresh payment status', error)
            return null
        }
    }, [isPaymentLocked])

    const refreshPaymentStatus = useCallback(async (
        options: { allowDefer?: boolean } = {}
    ): Promise<PaymentData | null> => {
        const snapshot = await fetchPaymentStatus()

        if (!snapshot) {
            return livePayment
        }

        return applyPaymentStatus(snapshot, options)
    }, [applyPaymentStatus, fetchPaymentStatus, livePayment])

    const finalizeSnapPopup = useCallback((
        options: { delay?: number; refresh?: boolean; waitForPopupClose?: boolean } = {}
    ) => {
        const { delay = 0, refresh = false, waitForPopupClose = false } = options

        if (snapFinalizeTimerRef.current !== null) {
            window.clearTimeout(snapFinalizeTimerRef.current)
            snapFinalizeTimerRef.current = null
        }

        const runFinalize = async (attempt = 0) => {
            if (waitForPopupClose && isSnapPopupVisible() && attempt < 40) {
                snapFinalizeTimerRef.current = window.setTimeout(() => {
                    void runFinalize(attempt + 1)
                }, 250)
                return
            }

            snapPopupOpenRef.current = false
            setSnapPopupOpen(false)

            if (deferredStatusRef.current) {
                applyPaymentStatus(deferredStatusRef.current, { allowDefer: false })
                deferredStatusRef.current = null
                return
            }

            if (refresh) {
                const nextPayment = await refreshPaymentStatus({ allowDefer: false })
                if (
                    nextPayment &&
                    nextPayment.payment_channel === 'gateway' &&
                    nextPayment.status === 'pending' &&
                    !nextPayment.is_expired
                ) {
                    scheduleGatewayPolling(1800)
                }
            }
        }

        snapFinalizeTimerRef.current = window.setTimeout(() => {
            void runFinalize()
        }, delay)
    }, [applyPaymentStatus, isSnapPopupVisible, refreshPaymentStatus])

    const scheduleGatewayPolling = (delay = 2500) => {
        stopGatewayPolling()
        pollTimerRef.current = window.setTimeout(async () => {
            const nextPayment = await refreshPaymentStatus()
            if (
                nextPayment &&
                nextPayment.payment_channel === 'gateway' &&
                nextPayment.status === 'pending' &&
                !nextPayment.is_expired
            ) {
                scheduleGatewayPolling(3500)
                return
            }

            stopGatewayPolling()
        }, delay)
    }

    useEffect(() => {
        if (
            livePayment &&
            livePayment.payment_channel === 'gateway' &&
            livePayment.status === 'pending' &&
            !livePayment.is_expired &&
            !snapPopupOpen
        ) {
            scheduleGatewayPolling(3500)
            return () => stopGatewayPolling()
        }

        stopGatewayPolling()
        return undefined
    }, [livePayment?.id, livePayment?.payment_channel, livePayment?.status, livePayment?.is_expired, snapPopupOpen])

    useEffect(() => {
        const handleFocusRefresh = () => {
            if (
                document.visibilityState === 'visible' &&
                livePayment &&
                livePayment.payment_channel === 'gateway' &&
                livePayment.status === 'pending' &&
                !livePayment.is_expired &&
                !snapPopupOpen
            ) {
                void refreshPaymentStatus()
                scheduleGatewayPolling(2000)
            }
        }

        window.addEventListener('focus', handleFocusRefresh)
        document.addEventListener('visibilitychange', handleFocusRefresh)

        return () => {
            window.removeEventListener('focus', handleFocusRefresh)
            document.removeEventListener('visibilitychange', handleFocusRefresh)
        }
    }, [livePayment, refreshPaymentStatus, snapPopupOpen])

    useEffect(() => {
        return () => {
            stopGatewayPolling()

            if (snapFinalizeTimerRef.current !== null) {
                window.clearTimeout(snapFinalizeTimerRef.current)
                snapFinalizeTimerRef.current = null
            }
        }
    }, [])

    // ── Transition helper ─────────────────────────────────────────────────
    const transitionTo = (next: PageState, dir: 'forward' | 'back' = 'forward') => {
        const dx = dir === 'forward' ? -20 : 20
        animate(contentRef.current!, {
            opacity:    [1, 0],
            translateX: [0, dx],
            duration:   180,
            ease:       'inQuad',
        })
        setTimeout(() => setPageState(next), 190)
    }

    // ── Create payment ────────────────────────────────────────────────────
    const handleSelectChannel = (channel: 'gateway' | 'transfer' | 'cash') => {
        // Kalau payment aktif untuk channel ini → langsung navigate ke state
        if (livePayment?.status === 'pending' && !livePayment.is_expired) {
            transitionTo(livePayment.payment_channel === 'gateway' ? 'gateway' : 'manual')
            return
        }

        setProcessing(true)
        router.post(route('dashboard.pembayaran.create'), { channel }, {
            onSuccess: () => {
                setProcessing(false)
                transitionTo(channel === 'gateway' ? 'gateway' : 'manual')
            },
            onError: () => {
                setProcessing(false)
                swalDark.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat membuat transaksi.' })
            },
        })
    }

    // ── Pay via Midtrans ──────────────────────────────────────────────────
    const handlePay = async () => {
        setProcessing(true)

        let token = livePayment?.snap_token

        if (!token) {
            try {
                const res = await axios.post(route('dashboard.pembayaran.snap-token'), {}, {
                    headers: { Accept: 'application/json' },
                })
                token = res.data.snap_token
            } catch {
                setProcessing(false)
                swalDark.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memuat payment gateway.' })
                return
            }
        }

        try {
            await ensureSnapReady()
        } catch (error: any) {
            setProcessing(false)
            const message = error?.message === 'MIDTRANS_CLIENT_KEY_MISSING'
                ? 'Konfigurasi payment gateway belum lengkap. Hubungi admin.'
                : 'Payment gateway sedang menyiapkan koneksi. Coba lagi beberapa detik lagi.'
            swalDark.fire({ icon: 'error', title: 'Payment Gateway Belum Siap', text: message })
            return
        }

        const snap = (window as any).snap
        snapPopupOpenRef.current = true
        setSnapPopupOpen(true)
        stopGatewayPolling()

        snap.pay(token, {
            onSuccess: async () => {
                setProcessing(false)
                await refreshPaymentStatus()
                finalizeSnapPopup({ delay: 250, refresh: true, waitForPopupClose: true })
            },
            onPending: async () => {
                setProcessing(false)
                await refreshPaymentStatus()
                finalizeSnapPopup({ delay: 150, refresh: true, waitForPopupClose: true })
            },
            onError:   () => {
                setProcessing(false)
                finalizeSnapPopup()
                swalDark.fire({ icon: 'error', title: 'Pembayaran Gagal', text: 'Terjadi kesalahan. Silakan coba lagi.' })
            },
            onClose: () => {
                setProcessing(false)
                finalizeSnapPopup({ refresh: true })
            },
        })
    }

    // ── Upload proof ──────────────────────────────────────────────────────
    const handleUploadProof = (file: File) => {
        setProcessing(true)
        router.post(route('dashboard.pembayaran.upload-proof'), { proof: file }, {
            onSuccess: () => { setProcessing(false); router.reload() },
            onError:   () => {
                setProcessing(false)
                swalDark.fire({
                    icon: 'error', title: 'Gagal Upload',
                    text: 'Format atau ukuran file tidak sesuai. Gunakan JPG, PNG, atau PDF maks 5MB.',
                })
            },
        })
    }

    // ── Cancel payment ────────────────────────────────────────────────────
    const handleCancel = async () => {
        if (!livePayment) return
        const result = await swalDark.fire({
            icon: 'warning',
            title: 'Batalkan Transaksi?',
            text:  'Transaksi akan dibatalkan. Kamu bisa memilih metode lain setelah ini.',
            showCancelButton:  true,
            confirmButtonText: 'Ya, Batalkan',
            cancelButtonText:  'Tidak',
        })
        if (!result.isConfirmed) return

        setCancelling(true)
        router.delete(route('dashboard.pembayaran.cancel', livePayment.id), {
            onSuccess: () => {
                setCancelling(false)
                setLivePayment(null)
                setLiveProofUrl(null)
                setLiveWhatsappUrl(null)
                stopGatewayPolling()
                transitionTo('selection', 'back')
            },
            onError:  () => setCancelling(false),
            onFinish: () => setCancelling(false),
        })
    }

    const handleBack = () => transitionTo('selection', 'back')

    const candidateInfo = {
        full_name:      candidate.full_name,
        candidate_code: candidate.candidate_code,
        admission_wave: candidate.admission_wave?.title ?? null,
        program_choice: candidate.program_choice,
    }

    const isInCheckout = pageState === 'gateway' || pageState === 'manual'

    // ─────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────

    return (
        <DashboardSplitLayout
            asideWidth="300px"
            aside={
                <PaymentSidebar
                    user={user}
                    candidateName={candidate.full_name}
                    candidateCode={candidate.candidate_code}
                    status={candidate.status}
                    programChoice={candidate.program_choice}
                    nisn={candidate.nisn}
                    schoolOrigin={candidate.school_origin}
                    motherName={candidate.mother_name}
                    wave={candidate.admission_wave}
                    payment={livePayment}
                    config={config}
                    whatsappUrl={liveWhatsappUrl}
                    baseAmount={base_amount}
                    isPaid={!!isPaid}
                />
            }
        >
            <Head title="Pembayaran" />

            <div className="space-y-5 px-4 py-6 sm:px-6">

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                    dark:bg-orange-500/15 bg-orange-100 dark:text-orange-400 text-orange-600">
                    <i className="fa-solid fa-credit-card text-sm" />
                </div>
                <div>
                    <h1 className="text-lg font-bold dark:text-slate-100 text-slate-800">Pembayaran</h1>
                    <p className="text-[11px] dark:text-slate-500 text-slate-500">
                        {candidate.admission_wave?.title ?? 'Biaya Pendaftaran'}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div ref={contentRef} style={{ opacity: 0 }} className="space-y-5">

                {/* Lifecycle gate */}
                {isPaymentLocked && (
                    <DraftGate
                        candidateName={candidate.full_name}
                        reason={gate.reason ?? undefined}
                        steps={
                            candidate.status === 'submitted'
                                ? [{ label: 'Upload Dokumen Wajib', icon: 'fa-solid fa-file-arrow-up', href: '/dashboard/data-dokumen' }]
                                : undefined
                        }
                    />
                )}

                {/* Paid */}
                {isPaid && livePayment && (
                    <PaymentSuccess
                        payment={{
                            order_id:        livePayment.order_id,
                            final_amount:    livePayment.final_amount,
                            payment_method:  livePayment.payment_method,
                            payment_channel: livePayment.payment_channel,
                            paid_at:         livePayment.paid_at,
                        }}
                    />
                )}

                {/* Submitted + belum paid */}
                {!isDraft && !isPaymentLocked && !isPaid && (
                    <>
                        {/* Narasi panduan — tampil saat di checkout, gantikan welcome */}
                        {isInCheckout && livePayment && (
                            <CheckoutNarasi channel={livePayment.payment_channel} />
                        )}

                        {/* Selection */}
                        {pageState === 'selection' && (
                            <ChannelSelection
                                baseAmount={base_amount}
                                config={config}
                                payment={livePayment}
                                onSelect={handleSelectChannel}
                                processing={processing}
                                candidateName={candidate.full_name}
                            />
                        )}

                        {/* Gateway checkout */}
                        {pageState === 'gateway' && livePayment?.payment_channel === 'gateway' && (
                            <GatewayCheckout
                                payment={livePayment}
                                candidate={candidateInfo}
                                config={config}
                                processing={processing || !snapReady}
                                cancelling={cancelling}
                                onPay={handlePay}
                                onCancel={handleCancel}
                                onBack={handleBack}
                            />
                        )}

                        {/* Manual checkout */}
                        {pageState === 'manual' && livePayment && livePayment.payment_channel !== 'gateway' && (
                            <ManualCheckout
                                payment={livePayment as any}
                                candidate={candidateInfo}
                                config={config}
                                proofUrl={liveProofUrl}
                                whatsappUrl={liveWhatsappUrl}
                                processing={processing}
                                cancelling={cancelling}
                                onUploadProof={handleUploadProof}
                                onCancel={handleCancel}
                                onBack={handleBack}
                            />
                        )}
                    </>
                )}
            </div>
            </div>{/* end px-4 py-6 sm:px-6 wrapper */}
        </DashboardSplitLayout>
    )
}
