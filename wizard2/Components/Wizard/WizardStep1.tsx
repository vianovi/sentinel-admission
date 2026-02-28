import { useEffect, useState } from 'react'
import { animate, stagger } from 'animejs'

interface Step1Data {
    full_name: string
    nisn: string
    gender: 'L' | 'P' | ''
    place_of_birth: string
    date_of_birth: string
}

interface WizardStep1Props {
    data: Step1Data
    onChange: (data: Step1Data) => void
    onNext: () => void
}

export default function WizardStep1({ data, onChange, onNext }: WizardStep1Props) {
    const [errors, setErrors] = useState<Partial<Record<keyof Step1Data, string>>>({})

    useEffect(() => {
        animate('.s1-field', {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            delay: stagger(80, { start: 100 }),
            ease: 'outExpo',
        })
    }, [])

    const set = (field: keyof Step1Data, value: string) => {
        onChange({ ...data, [field]: value })
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const toTitleCase = (str: string) =>
        str.toLowerCase().split(' ').filter(Boolean)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

    const validate = (): boolean => {
        const e: Partial<Record<keyof Step1Data, string>> = {}
        if (!data.full_name.trim())      e.full_name = 'Nama lengkap wajib diisi.'
        if (!data.nisn.trim())           e.nisn = 'NISN wajib diisi.'
        else if (!/^\d{10}$/.test(data.nisn)) e.nisn = 'NISN harus 10 digit angka.'
        if (!data.gender)                e.gender = 'Jenis kelamin wajib dipilih.'
        if (!data.place_of_birth.trim()) e.place_of_birth = 'Tempat lahir wajib diisi.'
        if (!data.date_of_birth)         e.date_of_birth = 'Tanggal lahir wajib diisi.'
        setErrors(e)
        if (Object.keys(e).length > 0) {
            // Shake animation on error
            animate('.s1-submit', {
                translateX: [0, -8, 8, -8, 8, 0],
                duration: 400,
                ease: 'outExpo',
            })
        }
        return Object.keys(e).length === 0
    }

    const handleNext = () => { if (validate()) onNext() }

    return (
        <div>
            <div className="s1-field opacity-0 mb-6 sm:mb-8 border-b border-slate-200 pb-4">
                <h3 className="text-lg sm:text-2xl font-display font-bold text-slate-900">Identitas Calon Siswa</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Lengkapi data pribadi sesuai Kartu Keluarga (KK) dan Akta Kelahiran.</p>
            </div>

            <div className="space-y-4 sm:space-y-6">
                {/* Nama Lengkap */}
                <div className="s1-field opacity-0">
                    <label className="label">Nama Lengkap <span className="text-rose-500">*</span></label>
                    <input
                        type="text"
                        name="full_name"
                        autoComplete="name"
                        value={data.full_name}
                        onChange={e => set('full_name', e.target.value)}
                        onBlur={e => set('full_name', toTitleCase(e.target.value))}
                        placeholder="Contoh: Ahmad Zaki Pratama"
                        className={`input-field ${errors.full_name ? 'input-error' : ''}`}
                    />
                    <p className="hint">Huruf awal kapital setiap kata, sesuai Akta Kelahiran / KK.</p>
                    {errors.full_name && <span className="error-text">{errors.full_name}</span>}
                </div>

                {/* NISN */}
                <div className="s1-field opacity-0">
                    <label className="label">NISN (10 Angka) <span className="text-rose-500">*</span></label>
                    <input
                        type="text"
                        name="nisn"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={10}
                        value={data.nisn}
                        onChange={e => set('nisn', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Contoh: 0012345678"
                        className={`input-field ${errors.nisn ? 'input-error' : ''}`}
                    />
                    <p className="hint">10 digit angka tanpa spasi. Cek di ijazah SD/SMP.</p>
                    {errors.nisn && <span className="error-text">{errors.nisn}</span>}
                </div>

                {/* Tempat & Tanggal Lahir */}
                <div className="s1-field opacity-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Tempat Lahir <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            name="place_of_birth"
                            autoComplete="off"
                            value={data.place_of_birth}
                            onChange={e => {
                                // Hanya huruf dan spasi
                                const val = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                                set('place_of_birth', val)
                            }}
                            onBlur={e => set('place_of_birth', toTitleCase(e.target.value))}
                            placeholder="Contoh: Semarang"
                            className={`input-field ${errors.place_of_birth ? 'input-error' : ''}`}
                        />
                        <p className="hint">Nama kota/kabupaten, bukan kecamatan.</p>
                        {errors.place_of_birth && <span className="error-text">{errors.place_of_birth}</span>}
                    </div>
                    <div>
                        <label className="label">Tanggal Lahir <span className="text-rose-500">*</span></label>
                        <input
                            type="date"
                            name="date_of_birth"
                            autoComplete="bday"
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
                        {[
                            { value: 'L', label: 'Laki-laki', icon: 'fa-person' },
                            { value: 'P', label: 'Perempuan', icon: 'fa-person-dress' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => set('gender', opt.value)}
                                className={`radio-card ${data.gender === opt.value ? 'radio-card-active' : ''}`}
                            >
                                <i className={`fa-solid ${opt.icon}`}></i>
                                <span>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                    <p className="hint">Ketuk salah satu pilihan sampai berwarna kuning.</p>
                    {errors.gender && <span className="error-text">{errors.gender}</span>}
                </div>

                {/* Footer */}
                <div className="s1-field opacity-0 flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-200">
                    <p className="text-[11px] text-slate-500 text-center sm:text-left">
                        Langkah 1 dari 3 • Mohon diisi dengan teliti.
                    </p>
                    <button
                        type="button"
                        onClick={handleNext}
                        className="s1-submit w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-navy text-gold px-6 py-3 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
                    >
                        Lanjut ke Langkah 2
                        <i className="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    )
}
