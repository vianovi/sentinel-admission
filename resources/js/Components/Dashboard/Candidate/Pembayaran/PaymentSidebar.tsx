// =============================================================================
// LOKASI FILE: resources/js/Components/Dashboard/Candidate/Pembayaran/PaymentSidebar.tsx
// =============================================================================

import { animate, stagger } from "animejs";
import { useEffect }        from "react";
import useCountdown          from "./useCountdown";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type UserData = {
    name:       string;
    avatar_url: string | null;
    initials:   string;
};

type WaveInfo = {
    title:            string;
    academic_year:    string | null;
    registration_fee: number;
    end_date:         string | null;
};

type PaymentData = {
    id:              number;
    order_id:        string;
    payment_channel: string;
    final_amount:    number;
    fee_amount:      number;
    status:          string;
    manual_status:   string | null;
    expired_at:      string | null;
    is_expired:      boolean;
};

type ConfigData = {
    whatsapp_contact_label: string | null;
};

type Props = {
    user:          UserData;
    candidateName: string;
    candidateCode: string;
    status:        string;
    programChoice: string | null;
    nisn:          string | null;
    schoolOrigin:  string | null;
    motherName:    string | null;
    wave:          WaveInfo | null;
    payment:       PaymentData | null;
    config:        ConfigData | null;
    whatsappUrl:   string | null;
    baseAmount:    number;
    isPaid:        boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — identik dengan CandidateSidebar
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, {
    label: string; clsDark: string; clsLight: string; dotDark: string; dotLight: string;
}> = {
    draft:     { label: "Draft",               clsDark: "bg-slate-700/50 text-slate-300",       clsLight: "bg-slate-100 text-slate-600",     dotDark: "bg-slate-400",   dotLight: "bg-slate-500" },
    submitted: { label: "Menunggu Verifikasi", clsDark: "bg-blue-500/20 text-blue-300",         clsLight: "bg-blue-50 text-blue-700",        dotDark: "bg-blue-400",    dotLight: "bg-blue-500" },
    verified:  { label: "Terverifikasi",       clsDark: "bg-amber-500/20 text-amber-300",       clsLight: "bg-amber-50 text-amber-700",      dotDark: "bg-amber-400",   dotLight: "bg-amber-500" },
    accepted:  { label: "Diterima",            clsDark: "bg-emerald-500/20 text-emerald-300",   clsLight: "bg-emerald-50 text-emerald-700",  dotDark: "bg-emerald-400", dotLight: "bg-emerald-500" },
    rejected:  { label: "Ditolak",             clsDark: "bg-red-500/20 text-red-300",           clsLight: "bg-red-50 text-red-700",          dotDark: "bg-red-400",     dotLight: "bg-red-500" },
};

const PAYMENT_TIPS = [
    "Pilih gateway untuk konfirmasi instan tanpa menunggu staff",
    "Sertakan kode kandidat di berita transfer bank",
    "Gateway tidak perlu upload bukti pembayaran manual",
    "Untuk transfer/cash, simpan bukti hingga status berubah lunas",
    "Hubungi tim PSB jika ada kendala verifikasi",
];

const CHANNEL_LABEL: Record<string, string> = {
    gateway:  "Payment Gateway",
    transfer: "Transfer Bank",
    cash:     "Bayar Langsung",
};

const MANUAL_STATUS_INFO: Record<string, { label: string; colorDark: string; colorLight: string }> = {
    waiting_proof:  { label: "Menunggu Bukti",      colorDark: "text-amber-400",   colorLight: "text-amber-600" },
    proof_uploaded: { label: "Menunggu Verifikasi", colorDark: "text-blue-400",    colorLight: "text-blue-600" },
    verified:       { label: "Terverifikasi",        colorDark: "text-emerald-400", colorLight: "text-emerald-600" },
    rejected:       { label: "Bukti Ditolak",        colorDark: "text-rose-400",    colorLight: "text-rose-600" },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
    });
};

// Warna countdown berdasarkan sisa waktu
// Format label gelombang: "Gelombang 2" + "2026/2027" → "G2-2026/2027"
const formatWaveLabel = (title: string | undefined, academicYear: string | null | undefined): string => {
    if (!title) return "—"
    // Ambil angka dari title: "Gelombang 2" → "2"
    const num = title.match(/\d+/)?.[0] ?? ""
    const base = num ? `G${num}` : title
    return academicYear ? `${base}-${academicYear}` : base
}

const countdownColorDark = (totalSecs: number): string => {
    if (totalSecs < 300)  return "text-rose-400";
    if (totalSecs < 1800) return "text-amber-400";
    return "text-emerald-400";
};

const countdownColorLight = (totalSecs: number): string => {
    if (totalSecs < 300)  return "text-rose-600";
    if (totalSecs < 1800) return "text-amber-600";
    return "text-emerald-600";
};

// Bar gradient sesuai sisa waktu (mirip progress bar CandidateSidebar)
const countdownBarCls = (totalSecs: number): string => {
    if (totalSecs < 300)  return "[background:linear-gradient(to_right,#c0392b,#e74c3c)]";
    if (totalSecs < 1800) return "[background:linear-gradient(to_right,#d35400,#f39c12)]";
    if (totalSecs < 7200) return "[background:linear-gradient(to_right,#2980b9,#7aa2f7)]";
    return "[background:linear-gradient(to_right,#1e8449,#27ae60)]";
};

// ─────────────────────────────────────────────────────────────────────────────
// COUNTDOWN SECTION — menggantikan progress bar
// ─────────────────────────────────────────────────────────────────────────────

function CountdownSection({
    payment, isPaid
}: {
    payment: PaymentData | null;
    isPaid:  boolean;
}) {
    const expiredAt  = payment?.payment_channel === "gateway" ? payment.expired_at : null;
    const { timeLeft, isExpired } = useCountdown(expiredAt);

    // ── Sudah lunas ──────────────────────────────────────────────────────────
    if (isPaid) {
        return (
            <div className="border-t dark:border-white/5 border-black/5 pt-3">
                <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] dark:text-[#8aa4c0] text-amber-900/60">Status Pembayaran</p>
                    <p className="text-[11px] font-bold text-emerald-400">Lunas ✓</p>
                </div>
                <div className="h-1.5 dark:bg-white/[0.06] bg-black/[0.07] rounded-full overflow-hidden">
                    <div className="h-full rounded-full [background:linear-gradient(to_right,#1e8449,#27ae60)]"
                        style={{ width: "100%" }} />
                </div>
                <p className="text-[10px] dark:text-[#506070] text-amber-800/50 mt-1.5">
                    ✅ Pembayaran sudah dikonfirmasi
                </p>
            </div>
        );
    }

    // ── Tidak ada payment aktif ───────────────────────────────────────────────
    if (!payment) {
        return (
            <div className="border-t dark:border-white/5 border-black/5 pt-3">
                <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] dark:text-[#8aa4c0] text-amber-900/60">Status Pembayaran</p>
                    <p className="text-[11px] font-bold dark:text-slate-500 text-slate-400">Belum Bayar</p>
                </div>
                <div className="h-1.5 dark:bg-white/[0.06] bg-black/[0.07] rounded-full overflow-hidden">
                    <div className="h-full rounded-full dark:bg-white/[0.08] bg-black/[0.08]"
                        style={{ width: "0%" }} />
                </div>
                <p className="text-[10px] dark:text-[#506070] text-amber-800/50 mt-1.5">
                    Pilih metode pembayaran untuk memulai
                </p>
            </div>
        );
    }

    // ── Manual channel (transfer/cash) — tidak ada countdown ─────────────────
    if (payment.payment_channel !== "gateway") {
        const manualInfo = payment.manual_status
            ? MANUAL_STATUS_INFO[payment.manual_status]
            : null;

        return (
            <div className="border-t dark:border-white/5 border-black/5 pt-3">
                <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] dark:text-[#8aa4c0] text-amber-900/60">Status Bukti</p>
                    <p className={`text-[11px] font-bold
                        dark:${manualInfo?.colorDark ?? "text-slate-400"}
                        ${manualInfo?.colorLight ?? "text-slate-500"}`}>
                        {manualInfo?.label ?? "Menunggu"}
                    </p>
                </div>
                <div className="h-1.5 dark:bg-white/[0.06] bg-black/[0.07] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700
                        ${payment.manual_status === "verified"
                            ? "[background:linear-gradient(to_right,#1e8449,#27ae60)]"
                            : payment.manual_status === "proof_uploaded"
                                ? "[background:linear-gradient(to_right,#2980b9,#7aa2f7)]"
                                : payment.manual_status === "rejected"
                                    ? "[background:linear-gradient(to_right,#c0392b,#e74c3c)]"
                                    : "[background:linear-gradient(to_right,#d35400,#f39c12)]"
                        }`}
                        style={{ width: payment.manual_status === "verified" ? "100%"
                            : payment.manual_status === "proof_uploaded" ? "66%"
                            : payment.manual_status === "rejected" ? "33%"
                            : "15%" }}
                    />
                </div>
                <p className="text-[10px] dark:text-[#506070] text-amber-800/50 mt-1.5">
                    {payment.manual_status === "verified"    ? "✅ Bukti sudah diverifikasi staff"
                    : payment.manual_status === "proof_uploaded" ? "Menunggu verifikasi staff (1×24 jam kerja)"
                    : payment.manual_status === "rejected"   ? "Bukti ditolak — upload ulang bukti pembayaran"
                    : "Upload bukti transfer/kwitansi untuk melanjutkan"}
                </p>
            </div>
        );
    }

    // ── Gateway — countdown timer ─────────────────────────────────────────────
    const EXPIRE_SECS = 24 * 3600; // 24 jam dalam detik

    if (isExpired || payment.is_expired || !timeLeft) {
        return (
            <div className="border-t dark:border-white/5 border-black/5 pt-3">
                <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] dark:text-[#8aa4c0] text-amber-900/60">Batas Waktu</p>
                    <p className="text-[11px] font-bold text-rose-400">Kadaluarsa</p>
                </div>
                <div className="h-1.5 dark:bg-white/[0.06] bg-black/[0.07] rounded-full overflow-hidden">
                    <div className="h-full rounded-full [background:linear-gradient(to_right,#c0392b,#e74c3c)]"
                        style={{ width: "100%" }} />
                </div>
                <p className="text-[10px] dark:text-[#506070] text-amber-800/50 mt-1.5">
                    Transaksi sudah melewati batas waktu
                </p>
            </div>
        );
    }

    const totalSecs  = timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
    const pct        = Math.min(100, Math.round((totalSecs / EXPIRE_SECS) * 100));

    return (
        <div className="border-t dark:border-white/5 border-black/5 pt-3">
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] dark:text-[#8aa4c0] text-amber-900/60">Batas Waktu</p>
                <p className={`text-[11px] font-bold font-mono
                    dark:${countdownColorDark(totalSecs)} ${countdownColorLight(totalSecs)}`}>
                    {String(timeLeft.hours).padStart(2, "0")}:
                    {String(timeLeft.minutes).padStart(2, "0")}:
                    {String(timeLeft.seconds).padStart(2, "0")}
                </p>
            </div>
            <div className="h-1.5 dark:bg-white/[0.06] bg-black/[0.07] rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${countdownBarCls(totalSecs)}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="text-[10px] dark:text-[#506070] text-amber-800/50 mt-1.5">
                {totalSecs < 300
                    ? "⚠️ Segera selesaikan pembayaran!"
                    : "Selesaikan sebelum batas waktu habis"
                }
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — struktur identik CandidateSidebar
// ─────────────────────────────────────────────────────────────────────────────

export default function PaymentSidebar({
    user, candidateName, candidateCode, status, programChoice,
    nisn, schoolOrigin, motherName,
    wave, payment, config, whatsappUrl, baseAmount, isPaid,
}: Props) {
    const statusInfo = STATUS_MAP[status] ?? STATUS_MAP.draft;

    useEffect(() => {
        animate(".sidebar-fade", {
            opacity: [0, 1], translateY: [8, 0],
            duration: 400, delay: stagger(60), ease: "outExpo",
        });
    }, []);

    // Status pembayaran untuk ringkasan
    const paymentStatusLabel = isPaid
        ? "Lunas ✓"
        : payment
            ? (payment.manual_status
                ? (MANUAL_STATUS_INFO[payment.manual_status]?.label ?? "Pending")
                : "Menunggu")
            : "Belum Bayar";

    // Ringkasan rows — urutan sesuai gambar referensi
    // Baris biasa (tidak highlight)
    const summaryRows = [
        ...(nisn         ? [{ label: "NISN",             value: nisn }]         : []),
        ...(motherName   ? [{ label: "Nama Ibu",         value: motherName }]   : []),
        ...(schoolOrigin ? [{ label: "Asal Sekolah",     value: schoolOrigin }] : []),
        ...(programChoice ? [{ label: "Program",         value: programChoice }] : []),
        { label: "Status Bayar",  value: paymentStatusLabel },
        { label: "Metode",        value: payment ? (CHANNEL_LABEL[payment.payment_channel] ?? "—") : "—" },
        { label: "Gelombang",     value: formatWaveLabel(wave?.title, wave?.academic_year) },
    ];

    return (
        <div className="flex flex-col gap-3 pb-2">

            {/* ── Profile card — IDENTIK dengan CandidateSidebar ──────────── */}
            <div className="sidebar-fade opacity-0 relative rounded-2xl overflow-hidden border
                            border-blue-900/20 dark:border-blue-900/20
                            bg-[#faf7f0] dark:bg-[#0a0f1e]">

                {/* Fog layer 1 */}
                <div className="absolute -top-10 -right-10 w-56 h-56 pointer-events-none z-0
                                dark:[background:radial-gradient(circle_at_top_right,rgba(30,100,255,0.4)_0%,rgba(20,60,180,0.18)_35%,transparent_70%)]
                                [background:radial-gradient(circle_at_top_right,rgba(190,140,50,0.28)_0%,rgba(200,160,80,0.12)_35%,transparent_70%)]">
                </div>
                {/* Fog layer 2 */}
                <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none z-0
                                dark:[background:radial-gradient(circle_at_top_right,rgba(80,140,255,0.32)_0%,transparent_65%)]
                                [background:radial-gradient(circle_at_top_right,rgba(200,155,60,0.22)_0%,transparent_65%)]">
                </div>
                {/* Accent lines */}
                <div className="absolute top-0 right-0 w-px h-28 pointer-events-none z-0
                                dark:[background:linear-gradient(to_bottom,rgba(100,160,255,0.7),transparent)]
                                [background:linear-gradient(to_bottom,rgba(180,130,40,0.45),transparent)]">
                </div>
                <div className="absolute top-0 right-0 h-px w-28 pointer-events-none z-0
                                dark:[background:linear-gradient(to_left,rgba(100,160,255,0.7),transparent)]
                                [background:linear-gradient(to_left,rgba(180,130,40,0.45),transparent)]">
                </div>

                {/* Banner area */}
                <div className="h-20 relative z-10">
                    <div className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold
                                    dark:${statusInfo.clsDark} ${statusInfo.clsLight}
                                    dark:bg-opacity-100 border dark:border-blue-900/30 border-amber-200/50`}>
                        <span className={`w-1.5 h-1.5 rounded-full dark:${statusInfo.dotDark} ${statusInfo.dotLight}`}></span>
                        {statusInfo.label}
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-4 relative z-10">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden -mt-7 mb-2.5
                                    border-[3px] dark:border-[#0a0f1e] border-[#faf7f0]
                                    dark:outline dark:outline-2 dark:outline-blue-400/40
                                    outline outline-2 outline-amber-400/30
                                    flex items-center justify-center
                                    dark:bg-[#1a2440] bg-[#f0e8d0]">
                        {user.avatar_url
                            ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                            : <span className="text-lg font-display font-bold dark:text-blue-400 text-amber-700">{user.initials}</span>
                        }
                    </div>

                    <p className="text-sm font-semibold dark:text-slate-100 text-slate-800 leading-snug truncate">
                        {candidateName}
                    </p>
                    <p className="text-xs dark:text-[#7a92b0] text-amber-800/70 mt-0.5 mb-3">
                        {wave ? formatWaveLabel(wave.title, wave.academic_year) : "Belum ada gelombang"}
                    </p>

                    {/* Countdown — menggantikan progress bar */}
                    <CountdownSection payment={payment} isPaid={isPaid} />
                </div>
            </div>

            {/* ── Ringkasan — IDENTIK struktur dengan CandidateSidebar ─────── */}
            <div className="sidebar-fade opacity-0 rounded-2xl border dark:border-white/[0.07] border-black/[0.07]
                            dark:bg-[#0f172a] bg-[#f5f0e8] p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] font-bold dark:text-[#4a6480] text-amber-800/60 mb-2.5">
                    Ringkasan
                </p>
                <div className="flex flex-col">
                    {summaryRows.map((item, i) => (
                        <div key={i} className="flex items-baseline justify-between py-1
                            border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
                            <p className="text-[11px] dark:text-[#5a7898] text-amber-900/60 shrink-0">{item.label}</p>
                            <p className="text-[11px] font-medium dark:text-[#c8daf0] text-slate-700 text-right truncate max-w-[130px]">
                                {item.value}
                            </p>
                        </div>
                    ))}
                    {/* Biaya Pendaftaran — baris bawah khusus, warna biru seperti Program di CandidateSidebar */}
                    <div className="flex items-baseline justify-between pt-2 mt-1 border-t dark:border-white/5 border-black/5">
                        <p className="text-[11px] dark:text-[#5a7898] text-amber-900/60 shrink-0">Biaya Pendaftaran</p>
                        <p className="text-[11px] font-bold dark:text-blue-400 text-amber-700">
                            {formatRupiah(baseAmount)}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Tips — IDENTIK struktur dengan CandidateSidebar ──────────── */}
            <div className="sidebar-fade opacity-0 rounded-2xl border dark:border-gold/10 border-amber-200/60
                            dark:bg-gold/[0.06] bg-[#fdf5e0] p-4">
                <div className="flex items-start gap-2">
                    <i className="fa-solid fa-lightbulb dark:text-gold text-amber-600 text-xs mt-0.5 shrink-0"></i>
                    <div>
                        <p className="text-xs font-bold dark:text-gold text-amber-800 mb-2">Tips Pembayaran</p>
                        <ul className="space-y-1.5">
                            {PAYMENT_TIPS.map((tip, i) => (
                                <li key={i} className="text-[11px] dark:text-[#8aa0b8] text-amber-900/70 flex items-start gap-1.5">
                                    <span className="dark:text-gold/50 text-amber-600 mt-0.5 shrink-0">•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
}
