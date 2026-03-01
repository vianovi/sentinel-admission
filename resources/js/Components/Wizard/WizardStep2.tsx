import { useEffect, useState } from 'react'
import { animate, stagger } from 'animejs'
import axios from 'axios'
import { useWizardStorage } from './useWizardStorage'

export interface Step2Data {
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
    draftId: string
    candidateName: string
    onChange: (data: Step2Data) => void
    onNext: () => void
    onBack: () => void
}

const toTitleCase = (s: string) =>
    s.toLowerCase().split(' ').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ')

const formatHP = (val: string) => {
    let v = val.replace(/\D/g, '')
    if (v.startsWith('62'))   v = '0' + v.slice(2)
    if (v.startsWith('0062')) v = '0' + v.slice(4)
    return v.slice(0, 14)
}

export default function WizardStep2({ data, draftId, candidateName, onChange, onNext, onBack }: WizardStep2Props) {
    const [errors, setErrors]         = useState<Partial<Record<keyof Step2Data, string>>>({})
    const [submitting, setSubmitting] = useState(false)

    // Auto-save ke localStorage
    useWizardStorage('step2', data)

    useEffect(() => {
        animate('.s2-field', {
            opacity: [0, 1],
            translateY: [24, 0],
            duration: 520,
            delay: stagger(70, { start: 80 }),
            ease: 'outExpo',
        })
    }, [])

    const set = (field: keyof Step2Data, value: string) => {
        onChange({ ...data, [field]: value })
        if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
    }

    const validate = (): boolean => {
        const e: Partial<Record<keyof Step2Data, string>> = {}
        if (!data.mother_name.trim())       e.mother_name     = 'Nama ibu kandung wajib diisi.'
        if (!data.whatsapp_number.trim())   e.whatsapp_number = 'Nomor WhatsApp wajib diisi.'
        else if (!data.whatsapp_number.startsWith('08')) e.whatsapp_number = 'Nomor harus diawali 08.'
        else if (data.whatsapp_number.length < 10)       e.whatsapp_number = 'Nomor minimal 10 digit.'
        if (!data.email.trim())             e.email = 'Email wajib diisi.'
        else if (!data.email.toLowerCase().endsWith('@gmail.com')) e.email = 'Gunakan email Gmail. Contoh: nama@gmail.com'
        if (!data.addr_jalan.trim()) e.addr_jalan = 'Alamat jalan wajib diisi.'
        if (!data.addr_rt.trim())    e.addr_rt    = 'RT wajib diisi.'
        if (!data.addr_rw.trim())    e.addr_rw    = 'RW wajib diisi.'
        if (!data.addr_desa.trim())  e.addr_desa  = 'Kelurahan/Desa wajib diisi.'
        if (!data.addr_kec.trim())   e.addr_kec   = 'Kecamatan wajib diisi.'
        if (!data.addr_kab.trim())   e.addr_kab   = 'Kabupaten/Kota wajib diisi.'
        if (!data.addr_prov.trim())  e.addr_prov  = 'Provinsi wajib diisi.'
        setErrors(e)
        if (Object.keys(e).length > 0) {
            animate('.s2-submit', { translateX: [0, -8, 8, -6, 6, 0], duration: 420, ease: 'outExpo' })
            setTimeout(() => animate('.s2-scope .input-error', { translateX: [0, -6, 6, -4, 4, 0], duration: 380, ease: 'outExpo' }), 50)
        }
        return Object.keys(e).length === 0
    }

    const handleNext = async () => {
        if (!validate()) return
        setSubmitting(true)
        try {
            await axios.put(`/daftar/step2/${draftId}`, {
                mother_name:     data.mother_name,
                whatsapp_number: data.whatsapp_number,
                email:           data.email,
                phone_number:    data.phone_number || null,
                addr_jalan:      data.addr_jalan,
                addr_rt:         data.addr_rt,
                addr_rw:         data.addr_rw,
                addr_desa:       data.addr_desa,
                addr_kec:        data.addr_kec,
                addr_kab:        data.addr_kab,
                addr_prov:       data.addr_prov,
            })
            setSubmitting(false)
            onNext()
        } catch (err: any) {
            setSubmitting(false)
            const errs = err.response?.data?.errors as Record<string, string[]> | undefined
            if (errs) {
                const mapped: Partial<Record<keyof Step2Data, string>> = {}
                Object.entries(errs).forEach(([k, v]) => { mapped[k as keyof Step2Data] = v[0] })
                setErrors(mapped)
            }
        }
    }

    return (
        <div className="s2-scope">
            <div className="s2-field opacity-0 mb-5 sm:mb-8 border-b border-slate-200 pb-4 flex justify-between items-start gap-3">
                <div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 leading-tight">Alamat & Kontak</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Pastikan alamat dan kontak aktif agar panitia mudah menghubungi.</p>
                </div>
                {candidateName && (
                    <div className="text-right flex-shrink-0">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Siswa</div>
                        <div className="font-semibold text-gold text-xs sm:text-sm">{candidateName}</div>
                    </div>
                )}
            </div>

            <div className="space-y-4 sm:space-y-6">
                {/* Nama Ibu */}
                <div className="s2-field opacity-0">
                    <label className="label">Nama Ibu Kandung <span className="text-rose-500">*</span></label>
                    <input type="text" name="mother_name" autoComplete="off"
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
                        <input type="tel" name="whatsapp_number" inputMode="numeric" autoComplete="tel"
                            value={data.whatsapp_number}
                            onChange={e => set('whatsapp_number', formatHP(e.target.value))}
                            placeholder="Contoh: 081234567890"
                            className={`input-field ${errors.whatsapp_number ? 'input-error' : ''}`}
                        />
                        <p className="hint">Diawali 08, tanpa spasi.</p>
                        {errors.whatsapp_number && <span className="error-text">{errors.whatsapp_number}</span>}
                    </div>
                    <div>
                        <label className="label">Email Gmail <span className="text-rose-500">*</span></label>
                        <input type="email" name="email" autoComplete="email"
                            value={data.email}
                            onChange={e => set('email', e.target.value)}
                            onBlur={e => set('email', e.target.value.trim().toLowerCase())}
                            placeholder="Contoh: nama@gmail.com"
                            className={`input-field ${errors.email ? 'input-error' : ''}`}
                        />
                        <p className="hint">Dipakai untuk login akun.</p>
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>
                </div>

                {/* Alamat */}
                <div className="s2-field opacity-0 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6">
                    <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                        <i className="fa-solid fa-map-location-dot text-gold"></i> Alamat Domisili
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <label className="label text-xs">Jalan / Dusun / Perumahan <span className="text-rose-500">*</span></label>
                            <input type="text" autoComplete="street-address"
                                value={data.addr_jalan} onChange={e => set('addr_jalan', e.target.value)}
                                placeholder="Contoh: Jl. Diponegoro No. 12"
                                className={`input-field ${errors.addr_jalan ? 'input-error' : ''}`}
                            />
                            {errors.addr_jalan && <span className="error-text">{errors.addr_jalan}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[{ field: 'addr_rt' as const, label: 'RT', ph: '005' }, { field: 'addr_rw' as const, label: 'RW', ph: '007' }].map(f => (
                                <div key={f.field}>
                                    <label className="label text-xs">{f.label} <span className="text-rose-500">*</span></label>
                                    <input type="text" inputMode="numeric" maxLength={3} autoComplete="off"
                                        value={data[f.field]} onChange={e => set(f.field, e.target.value.replace(/\D/g, '').slice(0, 3))}
                                        placeholder={f.ph}
                                        className={`input-field ${errors[f.field] ? 'input-error' : ''}`}
                                    />
                                    {errors[f.field] && <span className="error-text">{errors[f.field]}</span>}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { field: 'addr_desa' as const, label: 'Kelurahan / Desa', ph: 'Tegalsari' },
                                { field: 'addr_kec'  as const, label: 'Kecamatan',         ph: 'Banyumanik' },
                                { field: 'addr_kab'  as const, label: 'Kabupaten / Kota',  ph: 'Kab. Semarang' },
                                { field: 'addr_prov' as const, label: 'Provinsi',           ph: 'Jawa Tengah' },
                            ].map(f => (
                                <div key={f.field}>
                                    <label className="label text-xs">{f.label} <span className="text-rose-500">*</span></label>
                                    <input type="text" autoComplete="off"
                                        value={data[f.field]}
                                        onChange={e => set(f.field, e.target.value)}
                                        onBlur={e => set(f.field, toTitleCase(e.target.value))}
                                        placeholder={`Contoh: ${f.ph}`}
                                        className={`input-field ${errors[f.field] ? 'input-error' : ''}`}
                                    />
                                    {errors[f.field] && <span className="error-text">{errors[f.field]}</span>}
                                </div>
                            ))}
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
                    <button type="button" onClick={handleNext} disabled={submitting}
                        className="s2-submit w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gold text-slate-900 px-7 py-3.5 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 transition-all active:scale-95"
                    >
                        {submitting
                            ? <><i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...</>
                            : <>Simpan & Lanjut <i className="fa-solid fa-check-circle text-xs"></i></>
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}
