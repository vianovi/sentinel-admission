// resources/js/Components/Dashboard/Candidate/DataKesehatan/TabCatatanKhusus.tsx

import { useEffect, useRef, useState } from "react";
import { animate, stagger }            from "animejs";
import axios                           from "axios";
import Field, { textareaCls }          from "@/Components/UI/Field";
import FilePreviewModal                from "@/Components/UI/FilePreviewModal";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    specialNotes:   string; setSpecialNotes:   (v: string) => void;
    parentConcern:  string; setParentConcern:  (v: string) => void;
    suratSehatUrl:  string | null;
    bpjsCardUrl:    string | null;
    vaccineCardUrl: string | null;
    // Status verifikasi per dokumen
    suratSehatStatus?:  "pending" | "verified" | "rejected";
    bpjsCardStatus?:    "pending" | "verified" | "rejected";
    vaccineCardStatus?: "pending" | "verified" | "rejected";
    suratSehatRejection?:  string | null;
    bpjsCardRejection?:    string | null;
    vaccineCardRejection?: string | null;
};

type DocKey = "surat_sehat" | "bpjs_card" | "vaccine_card";

type DocState = {
    serverUrl:    string | null;
    localFile:    File | null;       // file yang dipilih, belum dikirim
    uploading:    boolean;
    error:        string | null;
    status:       "pending" | "verified" | "rejected";
    rejection:    string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DOC_CONFIG: Record<DocKey, { label: string; hint: string; required: boolean; icon: string }> = {
    surat_sehat: {
        label:    "Surat Keterangan Sehat",
        hint:     "Dari dokter / puskesmas — PDF, JPG, PNG, WebP. Maks. 2MB",
        required: false,
        icon:     "fa-solid fa-file-medical",
    },
    bpjs_card: {
        label:    "Kartu BPJS / JKN",
        hint:     "Kartu peserta BPJS Kesehatan — PDF, JPG, PNG, WebP. Maks. 2MB",
        required: true,
        icon:     "fa-solid fa-id-card",
    },
    vaccine_card: {
        label:    "Kartu Vaksin / Imunisasi",
        hint:     "Buku KIA atau sertifikat vaksin — PDF, JPG, PNG, WebP. Maks. 2MB",
        required: false,
        icon:     "fa-solid fa-syringe",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Document row (clean style — tanpa kotak berlapis)
// ─────────────────────────────────────────────────────────────────────────────

function DocRow({
    docKey, config, docState, onFileSelect, submitted,
}: {
    docKey:        DocKey;
    config:        typeof DOC_CONFIG[DocKey];
    docState:      DocState;
    onFileSelect:  (key: DocKey, file: File) => void;
    submitted:     boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const isLocked = docState.status === "verified";

    // Warna icon berdasarkan status
    const iconColor = isLocked
        ? "dark:text-emerald-400 text-emerald-600"
        : docState.localFile || docState.serverUrl
            ? "dark:text-amber-400 text-amber-500"
            : "dark:text-slate-500 text-slate-400";

    const iconBg = isLocked
        ? "dark:bg-emerald-500/10 bg-emerald-50"
        : docState.localFile || docState.serverUrl
            ? "dark:bg-amber-500/10 bg-amber-50"
            : "dark:bg-white/[0.04] bg-slate-100";

    return (
        <div className="flex items-center gap-3 py-4
                        border-b dark:border-white/[0.05] border-black/[0.05]
                        last:border-0">

            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                <i className={`${config.icon} text-sm ${iconColor}`}></i>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold dark:text-slate-200 text-slate-700">
                        {config.label}
                    </p>
                    {config.required && (
                        <span className="text-[10px] dark:text-amber-400 text-amber-600">
                            wajib
                        </span>
                    )}
                    {/* Status badge */}
                    {isLocked && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full
                                         dark:bg-emerald-500/10 bg-emerald-50
                                         dark:text-emerald-400 text-emerald-600
                                         border dark:border-emerald-500/20 border-emerald-200">
                            <i className="fa-solid fa-lock text-[9px] mr-1"></i>Terverifikasi
                        </span>
                    )}
                    {docState.status === "rejected" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full
                                         dark:bg-red-500/10 bg-red-50
                                         dark:text-red-400 text-red-500
                                         border dark:border-red-500/20 border-red-200">
                            <i className="fa-solid fa-circle-xmark text-[9px] mr-1"></i>Ditolak
                        </span>
                    )}
                    {docState.localFile && !submitted && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full
                                         dark:bg-blue-500/10 bg-blue-50
                                         dark:text-blue-400 text-blue-600
                                         border dark:border-blue-500/20 border-blue-200">
                            Belum dikirim
                        </span>
                    )}
                </div>

                {/* Rejection reason */}
                {docState.status === "rejected" && docState.rejection && (
                    <p className="text-[11px] dark:text-red-400/70 text-red-500 mt-0.5">
                        <i className="fa-solid fa-circle-info text-[9px] mr-1"></i>
                        {docState.rejection}
                    </p>
                )}

                {/* File name kalau sudah pilih */}
                {docState.localFile && (
                    <p className="text-[10px] dark:text-slate-500 text-slate-400 mt-0.5 truncate">
                        {docState.localFile.name}
                    </p>
                )}

                {/* Error */}
                {docState.error && (
                    <p className="text-[11px] text-red-400 mt-0.5">
                        <i className="fa-solid fa-circle-exclamation text-[9px] mr-1"></i>
                        {docState.error}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Preview — muncul kalau ada file (lokal atau server) */}
                {(docState.localFile || docState.serverUrl) && (
                    <FilePreviewModal
                        localFile={docState.localFile}
                        serverUrl={docState.serverUrl}
                    />
                )}

                {/* Pilih File — disable kalau locked atau sudah submitted */}
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
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                       text-[11px] font-semibold
                                       dark:bg-white/[0.04] bg-white
                                       border dark:border-white/[0.08] border-black/[0.08]
                                       dark:text-slate-300 text-slate-600
                                       dark:hover:border-white/[0.15] hover:border-black/[0.15]
                                       transition-all duration-150 min-h-[32px]
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {docState.uploading
                                ? <><i className="fa-solid fa-spinner fa-spin text-[10px]"></i> Mengunggah</>
                                : docState.localFile || docState.serverUrl
                                    ? <><i className="fa-solid fa-arrow-rotate-left text-[10px]"></i> Ganti</>
                                    : <><i className="fa-solid fa-arrow-up-from-bracket text-[10px]"></i> Pilih File</>
                            }
                        </button>
                    </>
                )}
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
        surat_sehat:  { serverUrl: suratSehatUrl,  localFile: null, uploading: false, error: null, status: suratSehatStatus,  rejection: suratSehatRejection  },
        bpjs_card:    { serverUrl: bpjsCardUrl,    localFile: null, uploading: false, error: null, status: bpjsCardStatus,    rejection: bpjsCardRejection    },
        vaccine_card: { serverUrl: vaccineCardUrl, localFile: null, uploading: false, error: null, status: vaccineCardStatus, rejection: vaccineCardRejection },
    });

    const [submitted,  setSubmitted]  = useState(false);
    const [submitting, setSubmitting] = useState(false);
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

    // ── Pilih file (simpan lokal, belum ke server) ─────────────────────────
    const handleFileSelect = (key: DocKey, file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            setDocs(prev => ({
                ...prev,
                [key]: { ...prev[key], error: "Ukuran file maksimal 2MB.", localFile: null },
            }));
            return;
        }
        setDocs(prev => ({
            ...prev,
            [key]: { ...prev[key], localFile: file, error: null },
        }));
    };

    // ── Kirim semua file ke server ─────────────────────────────────────────
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

            setDocs(prev => ({
                ...prev,
                [key]: { ...prev[key], uploading: true, error: null },
            }));

            try {
                const res = await axios.post(
                    route("dashboard.data-kesehatan.upload", { docType: key }),
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
                setDocs(prev => ({
                    ...prev,
                    [key]: { ...prev[key], serverUrl: res.data.file_url, localFile: null, uploading: false, error: null },
                }));
            } catch (err: any) {
                const msg = err?.response?.data?.message ?? "Upload gagal. Coba lagi.";
                setDocs(prev => ({
                    ...prev,
                    [key]: { ...prev[key], uploading: false, error: msg },
                }));
                allSuccess = false;
            }
        }

        setSubmitting(false);
        if (allSuccess) setSubmitted(true);
    };

    return (
        <div className="flex flex-col gap-8">

            {/* ── Catatan teks ──────────────────────────────────────────── */}
            <section className="catatan-section opacity-0">
                <h3 className="text-sm font-display font-bold dark:text-white text-slate-800
                                flex items-center gap-2 mb-1">
                    <i className="fa-solid fa-note-sticky text-emerald-400 text-xs"></i>
                    Catatan untuk Tim Kesehatan
                </h3>
                <p className="text-xs dark:text-slate-500 text-slate-400 mb-5">
                    Informasi ini hanya dapat dibaca oleh perawat dan admin sekolah
                </p>

                <div className="flex flex-col gap-5">
                    <Field label="Catatan Khusus" hint="Opsional — informasi penting yang perlu diketahui tim kesehatan">
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

                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-display font-bold dark:text-white text-slate-800
                                    flex items-center gap-2">
                        <i className="fa-solid fa-file-medical text-emerald-400 text-xs"></i>
                        Dokumen Kesehatan
                    </h3>
                </div>
                <p className="text-xs dark:text-slate-500 text-slate-400 mb-4">
                    Upload dokumen pendukung — format PDF, JPG, PNG, atau WebP · Maks. 2MB per file
                </p>

                {/* Info keamanan */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl mb-2
                                dark:bg-blue-500/[0.06] bg-blue-50
                                border dark:border-blue-500/15 border-blue-200">
                    <i className="fa-solid fa-shield-halved text-blue-400 text-xs mt-0.5 shrink-0"></i>
                    <p className="text-[11px] dark:text-blue-300/70 text-blue-700">
                        Dokumen disimpan secara aman dan terenkripsi. Hanya dapat diakses oleh tim kesehatan dan administrator sekolah.
                    </p>
                </div>

                {/* Daftar dokumen — clean rows */}
                <div className="mt-2">
                    {(Object.keys(DOC_CONFIG) as DocKey[]).map(key => (
                        <DocRow
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
                    <p className="text-[11px] text-red-400 mt-3 flex items-center gap-1.5">
                        <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                        {submitError}
                    </p>
                )}

                {/* Tombol Kirim Semua */}
                {hasLocalFiles && !submitted && (
                    <div className="mt-4 pt-4 border-t dark:border-white/[0.05] border-black/[0.05]">
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-[11px] dark:text-slate-500 text-slate-400">
                                {Object.values(docs).filter(d => d.localFile).length} file siap dikirim
                            </p>
                            <button
                                type="button"
                                onClick={handleSubmitAll}
                                disabled={submitting}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                                           bg-emerald-500 hover:bg-emerald-400
                                           text-white text-xs font-semibold
                                           transition-all duration-200 min-h-[40px]
                                           disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting
                                    ? <><i className="fa-solid fa-spinner fa-spin text-[11px]"></i> Mengunggah...</>
                                    : <><i className="fa-solid fa-paper-plane text-[11px]"></i> Kirim Semua Dokumen</>
                                }
                            </button>
                        </div>
                    </div>
                )}

                {/* State: semua sudah terkirim */}
                {submitted && (
                    <div className="mt-4 flex items-center gap-2 text-[11px]
                                    dark:text-emerald-400 text-emerald-600">
                        <i className="fa-solid fa-circle-check text-[10px]"></i>
                        Semua dokumen berhasil dikirim
                    </div>
                )}

            </section>

        </div>
    );
}