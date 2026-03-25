// resources/js/Components/Dashboard/Candidate/Pembayaran/PaymentSidebar.tsx

type Props = {
    user: {
        name:       string
        avatar_url: string | null
        initials:   string
    }
    candidate: {
        full_name:      string
        program_choice: string | null
        admission_wave: { title: string } | null
        status:         string
    }
    isPaid: boolean
}

const TIPS = [
    { icon: 'fa-qrcode',        text: 'QRIS bisa dibayar dari semua e-wallet & mobile banking.' },
    { icon: 'fa-clock',         text: 'Transaksi berlaku 24 jam. Lewat dari itu, buat transaksi baru.' },
    { icon: 'fa-rotate-right',  text: 'Mau ganti metode? Batalkan dulu transaksi aktif.' },
    { icon: 'fa-shield-halved', text: 'Pembayaran diproses aman melalui Midtrans.' },
    { icon: 'fa-receipt',       text: 'Simpan bukti pembayaran setelah transaksi berhasil.' },
]

const STEPS = [
    { label: 'Data Diri',    done: true  },
    { label: 'Kesehatan',    done: true  },
    { label: 'Data Wali',    done: true  },
    { label: 'Dokumen',      done: true  },
    { label: 'Pembayaran',   done: false, active: true },
    { label: 'Status',       done: false },
]

export default function PaymentSidebar({ user, candidate, isPaid }: Props) {
    return (
        <div className="flex flex-col gap-4 h-full">

            {/* ── Info kandidat ───────────────────────────────── */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-4">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-gold/30" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold text-sm font-bold">
                            {user.initials}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{candidate.full_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                            {candidate.admission_wave?.title ?? 'Belum ada gelombang'}
                        </p>
                    </div>
                </div>

                {candidate.program_choice && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gold/5 border border-gold/10 rounded-xl">
                        <i className="fa-solid fa-graduation-cap text-gold text-xs"></i>
                        <span className="text-xs text-gold/80">{candidate.program_choice}</span>
                    </div>
                )}
            </div>

            {/* ── Progress pendaftaran ─────────────────────────── */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">Progress</p>
                <div className="flex flex-col gap-2.5">
                    {STEPS.map((step) => {
                        const isDone   = step.done || (step.active && isPaid)
                        const isActive = step.active && !isPaid
                        return (
                            <div key={step.label} className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
                                    isDone   ? 'bg-emerald-400' :
                                    isActive ? 'bg-gold animate-pulse' :
                                    'bg-white/10'
                                }`} />
                                <span className={`text-xs transition-colors duration-300 ${
                                    isDone   ? 'text-emerald-400/70' :
                                    isActive ? 'text-gold font-semibold' :
                                    'text-slate-600'
                                }`}>{step.label}</span>
                                {isDone && (
                                    <i className="fa-solid fa-check text-[8px] text-emerald-400/70 ml-auto"></i>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Tips pembayaran ──────────────────────────────── */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex-1">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">Tips Pembayaran</p>
                <div className="flex flex-col gap-3">
                    {TIPS.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-gold/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i className={`fa-solid ${tip.icon} text-gold/60 text-[10px]`}></i>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{tip.text}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    )
}
