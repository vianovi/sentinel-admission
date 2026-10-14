import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import axios from "axios";

import Field, { textareaCls } from "@/Components/UI/Field";
import FilePreviewModal from "@/Components/UI/FilePreviewModal";

type Props = {
    specialNotes: string;
    setSpecialNotes: (v: string) => void;
    parentConcern: string;
    setParentConcern: (v: string) => void;
    chronicDocUrl: string | null;
    suratSehatUrl: string | null;
    bpjsCardUrl: string | null;
    vaccineCardUrl: string | null;
    onDocumentUrlChange: (key: DocKey, url: string | null) => void;
};

type DocKey = "chronic_disease" | "surat_sehat" | "bpjs_card" | "vaccine_card";

type DocState = {
    serverUrl: string | null;
    mimeType: string | null;
    localFile: File | null;
    uploading: boolean;
    progress: number;
    error: string | null;
    status: "empty" | "local" | "uploading" | "uploaded";
};

const DOC_CONFIG: Record<DocKey, { label: string; hint: string; required: boolean; icon: string; desc: string }> = {
    chronic_disease: {
        label: "Dokumen Hasil Lab / CT Scan / USG",
        hint: "Opsional, unggah jika ada riwayat pemeriksaan pendukung",
        required: false,
        icon: "fa-solid fa-file-waveform",
        desc: "Boleh berupa hasil lab, CT scan, USG, atau pemeriksaan penunjang lain.",
    },
    surat_sehat: {
        label: "Surat Keterangan Sehat",
        hint: "Dari dokter atau puskesmas",
        required: false,
        icon: "fa-solid fa-file-medical",
        desc: "Surat sehat terbaru dari dokter, klinik, atau puskesmas setempat.",
    },
    bpjs_card: {
        label: "Kartu BPJS / JKN",
        hint: "Dokumen wajib agar tim sekolah punya rujukan layanan kesehatan",
        required: true,
        icon: "fa-solid fa-id-card",
        desc: "Unggah kartu BPJS/JKN aktif. Jika belum punya, koordinasikan dulu sebelum finalisasi data.",
    },
    vaccine_card: {
        label: "Kartu Vaksin / Imunisasi",
        hint: "Buku KIA, kartu imunisasi, atau sertifikat vaksin",
        required: false,
        icon: "fa-solid fa-syringe",
        desc: "Bisa berupa buku KIA, kartu imunisasi, atau sertifikat vaksin digital.",
    },
};

const STATUS_CONFIG = {
    empty: {
        label: "Belum diunggah",
        icon: "fa-solid fa-minus",
        bg: "dark:bg-slate-700/40 bg-slate-100",
        border: "dark:border-slate-600/40 border-slate-200",
        text: "dark:text-slate-500 text-slate-400",
    },
    local: {
        label: "Siap diunggah",
        icon: "fa-solid fa-arrow-up",
        bg: "dark:bg-blue-500/10 bg-blue-50",
        border: "dark:border-blue-500/20 border-blue-200",
        text: "dark:text-blue-400 text-blue-600",
    },
    uploading: {
        label: "Mengunggah...",
        icon: "fa-solid fa-spinner fa-spin",
        bg: "dark:bg-cyan-500/10 bg-cyan-50",
        border: "dark:border-cyan-500/20 border-cyan-200",
        text: "dark:text-cyan-400 text-cyan-600",
    },
    uploaded: {
        label: "Terupload",
        icon: "fa-solid fa-circle-check",
        bg: "dark:bg-emerald-500/10 bg-emerald-50",
        border: "dark:border-emerald-500/20 border-emerald-200",
        text: "dark:text-emerald-400 text-emerald-600",
    },
} as const;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "pdf"];

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createInitialDocState(url: string | null): DocState {
    return {
        serverUrl: url,
        mimeType: null,
        localFile: null,
        uploading: false,
        progress: 0,
        error: null,
        status: url ? "uploaded" : "empty",
    };
}

function DocCard({
    docKey,
    config,
    docState,
    busy,
    onFileSelect,
}: {
    docKey: DocKey;
    config: typeof DOC_CONFIG[DocKey];
    docState: DocState;
    busy: boolean;
    onFileSelect: (key: DocKey, file: File) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [drag, setDrag] = useState(false);
    const hasFile = !!(docState.localFile || docState.serverUrl);
    const statusKey = docState.uploading
        ? "uploading"
        : docState.localFile
            ? "local"
            : docState.status;
    const statusConf = STATUS_CONFIG[statusKey];

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!docState.uploading) setDrag(true);
    }, [docState.uploading]);

    const handleDragLeave = useCallback(() => setDrag(false), []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDrag(false);
        if (docState.uploading || busy) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onFileSelect(docKey, file);
    }, [busy, docKey, docState.uploading, onFileSelect]);

    return (
        <div
            className={[
                "overflow-hidden rounded-2xl border transition-all duration-200",
                drag
                    ? "dark:border-cyan-500/50 border-cyan-400 dark:bg-cyan-500/[0.06] bg-cyan-50/50"
                    : "dark:border-white/[0.07] border-black/[0.07] dark:bg-white/[0.02] bg-white",
            ].join(" ")}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex items-start gap-3 p-4">
                <div className={[
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200",
                    statusKey === "uploaded"  ? "dark:bg-emerald-500/15 bg-emerald-50" :
                    statusKey === "local"     ? "dark:bg-blue-500/15 bg-blue-50" :
                    statusKey === "uploading" ? "dark:bg-cyan-500/15 bg-cyan-50" :
                                                "dark:bg-white/[0.05] bg-slate-100",
                ].join(" ")}>
                    <i className={`${config.icon} text-sm ${statusConf.text}`}></i>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold dark:text-slate-100 text-slate-800">
                            {config.label}
                        </p>
                        {config.required && (
                            <span className="rounded-md border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                wajib
                            </span>
                        )}
                    </div>

                    <p className="text-xs leading-relaxed dark:text-slate-400 text-slate-600">
                        {config.desc}
                    </p>

                    {docState.localFile && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium dark:text-slate-400 text-slate-600">
                            <i className="fa-solid fa-paperclip text-[10px]"></i>
                            <span className="max-w-[180px] truncate">{docState.localFile.name}</span>
                            <span className="shrink-0 dark:text-slate-500 text-slate-400">·</span>
                            <span className="shrink-0">{formatFileSize(docState.localFile.size)}</span>
                        </p>
                    )}
                </div>

                <div className={`shrink-0 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${statusConf.bg} ${statusConf.border} ${statusConf.text}`}>
                    <i className={`${statusConf.icon} text-[9px]`}></i>
                    <span className="hidden sm:inline">{statusConf.label}</span>
                </div>
            </div>

            {docState.uploading && (
                <div className="px-4 pb-3">
                    <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] dark:text-slate-500 text-slate-400">Mengunggah...</span>
                        <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                            {docState.progress}%
                        </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full dark:bg-white/[0.06] bg-black/[0.06]">
                        <div
                            className="h-full rounded-full bg-cyan-500 transition-all duration-200"
                            style={{ width: `${docState.progress}%` }}
                        />
                    </div>
                </div>
            )}

            {docState.error && (
                <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 dark:border-red-500/15 dark:bg-red-500/[0.08]">
                    <i className="fa-solid fa-circle-exclamation shrink-0 text-[10px] text-red-400"></i>
                    <p className="text-[11px] text-red-600 dark:text-red-400/80">{docState.error}</p>
                </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-black/[0.08] px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.02] bg-slate-50">
                {!hasFile && !docState.uploading && (
                    <p className="flex items-center gap-2 text-xs font-semibold dark:text-slate-300 text-slate-700">
                        <i className="fa-solid fa-arrow-up-from-bracket text-xs text-cyan-600 dark:text-cyan-400"></i>
                        <span className="hidden sm:inline">Drag file ke sini atau klik pilih file</span>
                        <span className="sm:hidden">PDF, JPG, PNG, WebP · maks. 2MB</span>
                    </p>
                )}

                {hasFile && !docState.uploading && (
                    <p className="text-xs font-medium dark:text-slate-300 text-slate-600">
                        {config.hint}
                    </p>
                )}

                {docState.uploading && <div />}

                <div className="flex items-center gap-2 shrink-0">
                    {hasFile && !docState.uploading && (
                        <FilePreviewModal
                            localFile={docState.localFile}
                            serverUrl={docState.serverUrl}
                            mimeType={docState.localFile?.type || docState.mimeType}
                            label="Lihat"
                        />
                    )}

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

                    {!docState.uploading && (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={busy}
                            className={[
                                "flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11px] font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40",
                                hasFile
                                    ? "dark:bg-white/[0.04] bg-white dark:border-white/[0.08] border-black/[0.08] dark:text-slate-300 text-slate-600 dark:hover:border-white/[0.15] hover:border-black/[0.15]"
                                    : "dark:bg-cyan-500/10 bg-cyan-50 dark:border-cyan-500/20 border-cyan-200 dark:text-cyan-400 text-cyan-600 dark:hover:bg-cyan-500/15 hover:bg-cyan-100",
                            ].join(" ")}
                        >
                            {hasFile
                                ? <><i className="fa-solid fa-arrow-rotate-left text-[10px]"></i> Ganti</>
                                : <><i className="fa-solid fa-arrow-up-from-bracket text-[10px]"></i> Pilih File</>
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TabCatatanKhusus({
    specialNotes,
    setSpecialNotes,
    parentConcern,
    setParentConcern,
    chronicDocUrl,
    suratSehatUrl,
    bpjsCardUrl,
    vaccineCardUrl,
    onDocumentUrlChange,
}: Props) {
    const [docs, setDocs] = useState<Record<DocKey, DocState>>({
        chronic_disease: createInitialDocState(chronicDocUrl),
        surat_sehat: createInitialDocState(suratSehatUrl),
        bpjs_card: createInitialDocState(bpjsCardUrl),
        vaccine_card: createInitialDocState(vaccineCardUrl),
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        animate(".catatan-section", {
            opacity: [0, 1],
            translateY: [12, 0],
            duration: 450,
            delay: stagger(80),
            ease: "outExpo",
        });
    }, []);

    useEffect(() => {
        setDocs(prev => ({
            ...prev,
            chronic_disease: prev.chronic_disease.localFile ? prev.chronic_disease : createInitialDocState(chronicDocUrl),
        }));
    }, [chronicDocUrl]);

    useEffect(() => {
        setDocs(prev => ({
            ...prev,
            surat_sehat: prev.surat_sehat.localFile ? prev.surat_sehat : createInitialDocState(suratSehatUrl),
        }));
    }, [suratSehatUrl]);

    useEffect(() => {
        setDocs(prev => ({
            ...prev,
            bpjs_card: prev.bpjs_card.localFile ? prev.bpjs_card : createInitialDocState(bpjsCardUrl),
        }));
    }, [bpjsCardUrl]);

    useEffect(() => {
        setDocs(prev => ({
            ...prev,
            vaccine_card: prev.vaccine_card.localFile ? prev.vaccine_card : createInitialDocState(vaccineCardUrl),
        }));
    }, [vaccineCardUrl]);

    const hasLocalFiles = useMemo(
        () => Object.values(docs).some(doc => doc.localFile !== null),
        [docs],
    );

    const localCount = useMemo(
        () => Object.values(docs).filter(doc => doc.localFile !== null).length,
        [docs],
    );

    const uploadedCount = useMemo(
        () => Object.values(docs).filter(doc => doc.serverUrl).length,
        [docs],
    );

    const handleFileSelect = useCallback((key: DocKey, file: File) => {
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
        const hasAllowedExtension = ALLOWED_EXTENSIONS.includes(extension);
        const hasAllowedMime = !file.type || ALLOWED_MIME_TYPES.includes(file.type);

        if (!hasAllowedExtension || !hasAllowedMime) {
            setDocs(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    localFile: null,
                    error: "Format file harus JPG, PNG, WebP, atau PDF.",
                    status: prev[key].serverUrl ? "uploaded" : "empty",
                },
            }));
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setDocs(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    localFile: null,
                    error: "Ukuran file maksimal 2MB.",
                    status: prev[key].serverUrl ? "uploaded" : "empty",
                },
            }));
            return;
        }

        setSubmitError(null);
        setDocs(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                localFile: file,
                mimeType: file.type || null,
                error: null,
                status: "local",
            },
        }));
    }, []);

    const handleSubmitAll = useCallback(async () => {
        const toUpload = (Object.keys(docs) as DocKey[]).filter(key => docs[key].localFile !== null);

        if (toUpload.length === 0) return;

        setSubmitting(true);
        setSubmitError(null);
        let allSuccess = true;

        for (const key of toUpload) {
            const file = docs[key].localFile;
            if (!file) continue;

            const formData = new FormData();
            formData.append("file", file);

            setDocs(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    uploading: true,
                    progress: 0,
                    error: null,
                    status: "uploading",
                },
            }));

            try {
                const response = await axios.post<{ file_url: string | null; mime_type: string | null }>(
                    route("dashboard.data-kesehatan.upload", { docType: key }),
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                            "Accept": "application/json",
                        },
                        onUploadProgress: (evt: { loaded: number; total?: number }) => {
                            if (!evt.total) return;
                            const progress = Math.round((evt.loaded * 100) / evt.total);
                            setDocs(prev => ({
                                ...prev,
                                [key]: {
                                    ...prev[key],
                                    progress,
                                },
                            }));
                        },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any
                );

                const nextUrl = response.data.file_url ?? null;
                const nextMimeType = response.data.mime_type ?? file.type ?? null;

                setDocs(prev => ({
                    ...prev,
                    [key]: {
                        ...prev[key],
                        serverUrl: nextUrl,
                        mimeType: nextMimeType,
                        localFile: null,
                        uploading: false,
                        progress: 100,
                        error: null,
                        status: nextUrl ? "uploaded" : "empty",
                    },
                }));

                onDocumentUrlChange(key, nextUrl);
            } catch (error: any) {
                const message = error?.response?.data?.errors?.file?.[0]
                    ?? error?.response?.data?.message
                    ?? "Upload gagal. Coba lagi beberapa saat lagi.";

                setDocs(prev => ({
                    ...prev,
                    [key]: {
                        ...prev[key],
                        uploading: false,
                        progress: 0,
                        error: message,
                        status: prev[key].serverUrl ? "uploaded" : "local",
                    },
                }));

                allSuccess = false;
            }
        }

        setSubmitting(false);

        if (!allSuccess) {
            setSubmitError("Sebagian dokumen belum berhasil diunggah. Periksa kartu yang masih merah lalu coba lagi.");
        }
    }, [docs, onDocumentUrlChange]);

    return (
        <div className="flex flex-col gap-8">
            <section className="catatan-section opacity-0">
                <div className="mb-1 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 dark:border-cyan-500/20 dark:bg-cyan-500/10">
                        <i className="fa-solid fa-note-sticky text-sm text-cyan-400"></i>
                    </div>
                    <h3 className="text-sm font-display font-bold dark:text-white text-slate-800">
                        Catatan untuk Tim Kesehatan
                    </h3>
                </div>
                <p className="mb-5 ml-12 text-xs dark:text-slate-500 text-slate-400">
                    Informasi ini hanya dapat dibaca oleh perawat dan admin sekolah.
                </p>

                <div className="flex flex-col gap-5">
                    <Field
                        label="Catatan Khusus"
                        hint="Opsional, isi jika ada hal penting yang perlu diketahui tim kesehatan"
                    >
                        <textarea
                            value={specialNotes}
                            onChange={e => setSpecialNotes(e.target.value)}
                            rows={3}
                            placeholder="Contoh: Anak punya fobia jarum suntik atau butuh pendampingan khusus saat pemeriksaan."
                            className={textareaCls()}
                        />
                    </Field>

                    <Field
                        label="Keluhan Terkini dari Orang Tua"
                        hint="Opsional, misalnya kondisi yang muncul dalam 1-3 bulan terakhir"
                    >
                        <textarea
                            value={parentConcern}
                            onChange={e => setParentConcern(e.target.value)}
                            rows={3}
                            placeholder="Contoh: Anak mudah lelah, sering batuk, atau sedang dalam pemantauan dokter."
                            className={textareaCls()}
                        />
                    </Field>
                </div>
            </section>

            <div className="border-t border-black/[0.06] dark:border-white/[0.06]"></div>

            <section className="catatan-section opacity-0">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <div className="mb-1 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 dark:border-cyan-500/20 dark:bg-cyan-500/10">
                                <i className="fa-solid fa-file-medical text-sm text-cyan-400"></i>
                            </div>
                            <h3 className="text-sm font-display font-bold dark:text-white text-slate-800">
                                Dokumen Kesehatan
                            </h3>
                        </div>
                        <p className="ml-12 text-xs dark:text-slate-500 text-slate-400">
                            Gambar akan dipreview di popup. PDF akan dibuka di tab baru browser.
                        </p>
                    </div>

                    {(uploadedCount > 0 || localCount > 0) && (
                        <div className="shrink-0 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 dark:border-cyan-500/15 dark:bg-cyan-500/[0.08]">
                            <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                                {localCount > 0 ? `${localCount} siap diunggah` : `${uploadedCount} terupload`}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/15 dark:bg-blue-500/[0.06]">
                    <i className="fa-solid fa-shield-halved mt-0.5 shrink-0 text-xs text-blue-400"></i>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300/70">
                        Sistem hanya menerima JPG, PNG, WebP, atau PDF yang valid. Jika file ditolak, pilih dokumen asli dari kamera, scanner, atau hasil ekspor PDF.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {(Object.keys(DOC_CONFIG) as DocKey[]).map(key => (
                        <DocCard
                            key={key}
                            docKey={key}
                            config={DOC_CONFIG[key]}
                            docState={docs[key]}
                            busy={submitting}
                            onFileSelect={handleFileSelect}
                        />
                    ))}
                </div>

                {submitError && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-500/15 dark:bg-red-500/[0.08]">
                        <i className="fa-solid fa-circle-info mt-0.5 shrink-0 text-[11px] text-red-400"></i>
                        <p className="text-[11px] text-red-600 dark:text-red-400/80">{submitError}</p>
                    </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] p-4 dark:border-white/[0.07] dark:bg-white/[0.02] bg-slate-50/70">
                    <div>
                        <p className="text-xs font-semibold dark:text-slate-300 text-slate-700">
                            Upload dokumen yang sudah dipilih
                        </p>
                        <p className="mt-0.5 text-[11px] dark:text-slate-500 text-slate-400">
                            {hasLocalFiles
                                ? "Klik tombol di samping untuk mengirim semua file yang statusnya masih biru."
                                : "Pilih file terlebih dahulu. Kartu BPJS / JKN tetap wajib diunggah."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmitAll}
                        disabled={!hasLocalFiles || submitting}
                        className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-cyan-400"
                    >
                        {submitting
                            ? <><i className="fa-solid fa-spinner fa-spin text-xs"></i> Mengunggah...</>
                            : <><i className="fa-solid fa-cloud-arrow-up text-xs"></i> Upload Dokumen</>
                        }
                    </button>
                </div>
            </section>
        </div>
    );
}
