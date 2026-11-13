import { Head } from "@inertiajs/react";
import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";

type Subject = { id: number; name: string; code: string };
type Package = { id: number; title: string; code: string; subject_id?: number; subject_name: string; question_count?: number; status?: string };
type Session = { id: number; title: string; status: string; order_type: string };
type Question = { id: number; question_text: string; correct_answer: string; options: string | Record<string, string> };
type Participant = { id: number; participant_code: string; name: string; school_origin: string; average_score: number | null; is_passed: boolean | null };

const field = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white";
const button = "rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50";

export default function PublicExam() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selected, setSelected] = useState<number | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [roster, setRoster] = useState<Participant[]>([]);
    const [tokens, setTokens] = useState<{ token: string }[]>([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [subject, setSubject] = useState({ name: "", code: "" });
    const [pack, setPack] = useState({ exam_public_subject_id: 0, title: "", code: "", duration_minutes: 35 });
    const [packageId, setPackageId] = useState(0);
    const [question, setQuestion] = useState({ question_text: "", A: "", B: "", C: "", D: "", correct_answer: "A", point: 10 });
    const [sessionForm, setSessionForm] = useState({ title: "", opens_at: "", closes_at: "", order_type: "free", package_ids: [0] });
    const [child, setChild] = useState({ name: "", school_origin: "", address: "" });
    const [issuedCode, setIssuedCode] = useState("");

    const reload = async () => {
        const [bank, exams] = await Promise.all([
            axios.get(route("admin.exams.public-bank.index")),
            axios.get(route("admin.exams.public-v2.sessions.index")),
        ]);
        setSubjects(bank.data.subjects);
        setPackages(bank.data.packages);
        setSessions(exams.data.sessions);
    };
    const loadSession = async (id: number) => {
        const [detail, participants] = await Promise.all([
            axios.get(route("admin.exams.public-v2.sessions.show", { session: id })),
            axios.get(route("admin.exams.public-sessions.participants.index", { session: id })),
        ]);
        setSelected(id);
        setTokens(detail.data.tokens);
        setRoster(participants.data.data);
    };
    const loadQuestions = async (id: number) => {
        setPackageId(id);
        const response = await axios.get(route("admin.exams.public-bank.questions.index", { package: id }));
        setQuestions(response.data.questions);
    };
    useEffect(() => { reload().catch(() => setError("Data ujian publik gagal dimuat.")); }, []);

    const run = async (action: () => Promise<unknown>, success: string) => {
        setBusy(true); setError(""); setMessage("");
        try { await action(); await reload(); setMessage(success); }
        catch (reason) { setError(axios.isAxiosError(reason) ? (reason.response?.data?.message ?? "Permintaan ditolak.") : "Permintaan gagal."); }
        finally { setBusy(false); }
    };
    const submit = (event: FormEvent, action: () => Promise<unknown>, success: string) => {
        event.preventDefault(); void run(action, success);
    };
    const updatePackageAt = (index: number, value: number) => setSessionForm(current => ({
        ...current, package_ids: current.package_ids.map((id, position) => position === index ? value : id),
    }));

    return <DashboardLayout><Head title="Ujian Publik" /><div className="mx-auto max-w-6xl space-y-6 text-slate-900 dark:text-white">
        <header><h1 className="text-2xl font-black">Ujian Publik</h1><p className="text-sm text-slate-600 dark:text-slate-400">Bank soal, sesi, token, peserta, dan rekap nilai terpisah dari ujian internal.</p></header>
        {error && <p role="alert" className="rounded-xl border border-red-400 p-3 text-red-600 dark:text-red-400">{error}</p>}
        {message && <p role="status" className="rounded-xl border border-emerald-400 p-3 text-emerald-700 dark:text-emerald-400">{message}</p>}
        <section className="grid gap-5 lg:grid-cols-2">
            <form onSubmit={e => submit(e, () => axios.post(route("admin.exams.public-bank.subjects.store"), subject), "Mapel ditambahkan.")} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                <h2 className="font-bold">Tambah mata pelajaran</h2><input className={field} required placeholder="Nama mapel" aria-label="Nama mapel" value={subject.name} onChange={e => setSubject({ ...subject, name: e.target.value })} />
                <input className={field} required placeholder="Kode mapel" aria-label="Kode mapel" value={subject.code} onChange={e => setSubject({ ...subject, code: e.target.value })} /><button disabled={busy} className={button}>Simpan mapel</button>
                <p className="text-sm">{subjects.length ? subjects.map(item => item.name).join(", ") : "Belum ada mapel."}</p>
            </form>
            <form onSubmit={e => submit(e, () => axios.post(route("admin.exams.public-bank.packages.store"), pack), "Paket dibuat.")} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                <h2 className="font-bold">Tambah paket</h2>
                <select className={field} required aria-label="Mapel paket" value={pack.exam_public_subject_id || ""} onChange={e => setPack({ ...pack, exam_public_subject_id: Number(e.target.value) })}><option value="">Pilih mapel</option>{subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <input className={field} required placeholder="Nama paket" aria-label="Nama paket" value={pack.title} onChange={e => setPack({ ...pack, title: e.target.value })} />
                <input className={field} required placeholder="Kode paket" aria-label="Kode paket" value={pack.code} onChange={e => setPack({ ...pack, code: e.target.value })} />
                <label className="block text-sm">Durasi per mapel (menit)<input type="number" min={5} max={300} className={field} value={pack.duration_minutes} onChange={e => setPack({ ...pack, duration_minutes: Number(e.target.value) })} /></label>
                <button disabled={busy} className={button}>Simpan paket</button>
            </form>
        </section>
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"><h2 className="font-bold">Soal paket</h2><div className="flex flex-wrap gap-2">{packages.map(item => <button key={item.id} type="button" onClick={() => void loadQuestions(item.id).catch(() => setError("Soal gagal dimuat."))} className="rounded-xl border border-amber-500/30 px-3 py-2 text-sm">{item.subject_name} · {item.title} ({item.question_count ?? 0}) {item.status}</button>)}</div>
            {packageId > 0 && <><ul className="space-y-2 text-sm">{questions.map((item, index) => <li key={item.id} className="rounded-lg border border-slate-200 p-2 dark:border-white/10">{index + 1}. {item.question_text} · Kunci {item.correct_answer}</li>)}</ul>
            {packages.find(item => item.id === packageId)?.status === "draft" && <><form className="grid gap-3 sm:grid-cols-2" onSubmit={e => submit(e, async () => { await axios.post(route("admin.exams.public-bank.questions.store", { package: packageId }), { question_text: question.question_text, options: Object.fromEntries((["A", "B", "C", "D"] as const).filter(key => question[key]).map(key => [key, question[key]])), correct_answer: question.correct_answer, point: question.point }); await loadQuestions(packageId); }, "Soal disimpan.")}>
                <input required className={`${field} sm:col-span-2`} placeholder="Teks soal" aria-label="Teks soal" value={question.question_text} onChange={e => setQuestion({ ...question, question_text: e.target.value })} />
                {(["A", "B", "C", "D"] as const).map(key => <input key={key} required={key === "A" || key === "B"} className={field} placeholder={`Pilihan ${key}`} aria-label={`Pilihan ${key}`} value={question[key]} onChange={e => setQuestion({ ...question, [key]: e.target.value })} />)}
                <label className="text-sm">Kunci jawaban<select className={field} value={question.correct_answer} onChange={e => setQuestion({ ...question, correct_answer: e.target.value })}>{(["A", "B", "C", "D"] as const).map(key => <option key={key}>{key}</option>)}</select></label>
                <label className="text-sm">Poin<input className={field} type="number" min={1} value={question.point} onChange={e => setQuestion({ ...question, point: Number(e.target.value) })} /></label><button disabled={busy} className={button}>Simpan soal</button>
            </form><button type="button" disabled={busy || questions.length !== 10} className={button} onClick={() => void run(() => axios.post(route("admin.exams.public-bank.packages.publish", { package: packageId })), "Paket diterbitkan.")}>Terbitkan paket (10 soal)</button></>}
            </>}
        </section>
        <section className="grid gap-5 lg:grid-cols-2"><form className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900" onSubmit={e => submit(e, () => axios.post(route("admin.exams.public-v2.sessions.store"), { ...sessionForm, opens_at: new Date(sessionForm.opens_at).toISOString(), closes_at: new Date(sessionForm.closes_at).toISOString() }), "Sesi dibuat sebagai draft.")}><h2 className="font-bold">Buat sesi 1–5 mapel</h2>
            <input required className={field} placeholder="Nama sesi" aria-label="Nama sesi" value={sessionForm.title} onChange={e => setSessionForm({ ...sessionForm, title: e.target.value })} />
            <label className="block text-sm">Mulai<input required type="datetime-local" className={field} value={sessionForm.opens_at} onChange={e => setSessionForm({ ...sessionForm, opens_at: e.target.value })} /></label>
            <label className="block text-sm">Selesai<input required type="datetime-local" className={field} value={sessionForm.closes_at} onChange={e => setSessionForm({ ...sessionForm, closes_at: e.target.value })} /></label>
            <label className="block text-sm">Urutan<select className={field} value={sessionForm.order_type} onChange={e => setSessionForm({ ...sessionForm, order_type: e.target.value })}><option value="free">Bebas memilih</option><option value="sequential">Wajib berurutan</option></select></label>
            {sessionForm.package_ids.map((_, index) => <label key={index} className="block text-sm">Paket mapel {index + 1}<select required className={field} value={sessionForm.package_ids[index] || ""} onChange={e => updatePackageAt(index, Number(e.target.value))}><option value="">Pilih paket diterbitkan</option>{packages.filter(item => item.status === "published").map(item => <option key={item.id} value={item.id}>{item.subject_name} · {item.title}</option>)}</select></label>)}
            <button type="button" disabled={sessionForm.package_ids.length >= 5} className={button} onClick={() => setSessionForm(current => ({ ...current, package_ids: [...current.package_ids, 0] }))}>Tambah paket</button><button type="button" disabled={sessionForm.package_ids.length <= 1} className={button} onClick={() => setSessionForm(current => ({ ...current, package_ids: current.package_ids.slice(0, -1) }))}>Kurangi paket</button>
            <button disabled={busy} className={button}>Buat sesi</button>
        </form><div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"><h2 className="font-bold">Sesi ujian</h2>{sessions.length === 0 && <p>Belum ada sesi.</p>}{sessions.map(item => <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-white/10"><button type="button" className="font-bold text-amber-600 dark:text-amber-400" onClick={() => void loadSession(item.id).catch(() => setError("Detail sesi gagal dimuat."))}>{item.title}</button><span>{item.status}</span>{item.status === "draft" && <button type="button" disabled={busy} className={button} onClick={() => void run(() => axios.post(route("admin.exams.public-v2.sessions.publish", { session: item.id })), "Sesi diterbitkan.")}>Terbitkan</button>}{item.status === "published" && <><button type="button" disabled={busy} className={button} onClick={() => void run(async () => { await axios.post(route("admin.exams.public-v2.sessions.tokens.store", { session: item.id })); await loadSession(item.id); }, "Token dibuat.")}>Buat token</button><button type="button" disabled={busy} className="rounded-xl border border-red-500 px-3 py-2 text-red-500" onClick={() => void run(() => axios.post(route("admin.exams.public-v2.sessions.close", { session: item.id })), "Sesi ditutup.")}>Tutup</button></>}</div>)}</div></section>
        {selected && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"><h2 className="font-bold">Peserta & token sesi #{selected}</h2><p className="text-sm">Token ruang: {tokens.length ? tokens.map(item => item.token).join(", ") : "Belum dibuat."}</p>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={e => submit(e, async () => { const response = await axios.post(route("admin.exams.public-sessions.participants.store", { session: selected }), child); setIssuedCode(response.data.participant_code); await loadSession(selected); }, "Kode peserta dibuat. Bagikan secara pribadi.")}>
                <input required className={field} placeholder="Nama anak" aria-label="Nama anak" value={child.name} onChange={e => setChild({ ...child, name: e.target.value })} /><input required className={field} placeholder="Sekolah asal" aria-label="Sekolah asal" value={child.school_origin} onChange={e => setChild({ ...child, school_origin: e.target.value })} /><input className={field} placeholder="Alamat (opsional)" aria-label="Alamat" value={child.address} onChange={e => setChild({ ...child, address: e.target.value })} /><button disabled={busy} className={button}>Daftarkan peserta</button>
            </form>{issuedCode && <p role="status" className="font-bold text-amber-600 dark:text-amber-400">Kode peserta baru: {issuedCode}</p>}
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Kode</th><th className="p-2">Nama</th><th className="p-2">Sekolah</th><th className="p-2">Rata-rata</th></tr></thead><tbody>{roster.map(item => <tr key={item.id} className="border-t border-slate-200 dark:border-white/10"><td className="p-2">{item.participant_code}</td><td className="p-2">{item.name}</td><td className="p-2">{item.school_origin}</td><td className="p-2">{item.average_score ?? "—"}</td></tr>)}</tbody></table></div>
            <a className="inline-flex rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950" href={route("admin.exams.public-sessions.results.export", { session: selected })}>Unduh hasil CSV</a>
        </section>}
    </div></DashboardLayout>;
}
