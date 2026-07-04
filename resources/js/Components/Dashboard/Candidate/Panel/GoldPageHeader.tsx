import { Link } from "@inertiajs/react";

type Action = {
    label: string;
    href: string;
    icon: string;
};

type Props = {
    eyebrow: string;
    title: string;
    description: string;
    icon: string;
    action?: Action;
};

export default function GoldPageHeader({ eyebrow, title, description, icon, action }: Props) {
    return (
        <section className="candidate-panel-entry overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-sm dark:border-gold/15 dark:bg-slate-900">
            <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-amber-600 shadow-sm dark:text-gold">
                        <i className={`${icon} text-lg`} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-gold">{eyebrow}</p>
                        <h1 className="mt-1 text-2xl font-display font-bold leading-tight text-slate-900 dark:text-white">{title}</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
                    </div>
                </div>

                {action && (
                    <Link
                        href={action.href}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy transition hover:bg-goldhover"
                    >
                        <i className={`${action.icon} text-xs`} />
                        {action.label}
                    </Link>
                )}
            </div>
        </section>
    );
}
