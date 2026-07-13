interface EcosystemItem {
    name: string
    role: string
    desktopLogo: string
    mobileLogo: string
    desktopWidth: number
    desktopHeight: number
    mobileWidth: number
    mobileHeight: number
}

const ecosystemItems: readonly EcosystemItem[] = [
    {
        name: 'Muhammadiyah',
        role: 'Identitas organisasi',
        desktopLogo: '/assets/landing/trustcooperation/muhammadiyah_desktop.png',
        mobileLogo: '/assets/landing/trustcooperation/muhammadiyah_mobile.png',
        desktopWidth: 40,
        desktopHeight: 40,
        mobileWidth: 32,
        mobileHeight: 32,
    },
    {
        name: 'Bank Syariah Indonesia',
        role: 'Layanan pembayaran',
        desktopLogo: '/assets/landing/trustcooperation/bsi_desktop.png',
        mobileLogo: '/assets/landing/trustcooperation/bsi_mobile.png',
        desktopWidth: 88,
        desktopHeight: 36,
        mobileWidth: 72,
        mobileHeight: 32,
    },
    {
        name: 'Laravel',
        role: 'Teknologi aplikasi',
        desktopLogo: '/assets/landing/trustcooperation/laravel_desktop.png',
        mobileLogo: '/assets/landing/trustcooperation/laravel_mobile.png',
        desktopWidth: 88,
        desktopHeight: 36,
        mobileWidth: 72,
        mobileHeight: 32,
    },
]

const ribbonItems = [...ecosystemItems, ...ecosystemItems]

function EcosystemLogo({ item }: { item: EcosystemItem }) {
    const isSymbol = item.desktopWidth === item.desktopHeight

    return (
        <div
            className={`flex shrink-0 items-center justify-center ${isSymbol ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-8 w-[72px] sm:h-9 sm:w-[88px]'}`}
        >
            <picture className="contents">
                <source media="(max-width: 639px)" srcSet={item.mobileLogo} />
                <img
                    src={item.desktopLogo}
                    alt={`Logo ${item.name}`}
                    width={item.desktopWidth}
                    height={item.desktopHeight}
                    loading="lazy"
                    decoding="async"
                    className="block h-full w-full object-contain"
                />
            </picture>
        </div>
    )
}

function EcosystemItems({ duplicate = false }: { duplicate?: boolean }) {
    return (
        <div
            className={`flex shrink-0 items-center ${duplicate ? 'trust-ribbon-duplicate' : ''}`}
            aria-hidden={duplicate || undefined}
        >
            {ribbonItems.map((item, index) => (
                <div
                    key={`${item.name}-${index}`}
                    className={`flex shrink-0 items-center ${index >= ecosystemItems.length ? 'trust-ribbon-fill-duplicate' : ''}`}
                    aria-hidden={index >= ecosystemItems.length || undefined}
                >
                    <div className="flex min-h-16 items-center gap-3 px-5 sm:min-h-[72px] sm:gap-4 sm:px-7">
                        <EcosystemLogo item={item} />
                        <div className="whitespace-nowrap">
                            <p className="text-sm font-bold leading-tight text-white sm:text-[15px]">
                                {item.name}
                            </p>
                            <p className="mt-1 text-[11px] font-medium leading-none text-slate-400 sm:text-xs">
                                {item.role}
                            </p>
                        </div>
                    </div>
                    <span aria-hidden="true" className="px-1 text-[10px] text-gold/60">
                        ✦
                    </span>
                </div>
            ))}
        </div>
    )
}

export default function TrustEcosystemRibbon() {
    return (
        <aside
            aria-label="Jejaring dan teknologi pendukung"
            className="overflow-hidden rounded-2xl border border-navy/10 bg-navy shadow-2xl shadow-navy/10"
        >
            <div className="flex flex-col lg:flex-row lg:items-stretch">
                <div className="relative z-10 flex shrink-0 items-center gap-3 border-b border-navy/10 bg-gold px-5 py-3.5 text-navy sm:gap-4 sm:px-6 lg:w-[276px] lg:border-b-0 lg:border-r lg:py-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-navy/10 bg-navy/10">
                        <i aria-hidden="true" className="fa-solid fa-handshake text-sm"></i>
                    </span>
                    <div className="min-w-0">
                        <p className="text-[10px] font-extrabold uppercase leading-none tracking-widest text-navy/65">
                            Ekosistem Pendukung
                        </p>
                        <p className="mt-1.5 whitespace-nowrap text-[15px] font-extrabold leading-none sm:text-base">
                            Jejaring &amp; Teknologi
                        </p>
                    </div>
                </div>

                <div
                    className="trust-ribbon-viewport min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
                    tabIndex={0}
                    aria-label="Jeda animasi untuk membaca jejaring dan teknologi pendukung"
                >
                    <div className="trust-ribbon-track flex w-max items-center">
                        <EcosystemItems />
                        <EcosystemItems duplicate />
                    </div>
                </div>
            </div>
        </aside>
    )
}
