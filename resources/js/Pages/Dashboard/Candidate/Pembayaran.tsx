// =============================================================================
// LOKASI FILE: resources/js/Pages/Dashboard/Candidate/Pembayaran.tsx
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { animate }                     from 'animejs'
import { Head, router }                from '@inertiajs/react'
import axios                           from 'axios'
import Swal                            from 'sweetalert2'
import DashboardSplitLayout            from '@/Layouts/DashboardSplitLayout'
import CandidateSidebar                from '@/Components/Dashboard/Candidate/Shared/CandidateSidebar'
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

type CandidateData = {
    full_name:           string
    nisn:                string
    nik:                 string
    gender_label:        string
    date_of_birth_label: string
    school_origin:       string
    status:              string
    program_choice:      string | null
    admission_wave:      { title: string } | null
    candidate_code:      string
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
    proof_url:     string | null
    whatsapp_url:  string | null
    base_amount:   number
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
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────

const PROGRESS_STEPS = [
    { key: 'data_diri',  label: 'Data Diri',  icon: 'fa-solid fa-id-card' },
    { key: 'kesehatan',  label: 'Kesehatan',   icon: 'fa-solid fa-heart-pulse' },
    { key: 'wali',       label: 'Wali',        icon: 'fa-solid fa-people-roof' },
    { key: 'dokumen',    label: 'Dokumen',     icon: 'fa-solid fa-file-lines' },
    { key: 'pembayaran', label: 'Pembayaran',  icon: 'fa-solid fa-credit-card' },
]

function ProgressStrip({ status }: { status: string }) {
    const isPaid      = status === 'paid'
    const isSubmitted = status === 'submitted' || isPaid

    // Kalau submitted berarti 4 step pertama sudah done
    // Kalau paid berarti semua done
    const getDoneCount = () => {
        if (isPaid)      return 5
        if (isSubmitted) return 4
        return 0
    }

    const doneCount = getDoneCount()

    return (
        <div className="mb-5 p-4 rounded-2xl border dark:border-white/[0.06] border-black/[0.06]
            dark:bg-white/[0.02] bg-white">
            <p className="text-[10px] dark:text-slate-600 text-slate-400 uppercase tracking-widest mb-3 font-semibold">
                Progress Pendaftaran
            </p>
            <div className="flex items-center gap-1.5">
                {PROGRESS_STEPS.map((step, i) => {
                    const isDone   = i < doneCount
                    const isActive = i === doneCount && i < 5
                    return (
                        <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className={`w-full h-1.5 rounded-full transition-all duration-500
                                ${isDone
                                    ? 'bg-emerald-500'
                                    : isActive
                                        ? 'bg-orange-500'
                                        : 'dark:bg-white/[0.06] bg-slate-200'
                                }`} />
                            <div className="flex flex-col items-center gap-0.5">
                                <i className={`${step.icon} text-[8px]
                                    ${isDone
                                        ? 'dark:text-emerald-500 text-emerald-600'
                                        : isActive
                                            ? 'dark:text-orange-400 text-orange-500'
                                            : 'dark:text-slate-700 text-slate-300'
                                    }`} />
                                <span className={`text-[8px] font-medium hidden sm:block
                                    ${isDone
                                        ? 'dark:text-emerald-500/70 text-emerald-600/70'
                                        : isActive
                                            ? 'dark:text-orange-400/80 text-orange-600/80 font-bold'
                                            : 'dark:text-slate-700 text-slate-300'
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

type PageState = 'selection' | 'gateway' | 'manual'

export default function PembayaranPage({
    user, candidate, payment, config, proof_url, whatsapp_url, base_amount, flash,
}: Props) {
    const [processing, setProcessing] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const contentRef                  = useRef<HTMLDivElement>(null)

    // Derive initial page state dari payment data
    const deriveState = (): PageState => {
        if (!payment) return 'selection'
        if (payment.payment_channel === 'gateway') return 'gateway'
        return 'manual'
    }

    const [pageState, setPageState] = useState<PageState>(deriveState)

    const isDraft    = candidate.status === 'draft'
    const isPaid     = payment?.status === 'paid'

    // ── Entrance animation ────────────────────────────────────────────────────
    useEffect(() => {
        if (!contentRef.current) return
        animate(contentRef.current, {
            opacity:    [0, 1],
            translateY: [12, 0],
            duration:   420,
            ease:       'outExpo',
        })
    }, [pageState])

    // ── Flash handler ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (flash?.success) {
            swalDark.fire({
                icon:              'success',
                title:             'Berhasil',
                text:              flash.success,
                timer:             2500,
                showConfirmButton: false,
                toast:             true,
                position:          'top-end',
                timerProgressBar:  true,
            })
        }
        if (flash?.error) {
            swalDark.fire({
                icon:  'error',
                title: 'Terjadi Kesalahan',
                text:  flash.error,
            })
        }
    }, [flash])

    // ── Transition helper ─────────────────────────────────────────────────────
    const transitionTo = (next: PageState, dir: 'forward' | 'back' = 'forward') => {
        const dx = dir === 'forward' ? -20 : 20
        animate(contentRef.current!, {
            opacity:    [1, 0],
            translateX: [0, dx],
            duration:   180,
            ease:       'inQuad',
        })
        setTimeout(() => {
            setPageState(next)
        }, 190)
    }

    // ── Create payment ────────────────────────────────────────────────────────
    const handleSelectChannel = (channel: 'gateway' | 'transfer' | 'cash') => {
        setProcessing(true)
        router.post(route('dashboard.pembayaran.create'), { channel }, {
            onSuccess: () => {
                setProcessing(false)
                transitionTo(channel === 'gateway' ? 'gateway' : 'manual')
            },
            onError: () => {
                setProcessing(false)
                swalDark.fire({
                    icon:  'error',
                    title: 'Gagal',
                    text:  'Terjadi kesalahan saat membuat transaksi.',
                })
            },
        })
    }

    // ── Pay via Midtrans Snap ─────────────────────────────────────────────────
    const handlePay = async () => {
        if (!payment?.snap_token) {
            // Fetch snap token dulu
            setProcessing(true)
            try {
                const res = await axios.post(route('dashboard.pembayaran.snap-token'), {}, {
                    headers: { Accept: 'application/json' },
                })
                const snapToken = res.data.snap_token
                triggerSnap(snapToken)
            } catch {
                setProcessing(false)
                swalDark.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memuat payment gateway.' })
            }
            return
        }
        triggerSnap(payment.snap_token)
    }

    const triggerSnap = (token: string) => {
        setProcessing(true)
        const snap = (window as any).snap
        if (!snap) {
            setProcessing(false)
            swalDark.fire({ icon: 'error', title: 'Error', text: 'Payment gateway belum siap. Coba muat ulang halaman.' })
            return
        }
        snap.pay(token, {
            onSuccess: () => { setProcessing(false); router.reload() },
            onPending: () => { setProcessing(false); router.reload() },
            onError:   () => {
                setProcessing(false)
                swalDark.fire({ icon: 'error', title: 'Pembayaran Gagal', text: 'Terjadi kesalahan. Silakan coba lagi.' })
            },
            onClose: () => setProcessing(false),
        })
    }

    // ── Upload proof ──────────────────────────────────────────────────────────
    const handleUploadProof = (file: File) => {
        const formData = new FormData()
        formData.append('proof', file)
        setProcessing(true)
        router.post(route('dashboard.pembayaran.upload-proof'), { proof: file }, {
            onSuccess:     () => setProcessing(false),
            onError:       () => {
                setProcessing(false)
                swalDark.fire({ icon: 'error', title: 'Gagal Upload', text: 'Format atau ukuran file tidak sesuai. Gunakan JPG, PNG, atau PDF maks 5MB.' })
            },
        })
    }

    // ── Cancel payment ────────────────────────────────────────────────────────
    const handleCancel = async () => {
        if (!payment) return
        const result = await swalDark.fire({
            icon:              'warning',
            title:             'Batalkan Transaksi?',
            text:              'Transaksi ini akan dibatalkan. Kamu bisa membuat transaksi baru dengan metode yang berbeda.',
            showCancelButton:  true,
            confirmButtonText: 'Ya, Batalkan',
            cancelButtonText:  'Tidak',
        })
        if (!result.isConfirmed) return
        setCancelling(true)
        router.delete(route('dashboard.pembayaran.cancel', payment.id), {
            onSuccess: () => {
                setCancelling(false)
                transitionTo('selection', 'back')
            },
            onError:  () => setCancelling(false),
            onFinish: () => setCancelling(false),
        })
    }

    // ── Back to selection ─────────────────────────────────────────────────────
    const handleBack = () => transitionTo('selection', 'back')

    // ─────────────────────────────────────────────────────────────────────────
    // CANDIDATE INFO untuk child components
    // ─────────────────────────────────────────────────────────────────────────

    const candidateInfo = {
        full_name:      candidate.full_name,
        candidate_code: candidate.candidate_code,
        admission_wave: candidate.admission_wave?.title ?? null,
        program_choice: candidate.program_choice,
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <DashboardSplitLayout
            aside={
                <CandidateSidebar
                    user={user}
                    candidate={candidate}
                    completion={candidate.status === 'submitted' || candidate.status === 'paid' ? 100 : 60}
                />
            }
        >
            <Head title="Pembayaran" />

            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
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

            {/* Progress strip — selalu tampil */}
            <ProgressStrip status={isPaid ? 'paid' : candidate.status} />

            {/* Content */}
            <div ref={contentRef} style={{ opacity: 0 }}>
                {/* Gate: status draft */}
                {isDraft && !isPaid && (
                    <DraftGate candidateName={candidate.full_name} />
                )}

                {/* Paid */}
                {isPaid && payment && (
                    <PaymentSuccess
                        payment={{
                            order_id:        payment.order_id,
                            final_amount:    payment.final_amount,
                            payment_method:  payment.payment_method,
                            payment_channel: payment.payment_channel,
                            paid_at:         payment.paid_at,
                        }}
                    />
                )}

                {/* Submitted + belum paid */}
                {!isDraft && !isPaid && (
                    <>
                        {/* Selection — tidak ada payment aktif, atau kembali dari checkout */}
                        {pageState === 'selection' && (
                            <ChannelSelection
                                baseAmount={base_amount}
                                config={config}
                                onSelect={handleSelectChannel}
                                processing={processing}
                                candidateName={candidate.full_name}
                            />
                        )}

                        {/* Gateway checkout */}
                        {pageState === 'gateway' && payment?.payment_channel === 'gateway' && (
                            <GatewayCheckout
                                payment={payment}
                                candidate={candidateInfo}
                                config={config}
                                processing={processing}
                                cancelling={cancelling}
                                onPay={handlePay}
                                onCancel={handleCancel}
                                onBack={handleBack}
                            />
                        )}

                        {/* Manual checkout */}
                        {pageState === 'manual' && payment && payment.payment_channel !== 'gateway' && (
                            <ManualCheckout
                                payment={payment as any}
                                candidate={candidateInfo}
                                config={config}
                                proofUrl={proof_url}
                                whatsappUrl={whatsapp_url}
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
        </DashboardSplitLayout>
    )
}