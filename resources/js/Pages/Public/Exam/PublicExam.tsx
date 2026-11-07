import { Head } from "@inertiajs/react";
import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
import RichExamText from "@/Components/Exam/Shared/RichExamText";

type Package = { id: number; title: string; subject_name: string; subject_id: number };
type Attempt = { id: number; exam_public_subject_id: number; status: string; attempt_type: string };
type Result = { completed: boolean; average_score: number | null; is_passed: boolean | null; subjects: { subject_id: number; primary_score: number | null; remedial_score: number | null; remedial_available: boolean }[] };
type Dashboard = { participant: { id: number; name: string }; session: { title: string; order_type: string }; packages: Package[]; attempts: Attempt[]; result: Result };
type Question = { id: number; question_text: string; options: Record<string, string> };
type Workspace = { attempt: { id: number; status: string; expires_at: string; total_questions: number }; questions: Question[]; answers: { exam_public_question_id: number; selected_option: string | null }[] };
const input = "w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none";
const action = "rounded-xl bg-amber-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-50";

export default function PublicExam() {
    const [token, setToken] = useState("");
    const [code, setCode] = useState("");
    const [session, setSession] = useState<{ title: string } | null>(null);
    const [participant, setParticipant] = useState<number | null>(null);
    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [activeQuestion, setActiveQuestion] = useState(0);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [remaining, setRemaining] = useState(0);

    const reloadDashboard = async (id: number) => {
        const response = await axios.get<Dashboard>(route("public-exam.dashboard", { participant: id }));
        setDashboard(response.data);
    };
    const loadAttempt = async (id: number) => {
        const response = await axios.get<Workspace>(route("public-exam.attempt", { attempt: id }));
        setWorkspace(response.data);
        setActiveQuestion(0);
        setAnswers(Object.fromEntries(response.data.answers.filter(item => item.selected_option).map(item => [item.exam_public_question_id, item.selected_option!]))) ;
    };
    useEffect(() => {
        const remembered = sessionStorage.getItem("public-exam-participant");
        if (remembered && /^\d+$/.test(remembered)) {
            const id = Number(remembered);
            reloadDashboard(id).then(() => setParticipant(id)).catch(() => { sessionStorage.removeItem("public-exam-participant"); });
        }
    }, []);
    useEffect(() => {
        if (!workspace || workspace.attempt.status !== "in_progress") return;
        const tick = () => setRemaining(Math.max(0, Math.ceil((new Date(workspace.attempt.expires_at).getTime() - Date.now()) / 1000)));
        tick(); const interval = window.setInterval(tick, 1000);
        return () => window.clearInterval(interval);
    }, [workspace]);
    const run = async (actionFn: () => Promise<void>) => {
        setError(""); setBusy(true);
        try { await actionFn(); }
        catch (cause) { setError(axios.isAxiosError(cause) ? (cause.response?.data?.message ?? "Permintaan gagal.") : "Koneksi gagal. Coba lagi."); }
        finally { setBusy(false); }
    };
    const verify = (event: FormEvent) => { event.preventDefault(); void run(async () => {
        const response = await axios.get(route("public-exam.session", { token: token.trim().toUpperCase() }));
        setSession(response.data.session);
    }); };
    const join = (event: FormEvent) => { event.preventDefault(); void run(async () => {
        const response = await axios.post(route("public-exam.join", { token: token.trim().toUpperCase() }), { participant_code: code.trim().toUpperCase() });
        const id = Number(response.data.participant_id);
        await reloadDashboard(id);
        setParticipant(id);
        sessionStorage.setItem("public-exam-participant", String(id));
    }); };
    const start = (id: number) => { if (!participant) return; void run(async () => {
        const response = await axios.post(route("public-exam.start", { participant, package: id }));
        await loadAttempt(Number(response.data.attempt_id));
    }); };
    const answer = (question: Question, choice: string) => { if (!workspace) return; void run(async () => {
        await axios.post(route("public-exam.answer", { attempt: workspace.attempt.id }), { question_id: question.id, selected_option: choice });
        setAnswers(current => ({ ...current, [question.id]: choice }));
    }); };
    const submit = () => { if (!workspace || !participant || !window.confirm("Kumpulkan jawaban mapel ini?")) return; void run(async () => {
        await axios.post(route("public-exam.submit", { attempt: workspace.attempt.id }));
        setWorkspace(null);
        await reloadDashboard(participant);
    }); };

    const active = workspace?.questions[activeQuestion];
    return <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6"><Head title="Ujian Publik" /><main className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl border border-amber-500/20 bg-slate-900 p-6"><span className="text-sm font-bold text-amber-400">Seleksi Masuk · Ujian Publik</span><h1 className="text-3xl font-black">Ruang Ujian Online</h1><p className="mt-2 text-sm text-slate-300">Empat mata pelajaran, satu per satu. Jawaban tersimpan di server.</p></header>
        {error && <p role="alert" className="rounded-xl border border-red-500 p-4 text-red-300">{error}</p>}
        {!participant && !session && <form onSubmit={verify} className="space-y-4 rounded-3xl border border-white/10 bg-slate-900 p-6"><h2 className="text-lg font-bold">Masukkan token ruang</h2><input className={input} required aria-label="Token ruang" value={token} onChange={e => setToken(e.target.value)} /><button className={action} disabled={busy}>Periksa token</button></form>}
        {!participant && session && <form onSubmit={join} className="space-y-4 rounded-3xl border border-white/10 bg-slate-900 p-6"><h2 className="text-lg font-bold">{session.title}</h2><p className="text-sm text-slate-300">Masukkan kode peserta yang diberikan sekolah. Kode hanya dapat digunakan sekali.</p><input className={input} required aria-label="Kode peserta" maxLength={16} value={code} onChange={e => setCode(e.target.value)} /><button className={action} disabled={busy}>Masuk ujian</button></form>}
        {dashboard && !workspace && <section className="space-y-5"><div className="rounded-2xl border border-white/10 bg-slate-900 p-5"><h2 className="text-xl font-bold">{dashboard.participant.name} · {dashboard.session.title}</h2><p className="text-sm text-slate-400">Urutan {dashboard.session.order_type === "sequential" ? "wajib berurutan" : "bebas memilih"}.</p></div><div className="grid gap-4 sm:grid-cols-2">{dashboard.packages.map((pack, index) => {
            const attempts = dashboard.attempts.filter(item => item.exam_public_subject_id === pack.subject_id);
            const activeAttempt = attempts.find(item => item.status === "in_progress");
            const primary = attempts.find(item => item.attempt_type === "primary" && item.status !== "in_progress");
            const eligible = dashboard.result.subjects.find(item => item.subject_id === pack.subject_id)?.remedial_available;
            const locked = dashboard.session.order_type === "sequential" && dashboard.packages.slice(0, index).some(previous => !dashboard.attempts.some(item => item.exam_public_subject_id === previous.subject_id && item.attempt_type === "primary" && item.status !== "in_progress"));
            return <article key={pack.id} className="space-y-3 rounded-2xl border border-white/10 bg-slate-900 p-5"><h3 className="text-lg font-bold">{pack.subject_name}</h3><p className="text-sm text-slate-300">{pack.title} · {primary ? "Sudah dikerjakan" : "Belum dikerjakan"}</p><button type="button" className={action} disabled={busy || (!activeAttempt && (locked || (!!primary && !eligible)))} onClick={() => activeAttempt ? void run(() => loadAttempt(activeAttempt.id)) : start(pack.id)}>{activeAttempt ? "Lanjutkan / kumpulkan" : eligible ? "Remedial" : primary ? "Selesai" : locked ? "Selesaikan mapel sebelumnya" : "Mulai mapel"}</button></article>;
        })}</div>{dashboard.result.completed && <div className="rounded-2xl border border-amber-500/20 bg-slate-900 p-5"><h2 className="text-xl font-bold">Rata-rata: {dashboard.result.average_score}%</h2><p className="text-sm text-slate-300">{dashboard.result.is_passed ? "Lulus" : "Belum lulus"}</p><ul className="mt-3 space-y-1 text-sm">{dashboard.packages.map(pack => { const score = dashboard.result.subjects.find(item => item.subject_id === pack.subject_id); return <li key={pack.id}>{pack.subject_name}: awal {score?.primary_score ?? "—"}, remedial {score?.remedial_score ?? "—"}</li>; })}</ul></div>}</section>}
        {workspace && <section className="space-y-5 rounded-3xl border border-white/10 bg-slate-900 p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">Soal {activeQuestion + 1} / {workspace.questions.length}</h2><p role="timer" className="font-bold text-amber-400">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</p></div>
            {active ? <><div className="text-lg font-medium"><RichExamText text={active.question_text} /></div><div className="space-y-3">{Object.entries(active.options).map(([key, value]) => <button key={key} type="button" disabled={busy || remaining === 0} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${answers[active.id] === key ? "border-amber-500 bg-amber-500/20" : "border-white/10 bg-slate-950"}`} onClick={() => answer(active, key)}><strong>{key}.</strong><RichExamText text={value} /></button>)}</div></> : <p>Waktu habis. Kumpulkan jawaban untuk melanjutkan.</p>}
            <div className="flex flex-wrap gap-3"><button type="button" disabled={activeQuestion === 0} className={action} onClick={() => setActiveQuestion(i => i - 1)}>Sebelumnya</button><button type="button" disabled={activeQuestion >= workspace.questions.length - 1} className={action} onClick={() => setActiveQuestion(i => i + 1)}>Berikutnya</button><button type="button" disabled={busy} className="rounded-xl border border-amber-500 px-5 py-3 font-bold text-amber-400" onClick={submit}>Kumpulkan mapel</button></div>
        </section>}
    </main></div>;
}