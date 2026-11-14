/* Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V4 */

import PublicExamQuestionWorkspace from '@/Components/Exam/Public/PublicExamQuestionWorkspace';
import PublicQuestionPalette from '@/Components/Exam/Public/PublicQuestionPalette';
import PublicGuestIdentityForm from '@/Components/Exam/Public/PublicGuestIdentityForm';
import PublicTokenLoginForm from '@/Components/Exam/Public/PublicTokenLoginForm';
import {
    useExamNavigation,
    useExamTimer,
    useFullscreenEnforcement,
} from '@/hooks/exam';
import type {
    ExamAnswerState,
    ExamAttemptState,
    ExamMeta,
    ExamQuestion,
} from '@/types/exam';
import { confirmExamSubmission } from '@/utils/swal';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

type Package = {
    id: number;
    title: string;
    subject_name: string;
    subject_id: number;
};
type AttemptSummary = {
    id: number;
    exam_public_subject_id: number;
    status: string;
    attempt_type: string;
    expires_at: string;
};
type Dashboard = {
    participant: { id: number; name: string; school_origin?: string };
    session: { title: string; order_type: string };
    packages: Package[];
    attempts: AttemptSummary[];
    result: {
        completed: boolean;
        subjects: {
            subject_id: number;
            primary_score: number | null;
            remedial_score: number | null;
            remedial_available: boolean;
        }[];
    };
};
type SessionInfo = {
    id: number;
    title: string;
    instructions: string | null;
    order_type: string;
};
type PublicAttempt = {
    attempt: {
        id: number;
        status: string;
        expires_at: string;
        total_questions: number;
        violations_count: number;
    };
    questions: Array<{
        id: number;
        question_text: string;
        options: Record<string, string | null>;
    }>;
    answers: Array<{
        exam_public_question_id: number;
        selected_option: string | null;
    }>;
};

const actionClass =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-black text-slate-950 transition hover:bg-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50';

export default function PublicExam() {
    const [token, setToken] = useState(
        () =>
            new URLSearchParams(window.location.search)
                .get('token')
                ?.toUpperCase() ?? '',
    );
    const [name, setName] = useState('');
    const [school, setSchool] = useState('');
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [participant, setParticipant] = useState<number | null>(null);
    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [workspace, setWorkspace] = useState<PublicAttempt | null>(null);
    const [activePackage, setActivePackage] = useState<Package | null>(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [serverTime, setServerTime] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('sentinel-theme') as
            | 'dark'
            | 'light'
            | null;
        const initial = saved ?? 'dark';
        document.documentElement.classList.toggle('dark', initial === 'dark');
        setTheme(initial);
        const updateClock = () => {
            const now = new Date();
            setServerTime(
                `${now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })} · ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' })} WIB`,
            );
        };
        updateClock();
        const interval = window.setInterval(updateClock, 1000);
        return () => window.clearInterval(interval);
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        localStorage.setItem('sentinel-theme', next);
        setTheme(next);
    };

    const run = async (operation: () => Promise<void>) => {
        setError('');
        setBusy(true);
        try {
            await operation();
        } catch (cause) {
            setError(
                axios.isAxiosError(cause)
                    ? (cause.response?.data?.message ?? 'Permintaan gagal.')
                    : 'Koneksi gagal. Coba lagi.',
            );
        } finally {
            setBusy(false);
        }
    };
    const verifyToken = useCallback(
        () =>
            run(async () => {
                setSession(
                    (
                        await axios.get<{ session: SessionInfo }>(
                            route('public-exam.session', {
                                token: token.trim().toUpperCase(),
                            }),
                        )
                    ).data.session,
                );
            }),
        [token],
    );
    const reloadDashboard = async (id: number) => {
        setDashboard(
            (
                await axios.get<Dashboard>(
                    route('public-exam.dashboard', { participant: id }),
                )
            ).data,
        );
    };
    const loadAttempt = async (id: number, pack?: Package) => {
        setWorkspace(
            (
                await axios.get<PublicAttempt>(
                    route('public-exam.attempt', { attempt: id }),
                )
            ).data,
        );
        if (pack) setActivePackage(pack);
    };

    useEffect(() => {
        if (token.length === 5) void verifyToken();
    }, []);
    useEffect(() => {
        const remembered = sessionStorage.getItem('public-exam-participant');
        if (remembered && /^\d+$/.test(remembered)) {
            const id = Number(remembered);
            reloadDashboard(id)
                .then(() => setParticipant(id))
                .catch(() =>
                    sessionStorage.removeItem('public-exam-participant'),
                );
        }
    }, []);

    const join = async (event: FormEvent) => {
        event.preventDefault();
        if (!session) return;
        await run(async () => {
            const storageKey = `public-exam-entry-${session.id}`;
            const entryKey =
                sessionStorage.getItem(storageKey) ?? crypto.randomUUID();
            sessionStorage.setItem(storageKey, entryKey);
            const id = Number(
                (
                    await axios.post(
                        route('public-exam.join', {
                            token: token.trim().toUpperCase(),
                        }),
                        {
                            name: name.trim(),
                            school_origin: school.trim(),
                            entry_key: entryKey,
                        },
                    )
                ).data.participant_id,
            );
            sessionStorage.setItem('public-exam-participant', String(id));
            await reloadDashboard(id);
            setParticipant(id);
        });
    };
    const start = async (pack: Package) => {
        if (!participant) return;
        await run(async () => {
            const attemptId = Number(
                (
                    await axios.post(
                        route('public-exam.start', {
                            participant,
                            package: pack.id,
                        }),
                    )
                ).data.attempt_id,
            );
            await loadAttempt(attemptId, pack);
        });
    };
    const submitExpired = async (attemptId: number) => {
        if (!participant) return;
        await run(async () => {
            await axios.post(
                route('public-exam.submit', { attempt: attemptId }),
            );
            await reloadDashboard(participant);
        });
    };
    const finish = async () => {
        if (!participant) return;
        setWorkspace(null);
        setActivePackage(null);
        await reloadDashboard(participant);
    };
    const pasteToken = async () => {
        try {
            const pasted = await navigator.clipboard.readText();
            setToken(pasted.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5));
        } catch {
            setError('Izin papan klip tidak tersedia. Silakan ketik token secara manual.');
        }
    };
    const submitToken = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void verifyToken();
    };

    const isDark = theme === 'dark';
    const portalCard = 'rounded-3xl border p-6 shadow-xl backdrop-blur-xl transition-colors sm:p-8';

    return (
        <div className={workspace ? 'min-h-screen' : `relative min-h-screen overflow-x-clip transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-white' : 'bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-slate-950'}`}>
            <Head title="Ujian Publik" />
            {!workspace && <>
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? '#f59e0b' : '#d97706'} 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[120px]" /><div className="absolute right-0 top-1/4 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[140px]" /><div className="absolute bottom-10 left-1/3 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[100px]" /></div>
                <header className={`sticky top-0 z-20 border-b backdrop-blur-md ${isDark ? 'border-white/10 bg-slate-900/80 shadow-2xl shadow-slate-950/20' : 'border-slate-200/80 bg-white/85 shadow-sm'}`}>
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
                        <div className="flex min-w-0 items-center gap-3"><img src="/assets/icons/brand/exam-logo.png" alt="Logo Pondok Modern Sabilurrosyad" className="h-12 w-12 shrink-0 rounded-xl border border-amber-500/30 bg-white/10 object-contain p-0.5 shadow-md shadow-amber-500/10" /><div className="min-w-0"><span className="block max-w-xs truncate bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-sm font-extrabold leading-tight tracking-wide text-transparent sm:max-w-xl sm:text-base">Pondok Modern Sabilurrosyad Muhammadiyah Banjarnegara</span><span className={`mt-1 inline-block rounded-md border px-2 py-0.5 text-[11px] font-bold ${isDark ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-amber-500/30 bg-amber-500/5 text-amber-700'}`}>Portal Ujian Masuk Santri Baru (SPMB)</span></div></div>
                        <div className="flex shrink-0 items-center gap-3 sm:gap-4"><div className="hidden text-right md:block"><span className={`block text-xs font-bold tracking-wide ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Waktu Server SPMB</span><span className={`mt-0.5 block font-mono text-[11px] font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}><i className="fa-regular fa-clock mr-1" aria-hidden="true" />{serverTime || 'Memuat waktu…'}</span></div><button type="button" onClick={toggleTheme} aria-label={`Aktifkan mode ${isDark ? 'terang' : 'gelap'}`} className={`flex min-h-10 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/30 ${isDark ? 'border-white/10 bg-slate-900 text-amber-300 hover:border-amber-500/40 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-800 hover:border-amber-600/40 hover:bg-slate-50'}`}><i className={`fa-solid ${isDark ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-600'}`} aria-hidden="true" /><span className="hidden sm:inline">Mode {isDark ? 'Terang' : 'Gelap'}</span></button></div>
                    </div>
                </header>
            </>}
            <main className={workspace ? '' : 'relative z-10 mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6'}>
                {!workspace && (
                    <section className="space-y-3.5 text-center"><span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-colors sm:text-sm ${isDark ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-amber-500/30 bg-amber-500/5 text-amber-700'}`}><i className="fa-solid fa-graduation-cap text-amber-500" aria-hidden="true" />Ujian Seleksi Masuk Santri Baru</span><h1 className={`text-3xl font-black leading-tight tracking-tight sm:text-5xl ${isDark ? 'text-white' : 'text-slate-950'}`}>Ruang Ujian <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">Online Santri</span></h1><p className={`mx-auto max-w-2xl text-sm leading-relaxed sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Selamat datang di ruang ujian seleksi Pondok Modern Sabilurrosyad Muhammadiyah Banjarnegara. Masukkan kode token dari pengawas ujian untuk memulai. Kerjakan dengan tenang, teliti, dan penuh kejujuran.</p></section>
                )}
                {!participant && !workspace && !session && (
                    <div className="mx-auto grid w-full max-w-4xl items-start gap-8 lg:grid-cols-12">
                        <div className="w-full lg:col-span-7">
                            <PublicTokenLoginForm
                                token={token}
                                themeMode={theme}
                                clientTime={serverTime}
                                busy={busy}
                                error={error}
                                onTokenChange={setToken}
                                onVerify={submitToken}
                                onPaste={() => void pasteToken()}
                            />
                        </div>
                        <PublicExamSecurityInfo isDark={isDark} />
                    </div>
                )}
                {!participant && !workspace && session && (
                    <div className="mx-auto w-full max-w-4xl">
                        <PublicGuestIdentityForm
                            session={session}
                            name={name}
                            school={school}
                            themeMode={theme}
                            busy={busy}
                            error={error}
                            onNameChange={setName}
                            onSchoolChange={setSchool}
                            onSubmit={join}
                            onChangeToken={() => {
                                setSession(null);
                                setError('');
                            }}
                        />
                    </div>
                )}
                {dashboard && !workspace && (
                    <DashboardView
                        dashboard={dashboard}
                        busy={busy}
                        start={start}
                        submitExpired={submitExpired}
                        loadAttempt={loadAttempt}
                    />
                )}
                {workspace && activePackage && dashboard && (
                    <PublicAttemptPanel
                        workspace={workspace}
                        packageInfo={activePackage}
                        sessionTitle={dashboard.session.title}
                        participantName={dashboard.participant.name}
                        error={error}
                        onComplete={finish}
                        onError={setError}
                    />
                )}
            </main>
        </div>
    );
}

function PublicExamSecurityInfo({ isDark }: { isDark: boolean }) {
    const [activeTab, setActiveTab] = useState<'flow' | 'answers' | 'conduct'>('flow');
    const card = isDark
        ? 'border-white/10 bg-slate-900/60 text-slate-300'
        : 'border-slate-200 bg-white text-slate-800';
    const title = isDark ? 'text-slate-100' : 'text-slate-900';
    const tabs: Array<{ id: typeof activeTab; label: string; icon: string }> = [
        { id: 'flow', label: 'Alur', icon: 'fa-route' },
        { id: 'answers', label: 'Jawaban', icon: 'fa-floppy-disk' },
        { id: 'conduct', label: 'Tertib', icon: 'fa-shield-halved' },
    ];

    return (
        <aside className="w-full space-y-4 lg:col-span-5" aria-label="Panduan ujian">
            <section className={`rounded-3xl border p-6 shadow-xl backdrop-blur-xl ${card}`}>
                <h2 className={`mb-4 flex items-center gap-2 border-b pb-3.5 text-sm font-extrabold uppercase tracking-wider ${isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-950'}`}>
                    <i className="fa-solid fa-circle-question text-base text-amber-500" aria-hidden="true" />Panduan Mengerjakan Ujian
                </h2>
                <div className="mb-5 grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 p-1.5 dark:border-white/5 dark:bg-slate-950/70" role="tablist" aria-label="Panduan ujian">
                    {tabs.map((tab) => <button key={tab.id} id={`public-guide-tab-${tab.id}`} type="button" role="tab" aria-controls="public-guide-panel" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${activeTab === tab.id ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}><i className={`fa-solid ${tab.icon} text-sm`} aria-hidden="true" /><span>{tab.label}</span></button>)}
                </div>
                <div id="public-guide-panel" role="tabpanel" aria-labelledby={`public-guide-tab-${activeTab}`} className="min-h-[200px] space-y-4">
                    {activeTab === 'flow' && <><p className="text-xs leading-relaxed text-slate-400">Ikuti 3 langkah berikut untuk memulai ujian:</p><ol className="relative mt-2 space-y-4 border-l-2 border-amber-500/30 pl-6">{[
                        ['Tempel / Ketik Token', 'Masukkan 5 karakter token yang diberikan pengawas ujian.'],
                        ['Lengkapi Nama & Sekolah', 'Isi nama lengkap dan asal sekolah dengan benar.'],
                        ['Kerjakan dengan Tenang', 'Ikuti petunjuk di layar dan selesaikan setiap mapel.'],
                    ].map(([heading, copy], index) => <li key={heading} className="relative"><span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-slate-950">{index + 1}</span><h3 className={`text-sm font-bold ${title}`}>{heading}</h3><p className="mt-1 text-xs text-slate-400">{copy}</p></li>)}</ol></>}
                    {activeTab === 'answers' && <div className="space-y-4">{[
                        ['fa-cloud-arrow-up', 'Jawaban Tersimpan', 'Jawaban disimpan ke server saat kamu memilih opsi.'],
                        ['fa-wifi', 'Periksa Koneksi', 'Pastikan koneksi internet stabil selama ujian berlangsung.'],
                        ['fa-rotate-right', 'Sesi Dapat Dilanjutkan', 'Jika terputus, masuk kembali dengan perangkat dan sesi yang sama.'],
                    ].map(([icon, heading, copy]) => <div key={heading} className="flex items-start gap-3.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/15 text-emerald-500"><i className={`fa-solid ${icon}`} aria-hidden="true" /></span><div><h3 className={`text-sm font-bold ${title}`}>{heading}</h3><p className="mt-1 text-xs leading-relaxed text-slate-400">{copy}</p></div></div>)}</div>}
                    {activeTab === 'conduct' && <div className="space-y-4">{[
                        ['fa-expand', 'Mode Layar Penuh', 'Ujian berjalan dalam layar penuh untuk membantu menjaga fokus.'],
                        ['fa-shield-halved', 'Jaga Ketertiban', 'Jangan membuka tab lain atau menggunakan bantuan yang tidak diizinkan.'],
                    ].map(([icon, heading, copy]) => <div key={heading} className="flex items-start gap-3.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/15 text-amber-500"><i className={`fa-solid ${icon}`} aria-hidden="true" /></span><div><h3 className={`text-sm font-bold ${title}`}>{heading}</h3><p className="mt-1 text-xs leading-relaxed text-slate-400">{copy}</p></div></div>)}</div>}
                </div>
            </section>
            <section className={`rounded-2xl border p-4 text-xs leading-relaxed ${isDark ? 'border-white/5 bg-slate-900/30 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-600'}`}><h3 className="mb-1 flex items-center gap-1.5 font-bold text-amber-500"><i className="fa-solid fa-lightbulb" aria-hidden="true" />Tips Ujian Lancar</h3><ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] sm:text-xs"><li>Gunakan browser versi terbaru.</li><li>Pastikan baterai perangkat terisi penuh atau tersambung ke pengisi daya.</li><li>Awali pengerjaan dengan membaca Basmalah dan berdoa.</li></ul></section>
        </aside>
    );
}

function DashboardView({
    dashboard,
    busy,
    start,
    submitExpired,
    loadAttempt,
}: {
    dashboard: Dashboard;
    busy: boolean;
    start: (pack: Package) => Promise<void>;
    submitExpired: (attemptId: number) => Promise<void>;
    loadAttempt: (id: number, pack?: Package) => Promise<void>;
}) {
    return (
        <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                    Peserta
                </p>
                <h2 className="mt-1 text-xl font-black">
                    {dashboard.participant.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {dashboard.participant.school_origin} ·{' '}
                    {dashboard.session.title}
                </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {dashboard.packages.map((pack, index) => {
                    const attempts = dashboard.attempts.filter(
                        (item) =>
                            item.exam_public_subject_id === pack.subject_id,
                    );
                    const active = attempts.find(
                        (item) =>
                            item.status === 'in_progress' &&
                            new Date(item.expires_at).getTime() > Date.now(),
                    );
                    const expired = attempts.find(
                        (item) =>
                            item.status === 'in_progress' &&
                            new Date(item.expires_at).getTime() <= Date.now(),
                    );
                    const completed = attempts.some(
                        (item) =>
                            item.attempt_type === 'primary' &&
                            item.status !== 'in_progress',
                    );
                    const result = dashboard.result.subjects.find(
                        (item) => item.subject_id === pack.subject_id,
                    );
                    const locked =
                        dashboard.session.order_type === 'sequential' &&
                        dashboard.packages
                            .slice(0, index)
                            .some(
                                (previous) =>
                                    !dashboard.attempts.some(
                                        (item) =>
                                            item.exam_public_subject_id ===
                                                previous.subject_id &&
                                            item.attempt_type === 'primary' &&
                                            item.status !== 'in_progress',
                                    ),
                            );
                    return (
                        <article
                            key={pack.id}
                            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                                        Mapel {index + 1}
                                    </p>
                                    <h3 className="mt-1 text-lg font-black">
                                        {pack.subject_name}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {pack.title}
                                    </p>
                                </div>
                                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-white/10">
                                    {expired
                                        ? 'Waktu habis'
                                        : completed
                                          ? 'Selesai'
                                          : 'Belum mulai'}
                                </span>
                            </div>
                            {result?.primary_score !== null &&
                                result?.primary_score !== undefined && (
                                    <p className="mt-4 text-sm font-bold text-amber-600 dark:text-amber-300">
                                        Nilai: {result.primary_score}%
                                    </p>
                                )}
                            <button
                                type="button"
                                disabled={
                                    busy || (!active && !expired && locked)
                                }
                                onClick={() =>
                                    active
                                        ? void loadAttempt(active.id, pack)
                                        : expired
                                          ? void submitExpired(expired.id)
                                          : void start(pack)
                                }
                                className={`${actionClass} mt-5 w-full`}
                            >
                                {active
                                    ? 'Lanjutkan ujian'
                                    : expired
                                      ? 'Kumpulkan mapel yang berakhir'
                                      : locked
                                        ? 'Selesaikan mapel sebelumnya'
                                        : result?.remedial_available
                                          ? 'Kerjakan ulang'
                                          : 'Mulai mapel'}
                            </button>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

function PublicAttemptPanel({
    workspace,
    packageInfo,
    sessionTitle,
    participantName,
    error,
    onComplete,
    onError,
}: {
    workspace: PublicAttempt;
    packageInfo: Package;
    sessionTitle: string;
    participantName: string;
    error: string;
    onComplete: () => Promise<void>;
    onError: (message: string) => void;
}) {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    useEffect(() => {
        const saved = localStorage.getItem('sentinel-theme') as
            | 'dark'
            | 'light'
            | null;
        const initial =
            saved ??
            (document.documentElement.classList.contains('dark')
                ? 'dark'
                : 'light');

        document.documentElement.classList.toggle('dark', initial === 'dark');
        setTheme(initial);
    }, []);
    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        localStorage.setItem('sentinel-theme', next);
        setTheme(next);
    };
    const questions: ExamQuestion[] = workspace.questions.map((question) => ({
        ...question,
        point: 1,
        difficulty: '-',
    }));
    const initialAnswers: Record<string, ExamAnswerState> = Object.fromEntries(
        workspace.answers.map((answer) => [
            answer.exam_public_question_id,
            {
                question_id: answer.exam_public_question_id,
                selected_option: answer.selected_option,
                is_marked_for_review: false,
                saved_at: null,
            },
        ]),
    );
    const [attemptState, setAttemptState] = useState<ExamAttemptState>(() =>
        mapAttempt(workspace.attempt),
    );
    const [saveState, setSaveState] = useState<
        'idle' | 'saving' | 'saved' | 'failed' | 'locked'
    >('idle');
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const {
        activeIndex,
        activeQuestion,
        answeredCount,
        answerMap,
        setActiveIndex,
        goNext,
        goPrev,
        updateAnswer,
        patchAnswer,
        saveTimers,
    } = useExamNavigation({ questions, initialAnswers });
    const markedCount = questions.filter(
        (question) => answerMap[question.id]?.is_marked_for_review,
    ).length;
    const exam: ExamMeta = {
        session_id: 0,
        session_title: 'Ujian Publik',
        package_title: packageInfo.title,
        subject_name: packageInfo.subject_name,
        duration_minutes: null,
        passing_score: null,
        show_result_to_candidate: false,
    };
    const isRunning =
        attemptState.status === 'in_progress' &&
        !attemptState.is_locked &&
        questions.length > 0;
    const {
        isFullscreen,
        needsInitialFullscreen,
        violationsCount,
        enterFullscreen,
    } = useFullscreenEnforcement({
        isRunning,
        attemptId: workspace.attempt.id,
        violationRoute: route('public-exam.violation', {
            attempt: workspace.attempt.id,
        }),
        initialViolations: workspace.attempt.violations_count,
    });
    const syncAttempt = useCallback(async () => {
        try {
            const response = await axios.get<PublicAttempt>(
                route('public-exam.attempt', { attempt: workspace.attempt.id }),
            );
            const next = mapAttempt(response.data.attempt);
            setAttemptState(next);
            if (next.status !== 'in_progress') {
                setSaveState('locked');
                setSaveMessage('Ujian sudah dikunci oleh server.');
            }
        } catch {
            setSaveState('failed');
            setSaveMessage('Gagal sinkronisasi waktu server.');
        }
    }, [workspace.attempt.id]);
    const { remaining } = useExamTimer({
        attempt: attemptState,
        isRunning,
        onExpired: () => void syncAttempt(),
        onSync: syncAttempt,
    });
    const persist = useCallback(
        async (answer: ExamAnswerState) => {
            setSaveState('saving');
            setSaveMessage('Menyimpan jawaban…');
            try {
                await axios.post(
                    route('public-exam.answer', {
                        attempt: workspace.attempt.id,
                    }),
                    {
                        question_id: answer.question_id,
                        selected_option: answer.selected_option,
                    },
                );
                setSaveState('saved');
                setSaveMessage('Jawaban tersimpan');
            } catch (cause) {
                setSaveState('failed');
                setSaveMessage(
                    axios.isAxiosError(cause)
                        ? (cause.response?.data?.message ??
                              'Gagal menyimpan jawaban.')
                        : 'Gagal menyimpan jawaban.',
                );
            }
        },
        [workspace.attempt.id],
    );
    const changeAnswer = (
        questionId: number,
        patch: Partial<ExamAnswerState>,
    ) => {
        if (!isRunning) return;
        const next = patchAnswer(questionId, patch);
        if (saveTimers.current[questionId])
            window.clearTimeout(saveTimers.current[questionId]);
        saveTimers.current[questionId] = window.setTimeout(
            () => void persist(next),
            500,
        );
    };
    const submit = async () => {
        if (
            !(await confirmExamSubmission({
                answeredCount,
                totalQuestions: questions.length,
            }))
        )
            return;
        try {
            await axios.post(
                route('public-exam.submit', { attempt: workspace.attempt.id }),
            );
            await onComplete();
        } catch (cause) {
            onError(
                axios.isAxiosError(cause)
                    ? (cause.response?.data?.message ??
                          'Gagal mengumpulkan ujian.')
                    : 'Gagal mengumpulkan ujian.',
            );
        }
    };
    const activeAnswer = activeQuestion ? answerMap[activeQuestion.id] : null;
    return (
        <div
            className={
                theme === 'dark'
                    ? 'min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-white'
                    : 'min-h-screen bg-slate-100 text-slate-900 selection:bg-amber-500 selection:text-slate-950'
            }
        >
            <Head
                title={`Ruang Ujian - ${sessionTitle} - Pondok Modern Sabilurrosyad`}
            />

            {needsInitialFullscreen && isRunning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-md">
                    <section className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-6 text-center shadow-2xl">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                            <i className="fa-solid fa-expand text-2xl" />
                        </div>
                        <h2 className="mt-4 text-lg font-black text-white">
                            Mode layar penuh diperlukan
                        </h2>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">
                            Untuk menjaga integritas ujian, kerjakan dalam mode
                            layar penuh. Sistem mencatat saat Anda keluar dari
                            mode ini atau berpindah tab.
                        </p>
                        <button
                            type="button"
                            onClick={enterFullscreen}
                            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/30"
                        >
                            <i className="fa-solid fa-maximize" /> Masuk layar
                            penuh &amp; mulai ujian
                        </button>
                    </section>
                </div>
            )}

            <header
                className={
                    theme === 'dark'
                        ? 'sticky top-0 z-30 border-b border-white/10 bg-slate-900/90 px-4 py-3 text-white backdrop-blur-md sm:px-6'
                        : 'sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 text-slate-900 shadow-sm backdrop-blur-md sm:px-6'
                }
            >
                <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <img
                            src="/assets/icons/brand/exam-logo.png"
                            alt="Logo Pondok"
                            className="h-11 w-11 shrink-0 rounded-xl border border-amber-500/30 bg-white/10 object-contain p-0.5 shadow-sm dark:bg-white/5"
                        />
                        <div className="min-w-0">
                            <span className="block max-w-xs truncate bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-xs font-extrabold tracking-wide text-transparent sm:max-w-md sm:text-sm md:max-w-xl">
                                Pondok Modern Sabilurrosyad Muhammadiyah
                                Banjarnegara
                            </span>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <h1 className="truncate text-xs font-black sm:text-sm">
                                    {sessionTitle}
                                </h1>
                                <span
                                    className={
                                        theme === 'dark'
                                            ? 'truncate text-[11px] text-slate-400'
                                            : 'truncate text-[11px] text-slate-600'
                                    }
                                >
                                    · Peserta:{' '}
                                    <strong className="text-amber-500">
                                        {participantName}
                                    </strong>{' '}
                                    ({packageInfo.subject_name})
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            title="Beralih tema tampilan"
                            className={
                                theme === 'dark'
                                    ? 'inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs font-bold text-amber-300 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30'
                                    : 'inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30'
                            }
                        >
                            <i
                                className={`fa-solid ${theme === 'dark' ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-500'}`}
                            />
                            <span className="hidden sm:inline">
                                {theme === 'dark'
                                    ? 'Mode terang'
                                    : 'Mode gelap'}
                            </span>
                        </button>
                        <div
                            className={
                                remaining <= 300
                                    ? 'animate-pulse rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-2 text-center text-red-500'
                                    : theme === 'dark'
                                      ? 'rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-center text-white'
                                      : 'rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-center text-slate-900'
                            }
                        >
                            <p
                                className={
                                    theme === 'dark'
                                        ? 'text-[9px] font-bold uppercase tracking-wider text-slate-400'
                                        : 'text-[9px] font-bold uppercase tracking-wider text-slate-500'
                                }
                            >
                                Sisa waktu
                            </p>
                            <p className="font-mono text-base font-black text-amber-500">
                                {formatTime(remaining)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={submit}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 sm:px-5"
                        >
                            <i className="fa-solid fa-paper-plane text-xs" />{' '}
                            <span className="hidden sm:inline">
                                Kumpulkan ujian
                            </span>
                            <span className="sm:hidden">Kumpulkan</span>
                        </button>
                    </div>
                </div>
                {saveMessage && (
                    <p
                        className={
                            saveState === 'failed'
                                ? 'mx-auto mt-1 max-w-7xl text-right text-[11px] font-medium text-red-500'
                                : 'mx-auto mt-1 max-w-7xl text-right text-[11px] font-medium text-amber-500'
                        }
                    >
                        {saveMessage}
                    </p>
                )}
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                {!isFullscreen && !needsInitialFullscreen && isRunning && (
                    <div
                        role="alert"
                        className="mb-4 flex items-center gap-3 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-xs text-orange-700 dark:text-orange-300"
                    >
                        <i className="fa-solid fa-triangle-exclamation shrink-0" />
                        <span className="flex-1">
                            <strong>Peringatan:</strong> Anda sedang tidak dalam
                            mode layar penuh. Pelanggaran tercatat:{' '}
                            {violationsCount}.
                        </span>
                        <button
                            type="button"
                            onClick={enterFullscreen}
                            className="shrink-0 rounded-lg border border-orange-500/30 bg-orange-500/20 px-3 py-1.5 text-[10px] font-bold transition hover:bg-orange-500/30"
                        >
                            <i className="fa-solid fa-maximize mr-1" /> Kembali
                            layar penuh
                        </button>
                    </div>
                )}
                {error && (
                    <div
                        role="alert"
                        className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-300"
                    >
                        <i className="fa-solid fa-triangle-exclamation mr-2" />
                        {error}
                    </div>
                )}
                {!activeQuestion ? (
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
                        Tidak ada soal aktif.
                    </section>
                ) : (
                    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                        <PublicExamQuestionWorkspace
                            activeQuestion={activeQuestion}
                            activeAnswer={activeAnswer}
                            activeIndex={activeIndex}
                            totalQuestions={questions.length}
                            themeMode={theme}
                            changeAnswer={changeAnswer}
                            goPrev={goPrev}
                            goNext={goNext}
                        />
                        <div className="mt-6 xl:hidden">
                            <PublicQuestionPalette
                                questions={questions}
                                answerMap={answerMap}
                                activeIndex={activeIndex}
                                answeredCount={answeredCount}
                                markedCount={markedCount}
                                themeMode={theme}
                                setActiveIndex={setActiveIndex}
                            />
                        </div>
                        <aside className="hidden xl:block">
                            <PublicQuestionPalette
                                questions={questions}
                                answerMap={answerMap}
                                activeIndex={activeIndex}
                                answeredCount={answeredCount}
                                markedCount={markedCount}
                                themeMode={theme}
                                setActiveIndex={setActiveIndex}
                            />
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}

function mapAttempt(attempt: PublicAttempt['attempt']): ExamAttemptState {
    return {
        id: attempt.id,
        status: attempt.status,
        attempt_number: 1,
        started_at: null,
        started_at_iso: null,
        expires_at: attempt.expires_at,
        expires_at_iso: attempt.expires_at,
        submitted_at: null,
        remaining_seconds: Math.max(
            0,
            Math.floor(
                (new Date(attempt.expires_at).getTime() - Date.now()) / 1000,
            ),
        ),
        is_locked: attempt.status !== 'in_progress',
        total_questions: attempt.total_questions,
        answered_questions: 0,
        blank_questions: attempt.total_questions,
        score_visible: false,
        percentage_score: null,
        passing_score: null,
        passed: null,
    };
}

function formatTime(seconds: number): string {
    const safe = Math.max(0, seconds);
    return [Math.floor(safe / 3600), Math.floor((safe % 3600) / 60), safe % 60]
        .map((value) => value.toString().padStart(2, '0'))
        .join(':');
}
