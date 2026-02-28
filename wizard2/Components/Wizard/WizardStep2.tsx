import { useEffect, useState } from 'react'
import { animate, stagger } from 'animejs'

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

interface WizardStep2Props {
    data: Step2Data
    candidateName: string
    onChange: (data: Step2Data) => void
    onNext: () => void
    onBack: () => void
}

export default function WizardStep2({ data, candidateName, onChange, onNext, onBack }: WizardStep2Props) {
    const [errors, setErrors] = useState<Partial<Record<keyof Step2Data, string>>>({})

    useEffect(() => {
        animate('.s2-field', {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            delay: stagger(70, { start: 100 }),
            ease: 'outExpo',
        })
    }, [])

    const set = (field: keyof Step2Data, value: string) => {
        onChange({ ...data, [field]: value })
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const toTitleCase = (str: string) =>
        str.toLowerCase().split(' ').filter(Boolean)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

    // Validasi nomor HP — harus diawali 08
    const formatHP = (val: string) => {
        let v = val.replace(/\D/g, '')
        // Konversi 62xxx → 08xxx
        if (v.startsWith('62')) v = '0' + v.slice(2)
        // Konversi +62xxx → 08xxx
        if (v.startsWith('0062')) v = '0' + v.slice(4)
        return v.slice(0, 14)
    }

    const validate = (): boolean => {
        const e: Partial<Record<keyof Step2Data, string>> = {}
        if (!data.mother_name.trim()) e.mother_name = 'Nama ibu kandung wajib diisi.'

        if (!data.whatsapp_number.trim()) {
            e.whatsapp_number = 'Nomor WhatsApp wajib diisi.'
        } else if (!data.whatsapp_number.startsWith('08')) {
            e.whatsapp_number = 'Nomor WhatsApp harus diawali 08. Contoh: 081234567890'
        } else if (data.whatsapp_number.length < 10) {
            e.whatsapp_number = 'Nomor WhatsApp minimal 10 digit.'
        }

        if (!data.email.trim()) {
            e.email = 'Email wajib diisi.'
        } else if (!data.email.toLowerCase().endsWith('@gmail.com')) {
            e.email = 'Gunakan email Gmail. Contoh: nama@gmail.com'
        }

        if (!data.addr_jalan.trim()) e.addr_jalan = 'Alamat jalan wajib diisi.'
        if (!data.addr_rt.trim())    e.addr_rt    = 'RT wajib diisi.'
        if (!data.addr_rw.trim())    e.addr_rw    = 'RW wajib diisi.'
        if (!data.addr_desa.trim())  e.addr_desa  = 'Kelurahan/Desa wajib diisi.'
        if (!data.addr_kec.trim())   e.addr_kec   = 'Kecamatan wajib diisi.'
        if (!data.addr_kab.trim())   e.addr_kab   = 'Kabupaten/Kota wajib diisi.'
        if (!data.addr_prov.trim())  e.addr_prov  = 'Provinsi wajib diisi.'

        setErrors(e)
        if (Object.keys(e).length > 0) {
            animate('.s2-submit', {
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
            {/* Header */}
            <div className="s2-field opacity-0 mb-5 sm:mb-8 border-b border-slate-200 pb-4 flex justify-between items-start gap-3">
                <div>
                    <h3 className="text-lg sm:text-2xl font-display font-bold text-slate-900">Alamat & Kontak</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Pastikan alamat dan kontak aktif agar panitia mudah menghubungi.</p>
                </div>
                {candidateName && (
                    <div className="text-right flex-shrink-0">
                        <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Siswa</div>
                        <div className="font-semibold text-gold text-xs sm:text-sm">{candidateName}</div>
                    </div>
                )}
            </div>

            <div className="space-y-4 sm:space-y-6">
                {/* Nama Ibu */}
                <div className="s2-field opacity-0">
                    <label className="label">Nama Ibu Kandung <span className="text-rose-500">*</span></label>
                    <input
                        type="text"
                        name="mother_name"
                        autoComplete="off"
                        value={data.mother_name}
                        onChange={e => set('mother_name', e.target.value)}
                        onBlur={e => set('mother_name', toTitleCase(e.target.value))}
                        placeholder="Contoh: Siti Nur Aisyah"
                        className={`input-field ${errors.mother_name ? 'input-error' : ''}`}
                    />
                    {errors.mother_name && <span className="error-text">{errors.mother_name}</span>}
                </div>

                {/* Kontak */}
                <div className="s2-field opacity-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label">No. WhatsApp <span className="text-rose-500">*</span></label>
                        <input
                            type="tel"
                            name="whatsapp_number"
                            inputMode="numeric"
                            autoComplete="tel"
                            value={data.whatsapp_number}
                            onChange={e => set('whatsapp_number', formatHP(e.target.value))}
                            placeholder="Contoh: 081234567890"
                            className={`input-field ${errors.whatsapp_number ? 'input-error' : ''}`}
                        />
                        <p className="hint">Diawali 08, tanpa spasi. Nomor aktif WhatsApp.</p>
                        {errors.whatsapp_number && <span className="error-text">{errors.whatsapp_number}</span>}
                    </div>
                    <div>
                        <label className="label">Email Gmail <span className="text-rose-500">*</span></label>
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={data.email}
                            onChange={e => set('email', e.target.value)}
                            onBlur={e => set('email', e.target.value.trim().toLowerCase())}
                            placeholder="Contoh: nama@gmail.com"
                            className={`input-field ${errors.email ? 'input-error' : ''}`}
                        />
                        <p className="hint">Gunakan akun Gmail aktif. Dipakai untuk login.</p>
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>
                </div>

                {/* Alamat Box */}
                <div className="s2-field opacity-0 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6">
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                        <i className="fa-solid fa-map-location-dot text-gold"></i>
                        Alamat Domisili
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <label className="label text-xs">Jalan / Dusun / Perumahan <span className="text-rose-500">*</span></label>
                            <input type="text" name="addr_jalan" autoComplete="street-address"
                                value={data.addr_jalan}
                                onChange={e => set('addr_jalan', e.target.value)}
                                placeholder="Contoh: Jl. Diponegoro No. 12"
                                className={`input-field ${errors.addr_jalan ? 'input-error' : ''}`}
                            />
                            {errors.addr_jalan && <span className="error-text">{errors.addr_jalan}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="label text-xs">RT <span className="text-rose-500">*</span></label>
                                <input type="text" inputMode="numeric" maxLength={3} name="addr_rt" autoComplete="off"
                                    value={data.addr_rt}
                                    onChange={e => set('addr_rt', e.target.value.replace(/\D/g, '').slice(0, 3))}
                                    placeholder="005"
                                    className={`input-field ${errors.addr_rt ? 'input-error' : ''}`}
                                />
                                {errors.addr_rt && <span className="error-text">{errors.addr_rt}</span>}
                            </div>
                            <div>
                                <label className="label text-xs">RW <span className="text-rose-500">*</span></label>
                                <input type="text" inputMode="numeric" maxLength={3} name="addr_rw" autoComplete="off"
                                    value={data.addr_rw}
                                    onChange={e => set('addr_rw', e.target.value.replace(/\D/g, '').slice(0, 3))}
                                    placeholder="007"
                                    className={`input-field ${errors.addr_rw ? 'input-error' : ''}`}
                                />
                                {errors.addr_rw && <span className="error-text">{errors.addr_rw}</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="label text-xs">Kelurahan / Desa <span className="text-rose-500">*</span></label>
                                <input type="text" name="addr_desa" autoComplete="off"
                                    value={data.addr_desa}
                                    onChange={e => set('addr_desa', e.target.value)}
                                    onBlur={e => set('addr_desa', toTitleCase(e.target.value))}
                                    placeholder="Contoh: Tegalsari"
                                    className={`input-field ${errors.addr_desa ? 'input-error' : ''}`}
                                />
                                {errors.addr_desa && <span className="error-text">{errors.addr_desa}</span>}
                            </div>
                            <div>
                                <label className="label text-xs">Kecamatan <span className="text-rose-500">*</span></label>
                                <input type="text" name="addr_kec" autoComplete="off"
                                    value={data.addr_kec}
                                    onChange={e => set('addr_kec', e.target.value)}
                                    onBlur={e => set('addr_kec', toTitleCase(e.target.value))}
                                    placeholder="Contoh: Banyumanik"
                                    className={`input-field ${errors.addr_kec ? 'input-error' : ''}`}
                                />
                                {errors.addr_kec && <span className="error-text">{errors.addr_kec}</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="label text-xs">Kabupaten / Kota <span className="text-rose-500">*</span></label>
                                <input type="text" name="addr_kab" autoComplete="off"
                                    value={data.addr_kab}
                                    onChange={e => set('addr_kab', e.target.value)}
                                    onBlur={e => set('addr_kab', toTitleCase(e.target.value))}
                                    placeholder="Contoh: Kab. Semarang"
                                    className={`input-field ${errors.addr_kab ? 'input-error' : ''}`}
                                />
                                {errors.addr_kab && <span className="error-text">{errors.addr_kab}</span>}
                            </div>
                            <div>
                                <label className="label text-xs">Provinsi <span className="text-rose-500">*</span></label>
                                <input type="text" name="addr_prov" autoComplete="off"
                                    value={data.addr_prov}
                                    onChange={e => set('addr_prov', e.target.value)}
                                    onBlur={e => set('addr_prov', toTitleCase(e.target.value))}
                                    placeholder="Contoh: Jawa Tengah"
                                    className={`input-field ${errors.addr_prov ? 'input-error' : ''}`}
                                />
                                {errors.addr_prov && <span className="error-text">{errors.addr_prov}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="s2-field opacity-0 flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-200">
                    <button type="button" onClick={onBack}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-navy transition group"
                    >
                        <span className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center group-hover:border-gold group-hover:text-gold transition">
                            <i className="fa-solid fa-arrow-left text-[11px]"></i>
                        </span>
                        <span>Kembali ke Langkah 1</span>
                    </button>
                    <button type="button" onClick={handleNext}
                        className="s2-submit w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gold text-slate-900 px-6 py-3 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
                    >
                        Simpan & Lanjut
                        <i className="fa-solid fa-check-circle"></i>
                    </button>
                </div>
            </div>
        </div>
    )
}
