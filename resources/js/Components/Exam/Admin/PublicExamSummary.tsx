import { useEffect, useId, useRef } from "react";

type Metric = { label: string; value: number | string; description: string; selected?: boolean; onClick?: () => void; tone?: "success" | "warning" };
type Props = { title: string; value: number; label: string; description: string; items: Metric[]; progress?: { value: number; total: number; label: string } };

// Hallmark · public summary · Sentinel amber/slate · stagger, press, selection.
export default function PublicExamSummary({ title, value, label, description, items, progress }: Props) {
    const headingId = useId();
    const root = useRef<HTMLElement>(null);
    const percent = progress && progress.total > 0 ? Math.min(100, Math.max(0, Math.round(progress.value / progress.total * 100))) : 0;
    useEffect(() => {
        const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (preference.matches) return;
        const animations = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-summary-reveal]") ?? []).map((element, index) =>
            element.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 420, delay: index * 70, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" }),
        );
        const cancel = () => animations.forEach(animation => animation.cancel());
        preference.addEventListener("change", cancel);
        return () => { cancel(); preference.removeEventListener("change", cancel); };
    }, []);

    return <section ref={root} aria-labelledby={headingId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="grid min-w-0 lg:grid-cols-3">
            <div className="border-b border-amber-200 bg-amber-50 p-5 sm:p-6 lg:border-b-0 lg:border-r dark:border-amber-400/20 dark:bg-amber-400/5">
                <h2 id={headingId} className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                <p data-summary-reveal className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="break-all font-display text-5xl font-semibold tracking-tight tabular-nums text-slate-950 dark:text-white">{value.toLocaleString("id-ID")}</span><span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span></p>
                <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-400">{description}</p>
            </div>
            <div className="min-w-0 p-5 sm:p-6 lg:col-span-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {items.map(item => {
                        const content = <><span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span><span className={`mt-2 block break-words font-display text-3xl font-semibold tracking-tight tabular-nums ${item.tone === "success" ? "text-emerald-700 dark:text-emerald-400" : item.tone === "warning" ? "text-amber-800 dark:text-amber-300" : "text-slate-900 dark:text-white"}`}>{typeof item.value === "number" ? item.value.toLocaleString("id-ID") : item.value}</span><span className="mt-3 flex items-center justify-between gap-2 text-xs leading-5 text-slate-600 dark:text-slate-400"><span>{item.selected ? "Filter aktif · klik untuk reset" : item.description}</span>{item.onClick && <i aria-hidden="true" className={`fa-solid ${item.selected ? "fa-check" : "fa-arrow-right motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover/stat:translate-x-1 motion-safe:group-focus-visible/stat:translate-x-1"}`} />}</span></>;
                        return <div data-summary-reveal key={item.label} className="min-w-0">{item.onClick ? <button type="button" aria-pressed={item.selected ?? false} onClick={item.onClick} className={`group/stat h-full w-full rounded-xl border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:focus-visible:-translate-y-1 motion-safe:active:translate-y-0 ${item.selected ? "border-amber-400 bg-amber-50 dark:border-amber-400/60 dark:bg-amber-400/10" : "border-slate-200 bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-500"}`}>{content}</button> : <div className="p-3">{content}</div>}</div>;
                    })}
                </div>
                {progress && <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800"><div className="flex flex-wrap justify-between gap-2 text-xs text-slate-600 dark:text-slate-400"><span>{progress.label}</span><span className="font-semibold tabular-nums">{percent}%</span></div><div role="meter" aria-label={progress.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full origin-left rounded-full bg-emerald-500 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out" style={{ transform: `scaleX(${percent / 100})` }} /></div></div>}
            </div>
        </div>
    </section>;
}
