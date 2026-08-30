import { useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import GoldPageHeader from "@/Components/Dashboard/Candidate/Panel/GoldPageHeader";
import StatusPill from "@/Components/Dashboard/Candidate/Panel/StatusPill";

type HelpLink = {
    label: string;
    href: string;
};

type HelpTopic = {
    key: string;
    title: string;
    description: string;
    links: HelpLink[];
};

type HelpChannel = {
    key: string;
    label: string;
    description: string;
    icon: string;
    href: string;
    tone: "gold" | "blue" | "slate";
};

type HelpFaq = {
    question: string;
    answer: string;
};

type HelpCenter = {
    identity: {
        name: string;
        email: string;
        candidate_code: string | null;
        status: string | null;
    };
    primary_help: {
        title: string;
        description: string;
        href: string;
        label: string;
        icon: string;
    };
    channels: HelpChannel[];
    topics: HelpTopic[];
    faqs: HelpFaq[];
};

type Props = {
    help_center: HelpCenter;
};

const CHANNEL_CLASS: Record<HelpChannel["tone"], string> = {
    gold: "bg-gold/10 text-amber-700 dark:text-gold",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
};

export default function CandidateHelp({ help_center }: Props) {
    useEffect(() => {
        animate(".candidate-panel-entry", {
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 520,
            delay: stagger(55),
            ease: "outExpo",
        });
    }, []);

    return (
        <>
            <Head title="Bantuan" />

            <div className="flex flex-col gap-5 pb-8">
                <GoldPageHeader
                    eyebrow="Candidate Help"
                    title="Bantuan"
                    description="Pusat bantuan ringkas untuk memahami langkah pendaftaran, berkas, pembayaran, dan seleksi tanpa keluar dari portal."
                    icon="fa-solid fa-headset"
                    action={{
                        label: help_center.primary_help.label,
                        href: help_center.primary_help.href,
                        icon: help_center.primary_help.icon,
                    }}
                />

                <section className="candidate-panel-entry rounded-2xl border border-gold/20 bg-white p-5 shadow-sm dark:border-gold/15 dark:bg-slate-900 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <StatusPill tone="gold" label={help_center.identity.status ?? "Candidate"} />
                            <h2 className="mt-3 text-lg font-display font-bold text-slate-900 dark:text-white">
                                {help_center.primary_help.title}
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                {help_center.primary_help.description}
                            </p>
                        </div>
                        <Link
                            href={help_center.primary_help.href}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-navy transition hover:bg-goldhover"
                        >
                            <i className={`${help_center.primary_help.icon} text-xs`} />
                            {help_center.primary_help.label}
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    {help_center.channels.map((channel) => (
                        <Link
                            key={channel.key}
                            href={channel.href}
                            className="candidate-panel-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-gold/40 hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-900"
                        >
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${CHANNEL_CLASS[channel.tone]}`}>
                                <i className={`${channel.icon} text-sm`} />
                            </div>
                            <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{channel.label}</h3>
                            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{channel.description}</p>
                        </Link>
                    ))}
                </section>

                <section className="candidate-panel-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
                    <div className="mb-5">
                        <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Panduan Cepat</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Langsung lompat ke halaman yang sesuai dengan kebutuhanmu.</p>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-3">
                        {help_center.topics.map((topic) => (
                            <div key={topic.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{topic.title}</h3>
                                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{topic.description}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {topic.links.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="inline-flex min-h-9 items-center rounded-lg border border-gold/30 px-3 text-xs font-bold text-amber-700 transition hover:border-gold hover:bg-gold/10 dark:text-gold"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="candidate-panel-entry rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
                    <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">FAQ</h2>
                    <div className="mt-4 divide-y divide-slate-200 dark:divide-white/10">
                        {help_center.faqs.map((faq) => (
                            <div key={faq.question} className="py-4 first:pt-0 last:pb-0">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{faq.question}</h3>
                                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

CandidateHelp.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
