// resources/js/Pages/Dashboard/Staff/Index.tsx

import { lazy, Suspense, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import { animate, stagger } from "animejs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import ResizableSplitGrid from "@/Components/Dashboard/Shared/ResizableSplitGrid";
import StatsGrid from "@/Components/Dashboard/Staff/Index/StatsGrid";
import RecentSubmissionsList from "@/Components/Dashboard/Staff/Index/RecentSubmissionsList";
import type { Stats } from "@/Components/Dashboard/Staff/Index/StatsGrid";
import type { TrendItem } from "@/Components/Dashboard/Staff/Index/SubmissionTrendChart";
import type { RecentSubmission } from "@/Components/Dashboard/Staff/Index/RecentSubmissionsList";
import type { PageProps } from "@/types";

// ── Lazy load charts (wajib sesuai build_rules) ───────────────────────────────
const StatusDistributionChart = lazy(
    () => import("@/Components/Dashboard/Staff/Index/StatusDistributionChart")
);
const SubmissionTrendChart = lazy(
    () => import("@/Components/Dashboard/Staff/Index/SubmissionTrendChart")
);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    stats:              Stats;
    submission_trend:   TrendItem[];
    recent_submissions: RecentSubmission[];
};

// ─────────────────────────────────────────────────────────────────────────────
// CHART SKELETON (Suspense fallback)
// ─────────────────────────────────────────────────────────────────────────────

function ChartSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-900
                        border border-slate-200 dark:border-white/5
                        rounded-2xl shadow-md overflow-hidden animate-pulse">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-white/10" />
                    <div className="space-y-1.5">
                        <div className="h-3.5 w-32 rounded-lg bg-slate-200 dark:bg-white/10" />
                        <div className="h-2.5 w-20 rounded-lg bg-slate-100 dark:bg-white/5" />
                    </div>
                </div>
            </div>
            <div className="p-6">
                <div className="h-[260px] rounded-xl bg-slate-100 dark:bg-white/5" />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function StaffIndex({ stats, submission_trend, recent_submissions }: Props) {
    const { auth } = usePage<PageProps>().props;

    useEffect(() => {
        // Header entrance
        animate(".staff-index-header", {
            opacity:    [0, 1],
            translateY: [16, 0],
            duration:   500,
            ease:       "outExpo",
        });
        // Section blocks stagger (charts + recent)
        animate(".staff-index-section", {
            opacity:    [0, 1],
            translateY: [24, 0],
            duration:   550,
            delay:      stagger(90, { start: 450 }),
            ease:       "outExpo",
        });
    }, []);

    return (
        <DashboardLayout>
            <Head title="Dashboard Staff" />

            <div className="flex flex-col gap-6 pb-8">

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="staff-index-header opacity-0 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl shrink-0
                                    bg-gradient-to-br from-emerald-500 to-teal-500
                                    flex items-center justify-center
                                    shadow-lg shadow-emerald-500/25">
                        <i className="fa-solid fa-gauge text-white text-sm" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold
                                       text-slate-800 dark:text-white leading-tight">
                            Dashboard Staff
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Selamat datang, {auth.user.name}
                        </p>
                    </div>
                </div>

                {/* ── Stats Grid ───────────────────────────────────────────── */}
                <StatsGrid stats={stats} />

                {/* ── Charts Row ───────────────────────────────────────────── */}
                <div className="staff-index-section opacity-0">
                    <ResizableSplitGrid
                        storageKey="staff-index-charts"
                        initialLeftWidth={500}
                        minLeftWidth={350}
                        maxLeftWidth={750}
                        left={
                            <Suspense fallback={<ChartSkeleton />}>
                                <StatusDistributionChart stats={stats} />
                            </Suspense>
                        }
                        right={
                            <Suspense fallback={<ChartSkeleton />}>
                                <SubmissionTrendChart data={submission_trend} />
                            </Suspense>
                        }
                    />
                </div>

                {/* ── Recent Submissions ───────────────────────────────────── */}
                <div className="staff-index-section opacity-0">
                    <RecentSubmissionsList
                        items={recent_submissions}
                        submittedCount={stats.submitted}
                    />
                </div>

            </div>
        </DashboardLayout>
    );
}