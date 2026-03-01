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
    step1, step2, data, draftId, onChange, onBack, onGoToStep1,
}: WizardStep3Props) {

    // ── State ─────────────────────────────────────────────────────────────────
    const [agreement, setAgreement]         = useState(false)
    const [errors, setErrors]               = useState<Record<string, string>>({})
    const [submitting, setSubmitting]       = useState(false)
    const [registrationCode, setRegCode]    = useState<string | null>(null)
    const [finalizing, setFinalizing]       = useState(false)
    const [finalizeError, setFinalizeError] = useState<string | null>(null)

    // Auto-save step3 data ke localStorage
    useWizardStorage('step3', data)

    // ── Computed ──────────────────────────────────────────────────────────────
    const addrDetail = step2
    const addressFull = [
        addrDetail.addr_jalan,
        addrDetail.addr_rt && addrDetail.addr_rw
            ? `RT ${addrDetail.addr_rt}/RW ${addrDetail.addr_rw}`
            : addrDetail.addr_rt ? `RT ${addrDetail.addr_rt}` : '',
        addrDetail.addr_desa,
        addrDetail.addr_kec ? `Kec. ${addrDetail.addr_kec}` : '',
        addrDetail.addr_kab,
        addrDetail.addr_prov,
    ].filter(Boolean).join(', ')

    // ── Entrance animation ────────────────────────────────────────────────────
    useEffect(() => {
        animate('.s3-card', {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            delay: stagger(100, { start: 80 }),
            ease: 'outExpo',
        })
    }, [])

    // ── Validate & submit ─────────────────────────────────────────────────────
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

    const handleSubmit = async () => {
        if (!validate()) return
        setFinalizing(true)
        setFinalizeError(null)

        try {
            // Finalisasi draft: generate registration_code + secret_token + expires_at
            const { data: res } = await axios.put(`/daftar/step3/${draftId}`, {
                school_origin: data.school_origin.trim(),
                agreement:     '1',
            })

            setRegCode(res.registration_code)
            setFinalizing(false)

            // Animate kode pendaftaran muncul
            setTimeout(() => {
                animate('.reg-code-card', {
                    opacity: [0, 1],
                    scale:   [0.95, 1],
                    duration: 450,
                    ease: 'outBack',
                })
            }, 50)

            // Setelah 1.5 detik redirect ke /register
            setTimeout(() => {
                setSubmitting(true)
                router.visit('/register')
            }, 1500)

        } catch (err: any) {
            setFinalizing(false)
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

    // ── Render saat sudah dapat registration_code ─────────────────────────────
    if (registrationCode) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="reg-code-card opacity-0 bg-white border border-slate-200 rounded-2xl shadow-lg p-8 max-w-sm w-full">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-check text-emerald-500 text-2xl"></i>
                    </div>
                    <h3 className="font-display font-bold text-xl text-slate-900 mb-1">Pendaftaran Berhasil!</h3>
                    <p className="text-sm text-slate-500 mb-5">Kode pendaftaran kamu:</p>
                    <div className="bg-slate-900 rounded-xl px-6 py-4 mb-4">
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Kode Pendaftaran</div>
                        <div className="text-2xl font-extrabold text-gold font-display tracking-[0.12em]">
                            {registrationCode}
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Simpan kode ini. Kode akan aktif otomatis setelah akun dibuat.
                        Mengarahkan ke halaman buat akun...
                    </p>
                    <div className="mt-4 flex justify-center">
                        <i className="fa-solid fa-spinner fa-spin text-gold text-xl"></i>
                    </div>
                </div>
            </div>
        )
    }

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <div className="s3-scope">

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
                <button
                    type="button"
                    onClick={onGoToStep1}
                    className="flex items-center gap-1.5 sm:gap-2 text-slate-500 hover:text-navy transition group flex-shrink-0"
                >
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition">
                        <i className="fa-solid fa-pen-to-square text-xs sm:text-sm"></i>
                    </span>
                    <span className="hidden sm:inline text-xs font-bold">Edit Data</span>
                </button>
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
                {/* Identitas */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <i className="fa-solid fa-id-card text-gold"></i> Identitas
                    </h4>
                    <div className="space-y-2">
                        <Row label="Nama"           value={step1.full_name} />
                        <Row label="NISN"           value={step1.nisn} />
                        <Row label="NIK"            value={step1.nik} />
                        <Row label="Jenis Kelamin"  value={step1.gender === 'L' ? 'Laki-laki' : step1.gender === 'P' ? 'Perempuan' : '-'} />
                        <Row label="Tempat Lahir"   value={step1.place_of_birth} />
                        <Row label="Tanggal Lahir"  value={step1.date_of_birth} />
                    </div>
                </div>

                {/* Kontak & Alamat */}
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
                    <label className="label">
                        Asal Sekolah <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.school_origin}
                        autoComplete="organization"
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
                    <input
                        type="checkbox"
                        checked={agreement}
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
                            Kode pendaftaran akan aktif otomatis setelah akun berhasil dibuat.
                        </div>
                    </div>
                </label>
                {errors.agreement && <span className="error-text">{errors.agreement}</span>}
            </div>

            {/* Fatal error */}
            {finalizeError && (
                <div className="s3-card opacity-0 mb-4 bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-r-xl text-sm text-red-800 flex gap-3">
                    <i className="fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0"></i>
                    <div><div className="font-semibold mb-0.5">Gagal</div><p>{finalizeError}</p></div>
                </div>
            )}

            {/* Footer */}
            <div className="s3-card opacity-0 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-navy transition group"
                >
                    <span className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center group-hover:border-gold group-hover:text-gold transition">
                        <i className="fa-solid fa-arrow-left text-[11px]"></i>
                    </span>
                    <span>Kembali ke Langkah 2</span>
                </button>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={finalizing || submitting}
                    className="s3-submit w-full sm:w-auto bg-navy hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed text-white px-7 sm:px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 transition hover:-translate-y-0.5 active:scale-95"
                >
                    {finalizing
                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
                        : submitting
                            ? <><i className="fa-solid fa-spinner fa-spin"></i> Mengarahkan...</>
                            : <><i className="fa-solid fa-arrow-right"></i> Lanjut &amp; Buat Akun</>
                    }
                </button>
            </div>
        </div>
    )
}
