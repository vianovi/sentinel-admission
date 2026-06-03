// resources/js/Components/Dashboard/Candidate/DataKesehatan/TabCatatanKhusus.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, stagger }                          from "animejs";
import axios                                         from "axios";
import Field, { textareaCls }                        from "@/Components/UI/Field";
import FilePreviewModal                              from "@/Components/UI/FilePreviewModal";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    specialNotes:   string; setSpecialNotes:   (v: string) => void;
    parentConcern:  string; setParentConcern:  (v: string) => void;
    suratSehatUrl:  string | null;
    bpjsCardUrl:    string | null;
    vaccineCardUrl: string | null;
    suratSehatStatus?:     "pending" | "verified" | "rejected";
    bpjsCardStatus?:       "pending" | "verified" | "rejected";
    vaccineCardStatus?:    "pending" | "verified" | "rejected";
    suratSehatRejection?:  string | null;
    bpjsCardRejection?:    string | null;
    vaccineCardRejection?: string | null;
};

type DocKey = "surat_sehat" | "bpjs_card" | "vaccine_card";

type DocState = {
    serverUrl:    string | null;
    localFile:    File | null;
    uploading:    boolean;
    progress:     number;          // 0–100, progress upload
    error:        string | null;
    status:       "empty" | "pending" | "verified" | "rejected";
    rejection:    string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DOC_CONFIG: Record<DocKey, { label: string; hint: string; required: boolean; icon: string; desc: string }> = {
    surat_sehat: {
        label:    "Surat Keterangan Sehat",
        hint:     "Dari dokter / puskesmas",
        required: false,
        icon:     "fa-solid fa-file-medical",
        desc:     "Dikeluarkan oleh dokter atau puskesmas setempat",
    },
    bpjs_card: {
        label:    "Kartu BPJS / JKN",
        hint:     "Kartu peserta BPJS Kesehatan",
        required: true,
        icon:     "fa-solid fa-id-card",
        desc:     "Kartu peserta BPJS Kesehatan aktif",
    },
    vaccine_card: {
        label:    "Kartu Vaksin / Imunisasi",
        hint:     "Buku KIA atau sertifikat vaksin",
        required: false,
        icon:     "fa-solid fa-syringe",
        desc:     "Buku KIA, kartu imunisasi, atau sertifikat vaksin digital",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Status badge config — warna hardcoded (tidak dynamic)
const STATUS_CONFIG = {
    empty:    { label: "Belum diunggah",  icon: "fa-solid fa-minus",        bg: "dark:bg-slate-700/40 bg-slate-100",      border: "dark:border-slate-600/40 border-slate-200",      text: "dark:text-slate-500 text-slate-400"      },
    pending:  { label: "Menunggu review", icon: "fa-solid fa-clock",        bg: "dark:bg-amber-500/10 bg-amber-50",       border: "dark:border-amber-500/20 border-amber-200",      text: "dark:text-amber-400 text-amber-600"      },
    verified: { label: "Terverifikasi",   icon: "fa-solid fa-circle-check", bg: "dark:bg-cyan-500/10 bg-cyan-50",         border: "dark:border-cyan-500/20 border-cyan-200",        text: "dark:text-cyan-400 text-cyan-600"        },
    rejected: { label: "Ditolak",         icon: "fa-solid fa-circle-xmark", bg: "dark:bg-red-500/10 bg-red-50",           border: "dark:border-red-500/20 border-red-200",          text: "dark:text-red-400 text-red-500"          },
    local:    { label: "Siap dikirim",    icon: "fa-solid fa-arrow-up",     bg: "dark:bg-blue-500/10 bg-blue-50",         border: "dark:border-blue-500/20 border-blue-200",        text: "dark:text-blue-400 text-blue-600"        },
    uploading:{ label: "Mengunggah...",   icon: "fa-solid fa-spinner fa-spin", bg: "dark:bg-cyan-500/10 bg-cyan-50",     border: "dark:border-cyan-500/20 border-cyan-200",        text: "dark:text-cyan-400 text-cyan-600"        },
} as const;

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: DocCard — premium card per dokumen
// ─────────────────────────────────────────────────────────────────────────────

function DocCard({
    docKey, config, docState, onFileSelect, submitted,
}: {
    docKey:       DocKey;
    config:       typeof DOC_CONFIG[DocKey];
    docState:     DocState;
    onFileSelect: (key: DocKey, file: File) => void;
    submitted:    boolean;
}) {
    const inputRef      = useRef<HTMLInputElement>(null);
    const [drag, setDrag] = useState(false);
    const isLocked      = docState.status === "verified";
    const hasFile       = !!(docState.localFile || docState.serverUrl);

    // Derive display status
    const displayStatus = docState.uploading
        ? "uploading"
        : docState.localFile
            ? "local"
            : (docState.serverUrl ? docState.status : "empty") as keyof typeof STATUS_CONFIG;

    const statusConf = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.empty;

    // ── Drag & drop ──────────────────────────────────────────────────────────
    const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); if (!isLocked && !docState.uploading) setDrag(true);  }, [isLocked, docState.uploading]);
    const handleDragLeave = useCallback(() => setDrag(false), []);
    const handleDrop      = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDrag(false);
        if (isLocked || docState.uploading || submitted) return;
        const file = e.dataTransfer.files[0];
        if (file) onFileSelect(docKey, file);
    }, [isLocked, docState.uploading, submitted, docKey, onFileSelect]);

    return (
        <div
            className={[
                "rounded-2xl border transition-all duration-200 overflow-hidden",
                drag
                    ? "dark:border-cyan-500/50 border-cyan-400 dark:bg-cyan-500/[0.06] bg-cyan-50/50"
                    : "dark:border-white/[0.07] border-black/[0.07] dark:bg-white/[0.02] bg-white",
            ].join(" ")}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* ── Header baris atas: icon + info + status badge ── */}
            <div className="flex items-start gap-3 p-4">

                {/* Doc icon */}
                <div className={[
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-200",
                    displayStatus === "verified"  ? "dark:bg-cyan-500/15 bg-cyan-50"   :
                    displayStatus === "local"     ? "dark:bg-blue-500/15 bg-blue-50"   :
                    displayStatus === "rejected"  ? "dark:bg-red-500/15 bg-red-50"     :
                    displayStatus === "pending"   ? "dark:bg-amber-500/15 bg-amber-50" :
                                                   "dark:bg-white/[0.05] bg-slate-100",
                ].join(" ")}>
                    <i className={`${config.icon} text-sm ${statusConf.text}`}></i>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-xs font-semibold dark:text-slate-200 text-slate-700">
                            {config.label}
                        </p>
                        {config.required && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md
                                             dark:bg-amber-500/10 bg-amber-50
                                             dark:text-amber-400 text-amber-600
                                             border dark:border-amber-500/20 border-amber-200">
                                wajib
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] dark:text-slate-500 text-slate-400 leading-relaxed">
                        {config.desc}
                    </p>
                    {/* File info kalau ada local file */}
                    {docState.localFile && (
                        <p className="text-[11px] dark:text-slate-500 text-slate-400 mt-1 flex items-center gap-1.5">
                            <i className="fa-solid fa-paperclip text-[9px]"></i>
                            <span className="truncate max-w-[180px]">{docState.localFile.name}</span>
                            <span className="shrink-0 dark:text-slate-600 text-slate-300">·</span>
                            <span className="shrink-0">{formatFileSize(docState.localFile.size)}</span>
                        </p>
                    )}
                </div>

                {/* Status badge — kanan atas */}
                <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                                 border text-[10px] font-semibold
                                 ${statusConf.bg} ${statusConf.border} ${statusConf.text}`}>
                    <i className={`${statusConf.icon} text-[9px]`}></i>
                    <span className="hidden sm:inline">{statusConf.label}</span>
                </div>
            </div>

            {/* ── Upload progress bar (hanya saat uploading) ── */}
            {docState.uploading && (
                <div className="px-4 pb-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] dark:text-slate-500 text-slate-400">Mengunggah...</span>
                        <span className="text-[11px] font-semibold dark:text-cyan-400 text-cyan-600">
                            {docState.progress}%
                        </span>
                    </div>
                    <div className="h-1.5 dark:bg-white/[0.06] bg-black/[0.06] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-cyan-500 transition-all duration-200"
                            style={{ width: `${docState.progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* ── Rejection reason ── */}
            {docState.status === "rejected" && docState.rejection && (
                <div className="mx-4 mb-3 flex items-start gap-2 p-2.5 rounded-lg
                                dark:bg-red-500/[0.08] bg-red-50
                                border dark:border-red-500/15 border-red-200">
                    <i className="fa-solid fa-circle-info text-red-400 text-[10px] mt-0.5 shrink-0"></i>
                    <p className="text-[11px] dark:text-red-400/80 text-red-600 leading-relaxed">
                        {docState.rejection}
                    </p>
                </div>
            )}

            {/* ── Error message ── */}
            {docState.error && (
                <div className="mx-4 mb-3 flex items-center gap-2 p-2.5 rounded-lg
                                dark:bg-red-500/[0.08] bg-red-50
                                border dark:border-red-500/15 border-red-200">
                    <i className="fa-solid fa-circle-exclamation text-red-400 text-[10px] shrink-0"></i>
                    <p className="text-[11px] dark:text-red-400/80 text-red-600">{docState.error}</p>
                </div>
            )}

            {/* ── Footer: drag hint + action buttons ── */}
            <div className="flex items-center justify-between gap-3 px-4 py-3
                            border-t dark:border-white/[0.05] border-black/[0.05]
                            dark:bg-white/[0.01] bg-slate-50/50">

                {/* Drag hint — hanya kalau tidak ada file & tidak locked */}
                {!isLocked && !hasFile && !docState.uploading && (
                    <p className="text-[11px] dark:text-slate-600 text-slate-400 flex items-center gap-1.5">
                        <i className="fa-solid fa-arrow-up-from-bracket text-[10px]"></i>
                        <span className="hidden sm:inline">Drag file ke sini atau</span>
                        <span className="sm:hidden">PDF, JPG, PNG · maks. 2MB</span>
                    </p>
                )}
                {/* File hint kalau sudah ada */}
                {!isLocked && hasFile && !docState.uploading && (
                    <p className="text-[11px] dark:text-slate-500 text-slate-400">
                        PDF, JPG, PNG, WebP · maks. 2MB
                    </p>
                )}
                {/* Lock message kalau verified */}
                {isLocked && (
                    <p className="text-[11px] dark:text-cyan-500/70 text-cyan-600 flex items-center gap-1.5">
                        <i className="fa-solid fa-lock text-[9px]"></i>
                        Dokumen terkunci setelah diverifikasi
                    </p>
                )}
                {/* Spacer kalau uploading */}
                {docState.uploading && <div />}

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">

                    {/* Preview — kalau ada file (lokal atau server) */}
                    {hasFile && !docState.uploading && (
                        <FilePreviewModal
                            localFile={docState.localFile}
                            serverUrl={docState.serverUrl}
                        />
                    )}

                    {/* Input file tersembunyi */}
                    {!isLocked && (
                        <>
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,.pdf"
                                className="hidden"
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) onFileSelect(docKey, file);
                                    e.target.value = "";
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                disabled={submitted || docState.uploading}
                                className={[
                                    "flex items-center gap-1.5 px-3.5 py-2 rounded-xl",
                                    "text-[11px] font-semibold min-h-[36px]",
                                    "border transition-all duration-150",
                                    "disabled:opacity-40 disabled:cursor-not-allowed",
                                    hasFile
                                        // Ganti — subtle style
                                        ? "dark:bg-white/[0.04] bg-white dark:border-white/[0.08] border-black/[0.08] dark:text-slate-300 text-slate-600 dark:hover:border-white/[0.15] hover:border-black/[0.15]"
                                        // Pilih file — accent style
                                        : "dark:bg-cyan-500/10 bg-cyan-50 dark:border-cyan-500/20 border-cyan-200 dark:text-cyan-400 text-cyan-600 dark:hover:bg-cyan-500/15 hover:bg-cyan-100",
                                ].join(" ")}
                            >
                                {hasFile
                                    ? <><i className="fa-solid fa-arrow-rotate-left text-[10px]"></i> Ganti</>
                                    : <><i className="fa-solid fa-arrow-up-from-bracket text-[10px]"></i> Pilih File</>
                                }
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TabCatatanKhusus({
    specialNotes, setSpecialNotes,
    parentConcern, setParentConcern,
    suratSehatUrl, bpjsCardUrl, vaccineCardUrl,
    suratSehatStatus  = "pending",
    bpjsCardStatus    = "pending",
    vaccineCardStatus = "pending",
    suratSehatRejection  = null,
    bpjsCardRejection    = null,
    vaccineCardRejection = null,
}: Props) {

    const [docs, setDocs] = useState<Record<DocKey, DocState>>({
        surat_sehat:  {
            serverUrl: suratSehatUrl,  localFile: null, uploading: false, progress: 0, error: null,
            status: suratSehatUrl ? suratSehatStatus : "empty",
            rejection: suratSehatRejection,
        },
        bpjs_card:    {
            serverUrl: bpjsCardUrl,    localFile: null, uploading: false, progress: 0, error: null,
            status: bpjsCardUrl ? bpjsCardStatus : "empty",
            rejection: bpjsCardRejection,
        },
        vaccine_card: {
            serverUrl: vaccineCardUrl, localFile: null, uploading: false, progress: 0, error: null,
            status: vaccineCardUrl ? vaccineCardStatus : "empty",
            rejection: vaccineCardRejection,
        },
    });

    const [submitted,   setSubmitted]   = useState(false);
    const [submitting,  setSubmitting]  = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        animate(".catatan-section", {
            opacity:    [0, 1],
            translateY: [12, 0],
            duration:   450,
            delay:      stagger(80),
            ease:       "outExpo",
        });
    }, []);

    const hasLocalFiles = Object.values(docs).some(d => d.localFile !== null);
    const localCount    = Object.values(docs).filter(d => d.localFile).length;

    // ── Pilih file ────────────────────────────────────────────────────────────
    const handleFileSelect = useCallback((key: DocKey, file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            setDocs(prev => ({ ...prev, [key]: { ...prev[key], error: "Ukuran file maksimal 2MB.", localFile: null } }));
            return;
        }
        setDocs(prev => ({ ...prev, [key]: { ...prev[key], localFile: file, error: null } }));
    }, []);

    // ── Kirim semua file ──────────────────────────────────────────────────────
    const handleSubmitAll = async () => {
        const toUpload = (Object.keys(docs) as DocKey[]).filter(
            key => docs[key].localFile !== null && docs[key].status !== "verified"
        );
        if (toUpload.length === 0) return;

        setSubmitting(true);
        setSubmitError(null);
        let allSuccess = true;

        for (const key of toUpload) {
            const file = docs[key].localFile!;
            const formData = new FormData();
            formData.append("file", file);

            setDocs(prev => ({ ...prev, [key]: { ...prev[key], uploading: true, progress: 0, error: null } }));

            try {
                const res = await axios.post(
                    route("dashboard.data-kesehatan.upload", { docType: key }),
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                        onUploadProgress: (evt) => {
                            if (evt.total) {
                                const pct = Math.round((evt.loaded * 100) / evt.total);
                                setDocs(prev => ({ ...prev, [key]: { ...prev[key], progress: pct } }));
                            }
                        },
                    }
                );
                setDocs(prev => ({
                    ...prev,
                    [key]: { ...prev[key], serverUrl: res.data.file_url, localFile: null, uploading: false, progress: 100, error: null, status: "pending" },
                }));
            } catch (err: any) {
                const msg = err?.response?.data?.message ?? "Upload gagal. Coba lagi.";
                setDocs(prev => ({ ...prev, [key]: { ...prev[key], uploading: false, progress: 0, error: msg } }));
                allSuccess = false;
            }
        }

        setSubmitting(false);
        if (allSuccess) setSubmitted(true);
    };

    // ── Summary stats ─────────────────────────────────────────────────────────
    const verifiedCount = Object.values(docs).filter(d => d.status === "verified").length;
    const uploadedCount = Object.values(docs).filter(d => d.serverUrl && d.status !== "empty").length;

    return (
        <div className="flex flex-col gap-8">

            {/* ── Catatan teks ──────────────────────────────────────────── */}
            <section className="catatan-section opacity-0">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl shrink-0
                                    dark:bg-cyan-500/10 bg-cyan-50
                                    border dark:border-cyan-500/20 border-cyan-200
                                    flex items-center justify-center">
                        <i className="fa-solid fa-note-sticky text-cyan-400 text-sm"></i>
                    </div>
                    <h3 className="text-sm font-display font-bold dark:text-white text-slate-800">
                        Catatan untuk Tim Kesehatan
                    </h3>
                </div>
                <p className="text-xs dark:text-slate-500 text-slate-400 mb-5 ml-12">
                    Informasi ini hanya dapat dibaca oleh perawat dan admin sekolah
                </p>

                <div className="flex flex-col gap-5">
                    <Field label="Catatan Khusus"
                        hint="Opsional — informasi penting yang perlu diketahui tim kesehatan">
                        <textarea
                            value={specialNotes}
                            onChange={e => setSpecialNotes(e.target.value)}
                            rows={3}
                            placeholder="Contoh: Anak memiliki fobia jarum suntik, perlu pendampingan ekstra..."
                            className={textareaCls()}
                        />
                    </Field>

                    <Field label="Keluhan Terkini dari Orang Tua"
                        hint="Opsional — kondisi atau keluhan yang terjadi 1-3 bulan terakhir">
                        <textarea
                            value={parentConcern}
                            onChange={e => setParentConcern(e.target.value)}
                            rows={3}
                            placeholder="Contoh: Anak akhir-akhir ini sering batuk dan mudah lelah sejak 2 bulan lalu..."
                            className={textareaCls()}
                        />
                    </Field>
                </div>
            </section>

            <div className="border-t dark:border-white/[0.06] border-black/[0.06]"></div>

            {/* ── Upload dokumen ────────────────────────────────────────── */}
            <section className="catatan-section opacity-0">

                {/* Section header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl shrink-0
                                            dark:bg-cyan-500/10 bg-cyan-50
                                            border dark:border-cyan-500/20 border-cyan-200
                                            flex items-center justify-center">
                                <i className="fa-solid fa-file-medical text-cyan-400 text-sm"></i>
                            </div>
                            <h3 className="text-sm font-display font-bold dark:text-white text-slate-800">
                                Dokumen Kesehatan
                            </h3>
                        </div>
                        <p className="text-xs dark:text-slate-500 text-slate-400 ml-12">
                            PDF, JPG, PNG, atau WebP · Maks. 2MB per file
                        </p>
                    </div>

                    {/* Mini summary stat */}
                    {uploadedCount > 0 && (
                        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                        dark:bg-cyan-500/[0.08] bg-cyan-50
                                        border dark:border-cyan-500/15 border-cyan-200">
                            <i className="fa-solid fa-circle-check text-cyan-400 text-[10px]"></i>
                            <span className="text-[11px] font-semibold dark:text-cyan-400 text-cyan-600">
                                {verifiedCount > 0 ? `${verifiedCount} terverifikasi` : `${uploadedCount} diunggah`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Info keamanan */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl mb-5
                                dark:bg-blue-500/[0.06] bg-blue-50
                                border dark:border-blue-500/15 border-blue-200">
                    <i className="fa-solid fa-shield-halved text-blue-400 text-xs mt-0.5 shrink-0"></i>
                    <p className="text-[11px] dark:text-blue-300/70 text-blue-700">
                        Dokumen disimpan secara aman dan terenkripsi. Hanya dapat diakses oleh tim kesehatan dan administrator sekolah.
                    </p>
                </div>

                {/* Doc cards — premium per-card layout */}
                <div className="flex flex-col gap-3">
                    {(Object.keys(DOC_CONFIG) as DocKey[]).map(key => (
                        <DocCard
                            key={key}
                            docKey={key}
                            config={DOC_CONFIG[key]}
                            docState={docs[key]}
                            onFileSelect={handleFileSelect}
                            submitted={submitted}
                        />
                    ))}
                </div>

                {/* Submit error */}
                {submitError && (
                    <div className="mt-4 flex items-center gap-2 p-3 rounded-xl
                                    dark:bg-red-500/[0.08] bg-red-50
                                    border dark:border-red-500/15 border-red-200">
                        <i className="fa-solid fa-circle-exclamation text-red-400 text-[10px] shrink-0"></i>
                        <p className="text-[11px] dark:text-red-400/80 text-red-600">{submitError}</p>
                    </div>
                )}

                {/* Tombol Kirim Semua */}
                {hasLocalFiles && !submitted && (
                    <div className="mt-5 pt-4 border-t dark:border-white/[0.05] border-black/[0.05]">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold dark:text-slate-300 text-slate-700">
                                    {localCount} file siap dikirim
                                </p>
                                <p className="text-[11px] dark:text-slate-500 text-slate-400 mt-0.5">
                                    Klik kirim untuk mengunggah ke server
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleSubmitAll}
                                disabled={submitting}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                                           bg-cyan-500 hover:bg-cyan-400
                                           text-white text-xs font-semibold
                                           transition-all duration-200 active:scale-95 min-h-[44px]
                                           disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting
                                    ? <><i className="fa-solid fa-spinner fa-spin text-[11px]"></i> Mengunggah...</>
                                    : <><i className="fa-solid fa-paper-plane text-[11px]"></i> Kirim Semua</>
                                }
                            </button>
                        </div>
                    </div>
                )}

                {/* State: semua sudah terkirim */}
                {submitted && (
                    <div className="mt-4 flex items-center gap-2.5 p-3 rounded-xl
                                    dark:bg-cyan-500/[0.08] bg-cyan-50
                                    border dark:border-cyan-500/15 border-cyan-200">
                        <i className="fa-solid fa-circle-check text-cyan-400 text-sm shrink-0"></i>
                        <div>
                            <p className="text-xs font-semibold dark:text-cyan-300 text-cyan-700">
                                Semua dokumen berhasil dikirim
                            </p>
                            <p className="text-[11px] dark:text-cyan-400/60 text-cyan-600 mt-0.5">
                                Tim kesehatan akan memeriksa dokumen kamu
                            </p>
                        </div>
                    </div>
                )}

            </section>

        </div>
    );
}