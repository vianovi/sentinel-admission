// =============================================================================
// LOKASI FILE: resources/js/Pages/Dashboard/Candidate/Pembayaran.tsx
// =============================================================================

import { useEffect, useRef, useState } from 'react'
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

export default function PembayaranPage({
    user, candidate, payment, config, proof_url, whatsapp_url, base_amount, flash,
}: Props) {
    const [processing, setProcessing] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const contentRef                  = useRef<HTMLDivElement>(null)

    const deriveState = (): PageState => {
        if (!payment || payment.status !== 'pending') return 'selection'
        if (payment.payment_channel === 'gateway') return 'gateway'
        return 'manual'
    }

    const [pageState, setPageState] = useState<PageState>(deriveState)

    const isDraft = candidate.status === 'draft'
    const isPaid  = payment?.status === 'paid'

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
        if (payment?.status === 'pending' && !payment.is_expired) {
            transitionTo(payment.payment_channel === 'gateway' ? 'gateway' : 'manual')
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

        let token = payment?.snap_token

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

    // ── Upload proof ──────────────────────────────────────────────────────
    const handleUploadProof = (file: File) => {
        setProcessing(true)
        router.post(route('dashboard.pembayaran.upload-proof'), { proof: file }, {
            onSuccess: () => setProcessing(false),
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
        if (!payment) return
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
        router.delete(route('dashboard.pembayaran.cancel', payment.id), {
            onSuccess: () => {
                setCancelling(false)
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
                    payment={payment}
                    config={config}
                    whatsappUrl={whatsapp_url}
                    baseAmount={base_amount}
                    isPaid={!!isPaid}
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

            {/* Content */}
            <div ref={contentRef} style={{ opacity: 0 }}>

                {/* Draft gate */}
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
                        {/* Narasi panduan — tampil saat di checkout, gantikan welcome */}
                        {isInCheckout && payment && (
                            <CheckoutNarasi channel={payment.payment_channel} />
                        )}

                        {/* Selection */}
                        {pageState === 'selection' && (
                            <ChannelSelection
                                baseAmount={base_amount}
                                config={config}
                                payment={payment}
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