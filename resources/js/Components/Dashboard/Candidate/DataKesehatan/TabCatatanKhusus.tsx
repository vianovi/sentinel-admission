// resources/js/Components/Dashboard/Candidate/DataKesehatan/TabCatatanKhusus.tsx

import { useEffect, useRef, useState } from "react";
import { animate, stagger }            from "animejs";
import axios                           from "axios";
import Field, { textareaCls }          from "@/Components/UI/Field";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    specialNotes:   string; setSpecialNotes:   (v: string) => void;
    parentConcern:  string; setParentConcern:  (v: string) => void;
    suratSehatUrl:  string | null;
    bpjsCardUrl:    string | null;
    vaccineCardUrl: string | null;
};

type DocKey = "surat_sehat" | "bpjs_card" | "vaccine_card";

type DocState = {
    url:        string | null;
    uploading:  boolean;
    error:      string | null;
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
// SUB-COMPONENT: Document upload card
// ─────────────────────────────────────────────────────────────────────────────

function DocUploadCard({
    docKey, config, docState, onUpload, onDelete,
}: {
    docKey:   DocKey;
    config:   typeof DOC_CONFIG[DocKey];
    docState: DocState;
    onUpload: (key: DocKey, file: File) => void;
    onDelete: (key: DocKey) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className={`flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200
                         ${docState.url
                            ? "dark:bg-emerald-500/[0.06] bg-emerald-50 dark:border-emerald-500/20 border-emerald-200"
                            : "dark:bg-white/[0.02] bg-slate-50 dark:border-white/[0.06] border-black/[0.06]"
                         }`}>

            <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                                 ${docState.url
                                    ? "dark:bg-emerald-500/20 bg-emerald-100"
                                    : "dark:bg-white/[0.04] bg-slate-100"
                                 }`}>
                    <i className={`${config.icon} text-sm
                                   ${docState.url
                                        ? "dark:text-emerald-400 text-emerald-600"
                                        : "dark:text-slate-500 text-slate-400"
                                   }`}></i>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold dark:text-slate-200 text-slate-700">
                        {config.label}
                        {config.required && (
                            <span className="ml-1 text-[10px] font-normal dark:text-amber-400 text-amber-600">
                                (wajib direspons)
                            </span>
                        )}
                    </p>
                    <p className="text-[11px] dark:text-slate-500 text-slate-400 mt-0.5">
                        {config.hint}
                    </p>
                </div>
            </div>

            {/* Status & actions */}
            {docState.url ? (
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium
                                     dark:text-emerald-400 text-emerald-600 flex-1">
                        <i className="fa-solid fa-circle-check text-[10px]"></i>
                        Dokumen tersimpan
                    </span>
                    <a href={docState.url} target="_blank" rel="noreferrer"
                        className="text-[11px] font-semibold dark:text-slate-400 text-slate-500
                                   hover:dark:text-slate-200 hover:text-slate-700 transition px-2 py-1
                                   rounded-lg dark:hover:bg-white/[0.05] hover:bg-black/[0.05] min-h-[36px]
                                   flex items-center">
                        <i className="fa-solid fa-eye mr-1.5 text-[10px]"></i>Lihat
                    </a>
                    <button
                        onClick={() => onDelete(docKey)}
                        className="text-[11px] font-semibold text-red-400 hover:text-red-300
                                   transition px-2 py-1 rounded-lg hover:bg-red-500/10 min-h-[36px]
                                   flex items-center"
                    >
                        <i className="fa-solid fa-trash mr-1.5 text-[10px]"></i>Hapus
                    </button>
                </div>
            ) : (
                <div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        className="hidden"
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) onUpload(docKey, file);
                            e.target.value = "";
                        }}
                    />
                    <button
                        onClick={() => inputRef.current?.click()}
                        disabled={docState.uploading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl
                                   dark:bg-white/[0.05] bg-white
                                   border dark:border-white/[0.08] border-black/[0.08]
                                   text-xs font-semibold dark:text-slate-300 text-slate-600
                                   hover:dark:border-emerald-500/30 hover:border-emerald-300
                                   hover:dark:text-emerald-400 hover:text-emerald-600
                                   transition-all duration-200 min-h-[44px]
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {docState.uploading
                            ? <><i className="fa-solid fa-spinner fa-spin text-[10px]"></i> Mengunggah...</>
                            : <><i className="fa-solid fa-arrow-up-from-bracket text-[10px]"></i> Pilih File</>
                        }
                    </button>
                    {docState.error && (
                        <p className="text-[11px] text-red-400 mt-2 flex items-center gap-1">
                            <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                            {docState.error}
                        </p>
                    )}
                </div>
            )}
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
}: Props) {

    const [docs, setDocs] = useState<Record<DocKey, DocState>>({
        surat_sehat:  { url: suratSehatUrl,  uploading: false, error: null },
        bpjs_card:    { url: bpjsCardUrl,    uploading: false, error: null },
        vaccine_card: { url: vaccineCardUrl, uploading: false, error: null },
    });

    useEffect(() => {
        animate(".catatan-section", {
            opacity:    [0, 1],
            translateY: [12, 0],
            duration:   450,
            delay:      stagger(80),
            ease:       "outExpo",
        });
    }, []);

    const handleUpload = async (key: DocKey, file: File) => {
        // Validasi ukuran di frontend
        if (file.size > 2 * 1024 * 1024) {
            setDocs(prev => ({
                ...prev,
                [key]: { ...prev[key], error: "Ukuran file maksimal 2MB." },
            }));
            return;
        }

        setDocs(prev => ({
            ...prev,
            [key]: { ...prev[key], uploading: true, error: null },
        }));

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await axios.post(
                route("dashboard.data-kesehatan.upload", { docType: key }),
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            setDocs(prev => ({
                ...prev,
                [key]: { url: res.data.file_url, uploading: false, error: null },
            }));
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? "Upload gagal. Coba lagi.";
            setDocs(prev => ({
                ...prev,
                [key]: { ...prev[key], uploading: false, error: msg },
            }));
        }
    };

    const handleDelete = async (key: DocKey) => {
        setDocs(prev => ({
            ...prev,
            [key]: { ...prev[key], uploading: true, error: null },
        }));

        try {
            await axios.delete(
                route("dashboard.data-kesehatan.delete-doc", { docType: key })
            );
            setDocs(prev => ({
                ...prev,
                [key]: { url: null, uploading: false, error: null },
            }));
        } catch {
            setDocs(prev => ({
                ...prev,
                [key]: { ...prev[key], uploading: false, error: "Gagal menghapus. Coba lagi." },
            }));
        }
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
                <div className="mb-5">
                    <h3 className="text-sm font-display font-bold dark:text-white text-slate-800
                                    flex items-center gap-2 mb-1">
                        <i className="fa-solid fa-file-medical text-emerald-400 text-xs"></i>
                        Dokumen Kesehatan
                    </h3>
                    <p className="text-xs dark:text-slate-500 text-slate-400">
                        Upload dokumen pendukung — format PDF, JPG, PNG, atau WebP
                    </p>
                </div>

                {/* Info keamanan */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5
                                dark:bg-blue-500/[0.07] bg-blue-50
                                border dark:border-blue-500/20 border-blue-200">
                    <i className="fa-solid fa-shield-halved text-blue-400 text-xs mt-0.5 shrink-0"></i>
                    <p className="text-[11px] dark:text-blue-300/80 text-blue-700">
                        Dokumen disimpan secara aman dan terenkripsi. Hanya dapat diakses
                        oleh tim kesehatan dan administrator sekolah.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {(Object.keys(DOC_CONFIG) as DocKey[]).map(key => (
                        <DocUploadCard
                            key={key}
                            docKey={key}
                            config={DOC_CONFIG[key]}
                            docState={docs[key]}
                            onUpload={handleUpload}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            </section>

        </div>
    );
}
