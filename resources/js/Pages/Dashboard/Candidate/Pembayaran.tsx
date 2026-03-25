// resources/js/Pages/Dashboard/Candidate/Pembayaran.tsx

import { useEffect, useRef, useState } from 'react'
import { animate }                     from 'animejs'
import { Head, router }                from '@inertiajs/react'
import Swal                            from 'sweetalert2'
import DashboardSplitLayout            from '@/Layouts/DashboardSplitLayout'
import CandidateSidebar                from '@/Components/Dashboard/Candidate/Shared/CandidateSidebar'
import PaymentSidebar                  from '@/Components/Dashboard/Candidate/Pembayaran/PaymentSidebar'
import StateEmpty                      from '@/Components/Dashboard/Candidate/Pembayaran/StateEmpty'
import StatePending                    from '@/Components/Dashboard/Candidate/Pembayaran/StatePending'
import StatePaid                       from '@/Components/Dashboard/Candidate/Pembayaran/StatePaid'

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
}

type WaveData = {
    title:            string
    academic_year:    string
    registration_fee: number
}

type ActivePayment = {
    id:             number
    order_id:       string
    snap_token:     string | null
    amount:         number
    status:         string
    expired_at:     string | null
    payment_method: string | null
}

type PaidPayment = {
    order_id:       string
    amount:         number
    payment_method: string | null
    paid_at:        string | null
}

type Props = {
    user:           UserData
    candidate:      CandidateData
    wave:           WaveData | null
    active_payment: ActivePayment | null
    paid_payment:   PaidPayment | null
    flash?:         { success?: string }
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
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PembayaranPage({
    user, candidate, wave, active_payment, paid_payment, flash,
}: Props) {
    const [processing, setProcessing] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const contentRef                  = useRef<HTMLDivElement>(null)

    const isPaid = !!paid_payment

    // ── Entrance animation ────────────────────────────────────────────────────
    useEffect(() => {
        if (!contentRef.current) return
        animate(contentRef.current, {
            opacity:    [0, 1],
            translateY: [16, 0],
            duration:   500,
            ease:       'outExpo',
        })
    }, [active_payment?.id, isPaid])

    // ── Flash success ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (flash?.success) {
            swalDark.fire({
                icon:              'success',
                title:             'Berhasil',
                text:              flash.success,
                timer:             2000,
                showConfirmButton: false,
            })
        }
    }, [flash])

    // ── Buat transaksi baru ───────────────────────────────────────────────────
    const handleCreate = () => {
        setProcessing(true)
        router.post(route('dashboard.pembayaran.create'), {}, {
            onError:  () => setProcessing(false),
            onFinish: () => setProcessing(false),
        })
    }

    // ── Bayar — trigger Snap popup ────────────────────────────────────────────
    const handlePay = () => {
        if (!active_payment?.snap_token) return

        setProcessing(true)

        // window.snap disediakan oleh Snap.js yang di-load di app.blade.php
        const snap = (window as unknown as { snap: { pay: (token: string, opts: object) => void } }).snap
        snap.pay(active_payment.snap_token, {
            onSuccess: () => {
                setProcessing(false)
                router.reload()
            },
            onPending: () => {
                setProcessing(false)
                router.reload()
            },
            onError: () => {
                setProcessing(false)
                swalDark.fire({
                    icon:  'error',
                    title: 'Pembayaran Gagal',
                    text:  'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.',
                })
            },
            onClose: () => {
                setProcessing(false)
            },
        })
    }

    // ── Cancel transaksi ──────────────────────────────────────────────────────
    const handleCancel = async () => {
        if (!active_payment) return

        const result = await swalDark.fire({
            icon:              'warning',
            title:             'Batalkan Transaksi?',
            text:              'Transaksi ini akan dibatalkan dan kamu bisa membuat transaksi baru dengan metode berbeda.',
            showCancelButton:  true,
            confirmButtonText: 'Ya, Batalkan',
            cancelButtonText:  'Tidak',
        })

        if (!result.isConfirmed) return

        setCancelling(true)
        router.delete(route('dashboard.pembayaran.cancel', active_payment.id), {
            onError:  () => setCancelling(false),
            onFinish: () => setCancelling(false),
        })
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <DashboardSplitLayout
            aside={
                <PaymentSidebar
                    user={user}
                    candidate={candidate}
                    isPaid={isPaid}
                />
            }
        >
            <Head title="Pembayaran" />

            {/* Mobile: progress strip */}
            <div className="lg:hidden mb-4">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">Progress Pendaftaran</p>
                    <div className="flex gap-1.5">
                        {['Data', 'Kesehatan', 'Wali', 'Dokumen', 'Bayar', 'Status'].map((label, i) => {
                            const isDone   = i < 4 || isPaid
                            const isActive = i === 4 && !isPaid
                            return (
                                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                                    <div className={`h-1 w-full rounded-full transition-colors duration-300 ${
                                        isDone   ? 'bg-emerald-400' :
                                        isActive ? 'bg-gold' :
                                        'bg-white/10'
                                    }`} />
                                    <span className={`text-[9px] ${
                                        isDone   ? 'text-emerald-400/60' :
                                        isActive ? 'text-gold font-semibold' :
                                        'text-slate-700'
                                    }`}>{label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="mb-4">
                <p className="text-[10px] text-gold font-semibold uppercase tracking-widest">Pembayaran</p>
                <h1 className="text-lg font-bold text-white mt-1">Biaya Pendaftaran</h1>
                {wave && (
                    <p className="text-xs text-slate-500 mt-0.5">{wave.title} · {wave.academic_year}</p>
                )}
            </div>

            {/* Flash error */}
            {flash?.success && (
                <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                    <i className="fa-solid fa-circle-check text-emerald-400"></i>
                    <p className="text-sm font-semibold text-emerald-300">{flash.success}</p>
                </div>
            )}

            {/* Content — switch state */}
            <div ref={contentRef}>
                {isPaid ? (
                    <StatePaid payment={paid_payment!} />
                ) : active_payment ? (
                    <StatePending
                        payment={active_payment}
                        processing={processing}
                        cancelling={cancelling}
                        onPay={handlePay}
                        onCancel={handleCancel}
                    />
                ) : (
                    <StateEmpty
                        wave={wave}
                        processing={processing}
                        onCreateTransaction={handleCreate}
                    />
                )}
            </div>

        </DashboardSplitLayout>
    )
}
