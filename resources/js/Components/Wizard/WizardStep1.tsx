import { useEffect, useState } from 'react'
import { animate, stagger } from 'animejs'
import axios from 'axios'
import { useWizardStorage } from './useWizardStorage'

export interface Step1Data {
    full_name: string
    nisn: string
    nik: string
    gender: 'L' | 'P' | ''
    place_of_birth: string
    date_of_birth: string
}

interface WizardStep1Props {
    data: Step1Data
    onChange: (data: Step1Data) => void
    onNext: (draftId: string) => void
    onDuplicateFound: (status: 'draft' | 'registered', data: { name: string; nisn: string; nik: string; draft_id?: number; updated_at?: string }) => void
    currentDraftId?: string
}

const toTitleCase = (s: string) =>
    s.toLowerCase().split(' ').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ')

export default function WizardStep1({ data, onChange, onNext, onDuplicateFound, currentDraftId }: WizardStep1Props) {
    const [errors, setErrors]       = useState<Partial<Record<keyof Step1Data, string>>>({})
    const [submitting, setSubmitting] = useState(false)

    // Auto-save ke localStorage setiap kali data berubah
    useWizardStorage('step1', data)

    useEffect(() => {
        animate('.s1-field', {
            opacity: [0, 1],
            translateY: [24, 0],
            duration: 520,
            delay: stagger(80, { start: 80 }),
            ease: 'outExpo',
        })
    }, [])

    const set = (field: keyof Step1Data, value: string) => {
        onChange({ ...data, [field]: value })
        if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
    }

    const validate = (): boolean => {
        const e: Partial<Record<keyof Step1Data, string>> = {}
        if (!data.full_name.trim())             e.full_name      = 'Nama lengkap wajib diisi.'
        if (!data.nisn.trim())                  e.nisn           = 'NISN wajib diisi.'
        else if (!/^\d{10}$/.test(data.nisn))   e.nisn           = 'NISN harus 10 digit angka.'
        if (!data.nik.trim())                   e.nik            = 'NIK wajib diisi.'
        else if (!/^\d{16}$/.test(data.nik))    e.nik            = 'NIK harus 16 digit angka.'
        if (!data.gender)                       e.gender         = 'Jenis kelamin wajib dipilih.'
        if (!data.place_of_birth.trim())        e.place_of_birth = 'Tempat lahir wajib diisi.'
        if (!data.date_of_birth)                e.date_of_birth  = 'Tanggal lahir wajib diisi.'
        setErrors(e)
        if (Object.keys(e).length > 0) {
            animate('.s1-submit', { translateX: [0, -8, 8, -6, 6, 0], duration: 420, ease: 'outExpo' })
            setTimeout(() => animate('.s1-scope .input-error', { translateX: [0, -6, 6, -4, 4, 0], duration: 380, ease: 'outExpo' }), 50)
        }
        return Object.keys(e).length === 0
    }

    const handleNext = async () => {
        if (!validate()) return
        setSubmitting(true)

        try {
            // 1. Cek duplikat dulu
            const { data: check } = await axios.post('/daftar/check-duplicate', {
                nisn:             data.nisn,
                nik:              data.nik,
                current_draft_id: currentDraftId ? Number(currentDraftId) : null,
            })

            if (check.found) {
                setSubmitting(false)
                onDuplicateFound(check.status, check.data)
                return
            }

            // 2. Tidak ada duplikat — insert draft
            const { data: res } = await axios.post('/daftar/step1', {
                full_name:      data.full_name,
                nisn:           data.nisn,
                nik:            data.nik,
                gender:         data.gender,
                place_of_birth: data.place_of_birth,
                date_of_birth:  data.date_of_birth,
            })

            setSubmitting(false)
            onNext(String(res.draft_id))

        } catch (err: any) {
            setSubmitting(false)
            const errs = err.response?.data?.errors as Record<string, string[]> | undefined
            if (errs) {
                const mapped: Partial<Record<keyof Step1Data, string>> = {}
                Object.entries(errs).forEach(([k, v]) => {
                    mapped[k as keyof Step1Data] = v[0]
                })
                setErrors(mapped)
            }
        }
    }

    return (
        <div className="s1-scope">
            <div className="s1-field opacity-0 mb-6 sm:mb-8 border-b border-slate-200 pb-4">
                <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 leading-tight">Identitas Calon Siswa</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Lengkapi data pribadi sesuai Kartu Keluarga (KK) dan Akta Kelahiran.</p>
            </div>

            <div className="space-y-5 sm:space-y-6">
                {/* Nama */}
                <div className="s1-field opacity-0">
                    <label className="label">Nama Lengkap <span className="text-rose-500">*</span></label>
                    <input type="text" name="full_name" autoComplete="name"
                        value={data.full_name}
                        onChange={e => set('full_name', e.target.value)}
                        onBlur={e => set('full_name', toTitleCase(e.target.value))}
                        placeholder="Contoh: Ahmad Zaki Pratama"
                        className={`input-field ${errors.full_name ? 'input-error' : ''}`}
                    />
                    <p className="hint">Huruf awal kapital setiap kata, sesuai Akta Kelahiran / KK.</p>
                    {errors.full_name && <span className="error-text">{errors.full_name}</span>}
                </div>

                {/* NISN & NIK */}
                <div className="s1-field opacity-0 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="label">NISN (10 Angka) <span className="text-rose-500">*</span></label>
                        <input type="text" name="nisn" inputMode="numeric" autoComplete="off" maxLength={10}
                            value={data.nisn}
                            onChange={e => set('nisn', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="Contoh: 0012345678"
                            className={`input-field ${errors.nisn ? 'input-error' : ''}`}
                        />
                        <p className="hint">10 digit angka. Cek di ijazah SD/SMP.</p>
                        {errors.nisn && <span className="error-text">{errors.nisn}</span>}
                    </div>
                    <div>
                        <label className="label">NIK (16 Angka) <span className="text-rose-500">*</span></label>
                        <input type="text" name="nik" inputMode="numeric" autoComplete="off" maxLength={16}
                            value={data.nik}
                            onChange={e => set('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                            placeholder="Contoh: 3301123456789001"
                            className={`input-field ${errors.nik ? 'input-error' : ''}`}
                        />
                        <p className="hint">16 digit, sesuai KTP/KK.</p>
                        {errors.nik && <span className="error-text">{errors.nik}</span>}
                    </div>
                </div>

                {/* Tempat & Tanggal Lahir */}
                <div className="s1-field opacity-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Tempat Lahir <span className="text-rose-500">*</span></label>
                        <input type="text" name="place_of_birth" autoComplete="off"
                            value={data.place_of_birth}
                            onChange={e => set('place_of_birth', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                            onBlur={e => set('place_of_birth', toTitleCase(e.target.value))}
                            placeholder="Contoh: Semarang"
                            className={`input-field ${errors.place_of_birth ? 'input-error' : ''}`}
                        />
                        <p className="hint">Nama kota/kabupaten.</p>
                        {errors.place_of_birth && <span className="error-text">{errors.place_of_birth}</span>}
                    </div>
                    <div>
                        <label className="label">Tanggal Lahir <span className="text-rose-500">*</span></label>
                        <input type="date" name="date_of_birth" autoComplete="bday"
                            value={data.date_of_birth}
                            onChange={e => set('date_of_birth', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className={`input-field ${errors.date_of_birth ? 'input-error' : ''}`}
                        />
                        <p className="hint">Sesuai Akta Kelahiran / KK.</p>
                        {errors.date_of_birth && <span className="error-text">{errors.date_of_birth}</span>}
                    </div>
                </div>

                {/* Jenis Kelamin */}
                <div className="s1-field opacity-0">
                    <label className="label">Jenis Kelamin <span className="text-rose-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {[{ value: 'L', label: 'Laki-laki', icon: 'fa-person' }, { value: 'P', label: 'Perempuan', icon: 'fa-person-dress' }].map(opt => (
                            <button key={opt.value} type="button" onClick={() => set('gender', opt.value)}
                                className={`radio-card ${data.gender === opt.value ? 'radio-card-active' : ''}`}>
                                <i className={`fa-solid ${opt.icon}`}></i>
                                <span>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                    {errors.gender && <span className="error-text mt-2 block">{errors.gender}</span>}
                </div>

                {/* Footer */}
                <div className="s1-field opacity-0 flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-200">
                    <p className="text-[11px] text-slate-400 text-center sm:text-left">
                        Langkah 1 dari 3 &bull; Data disimpan otomatis.
                    </p>
                    <button type="button" onClick={handleNext} disabled={submitting}
                        className="s1-submit w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-navy text-gold px-7 py-3.5 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 transition-all active:scale-95"
                    >
                        {submitting
                            ? <><i className="fa-solid fa-spinner fa-spin"></i> Memeriksa...</>
                            : <>Lanjut ke Langkah 2 <i className="fa-solid fa-arrow-right text-xs"></i></>
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}
