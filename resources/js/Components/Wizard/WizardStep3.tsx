import { useEffect, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import { animate, stagger } from 'animejs'
import axios from 'axios'
import { useWizardStorage } from './useWizardStorage'
import type { Step1Data } from './WizardStep1'
import type { Step2Data } from './WizardStep2'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Step3Data {
    school_origin: string
}

interface WizardStep3Props {
    step1: Step1Data
    step2: Step2Data
    data: Step3Data
    draftId: string
    onChange: (data: Step3Data) => void
    onBack: () => void
    onGoToStep1: () => void
    onInvalidDraft: () => void  // dipanggil kalau draft sudah tidak valid
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toTitleCase = (s: string) =>
    s.toLowerCase().split(' ').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ')

const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between gap-3">
        <span className="text-slate-500 flex-shrink-0 text-xs sm:text-sm">{label}</span>
        <span className="font-semibold text-slate-900 text-right text-xs sm:text-sm break-all">{value || '-'}</span>
    </div>
)

// ─── Component ────────────────────────────────────────────────────────────────

export default function WizardStep3({
    step1, step2, data, draftId, onChange, onBack, onGoToStep1, onInvalidDraft,
}: WizardStep3Props) {

    const [agreement, setAgreement]           = useState(false)
    const [errors, setErrors]                 = useState<Record<string, string>>({})
    const [submitting, setSubmitting]         = useState(false)
    const [finalizing, setFinalizing]         = useState(false)
    const [finalizeError, setFinalizeError]   = useState<string | null>(null)

    // Registration code — di-load saat mount via initStep3
    const [registrationCode, setRegCode]      = useState<string | null>(null)
    const [loadingCode, setLoadingCode]       = useState(true)
    const [loadCodeError, setLoadCodeError]   = useState<string | null>(null)

    const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const initCalled    = useRef(false)

    useWizardStorage('step3', data)

    // ── Auto-call initStep3 saat mount ────────────────────────────────────────
    useEffect(() => {
        if (initCalled.current) return
        initCalled.current = true

        // Guard — kalau draftId kosong, langsung kembali ke step 1
        // Seharusnya tidak terjadi di flow normal, tapi safety net tetap perlu
        if (!draftId) {
            onInvalidDraft()
            return
        }

        const init = async () => {
            const startTime = Date.now()
            try {
                const { data: res } = await axios.put<{ registration_code: string }>(`/daftar/step3/init/${draftId}`)
                setRegCode(res.registration_code)

                // Minimum loading 800ms agar user sempat baca "Menyiapkan kode..."
                const elapsed = Date.now() - startTime
                const remaining = Math.max(0, 800 - elapsed)

                setTimeout(() => {
                    setLoadingCode(false)
                    setTimeout(() => {
                        animate('.reg-code-card', {
                            opacity: [0, 1],
                            translateY: [8, 0],
                            duration: 400,
                            ease: 'outExpo',
                        })
                    }, 50)
                }, remaining)
            } catch (err: any) {
                // 403 = cookie ownership tidak valid, draft expired, atau draft tidak ada.
                // → clear localStorage + kembali ke step 1
                if (err.response?.status === 403) {
                    onInvalidDraft()
                    return
                }
                // Error lain (network, dll) → tampilkan pesan error
                setLoadCodeError('Gagal memuat kode pendaftaran. Coba kembali ke langkah 2.')
                setLoadingCode(false)
            }
        }

        init()
    }, [draftId])

    useEffect(() => {
        animate('.s3-card', {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            delay: stagger(100, { start: 80 }),
            ease: 'outExpo',
        })
        return () => { if (redirectTimer.current) clearTimeout(redirectTimer.current) }
    }, [])

    // ── Computed alamat ───────────────────────────────────────────────────────
    const addressFull = [
        step2.addr_jalan,
        step2.addr_rt && step2.addr_rw
            ? `RT ${step2.addr_rt}/RW ${step2.addr_rw}`
            : step2.addr_rt ? `RT ${step2.addr_rt}` : '',
        step2.addr_desa,
        step2.addr_kec ? `Kec. ${step2.addr_kec}` : '',
        step2.addr_kab,
        step2.addr_prov,
    ].filter(Boolean).join(', ')

    // ── Validate ──────────────────────────────────────────────────────────────
    const validate = (): boolean => {
        const e: Record<string, string> = {}
        if (!data.school_origin.trim()) e.school_origin = 'Asal sekolah wajib diisi.'
        if (!agreement)                 e.agreement     = 'Kamu harus menyetujui pernyataan data benar.'
        setErrors(e)
        if (Object.keys(e).length > 0) {
            animate('.s3-submit', { translateX: [0, -8, 8, -6, 6, 0], duration: 420, ease: 'outExpo' })
            setTimeout(() => animate('.s3-scope .input-error', { translateX: [0, -6, 6, -4, 4, 0], duration: 380, ease: 'outExpo' }), 50)
        }
        return Object.keys(e).length === 0
    }

    // ── Submit: simpan school_origin lalu redirect ────────────────────────────
    const handleSubmit = async () => {
        if (!validate()) return
        setFinalizing(true)
        setFinalizeError(null)

        try {
            await axios.put(`/daftar/step3/${draftId}`, {
                school_origin: data.school_origin.trim(),
                agreement:     '1',
            })

            setFinalizing(false)
            setSubmitting(true)

            // Delay 2.5 detik — beri waktu user baca redirect screen
            // localStorage dibersihkan di RegisterController setelah login
            redirectTimer.current = setTimeout(() => {
                router.visit('/register')
            }, 2500)

        } catch (err: any) {
            setFinalizing(false)
            if (err.response?.status === 403) {
                onInvalidDraft()
                return
            }
            const errs = err.response?.data?.errors as Record<string, string[]> | undefined
            const msg  = err.response?.data?.message as string | undefined
            if (errs) {
                const mapped: Record<string, string> = {}
                Object.entries(errs).forEach(([k, v]) => { mapped[k] = v[0] })
                setErrors(mapped)
            } else {
                setFinalizeError(msg ?? 'Terjadi kesalahan. Coba lagi.')
            }
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="s3-scope">

            {/* ── Redirect screen — tampil saat submitting, durasi 2.5 detik ── */}
            {submitting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-6 px-8 text-center max-w-sm">
                        {/* Spinner + icon */}
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-4 border-gold/20 border-t-gold animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <i className="fa-solid fa-shield-halved text-gold text-2xl"></i>
                            </div>
                        </div>

                        {/* Kode pendaftaran */}
                        {registrationCode && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 w-full">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                                    Kode Pendaftaran Kamu
                                </p>
                                <p className="font-display font-extrabold text-gold text-xl tracking-[0.1em]">
                                    {registrationCode}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1.5">
                                    Simpan kode ini baik-baik
                                </p>
                            </div>
                        )}

                        {/* Pesan */}
                        <div>
                            <p className="text-white font-semibold text-sm mb-1">
                                Data kamu sudah tersimpan!
                            </p>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Kami sedang menyiapkan halaman pembuatan akun
                                berdasarkan data pendaftaranmu...
                            </p>
                        </div>

                        {/* Progress dots */}
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-gold"
                                    style={{
                                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="s3-card opacity-0 mb-5 sm:mb-8 border-b border-slate-200 pb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 leading-tight">
                        Review &amp; Lanjut Registrasi
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Pastikan semua data sudah benar sebelum membuat akun.
                    </p>
                </div>
                <button type="button" onClick={onGoToStep1}
                    className="flex items-center gap-1.5 sm:gap-2 text-slate-500 hover:text-navy transition group flex-shrink-0">
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition">
                        <i className="fa-solid fa-pen-to-square text-xs sm:text-sm"></i>
                    </span>
                    <span className="hidden sm:inline text-xs font-bold">Edit Data</span>
                </button>
            </div>

            {/* ── Kode Pendaftaran Card ── */}
            <div className="s3-card opacity-0 mb-4 sm:mb-5">
                {loadingCode ? (
                    // Loading state
                    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm flex items-center gap-3">
                        <i className="fa-solid fa-spinner fa-spin text-gold text-lg flex-shrink-0"></i>
                        <div className="text-sm text-slate-500">Menyiapkan kode pendaftaran...</div>
                    </div>
                ) : loadCodeError ? (
                    // Error state
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                        <i className="fa-solid fa-triangle-exclamation text-red-500 flex-shrink-0"></i>
                        <p className="text-sm text-red-700">{loadCodeError}</p>
                    </div>
                ) : (
                    // Kode tampil
                    <div className="reg-code-card opacity-0 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
                                    Kode Pendaftaran
                                </div>
                                <div className="font-display font-extrabold text-navy text-base sm:text-lg tracking-[0.08em] break-all">
                                    {registrationCode}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 flex-shrink-0">
                                <i className="fa-solid fa-shield-halved text-emerald-500 text-xs"></i>
                                <span className="text-[11px] font-semibold text-emerald-700 hidden sm:inline">
                                    Aman &amp; Terverifikasi
                                </span>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                            Demi keamanan, simpan kode ini. Kode aktif otomatis setelah akun berhasil dibuat.
                        </p>
                    </div>
                )}
            </div>

            {/* Status tersimpan */}
            <div className="s3-card opacity-0 mb-4 sm:mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 sm:p-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-check text-white text-[11px]"></i>
                </div>
                <div>
                    <div className="font-bold text-emerald-800 text-sm">Data Berhasil Disimpan</div>
                    <p className="text-xs text-emerald-700 mt-0.5">
                        Identitas dan kontak tersimpan. Lengkapi asal sekolah di bawah lalu klik Lanjut.
                    </p>
                </div>
            </div>

            {/* Preview Data */}
            <div className="s3-card opacity-0 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <i className="fa-solid fa-id-card text-gold"></i> Identitas
                    </h4>
                    <div className="space-y-2">
                        <Row label="Nama"          value={step1.full_name} />
                        <Row label="NISN"          value={step1.nisn} />
                        <Row label="NIK"           value={step1.nik} />
                        <Row label="Jenis Kelamin" value={step1.gender === 'L' ? 'Laki-laki' : step1.gender === 'P' ? 'Perempuan' : '-'} />
                        <Row label="Tempat Lahir"  value={step1.place_of_birth} />
                        <Row label="Tanggal Lahir" value={step1.date_of_birth} />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <i className="fa-solid fa-location-dot text-gold"></i> Kontak &amp; Alamat
                    </h4>
                    <div className="space-y-2">
                        <Row label="Nama Ibu" value={step2.mother_name} />
                        <Row label="WhatsApp" value={step2.whatsapp_number} />
                        <Row label="Email"    value={step2.email} />
                        <div className="pt-1">
                            <div className="text-xs sm:text-sm text-slate-500 mb-1">Alamat</div>
                            <p className="font-semibold text-slate-900 text-xs leading-relaxed">{addressFull || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Asal Sekolah + Agreement */}
            <div className="s3-card opacity-0 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4 mb-4 sm:mb-5">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                    <i className="fa-solid fa-school text-gold"></i> Data Tambahan
                </h4>
                <div>
                    <label className="label">Asal Sekolah <span className="text-rose-500">*</span></label>
                    <input type="text" value={data.school_origin} autoComplete="organization"
                        onChange={e => {
                            onChange({ ...data, school_origin: e.target.value })
                            if (errors.school_origin) setErrors(p => ({ ...p, school_origin: '' }))
                        }}
                        onBlur={e => onChange({ ...data, school_origin: toTitleCase(e.target.value) })}
                        placeholder="Contoh: SMP Negeri 3 Semarang"
                        className={`input-field ${errors.school_origin ? 'input-error' : ''}`}
                    />
                    <p className="hint">Tulis nama sekolah terakhir secara lengkap.</p>
                    {errors.school_origin && <span className="error-text">{errors.school_origin}</span>}
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input type="checkbox" checked={agreement}
                        onChange={e => {
                            setAgreement(e.target.checked)
                            if (errors.agreement) setErrors(p => ({ ...p, agreement: '' }))
                        }}
                        className="mt-1 w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 accent-navy flex-shrink-0"
                    />
                    <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                            Saya menyatakan data yang saya isi adalah benar.
                        </div>
                        <div className="text-[11px] sm:text-xs text-slate-500 mt-1">
                            Setelah lanjut, kamu akan diarahkan ke halaman pembuatan akun.
                        </div>
                    </div>
                </label>
                {errors.agreement && <span className="error-text">{errors.agreement}</span>}
            </div>

            {finalizeError && (
                <div className="s3-card opacity-0 mb-4 bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-r-xl text-sm text-red-800 flex gap-3">
                    <i className="fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0"></i>
                    <div><div className="font-semibold mb-0.5">Gagal</div><p>{finalizeError}</p></div>
                </div>
            )}

            {/* Footer */}
            <div className="s3-card opacity-0 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <button type="button" onClick={onBack}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-navy transition group">
                    <span className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center group-hover:border-gold group-hover:text-gold transition">
                        <i className="fa-solid fa-arrow-left text-[11px]"></i>
                    </span>
                    <span>Kembali ke Langkah 2</span>
                </button>

                <button type="button" onClick={handleSubmit}
                    disabled={finalizing || submitting || loadingCode || !!loadCodeError}
                    className="s3-submit w-full sm:w-auto bg-navy hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed text-white px-7 sm:px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 transition hover:-translate-y-0.5 active:scale-95"
                >
                    {finalizing || submitting
                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
                        : <><i className="fa-solid fa-arrow-right"></i> Lanjut &amp; Buat Akun</>
                    }
                </button>
            </div>
        </div>
    )
}
