import PublicExamSummary from "@/Components/Exam/Admin/PublicExamSummary";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Head, Link, router, usePage, usePoll } from "@inertiajs/react";
import axios from "axios";
import Select from "react-select";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { makeSelectStyles } from "@/Components/UI/selectStyles";
import { useTheme } from "@/context/ThemeContext";
import {
    EmptyState,
    ExamWorkspace,
    FlashMessage,
    PageHeader,
    StatCard,
    StatusPill,
    WorkflowRail,
    inputClass,
    labelClass,
    primaryButtonClass,
    secondaryButtonClass,
} from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { confirmAction, showErrorToast, showSuccessToast } from "@/utils/swal";
import type { PageProps } from "@/types";

type PackageInfo = { id: number; title: string; code: string; subject_name: string };
type Session = {
    id: number;
    title: string;
    description: string | null;
    instructions: string | null;
    status: string;
    order_type: "free" | "sequential";
    time_source: "server" | "participant";
    opens_at: string;
    closes_at: string;
    packages: PackageInfo[];
    active_token: string | null;
    token_rotation_minutes: number;
    token_expires_at: string | null;
    participants_count: number;
};
type AvailablePackage = { id: number; title: string; subject_name: string; subject_id: number };
type Participant = { id: number; participant_code: string; name: string; school_origin: string; status: string; average_score: number | null };
type Props = {
    examTimezone: string;
    publicExamUrl?: string;
    detailMode?: boolean;
    sessions: Session[];
    packages: AvailablePackage[];
    stats: { total: number; published: number; available_packages: number; total_participants: number };
};
type StatusFilter = "all" | "draft" | "published" | "closed";
type SortOption = "newest" | "oldest" | "title_asc" | "closes_soon";

const statusLabel: Record<string, string> = { draft: "Draf", published: "Diterbitkan", closed: "Ditutup", archived: "Diarsipkan" };

export default function PublicSessions({ sessions, packages, stats, examTimezone, publicExamUrl, detailMode = false }: Props) {
    const { theme } = useTheme();
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const selectStyles = makeSelectStyles(false, theme === "dark");
    const session = detailMode ? sessions[0] : null;

    usePoll(5000, { only: ["sessions", "stats"] });

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Session | null>(null);
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", instructions: "", opens_at: "", closes_at: "", order_type: "free" as "free" | "sequential", time_source: "server" as "server" | "participant", package_ids: [] as number[], token_rotation_minutes: 5 });
    const [roster, setRoster] = useState<Participant[]>([]);
    const [rosterLoading, setRosterLoading] = useState(false);
    const [rosterError, setRosterError] = useState(false);
    const [rosterPage, setRosterPage] = useState(1);
    const [rosterLastPage, setRosterLastPage] = useState(1);
    const [rosterTotal, setRosterTotal] = useState(0);

    const packageGroups = useMemo(() => {
        const groups = new Map<number, AvailablePackage[]>();
        packages.forEach((item) => groups.set(item.subject_id, [...(groups.get(item.subject_id) ?? []), item]));
        return [...groups.values()];
    }, [packages]);
    const filteredSessions = useMemo(() => [...sessions]
        .filter((item) => {
            const query = search.trim().toLowerCase();
            return (!query || item.title.toLowerCase().includes(query) || item.packages.some((pkg) => `${pkg.subject_name} ${pkg.title}`.toLowerCase().includes(query))) && (statusFilter === "all" || item.status === statusFilter);
        })
        .sort((a, b) => sortBy === "oldest" ? a.id - b.id : sortBy === "title_asc" ? a.title.localeCompare(b.title, "id") : sortBy === "closes_soon" ? new Date(a.closes_at).getTime() - new Date(b.closes_at).getTime() : b.id - a.id), [sessions, search, statusFilter, sortBy]);

    const portalUrl = publicExamUrl ?? route("public-exam.page");
    const formatDate = (value: string) => new Date(value).toLocaleString("id-ID", { timeZone: examTimezone, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
    const localInput = (value: string) => { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
    const copy = async (value: string, label: string) => { try { await navigator.clipboard.writeText(value); showSuccessToast(`${label} berhasil disalin.`); } catch { showErrorToast("Tidak dapat menyalin. Pilih teks lalu salin manual."); } };

    const openCreate = () => { setEditing(null); setForm({ title: "", description: "", instructions: "", opens_at: "", closes_at: "", order_type: "free", time_source: "server", package_ids: [packageGroups[0]?.[0]?.id ?? 0], token_rotation_minutes: 5 }); setModalOpen(true); };
    const openEdit = async (item: Session) => { setBusy(true); try { const response = await axios.get(route("admin.exams.public-v2.sessions.show", { session: item.id })); setEditing(item); setForm({ title: item.title, description: item.description ?? "", instructions: item.instructions ?? "", opens_at: localInput(item.opens_at), closes_at: localInput(item.closes_at), order_type: item.order_type, time_source: response.data.session.time_source ?? "server", package_ids: response.data.packages.map((pkg: PackageInfo) => pkg.id), token_rotation_minutes: item.token_rotation_minutes }); setModalOpen(true); } catch { showErrorToast("Gagal memuat konfigurasi sesi."); } finally { setBusy(false); } };
    const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); try { const payload = { ...form, opens_at: new Date(form.opens_at).toISOString(), closes_at: new Date(form.closes_at).toISOString() }; if (editing) await axios.put(route("admin.exams.public-v2.sessions.update", { session: editing.id }), payload); else { const response = await axios.post<{ id: number }>(route("admin.exams.public-v2.sessions.store"), payload); setModalOpen(false); router.visit(route("admin.public-exams.sessions.show", { session: response.data.id })); return; } setModalOpen(false); router.reload(); showSuccessToast("Konfigurasi sesi disimpan."); } catch (error) { showErrorToast(axios.isAxiosError(error) ? error.response?.data?.message ?? "Gagal menyimpan sesi." : "Gagal menyimpan sesi."); } finally { setBusy(false); } };
    const publish = async (item: Session) => { if (!await confirmAction("Terbitkan sesi?", `Sesi “${item.title}” akan mulai menerima peserta.`, "Terbitkan")) return; setBusy(true); try { await axios.post(route("admin.exams.public-v2.sessions.publish", { session: item.id })); showSuccessToast("Sesi diterbitkan. Token dibuat otomatis."); router.reload(); } catch (error) { showErrorToast(axios.isAxiosError(error) ? error.response?.data?.message ?? "Gagal menerbitkan sesi." : "Gagal menerbitkan sesi."); } finally { setBusy(false); } };
    const remove = async (item: Session) => { if (!await confirmAction("Hapus sesi draf?", `Sesi “${item.title}” akan dihapus permanen dari konfigurasi.`, "Ya, Hapus Sesi")) return; setBusy(true); try { await axios.delete(route("admin.exams.public-v2.sessions.destroy", { session: item.id })); showSuccessToast("Sesi draf dihapus."); router.reload(); } catch (error) { showErrorToast(axios.isAxiosError(error) ? error.response?.data?.message ?? "Gagal menghapus sesi." : "Gagal menghapus sesi."); } finally { setBusy(false); } };
    const close = async (item: Session) => { if (!await confirmAction("Tutup sesi?", "Peserta tidak dapat memulai pengerjaan baru setelah sesi ditutup.", "Tutup sesi")) return; setBusy(true); try { await axios.post(route("admin.exams.public-v2.sessions.close", { session: item.id })); showSuccessToast("Sesi ditutup."); router.reload(); } catch (error) { showErrorToast(axios.isAxiosError(error) ? error.response?.data?.message ?? "Gagal menutup sesi." : "Gagal menutup sesi."); } finally { setBusy(false); } };
    const loadRoster = async (item: Session, page = 1) => { setRosterLoading(true); setRosterError(false); try { const response = await axios.get(route("admin.exams.public-sessions.participants.index", { session: item.id }), { params: { page } }); setRoster(response.data.data); setRosterPage(response.data.current_page); setRosterLastPage(response.data.last_page); setRosterTotal(response.data.total); } catch { setRosterError(true); } finally { setRosterLoading(false); } };
    useEffect(() => { if (session) void loadRoster(session); }, [session?.id]);

    return <>
        <Head title={session ? `${session.title} · Sesi Publik` : "Sesi Ujian Publik"} />
        <ExamWorkspace active="sessions">
            <PageHeader title={session?.title ?? "Sesi Ujian Publik"} badge="LANGKAH 3: JADWAL & AKSES PUBLIK" description={session ? "Kelola jadwal, paket soal, tautan akses, dan pantau peserta." : "Jadwalkan sesi publik, pilih paket soal, lalu bagikan akses kepada peserta."} icon="fa-solid fa-calendar-check" actions={<div className="flex flex-wrap gap-2">{session ? <Link href={route("admin.public-exams.sessions.index")} className={secondaryButtonClass}><i className="fa-solid fa-arrow-left" /> Kembali</Link> : <button type="button" onClick={openCreate} disabled={!packages.length} className={primaryButtonClass}><i className="fa-solid fa-plus" /> Buat sesi</button>}<Link href={route("admin.public-exams.results.index")} className={secondaryButtonClass}><i className="fa-solid fa-chart-column" /> Rekap hasil</Link></div>} />
            <FlashMessage value={flash.success} type="success" /><FlashMessage value={flash.error ?? pageErrors.session} />
            {session ? <DetailView session={session} portalUrl={portalUrl} copy={copy} roster={roster} rosterLoading={rosterLoading} rosterError={rosterError} rosterPage={rosterPage} rosterLastPage={rosterLastPage} rosterTotal={rosterTotal} loadRoster={loadRoster} closeSession={close} busy={busy} formatDate={formatDate} /> : <>
                <PublicExamSummary title="Ringkasan sesi" value={stats.total} label="total sesi" description="Jadwal dan akses ujian publik" items={[
                    { label: "Sesi terbit", value: stats.published, description: "Lihat sesi terbit", tone: "success", selected: statusFilter === "published", onClick: () => { setStatusFilter(statusFilter === "published" ? "all" : "published"); setSearch(""); } },
                    { label: "Paket siap", value: stats.available_packages, description: "Tersedia untuk sesi" },
                    { label: "Peserta masuk", value: stats.total_participants, description: "Di seluruh sesi" },
                ]} progress={{ value: stats.published, total: stats.total, label: `${stats.published} dari ${stats.total} sesi diterbitkan` }} />
                <WorkflowRail items={[{ label: "Langkah 1", title: "Buat sesi", description: "Pilih 1–5 paket dari mapel berbeda.", icon: "fa-solid fa-calendar-plus", state: stats.total ? "done" : "active" }, { label: "Langkah 2", title: "Atur jadwal", description: "Tentukan jendela pengerjaan dan urutan paket.", icon: "fa-solid fa-clock", state: stats.total ? "done" : "idle" }, { label: "Langkah 3", title: "Terbitkan", description: `${stats.published} sesi siap menerima peserta.`, icon: "fa-solid fa-circle-check", state: stats.published ? "done" : stats.total ? "active" : "idle" }, { label: "Langkah 4", title: "Bagikan akses", description: "Portal, link bertoken, atau token saja.", icon: "fa-solid fa-share-nodes", state: stats.published ? "done" : "idle" }, { label: "Langkah 5", title: "Pantau peserta", description: `${stats.total_participants} peserta masuk melalui portal.`, icon: "fa-solid fa-users", state: stats.total_participants ? "done" : "idle" }]} />
                <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><i className="fa-solid fa-list text-amber-500" /> Daftar sesi <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-white/10">{sessions.length}</span></h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Satu kartu merangkum jadwal, paket, dan akses publik.</p></div><button type="button" onClick={openCreate} disabled={!packages.length} className={primaryButtonClass}><i className="fa-solid fa-plus" /> Buat sesi baru</button></div>
                    <div className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-center"><input aria-label="Cari sesi publik" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari judul atau paket soal" className={inputClass} /><div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/5">{(["all", "draft", "published", "closed"] as StatusFilter[]).map((value) => <button type="button" key={value} onClick={() => setStatusFilter(value)} className={`rounded-md px-2.5 py-2 text-xs font-bold ${statusFilter === value ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500"}`}>{value === "all" ? "Semua" : statusLabel[value]}</button>)}</div><Select aria-label="Urutkan sesi" styles={selectStyles} options={[{ value: "newest", label: "Terbaru" }, { value: "oldest", label: "Terlama" }, { value: "title_asc", label: "Judul A–Z" }, { value: "closes_soon", label: "Segera berakhir" }]} value={{ value: sortBy, label: { newest: "Terbaru", oldest: "Terlama", title_asc: "Judul A–Z", closes_soon: "Segera berakhir" }[sortBy] }} onChange={(option) => setSortBy((option?.value ?? "newest") as SortOption)} /></div>
                    {filteredSessions.length ? <div className="grid gap-3">{filteredSessions.map((item) => <SessionCard key={item.id} session={item} portalUrl={portalUrl} copy={copy} formatDate={formatDate} edit={openEdit} publish={publish} remove={remove} closeSession={close} busy={busy} />)}</div> : <EmptyState icon="fa-solid fa-calendar-xmark" title="Belum ada sesi yang cocok" description="Sesuaikan pencarian atau buat sesi publik baru." />}
                </section>
            </>}
        </ExamWorkspace>
        {modalOpen && <SessionModal form={form} setForm={setForm} packages={packages} editing={editing} busy={busy} close={() => setModalOpen(false)} submit={submit} selectStyles={selectStyles} examTimezone={examTimezone} />}
    </>;
}

function SessionCard({ session, portalUrl, copy, formatDate, edit, publish, remove, closeSession, busy }: { session: Session; portalUrl: string; copy: (value: string, label: string) => Promise<void>; formatDate: (value: string) => string; edit: (session: Session) => void; publish: (session: Session) => void; remove: (session: Session) => void; closeSession: (session: Session) => void; busy: boolean }) {
    return <article className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-amber-400/70 hover:shadow-sm dark:border-white/10 dark:bg-slate-900"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-base font-bold text-slate-900 dark:text-white">{session.title}</h3><StatusPill value={session.status} /><span className="rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-300">{session.order_type === "sequential" ? "Berurutan" : "Bebas memilih"}</span></div><p className="mt-2 text-xs text-slate-500 dark:text-slate-400"><i className="fa-solid fa-clock mr-1.5 text-amber-500" />{formatDate(session.opens_at)} — {formatDate(session.closes_at)}</p><div className="mt-3 flex flex-wrap gap-2">{session.packages.map((pkg) => <Link key={pkg.id} href={route("admin.public-exams.packages.show", { package: pkg.id })} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-slate-300"><span className="mr-1.5 text-amber-500">●</span>{pkg.subject_name}: {pkg.title}</Link>)}</div></div><div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-auto"><div className="rounded-lg bg-slate-50 p-3 dark:bg-white/[0.03]"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Peserta masuk</p><p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{session.participants_count}</p></div><div className="rounded-lg bg-slate-50 p-3 dark:bg-white/[0.03]"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Token</p><p className="mt-1 font-mono text-sm font-bold text-amber-600 dark:text-amber-300">{session.active_token ?? "Otomatis saat aktif"}</p></div></div></div><PublicAccessPanel session={session} portalUrl={portalUrl} copy={copy} /><div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/10"><Link href={route("admin.public-exams.sessions.show", { session: session.id })} className={primaryButtonClass}><i className="fa-solid fa-sliders" /> Kelola sesi</Link><div className="flex flex-wrap gap-2">{session.status === "draft" && <><button type="button" onClick={() => edit(session)} disabled={busy} className={secondaryButtonClass}><i className="fa-solid fa-pen" /> Konfigurasi</button><button type="button" onClick={() => publish(session)} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white">Terbitkan</button><button type="button" onClick={() => remove(session)} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-500/30 px-3 text-sm font-bold text-red-600 dark:text-red-300"><i className="fa-solid fa-trash" /> Hapus</button></>}{session.status === "published" && <button type="button" onClick={() => closeSession(session)} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-500/30 px-3 text-sm font-bold text-red-600 dark:text-red-300">Tutup sesi</button>}<Link href={route("admin.public-exams.results.index", { session: session.id })} className={secondaryButtonClass}><i className="fa-solid fa-chart-column" /> Hasil</Link></div></div></article>;
}

function PublicAccessPanel({ session, portalUrl, copy }: { session: Session; portalUrl: string; copy: (value: string, label: string) => Promise<void> }) {
    const tokenLink = session.active_token ? `${portalUrl}?token=${encodeURIComponent(session.active_token)}` : "";
    const rows = [{ label: "Link portal", value: portalUrl, hint: "Peserta memasukkan token terbaru sendiri." }, { label: "Link dengan token", value: tokenLink, hint: "Token terisi otomatis saat link dibuka." }, { label: "Token saja", value: session.active_token ?? "", hint: "Salin ke pesan atau instruksi pengawas." }];
    return <section className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4 dark:bg-amber-500/[0.06]"><div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="text-sm font-bold text-slate-900 dark:text-white"><i className="fa-solid fa-share-nodes mr-2 text-amber-500" />Akses ujian publik</h4><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tiga format yang dapat dibagikan. Tidak ada daftar peserta manual.</p></div><span className="text-xs font-bold text-amber-600 dark:text-amber-300">{session.status === "published" ? "Token otomatis" : "Menunggu terbit"}</span></div><div className="mt-3 grid gap-2 md:grid-cols-3">{rows.map((row) => <div key={row.label} className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900"><label className={labelClass}>{row.label}</label><div className="flex min-w-0 gap-2"><input aria-label={row.label} readOnly value={row.value} placeholder="Tersedia setelah sesi diterbitkan" className={`${inputClass} min-w-0 font-mono text-xs`} onFocus={(event) => event.target.select()} /><button type="button" disabled={!row.value} onClick={() => void copy(row.value, row.label)} className={secondaryButtonClass}>Salin</button></div><p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{row.hint}</p></div>)}</div>{session.active_token && session.token_expires_at && <p className="mt-3 text-xs text-slate-600 dark:text-slate-300"><i className="fa-solid fa-rotate mr-1.5 text-amber-500" />Token saat ini berganti otomatis sesuai interval {session.token_rotation_minutes} menit.</p>}</section>;
}

function DetailView({ session, portalUrl, copy, roster, rosterLoading, rosterError, rosterPage, rosterLastPage, rosterTotal, loadRoster, closeSession, busy, formatDate }: { session: Session; portalUrl: string; copy: (value: string, label: string) => Promise<void>; roster: Participant[]; rosterLoading: boolean; rosterError: boolean; rosterPage: number; rosterLastPage: number; rosterTotal: number; loadRoster: (session: Session, page?: number) => Promise<void>; closeSession: (session: Session) => void; busy: boolean; formatDate: (value: string) => string }) {
    return <><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><StatCard label="Status" value={statusLabel[session.status] ?? session.status} icon="fa-solid fa-circle-info" /><StatCard label="Paket terhubung" value={session.packages.length} icon="fa-solid fa-box-archive" tone="text-sky-500" /><StatCard label="Peserta masuk" value={session.participants_count} icon="fa-solid fa-users" tone="text-violet-500" /><StatCard label="Rotasi token" value={`${session.token_rotation_minutes} menit`} icon="fa-solid fa-rotate" tone="text-amber-500" /></div><section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900"><div className="grid gap-4 lg:grid-cols-[1fr_280px]"><div><div className="flex flex-wrap gap-2"><StatusPill value={session.status} /><span className="rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-300">{session.order_type === "sequential" ? "Paket berurutan" : "Paket bebas dipilih"}</span></div><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{session.description || "Belum ada deskripsi sesi."}</p>{session.instructions && <div className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">{session.instructions}</div>}<div className="mt-4 flex flex-wrap gap-2">{session.packages.map((pkg) => <Link key={pkg.id} href={route("admin.public-exams.packages.show", { package: pkg.id })} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-slate-300">{pkg.subject_name}: {pkg.title}</Link>)}</div></div><div className="rounded-lg bg-slate-50 p-4 dark:bg-white/[0.03]"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Jadwal sesi</p><p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{formatDate(session.opens_at)}</p><p className="my-1 text-xs text-slate-500">sampai</p><p className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(session.closes_at)}</p>{session.status === "published" && <button type="button" onClick={() => closeSession(session)} disabled={busy} className="mt-4 w-full inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 text-sm font-bold text-red-600 dark:text-red-300">Tutup sesi</button>}</div></div></section><PublicAccessPanel session={session} portalUrl={portalUrl} copy={copy} /><section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900 dark:text-white">Peserta yang masuk</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Read-only. Peserta mengisi identitas melalui portal publik.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void loadRoster(session, rosterPage)} disabled={rosterLoading} className={secondaryButtonClass}><i className="fa-solid fa-rotate" /> Perbarui</button>{roster.length > 0 && <a href={route("admin.exams.public-sessions.results.export", { session: session.id })} className={secondaryButtonClass}><i className="fa-solid fa-file-csv" /> Unduh CSV</a>}</div></div>{rosterLoading ? <div className="py-10 text-center text-sm text-slate-500">Memuat peserta…</div> : rosterError ? <button type="button" onClick={() => void loadRoster(session, rosterPage)} className={secondaryButtonClass}>Gagal memuat. Coba lagi.</button> : roster.length === 0 ? <EmptyState icon="fa-solid fa-users" title="Belum ada peserta" description="Peserta akan muncul setelah masuk melalui portal publik." /> : <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/5"><tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Asal sekolah</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Nilai rata-rata</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/10">{roster.map((person) => <tr key={person.id}><td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{person.name}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-300">{person.school_origin}</td><td className="px-4 py-3"><StatusPill value={person.status} /></td><td className="px-4 py-3 text-slate-600 dark:text-slate-300">{person.average_score ?? "—"}</td></tr>)}</tbody></table></div>} {!rosterError && roster.length > 0 && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{rosterTotal} peserta · halaman {rosterPage} dari {rosterLastPage}</span><div className="flex gap-2"><button type="button" disabled={rosterPage <= 1 || rosterLoading} onClick={() => void loadRoster(session, rosterPage - 1)} className={secondaryButtonClass}>Sebelumnya</button><button type="button" disabled={rosterPage >= rosterLastPage || rosterLoading} onClick={() => void loadRoster(session, rosterPage + 1)} className={secondaryButtonClass}>Berikutnya</button></div></div>}</section></>;
}

function SessionModal({ form, setForm, packages, editing, busy, close, submit, selectStyles, examTimezone }: { form: { title: string; description: string; instructions: string; opens_at: string; closes_at: string; order_type: "free" | "sequential"; time_source: "server" | "participant"; package_ids: number[]; token_rotation_minutes: number }; setForm: React.Dispatch<React.SetStateAction<typeof form>>; packages: AvailablePackage[]; editing: Session | null; busy: boolean; close: () => void; submit: (event: FormEvent) => Promise<void>; selectStyles: ReturnType<typeof makeSelectStyles>; examTimezone: string }) {
    const options = packages.map((item) => ({ value: item.id, label: `${item.subject_name} · ${item.title}` }));
    const [otherOptionsOpen, setOtherOptionsOpen] = useState(false);
    const [quickTimeOpen, setQuickTimeOpen] = useState(false);

    return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="session-modal-title">
        <div className={`my-8 w-full max-w-4xl rounded-lg border bg-white shadow-2xl dark:bg-slate-900 border-slate-200 dark:border-white/10`}>
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-amber-500">Konfigurasi publik</p><h2 id="session-modal-title" className="mt-1 text-xl font-black text-slate-900 dark:text-white">{editing ? "Edit sesi ujian" : "Buat sesi ujian publik"}</h2><p className="mt-1 max-w-2xl text-xs text-slate-500 dark:text-slate-400">Atur identitas, jadwal, paket, dan aturan akses dalam satu ruang kerja.</p></div>
                <div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => setOtherOptionsOpen(true)} aria-haspopup="dialog" aria-expanded={otherOptionsOpen} className={`${secondaryButtonClass} border-amber-500/30 text-amber-700 dark:text-amber-300`}><i className="fa-solid fa-sliders" /> Opsi lainnya</button><button type="button" onClick={close} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:hover:bg-white/10" aria-label="Tutup"><i className="fa-solid fa-xmark" /></button></div>
            </div>
            <form onSubmit={submit} className={`grid gap-5 p-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(240px,0.75fr)] text-sm`}>
                <div className="space-y-5">
                    <section className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-white/10"><div><h3 className="text-sm font-bold text-slate-900 dark:text-white">Identitas sesi</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Nama ini tampil di daftar sesi dan ruang peserta.</p></div><div><label htmlFor="session-title" className={labelClass}>Judul sesi</label><input id="session-title" required maxLength={255} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} /></div><div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="session-description" className={labelClass}>Deskripsi singkat</label><textarea id="session-description" maxLength={1500} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={inputClass} rows={3} /></div><div><label htmlFor="session-instructions" className={labelClass}>Petunjuk peserta</label><textarea id="session-instructions" maxLength={5000} value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} className={inputClass} rows={3} /></div></div></section>
                    <section className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-white/10"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900 dark:text-white">Jadwal dan akses</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Input mengikuti zona waktu perangkat. Zona tampilan ujian: <span className="font-semibold text-slate-700 dark:text-slate-200">{examTimezone}</span>.</p></div><button type="button" onClick={() => setQuickTimeOpen(true)} aria-haspopup="dialog" aria-expanded={quickTimeOpen} className={`${secondaryButtonClass} border-amber-500/30 text-amber-700 dark:text-amber-300`}><i className="fa-solid fa-bolt" /> Atur waktu cepat</button></div><div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="session-opens-at" className={labelClass}>Mulai</label><input id="session-opens-at" type="datetime-local" required value={form.opens_at} onChange={(event) => setForm((current) => ({ ...current, opens_at: event.target.value }))} className={inputClass} /></div><div><label htmlFor="session-closes-at" className={labelClass}>Berakhir</label><input id="session-closes-at" type="datetime-local" required value={form.closes_at} onChange={(event) => setForm((current) => ({ ...current, closes_at: event.target.value }))} className={inputClass} /></div></div></section>
                    <section className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-white/10"><div><h3 className="text-sm font-bold text-slate-900 dark:text-white">Paket soal</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pilih 1–5 paket dari mapel yang berbeda.</p></div><Select isMulti aria-label="Paket soal" styles={selectStyles} options={options} value={options.filter((option) => form.package_ids.includes(option.value))} onChange={(selected) => setForm((current) => ({ ...current, package_ids: selected.map((item) => item.value).slice(0, 5) }))} /></section>
                    <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-white/10"><button type="button" onClick={close} className={secondaryButtonClass}>Batal</button><button type="submit" disabled={busy || !form.package_ids.length || form.package_ids.some((id) => !id)} className={primaryButtonClass}>{busy ? "Menyimpan…" : editing ? "Simpan perubahan" : "Buat sesi"}</button></div>
                </div>
                <aside className="h-fit space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4 dark:bg-amber-500/[0.06]"><div><p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">Ringkasan cepat</p><h3 className="mt-1 text-base font-black text-slate-900 dark:text-white">Sesi siap ditinjau</h3></div><dl className="divide-y divide-amber-500/10 text-xs"><div className="flex items-center justify-between gap-3 py-3"><dt className="text-slate-500 dark:text-slate-400">Paket dipilih</dt><dd className="font-black text-slate-900 dark:text-white">{form.package_ids.length} / 5</dd></div><div className="flex items-center justify-between gap-3 py-3"><dt className="text-slate-500 dark:text-slate-400">Alur pengerjaan</dt><dd className="font-bold text-slate-900 dark:text-white">{form.order_type === "free" ? "Bebas" : "Berurutan"}</dd></div><div className="flex items-center justify-between gap-3 py-3"><dt className="text-slate-500 dark:text-slate-400">Zona waktu</dt><dd className="max-w-[9rem] text-right font-bold text-slate-900 dark:text-white">{examTimezone}</dd></div></dl><p className="text-xs leading-5 text-slate-500 dark:text-slate-400"><i className="fa-solid fa-circle-info mr-1 text-amber-500" />Jadwal menentukan jendela akses sesi. Durasi pengerjaan tetap mengikuti masing-masing paket.</p></aside>
            </form>
        </div>
        {otherOptionsOpen && <SessionOptionsPopup title="Opsi lainnya" close={() => setOtherOptionsOpen(false)}>
            <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">Atur alur pengerjaan dan pembaruan token sesi. Perubahan disimpan saat kamu menyimpan konfigurasi sesi.</p>
            <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass}>Urutan paket</label><Select aria-label="Urutan paket" styles={selectStyles} options={[{ value: "free", label: "Bebas memilih" }, { value: "sequential", label: "Wajib berurutan" }]} value={{ value: form.order_type, label: form.order_type === "free" ? "Bebas memilih" : "Wajib berurutan" }} onChange={(selected) => setForm((current) => ({ ...current, order_type: selected?.value === "sequential" ? "sequential" : "free" }))} /></div><div><label htmlFor="token-rotation" className={labelClass}>Rotasi token otomatis (menit)</label><input id="token-rotation" type="number" min={1} max={1440} required value={form.token_rotation_minutes} onChange={(event) => setForm((current) => ({ ...current, token_rotation_minutes: Number(event.target.value) }))} className={inputClass} /></div></div>
            <fieldset className="mt-4 space-y-2"><legend className="text-sm font-bold text-slate-900 dark:text-white">Sumber waktu peserta</legend><p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Server tetap menjadi otoritas validasi jadwal. Pilihan ini menentukan jam yang ditampilkan di ruang peserta.</p><label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-white/10"><input type="radio" name="time-source" value="server" checked={form.time_source === "server"} onChange={() => setForm((current) => ({ ...current, time_source: "server" }))} className="mt-1 accent-amber-500" /><span><span className="block text-sm font-bold text-slate-900 dark:text-white">Waktu server</span><span className="block text-xs text-slate-500 dark:text-slate-400">Direkomendasikan untuk jadwal resmi dan konsisten.</span></span></label><label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-white/10"><input type="radio" name="time-source" value="participant" checked={form.time_source === "participant"} onChange={() => setForm((current) => ({ ...current, time_source: "participant" }))} className="mt-1 accent-amber-500" /><span><span className="block text-sm font-bold text-slate-900 dark:text-white">Waktu perangkat peserta</span><span className="block text-xs text-slate-500 dark:text-slate-400">Untuk tampilan lokal; pemeriksaan jadwal tetap memakai server.</span></span></label></fieldset>
            <div className="mt-5 flex justify-end"><button type="button" onClick={() => setOtherOptionsOpen(false)} className={primaryButtonClass}>Selesai</button></div>
        </SessionOptionsPopup>}
        {quickTimeOpen && <QuickTimeDialog close={() => setQuickTimeOpen(false)} setForm={setForm} />}
    </div>;
}

function SessionOptionsPopup({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const dialog = ref.current;
        dialog?.showModal();
        return () => dialog?.close();
    }, []);
    return <dialog ref={ref} onCancel={(event) => { event.preventDefault(); close(); }} aria-label={title} className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-950/70 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
            <h2 className="text-lg font-bold">{title}</h2>
            <button type="button" onClick={close} aria-label="Tutup popup" className={secondaryButtonClass}><i aria-hidden="true" className="fa-solid fa-xmark" /></button>
        </div>
        {children}
    </dialog>;
}

function QuickTimeDialog({ close, setForm }: { close: () => void; setForm: React.Dispatch<React.SetStateAction<{ title: string; description: string; instructions: string; opens_at: string; closes_at: string; order_type: "free" | "sequential"; time_source: "server" | "participant"; package_ids: number[]; token_rotation_minutes: number }>> }) {
    const [delay, setDelay] = useState(0);
    const [duration, setDuration] = useState(60);
    const [error, setError] = useState("");
    const apply = () => {
        if (!Number.isSafeInteger(delay) || delay < 0 || !Number.isSafeInteger(duration) || duration < 1) {
            setError("Waktu mulai minimal 0 menit dan jendela sesi minimal 1 menit.");
            return;
        }
        const start = new Date();
        start.setSeconds(0, 0);
        start.setMinutes(start.getMinutes() + delay);
        const end = new Date(start.getTime() + duration * 60000);
        if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end.getFullYear() > 9999) {
            setError("Rentang waktu terlalu besar. Pilih waktu yang lebih dekat.");
            return;
        }
        const toInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setForm((current) => ({ ...current, opens_at: toInput(start), closes_at: toInput(end) }));
        close();
    };
    return <SessionOptionsPopup title="Atur waktu cepat" close={close}>
        <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">Pilih waktu mulai, lalu tentukan kapan sesi berakhir. Jadwal baru diisi setelah menekan Terapkan.</p>
        <fieldset className="mb-5">
            <legend className="mb-2 text-sm font-bold">Mulai dari sekarang</legend>
            <div className="flex flex-wrap gap-2">{[[0, "Sekarang"], [15, "15 menit lagi"], [30, "30 menit lagi"], [60, "1 jam lagi"], [120, "2 jam lagi"]].map(([value, label]) => <button key={value} type="button" aria-pressed={delay === value} onClick={() => setDelay(Number(value))} className={delay === value ? primaryButtonClass : secondaryButtonClass}>{label}</button>)}</div>
            <label htmlFor="quick-delay" className={`mt-3 ${labelClass}`}>Atau masukkan jeda (menit)</label>
            <input id="quick-delay" type="number" min={0} step={1} value={Number.isFinite(delay) ? delay : ""} onChange={(event) => setDelay(event.target.valueAsNumber)} className={inputClass} />
        </fieldset>
        <fieldset>
            <legend className="mb-2 text-sm font-bold">Selesai setelah waktu mulai</legend>
            <div className="flex flex-wrap gap-2">{[[30, "30 menit"], [60, "1 jam"], [120, "2 jam"], [1440, "1 hari"], [2880, "2 hari"], [10080, "7 hari"]].map(([value, label]) => <button key={value} type="button" aria-pressed={duration === value} onClick={() => setDuration(Number(value))} className={duration === value ? primaryButtonClass : secondaryButtonClass}>{label}</button>)}</div>
            <label htmlFor="quick-duration" className={`mt-3 ${labelClass}`}>Atau masukkan jendela sesi (menit)</label>
            <input id="quick-duration" type="number" min={1} step={1} value={Number.isFinite(duration) ? duration : ""} onChange={(event) => setDuration(event.target.valueAsNumber)} className={inputClass} />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">1 hari = 24 jam. Ini bukan durasi pengerjaan soal per paket.</p>
        </fieldset>
        {error && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button type="button" onClick={close} className={secondaryButtonClass}>Batal</button>
            <button type="button" onClick={apply} className={primaryButtonClass}>Terapkan</button>
        </div>
    </SessionOptionsPopup>;
}

PublicSessions.layout = (page: ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
