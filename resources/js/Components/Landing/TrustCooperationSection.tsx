import { Link } from '@inertiajs/react'
import type { AppConfig } from '@/types'
import TrustEcosystemRibbon from './TrustEcosystemRibbon'

interface TrustCooperationSectionProps {
    app: AppConfig
}

interface TrustCard {
    number: string
    icon: string
    title: string
    description: string
}

const BRAND_LOGO_PATH = '/assets/icons/brand/logo.webp'

const trustCards: readonly TrustCard[] = [
    {
        number: '01',
        icon: 'fa-building-columns',
        title: 'Identitas Lembaga yang Jelas',
        description: 'Informasi pendaftaran disampaikan melalui kanal resmi lembaga dengan identitas dan kontak panitia yang dapat dikenali.',
    },
    {
        number: '02',
        icon: 'fa-file-circle-check',
        title: 'Verifikasi Bertahap',
        description: 'Data, dokumen, dan pembayaran diperiksa melalui tahapan yang jelas sebelum status pendaftaran diperbarui.',
    },
    {
        number: '03',
        icon: 'fa-comments',
        title: 'Komunikasi Terbuka',
        description: 'Calon santri dan wali dapat menghubungi panitia apabila membutuhkan penjelasan atau mengalami kendala selama proses pendaftaran.',
    },
]

export default function TrustCooperationSection({ app }: TrustCooperationSectionProps) {
    return (
        <section
            id="kepercayaan"
            aria-labelledby="trust-cooperation-heading"
            className="relative overflow-hidden border-y border-gold/10 bg-[linear-gradient(135deg,#ffffff_0%,#fff9ec_48%,#f8fafc_100%)] py-16 scroll-mt-28 md:py-24"
        >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-dotted opacity-20" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:gap-x-12 lg:gap-y-8">
                    <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1">
                        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-700 sm:text-sm">
                            <span aria-hidden="true" className="h-2 w-2 rounded-sm bg-gold" />
                            Kepercayaan &amp; Kerja Sama
                        </span>
                        <h2
                            id="trust-cooperation-heading"
                            className="mt-3 max-w-xl font-display text-3xl font-bold leading-tight text-navy sm:text-4xl lg:text-[2.75rem]"
                        >
                            Kepercayaan Tumbuh dari Proses yang Jelas
                        </h2>
                        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                            Proses SPMB dirancang agar calon santri dan wali dapat memahami setiap tahap pendaftaran, mulai dari pengisian data hingga verifikasi oleh panitia.
                        </p>

                        <div className="mt-8 flex items-center gap-4 rounded-2xl border border-gold/20 bg-white/90 p-4 shadow-soft sm:p-5">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-white p-1.5 shadow-sm">
                                <img
                                    src={BRAND_LOGO_PATH}
                                    alt={`Logo resmi ${app.name}`}
                                    width="64"
                                    height="64"
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Sistem Penerimaan Murid Baru
                                </p>
                                <h3 className="mt-1 break-words font-display text-lg font-bold leading-snug text-navy sm:text-xl">
                                    {app.name}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    Informasi dan bantuan pendaftaran tersedia melalui kanal kontak resmi panitia di halaman ini.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute bottom-8 left-6 top-8 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent"
                        />
                        <ol className="space-y-4">
                            {trustCards.map((card) => (
                                <li key={card.number} className="relative z-10">
                                    <article className="group flex min-h-[150px] gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-[transform,border-color,box-shadow] duration-300 motion-safe:hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-lg motion-reduce:transition-none sm:gap-5 sm:p-6">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-[#fff8e8] text-sm font-extrabold text-navy shadow-sm">
                                            {card.number}
                                        </div>
                                        <div className="min-w-0 pt-0.5">
                                            <div className="flex items-start gap-3">
                                                <i aria-hidden="true" className={`fa-solid ${card.icon} mt-1 shrink-0 text-gold`}></i>
                                                <h3 className="font-display text-lg font-bold leading-snug text-navy sm:text-xl">
                                                    {card.title}
                                                </h3>
                                            </div>
                                            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                                                {card.description}
                                            </p>
                                        </div>
                                    </article>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="flex flex-col gap-3 lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:self-start sm:flex-row">
                        <a
                            href="#kontak"
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-lg shadow-navy/10 transition-[transform,background-color,color,box-shadow] duration-300 hover:bg-gold hover:text-navy hover:shadow-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none sm:w-auto"
                        >
                            <i aria-hidden="true" className="fa-solid fa-phone text-xs"></i>
                            Hubungi Panitia
                        </a>
                        <Link
                            href="/daftar"
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-5 py-3 text-sm font-bold text-navy transition-colors duration-300 hover:border-gold/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-auto"
                        >
                            Gabung dengan keluarga kami
                            <i aria-hidden="true" className="fa-solid fa-arrow-right text-[10px]"></i>
                        </Link>
                    </div>
                </div>

                <div className="mt-12 md:mt-16">
                    <TrustEcosystemRibbon />
                </div>
            </div>
        </section>
    )
}
