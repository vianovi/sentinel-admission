import { useEffect } from "react";
import { animate, stagger } from "animejs";
import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";

// ─── Types ───────────────────────────────────────────────────────────────────

type AdmissionWave = {
    title:         string;
    academic_year: string;
    end_date:      string | null;
} | null;

type Candidate = {
    id:              number;
    full_name:       string;
    nisn:            string;
    nik:             string;
    gender_label:    string;
    place_of_birth:  string;
    date_of_birth:   string | null;
    school_origin:   string;
    address_full:    string;
    status:          "draft" | "submitted" | "verified" | "accepted" | "rejected";
    admission_wave:  AdmissionWave;
} | null;

type Document = {
    id:             number;
    document_type:  string;
    document_owner: string;
    status:         "pending" | "valid" | "invalid";
    admin_note:     string | null;
    file_path:      string | null;
    created_at:     string;
};

type Payment = {
    id:               number;
    transaction_code: string;
    payment_method:   string;
    expected_amount:  number;
    amount:           number | null;
    status:           string;
    verified_at:      string | null;
    admin_note:       string | null;
} | null;

type Props = {
    candidate:      Candidate;
    documents:      Document[];
    payment:        Payment;
    email_verified: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        draft:     "bg-slate-100 text-slate-600",
        submitted: "bg-blue-50 text-blue-600",
        verified:  "bg-amber-50 text-amber-600",
        accepted:  "bg-emerald-50 text-emerald-700",
        rejected:  "bg-red-50 text-red-600",
        pending:   "bg-orange-50 text-orange-600",
        valid:     "bg-emerald-50 text-emerald-700",
        invalid:   "bg-red-50 text-red-600",
    };
    return map[status] ?? "bg-slate-100 text-slate-500";
};

const statusLabel = (status: string) => {
    const map: Record<string, string> = {
        draft:     "Draft",
        submitted: "Menunggu Verifikasi",
        verified:  "Terverifikasi",
        accepted:  "Diterima",
        rejected:  "Ditolak",
        pending:   "Pending",
        valid:     "Valid",
        invalid:   "Tidak Valid",
    };
    return map[status] ?? status;
};

const statusIcon = (status: string) => {
    const map: Record<string, string> = {
        draft:     "fa-solid fa-pen-to-square text-slate-500",
        submitted: "fa-solid fa-paper-plane text-blue-500",
        verified:  "fa-solid fa-magnifying-glass text-amber-500",
        accepted:  "fa-solid fa-circle-check text-emerald-500",
        rejected:  "fa-solid fa-circle-xmark text-red-500",
    };
    return map[status] ?? "fa-solid fa-circle text-slate-400";
};

const timelineSteps = [
    { key: "draft",     label: "Data Tersimpan" },
    { key: "submitted", label: "Dokumen Diupload" },
    { key: "verified",  label: "Dokumen Diverifikasi" },
    { key: "accepted",  label: "Diterima" },
];

const stepOrder = ["draft", "submitted", "verified", "accepted", "rejected"];

const getStepIndex = (status: string) => stepOrder.indexOf(status);

const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const docTypeLabel = (type: string) => {
    const map: Record<string, string> = {
        kk:             "Kartu Keluarga",
        akta:           "Akta Kelahiran",
        ijazah:         "Ijazah / SKL",
        foto:           "Pas Foto",
        rapor:          "Rapor",
        surat_domisili: "Surat Domisili",
    };
    return map[type] ?? type;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CandidateDashboard({ candidate, documents, payment, email_verified }: Props) {
    useEffect(() => {
        animate(".card-item", {
            opacity:    [0, 1],
            translateY: [20, 0],
            duration:   600,
            delay:      stagger(80),
            ease:       "outExpo",
        });
    }, []);

    // ── Null candidate state ──────────────────────────────────────────────────
    if (!candidate) {
        return (
            <DashboardLayout>
                <Head title="Dashboard Pendaftar" />
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                        <i className="fa-solid fa-graduation-cap text-gold text-2xl"></i>
                    </div>
                    <h2 className="text-lg font-display font-bold text-slate-800 dark:text-white">
                        Belum Ada Data Pendaftaran
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                        Kamu belum memulai proses pendaftaran. Klik tombol di bawah untuk memulai.
                    </p>
                    <a
                        href="/admission/register"
                        className="mt-6 bg-gold hover:bg-goldhover text-navy px-6 py-2.5 rounded-xl font-semibold text-sm shadow-glow transition hover:-translate-y-0.5"
                    >
                        Mulai Pendaftaran
                    </a>
                </div>
            </DashboardLayout>
        );
    }

    const currentStepIndex = getStepIndex(candidate.status);

    return (
        <DashboardLayout>
            <Head title="Dashboard Pendaftar" />

            <div className="flex flex-col gap-6">

                {/* ── Email verification banner ── */}
                {!email_verified && (
                    <div className="card-item opacity-0 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                        <i className="fa-solid fa-circle-info text-amber-500 mt-0.5 flex-shrink-0"></i>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800">Email belum diverifikasi</p>
                            <p className="text-xs text-amber-600 mt-0.5">
                                Silakan cek inbox kamu dan klik link verifikasi untuk melanjutkan proses pendaftaran.
                            </p>
                        </div>
                        <a
                            href="/email/verify"
                            className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition shrink-0"
                        >
                            Verifikasi →
                        </a>
                    </div>
                )}

                {/* ── Greeting + info gelombang ── */}
                <div className="card-item opacity-0 bg-navy rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold mb-1">
                            Selamat Datang
                        </p>
                        <h1 className="text-xl font-display font-bold text-white">
                            {candidate.full_name}
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            NISN: <span className="text-slate-300 font-medium">{candidate.nisn}</span>
                            <span className="mx-2 text-slate-600">·</span>
                            Asal: <span className="text-slate-300 font-medium">{candidate.school_origin}</span>
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-right shrink-0">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Gelombang</p>
                        <p className="text-sm font-display font-bold text-white mt-0.5">
                            {candidate.admission_wave?.title ?? "-"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            {candidate.admission_wave?.academic_year ?? ""}
                        </p>
                    </div>
                </div>

                {/* ── Status timeline ── */}
                <div className="card-item opacity-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-display font-semibold text-slate-800 dark:text-white">
                            Status Pendaftaran
                        </h2>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${statusBadge(candidate.status)}`}>
                            {statusLabel(candidate.status)}
                        </span>
                    </div>

                    {/* Timeline steps */}
                    <div className="flex items-start gap-0">
                        {timelineSteps.map((step, i) => {
                            const isDone    = currentStepIndex > i || (candidate.status === "accepted" && i === 3);
                            const isActive  = candidate.status === step.key || (candidate.status === "rejected" && i === currentStepIndex);
                            const isRejected = candidate.status === "rejected" && i === currentStepIndex;
                            const isLast    = i === timelineSteps.length - 1;

                            return (
                                <div key={step.key} className={`flex flex-col items-center ${!isLast ? "flex-1" : ""}`}>
                                    <div className="flex items-center w-full">
                                        {/* Circle */}
                                        <div className={`
                                            w-8 h-8 rounded-xl flex items-center justify-center shrink-0 z-10
                                            ${isDone    ? "bg-gold shadow-glow"                          : ""}
                                            ${isActive && !isRejected ? "bg-gold/20 border-2 border-gold" : ""}
                                            ${isRejected ? "bg-red-100 border-2 border-red-400"          : ""}
                                            ${!isDone && !isActive ? "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10" : ""}
                                        `}>
                                            {isDone && <i className="fa-solid fa-check text-navy text-xs"></i>}
                                            {isActive && !isRejected && <i className={`${statusIcon(step.key)} text-xs`}></i>}
                                            {isRejected && <i className="fa-solid fa-xmark text-red-500 text-xs"></i>}
                                            {!isDone && !isActive && (
                                                <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                                            )}
                                        </div>

                                        {/* Connector line */}
                                        {!isLast && (
                                            <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-500 ${isDone ? "bg-gold" : "bg-slate-200 dark:bg-white/10"}`} />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <p className={`
                                        text-[10px] font-semibold mt-2 text-center leading-tight
                                        ${isDone || isActive ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}
                                    `}>
                                        {step.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Dokumen + Pembayaran grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Dokumen */}
                    <div className="card-item opacity-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-soft">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-display font-semibold text-slate-800 dark:text-white">
                                Dokumen Pendaftaran
                            </h2>
                            <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                                <i className="fa-solid fa-file-lines text-gold text-xs"></i>
                            </div>
                        </div>

                        {documents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                                    <i className="fa-solid fa-folder-open text-slate-400 text-lg"></i>
                                </div>
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Belum ada dokumen</p>
                                <p className="text-xs text-slate-400 mt-1">Upload dokumen untuk melanjutkan pendaftaran</p>
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-2.5">
                                {documents.map((doc) => (
                                    <li key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                            <i className="fa-solid fa-file text-slate-400 text-xs"></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                                {docTypeLabel(doc.document_type)}
                                            </p>
                                            {doc.admin_note && (
                                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{doc.admin_note}</p>
                                            )}
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 ${statusBadge(doc.status)}`}>
                                            {statusLabel(doc.status)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Pembayaran */}
                    <div className="card-item opacity-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-soft">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-display font-semibold text-slate-800 dark:text-white">
                                Informasi Pembayaran
                            </h2>
                            <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                                <i className="fa-solid fa-credit-card text-gold text-xs"></i>
                            </div>
                        </div>

                        {!payment ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                                    <i className="fa-solid fa-receipt text-slate-400 text-lg"></i>
                                </div>
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Belum ada tagihan</p>
                                <p className="text-xs text-slate-400 mt-1">Tagihan akan muncul setelah dokumen diverifikasi</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {/* Amount highlight */}
                                <div className="bg-navy rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Total Tagihan</p>
                                        <p className="text-2xl font-display font-bold text-white mt-1">
                                            {formatRupiah(payment.expected_amount)}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${statusBadge(payment.status)}`}>
                                        {statusLabel(payment.status)}
                                    </span>
                                </div>

                                {/* Transaction code */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Kode Transaksi</p>
                                        <p className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                                            {payment.transaction_code}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(payment.transaction_code)}
                                        className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-gold transition"
                                        title="Salin kode"
                                    >
                                        <i className="fa-solid fa-copy text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}