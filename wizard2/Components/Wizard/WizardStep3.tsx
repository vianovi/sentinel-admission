import { useEffect, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import { animate, stagger } from 'animejs'

interface Step1Data {
    full_name: string; nisn: string; gender: 'L' | 'P' | ''
    place_of_birth: string; date_of_birth: string
}
interface Step2Data {
    mother_name: string; whatsapp_number: string; email: string; phone_number: string
    addr_jalan: string; addr_rt: string; addr_rw: string; addr_desa: string
    addr_kec: string; addr_kab: string; addr_prov: string
}
interface WizardStep3Props {
    step1: Step1Data; step2: Step2Data; waveId?: number
    onBack: () => void
    onGoToStep1: () => void
}

export default function WizardStep3({ step1, step2, waveId, onBack, onGoToStep1 }: WizardStep3Props) {
    const [schoolOrigin, setSchoolOrigin] = useState('')
    const [agreement, setAgreement] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [registrationCode, setRegistrationCode] = useState<string | null>(null)
    const [saving, setSaving] = useState(true)
    const [saveError, setSaveError] = useState<string | null>(null)
    const savedRef = useRef(false)

    const toTitleCase = (s: string) =>
        s.toLowerCase().split(' ').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ')

    const addressFull = [
        step2.addr_jalan,
        `RT ${step2.addr_rt}/RW ${step2.addr_rw}`,
        step2.addr_desa, `Kec. ${step2.addr_kec}`,
        step2.addr_kab, step2.addr_prov,
    ].filter(Boolean).join(', ')

    // Auto-save draft saat masuk step 3
    useEffect(() => {
        if (savedRef.current) return
        savedRef.current = true

        fetch('/daftar/save-draft', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                full_name: step1.full_name,
                nisn: step1.nisn,
                gender: step1.gender,
                place_of_birth: step1.place_of_birth,
                date_of_birth: step1.date_of_birth,
                mother_name: step2.mother_name,
                whatsapp_number: step2.whatsapp_number,
                email: step2.email,
                phone_number: step2.phone_number || null,
                addr_jalan: step2.addr_jalan,
                addr_rt: step2.addr_rt,
                addr_rw: step2.addr_rw,
                addr_desa: step2.addr_desa,
                addr_kec: step2.addr_kec,
                addr_kab: step2.addr_kab,
                addr_prov: step2.addr_prov,
                school_origin: 'pending', // Will be updated but needed for validation
            }),
        })
        .then(async res => {
            const json = await res.json()
            if (!res.ok) {
                const msg = json.message ?? Object.values(json.errors ?? {})?.[0]?.[0] ?? 'Gagal menyimpan data.'
                setSaveError(String(msg))
                setSaving(false)
                return
            }
            setRegistrationCode(json.registration_code)
            setSaving(false)
            // Animate in after save
            setTimeout(() => {
                animate('.s3-card', {
                    opacity: [0, 1],
                    translateY: [20, 0],
                    duration: 500,
                    delay: stagger(100),
                    ease: 'outExpo',
                })
            }, 50)
        })
        .catch(() => {
            setSaveError('Koneksi gagal. Periksa internet dan coba kembali.')
            setSaving(false)
        })
    }, [])

    const handleSubmit = () => {
        const e: Record<string, string> = {}
        if (!schoolOrigin.trim()) e.school_origin = 'Asal sekolah wajib diisi.'
        if (!agreement) e.agreement = 'Kamu harus menyetujui pernyataan data benar.'
        setErrors(e)
        if (Object.keys(e).length > 0) {
            animate('.s3-submit', { translateX: [0, -8, 8, -8, 8, 0], duration: 400, ease: 'outExpo' })
            return
        }
        setSubmitting(true)
        router.post('/daftar/submit', {}, {
            onError: () => setSubmitting(false),
        })
    }

    const Row = ({ label, value }: { label: string; value: string }) => (
        <div className="flex justify-between gap-2 text-sm">
            <span className="text-slate-500 flex-shrink-0 text-xs sm:text-sm">{label}</span>
            <span className="font-semibold text-slate-900 text-right text-xs sm:text-sm">{value || '-'}</span>
        </div>
    )

    // Loading state
    if (saving) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin"></div>
                <p className="text-slate-500 text-sm font-medium">Menyimpan data pendaftaran...</p>
            </div>
        )
    }

    // Error state
    if (saveError) {
        return (
            <div className="py-10">
                <div className="bg-red-50 border-l-4 border-red-500 px-4 py-4 rounded-r-xl text-sm text-red-800 mb-6">
                    <div className="font-bold mb-1 flex items-center gap-2">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        Gagal Menyimpan Data
                    </div>
                    <p>{saveError}</p>
                </div>
                <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-navy transition">
                    <i className="fa-solid fa-arrow-left"></i> Kembali & Periksa Data
                </button>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="s3-card opacity-0 mb-5 sm:mb-8 border-b border-slate-200 pb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg sm:text-2xl font-display font-bold text-slate-900">Review & Lanjut Registrasi</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Pastikan data sudah benar sebelum membuat akun.</p>
                </div>
                <button type="button" onClick={onGoToStep1}
                    className="text-slate-500 font-bold text-xs sm:text-sm hover:text-navy transition flex items-center gap-1.5 sm:gap-2 group flex-shrink-0"
                >
                    <span className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-slate-300 transition">
                        <i className="fa-solid fa-pen-to-square text-xs sm:text-sm"></i>
                    </span>
                    <span className="hidden sm:inline">Edit Data</span>
                </button>
            </div>

            {/* Status tersimpan + Kode */}
            <div className="s3-card opacity-0 mb-4 sm:mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fa-solid fa-check text-white text-xs"></i>
                </div>
                <div>
                    <div className="font-bold text-emerald-800 text-sm">Data Berhasil Disimpan</div>
                    <p className="text-xs text-emerald-700 mt-0.5">Data kontak dan identitas berhasil tersimpan di sistem.</p>
                </div>
            </div>

            {/* Kode Pendaftaran */}
            <div className="s3-card opacity-0 mb-4 sm:mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                            Kode Pendaftaran
                        </div>
                        <div className="text-xl sm:text-2xl font-extrabold text-navy font-display tracking-wider">
                            {registrationCode}
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">
                            Kode akan terverifikasi otomatis setelah akun dibuat. Simpan kode ini sebagai referensi.
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-gold font-bold flex-shrink-0">
                        <i className="fa-solid fa-shield-halved text-lg"></i>
                        <span className="text-sm">Aman &amp; Terverifikasi</span>
                    </div>
                </div>
            </div>

            {/* Preview Data */}
            <div className="s3-card opacity-0 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                        <i className="fa-solid fa-id-card text-gold"></i> Identitas
                    </h4>
                    <div className="space-y-1.5 sm:space-y-2">
                        <Row label="Nama" value={step1.full_name} />
                        <Row label="NISN" value={step1.nisn} />
                        <Row label="Jenis Kelamin" value={step1.gender === 'L' ? 'Laki-laki' : 'Perempuan'} />
                        <Row label="Tempat Lahir" value={step1.place_of_birth} />
                        <Row label="Tanggal Lahir" value={step1.date_of_birth} />
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                        <i className="fa-solid fa-location-dot text-gold"></i> Kontak & Alamat
                    </h4>
                    <div className="space-y-1.5 sm:space-y-2">
                        <Row label="Nama Ibu" value={step2.mother_name} />
                        <Row label="WhatsApp" value={step2.whatsapp_number} />
                        <Row label="Email" value={step2.email} />
                        <div className="text-xs sm:text-sm pt-1">
                            <span className="text-slate-500">Alamat</span>
                            <p className="font-semibold text-slate-900 mt-1 leading-relaxed text-xs">{addressFull}</p>
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
                    <label className="label">Asal Sekolah <span className="text-rose-500">*</span></label>
                    <input
                        type="text"
                        value={schoolOrigin}
                        autoComplete="organization"
                        onChange={e => { setSchoolOrigin(e.target.value); if (errors.school_origin) setErrors(p => ({ ...p, school_origin: '' })) }}
                        onBlur={e => setSchoolOrigin(toTitleCase(e.target.value))}
                        placeholder="Contoh: SMP Negeri 3 Semarang"
                        className={`input-field ${errors.school_origin ? 'input-error' : ''}`}
                    />
                    {errors.school_origin && <span className="error-text">{errors.school_origin}</span>}
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input type="checkbox" checked={agreement}
                        onChange={e => { setAgreement(e.target.checked); if (errors.agreement) setErrors(p => ({ ...p, agreement: '' })) }}
                        className="mt-1 w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 accent-navy"
                    />
                    <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">Saya menyatakan data yang saya isi adalah benar.</div>
                        <div className="text-[11px] sm:text-xs text-slate-500 mt-1">Setelah lanjut, kamu akan diarahkan ke halaman pembuatan akun.</div>
                    </div>
                </label>
                {errors.agreement && <span className="error-text">{errors.agreement}</span>}
            </div>

            {/* Submit */}
            <div className="s3-card opacity-0 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-8">
                <button type="button" onClick={onBack}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-navy transition group"
                >
                    <span className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center group-hover:border-gold group-hover:text-gold transition">
                        <i className="fa-solid fa-arrow-left text-[11px]"></i>
                    </span>
                    <span>Kembali</span>
                </button>
                <button type="button" onClick={handleSubmit} disabled={submitting}
                    className="s3-submit w-full sm:w-auto bg-navy hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition hover:-translate-y-0.5"
                >
                    {submitting
                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
                        : <><i className="fa-solid fa-arrow-right"></i> Lanjut Buat Akun</>
                    }
                </button>
            </div>
        </div>
    )
}
