import { Link } from "@inertiajs/react";

type Props = {
    icon: string;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
};

export default function EmptyState({ icon, title, description, actionLabel, actionHref }: Props) {
    return (
        <div className="candidate-panel-entry rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-amber-600 dark:text-gold">
                <i className={`${icon} text-xl`} />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
            {actionLabel && actionHref && (
                <Link
                    href={actionHref}
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-gold px-5 text-sm font-bold text-navy transition hover:bg-goldhover"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
