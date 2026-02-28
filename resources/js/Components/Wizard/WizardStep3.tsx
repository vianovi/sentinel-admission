import { useEffect, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import { animate, stagger } from 'animejs'
import axios from 'axios'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step1Data {
    full_name: string
    nisn: string
    gender: 'L' | 'P' | ''
    place_of_birth: string
    date_of_birth: string
}

interface Step2Data {
    mother_name: string
    whatsapp_number: string
    email: string
    phone_number: string
    addr_jalan: string
    addr_rt: string
    addr_rw: string
    addr_desa: string
    addr_kec: string
    addr_kab: string
    addr_prov: string
}

interface WizardStep3Props {
    step1: Step1Data
    step2: Step2Data
    waveId?: number        // disiapkan untuk filter gelombang di masa depan
    onBack: () => void     // kembali ke step 2
    onGoToStep1: () => void  // tombol "Edit Data" → step 1
}

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

// ─── Helpers (outside component) ─────────────────────────────────────────────

const toTitleCase = (s: string) =>
    s.toLowerCase().split(' ').filter(Boolean)
        .map(w => w[0].toUpperCase() + w.slice(1)).join(' ')

/**
 * Build RT/RW string only when at least one value exists.
 * Prevents "RT /RW " artifact when fields are empty.
 */
const formatRtRw = (rt: string, rw: string): string => {
    if (rt && rw) return `RT ${rt}/RW ${rw}`
    if (rt)       return `RT ${rt}`
    if (rw)       return `RW ${rw}`
    return ''
}

/** Review table row */
const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between gap-2">
        <span className="text-slate-500 flex-shrink-0 text-xs sm:text-sm">{label}</span>
        <span className="font-semibold text-slate-900 text-right text-xs sm:text-sm break-all">
            {value || '-'}
        </span>
    </div>
)

// ─── Component ────────────────────────────────────────────────────────────────

export default function WizardStep3({
    step1,
    step2,
    onBack,
    onGoToStep1,
}: WizardStep3Props) {

    // ── State ─────────────────────────────────────────────────────────────────

    const [schoolOrigin, setSchoolOrigin] = useState('')
    const [agreement, setAgreement]       = useState(false)
    const [errors, setErrors]             = useState<Record<string, string>>({})
    const [submitting, setSubmitting]     = useState(false)

    // Kode pendaftaran — null sebelum save pertama berhasil
    const [registrationCode, setRegistrationCode] = useState<string | null>(null)

    // Status loading awal (blocking spinner)
    const [loading, setLoading]       = useState(true)
    const [fatalError, setFatalError] = useState<string | null>(null)

    // Status sinkronisasi background (debounce save)
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

    // ── Refs ──────────────────────────────────────────────────────────────────

    // Cegah double-fire di React StrictMode
    const savedRef = useRef(false)

    // Ref ke props terbaru — aman dipakai di debounce callback tanpa stale closure
    const step1Ref = useRef(step1)
    const step2Ref = useRef(step2)
    step1Ref.current = step1
    step2Ref.current = step2

    // Ref ke registrationCode untuk pengecekan di performSave tanpa stale closure
    const registrationCodeRef = useRef<string | null>(null)

    // Debounce timer
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Computed ──────────────────────────────────────────────────────────────

    const addressFull = [
        step2.addr_jalan,
        formatRtRw(step2.addr_rt, step2.addr_rw),
        step2.addr_desa,
        step2.addr_kec ? `Kec. ${step2.addr_kec}` : '',
        step2.addr_kab,
        step2.addr_prov,
    ].filter(Boolean).join(', ')

    // ── performSave ───────────────────────────────────────────────────────────
    //
    // Satu fungsi untuk semua POST ke /daftar/save-draft.
    // Selalu kirim semua data (bukan partial) — Laravel handle insert/update
    // via cookie draft_token (HttpOnly, diset oleh backend).
    //
    // CSRF: axios dikonfigurasi Laravel (bootstrap.js) untuk membaca cookie
    // XSRF-TOKEN dan menyertakan header X-XSRF-TOKEN secara otomatis.
    //
    // `isInitial`: true → ganti state loading; false → ganti state syncStatus

    const performSave = async (currentSchoolOrigin: string, isInitial = false) => {
        if (!isInitial) setSyncStatus('syncing')

        try {
            const { data: res } = await axios.post('/daftar/save-draft', {
                full_name:       step1Ref.current.full_name,
                nisn:            step1Ref.current.nisn,
                gender:          step1Ref.current.gender,
                place_of_birth:  step1Ref.current.place_of_birth,
                date_of_birth:   step1Ref.current.date_of_birth,
                mother_name:     step2Ref.current.mother_name,
                whatsapp_number: step2Ref.current.whatsapp_number,
                email:           step2Ref.current.email,
                phone_number:    step2Ref.current.phone_number || null,
                addr_jalan:      step2Ref.current.addr_jalan,
                addr_rt:         step2Ref.current.addr_rt,
                addr_rw:         step2Ref.current.addr_rw,
                addr_desa:       step2Ref.current.addr_desa,
                addr_kec:        step2Ref.current.addr_kec,
                addr_kab:        step2Ref.current.addr_kab,
                addr_prov:       step2Ref.current.addr_prov,
                // school_origin null saat pertama masuk, diisi saat user mengetik
                school_origin:   currentSchoolOrigin.trim() || null,
            })

            // Set registrationCode hanya sekali — kode tidak berubah saat update
            if (registrationCodeRef.current === null) {
                registrationCodeRef.current = res.registration_code
                setRegistrationCode(res.registration_code)
            }

            if (isInitial) {
                setLoading(false)
                // Entrance animation setelah form tampil
                setTimeout(() => {
                    animate('.s3-card', {
                        opacity: [0, 1],
                        translateY: [20, 0],
                        duration: 500,
                        delay: stagger(100),
                        ease: 'outExpo',
                    })
                }, 50)
            } else {
                setSyncStatus('synced')
                // Reset badge "Tersimpan" ke idle setelah 3 detik
                setTimeout(() => setSyncStatus('idle'), 3000)
            }

        } catch (err) {
            const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
            const errs = data?.errors
            const msg  = data?.message
                ?? (errs ? Object.values(errs)?.[0]?.[0] : undefined)
                ?? 'Gagal menyimpan data.'

            if (isInitial) {
                setFatalError(String(msg))
                setLoading(false)
            } else {
                setSyncStatus('error')
            }
        }
    }

    // ── Initial save saat masuk step 3 ───────────────────────────────────────

    useEffect(() => {
        if (savedRef.current) return
        savedRef.current = true
        performSave('', true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Cleanup debounce saat unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
        }
    }, [])

    // ── Handler school_origin + debounce save ─────────────────────────────────

    const handleSchoolOriginChange = (value: string) => {
        setSchoolOrigin(value)
        if (errors.school_origin) setErrors(p => ({ ...p, school_origin: '' }))

        // Hanya debounce jika draft sudah ada (initial save selesai)
        if (registrationCodeRef.current !== null) {
            setSyncStatus('syncing')
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
            debounceTimer.current = setTimeout(() => {
                performSave(value)
            }, 800)
        }
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    //
    // Mengirim school_origin ke /daftar/submit.
    // Backend akan mengikat registration_code ke secret_token (verifikasi resmi).

    const handleSubmit = () => {
        const e: Record<string, string> = {}
        if (!schoolOrigin.trim()) e.school_origin = 'Asal sekolah wajib diisi.'
        if (!agreement)           e.agreement     = 'Kamu harus menyetujui pernyataan data benar.'
        setErrors(e)

        if (Object.keys(e).length > 0) {
            animate('.s3-submit', { translateX: [0, -8, 8, -6, 6, 0], duration: 420, ease: 'outExpo' })
            setTimeout(() => {
                animate('.s3-scope .input-error', {
                    translateX: [0, -6, 6, -4, 4, 0],
                    duration: 380,
                    ease: 'outExpo',
                })
            }, 50)
            return
        }

        setSubmitting(true)
        router.post(
            '/daftar/submit',
            { school_origin: schoolOrigin.trim() },
            { onError: () => setSubmitting(false) }
        )
    }

    // ── Loading state ─────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin"></div>
                <p className="text-slate-500 text-sm font-medium">Menyimpan data pendaftaran...</p>
            </div>
        )
    }

    // ── Fatal error state ─────────────────────────────────────────────────────

    if (fatalError) {
        return (
            <div className="py-10">
                <div className="bg-red-50 border-l-4 border-red-500 px-4 py-4 rounded-r-xl text-sm text-red-800 mb-6">
                    <div className="font-bold mb-1 flex items-center gap-2">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        Gagal Menyimpan Data
                    </div>
                    <p>{fatalError}</p>
                </div>
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-navy transition"
                >
                    <i className="fa-solid fa-arrow-left"></i> Kembali &amp; Periksa Data
                </button>
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
                        Pastikan data sudah benar sebelum membuat akun.
                    </p>
                </div>
                {/*
                    Tombol "Edit Data" → onGoToStep1 (step 1, bukan step 2)
                    Sesuai permintaan: kembali ke step 1 untuk edit identitas
                */}
                <button
                    type="button"
                    onClick={onGoToStep1}
                    className="text-slate-500 font-bold text-xs sm:text-sm hover:text-navy transition flex items-center gap-1.5 sm:gap-2 group flex-shrink-0"
                >
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition">
                        <i className="fa-solid fa-pen-to-square text-xs sm:text-sm"></i>
                    </span>
                    <span className="hidden sm:inline">Edit Data</span>
                </button>
            </div>

            {/* Status tersimpan */}
            <div className="s3-card opacity-0 mb-4 sm:mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 sm:p-4 flex items-start gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fa-solid fa-check text-white text-[11px]"></i>
                </div>
                <div>
                    <div className="font-bold text-emerald-800 text-sm">Data Berhasil Disimpan</div>
                    <p className="text-xs text-emerald-700 mt-0.5">
                        Identitas dan kontak tersimpan. Lengkapi asal sekolah di bawah.
                    </p>
                </div>
            </div>

            {/* ── Kode Pendaftaran ───────────────────────────────────────────
             *
             * Status "Belum Terverifikasi":
             *   Kode ini bersifat sementara — sudah tersimpan di sistem, tapi
             *   BELUM aktif. Kode akan resmi terverifikasi hanya setelah user
             *   klik "Lanjut Buat Akun" dan menyelesaikan proses pembuatan akun.
             *
             *   Mekanisme verifikasi:
             *   Saat submit → backend generate secret_token dan mengikat token
             *   tersebut ke registration_code ini. Ikatan itulah yang membuat
             *   kode menjadi "terverifikasi" dan sah digunakan.
             */}
            <div className="s3-card opacity-0 mb-4 sm:mb-5 bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                Kode Pendaftaran
                            </div>
                            {/* Badge status sementara */}
                            <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                                <i className="fa-solid fa-clock text-[8px]"></i>
                                Belum Terverifikasi
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-[0.12em]">
                            {registrationCode}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                            <i className="fa-solid fa-circle-info text-amber-400 mr-1"></i>
                            Kode ini <strong className="text-slate-300">baru aktif</strong> setelah kamu selesai membuat akun.
                            Simpan kode ini sebagai referensi pendaftaran.
                        </p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                        <i className="fa-solid fa-shield-halved text-2xl text-slate-600"></i>
                        <span className="text-[10px] text-slate-500 font-medium">Sistem Sentinel</span>
                    </div>
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
                        <Row label="Jenis Kelamin" value={step1.gender === 'L' ? 'Laki-laki' : 'Perempuan'} />
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
                            <div className="text-slate-500 text-xs sm:text-sm">Alamat</div>
                            <p className="font-semibold text-slate-900 mt-1 leading-relaxed text-xs">
                                {addressFull || '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Asal Sekolah + Agreement */}
            <div className="s3-card opacity-0 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                    <i className="fa-solid fa-user-check text-gold"></i>
                    Data untuk Akun
                </h4>

                <div>
                    <label className="label">
                        Asal Sekolah <span className="text-rose-500">*</span>
                        {/* Indikator sinkronisasi debounce */}
                        {syncStatus === 'syncing' && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                                <i className="fa-solid fa-spinner fa-spin text-[9px]"></i> Menyimpan...
                            </span>
                        )}
                        {syncStatus === 'synced' && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-emerald-500 font-normal">
                                <i className="fa-solid fa-check text-[9px]"></i> Tersimpan
                            </span>
                        )}
                        {syncStatus === 'error' && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-rose-500 font-normal">
                                <i className="fa-solid fa-xmark text-[9px]"></i> Gagal simpan
                            </span>
                        )}
                    </label>
                    <input
                        type="text"
                        value={schoolOrigin}
                        autoComplete="organization"
                        onChange={e => handleSchoolOriginChange(e.target.value)}
                        onBlur={e => {
                            const titled = toTitleCase(e.target.value)
                            setSchoolOrigin(titled)
                            // Jika belum ada save dari debounce, simpan saat blur
                            if (titled && registrationCodeRef.current !== null) {
                                performSave(titled)
                            }
                        }}
                        placeholder="Contoh: SMP Negeri 3 Semarang"
                        className={`input-field ${errors.school_origin ? 'input-error' : ''}`}
                    />
                    {errors.school_origin && (
                        <span className="error-text">{errors.school_origin}</span>
                    )}
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
                {errors.agreement && (
                    <span className="error-text">{errors.agreement}</span>
                )}
            </div>

            {/* Submit */}
            <div className="s3-card opacity-0 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-8">
                <button
                    type="button"
                    onClick={onBack}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-navy transition group"
                >
                    <span className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center group-hover:border-gold group-hover:text-gold transition">
                        <i className="fa-solid fa-arrow-left text-[11px]"></i>
                    </span>
                    <span>Kembali ke Langkah 2</span>
                </button>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="s3-submit w-full sm:w-auto bg-navy hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed text-white px-7 sm:px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 transition hover:-translate-y-0.5 active:scale-95"
                >
                    {submitting
                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
                        : <><i className="fa-solid fa-arrow-right"></i> Lanjut &amp; Buat Akun</>
                    }
                </button>
            </div>

        </div>
    )
}