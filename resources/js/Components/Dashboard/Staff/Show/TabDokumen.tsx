// resources/js/Components/Dashboard/Staff/Show/TabDokumen.tsx

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DocumentItem = {
    id:                number;
    doc_type:          string;
    doc_group:         string | null;
    original_filename: string;
    file_path:         string;
    status:            "pending" | "verified" | "rejected";
    rejection_reason:  string | null;
    verified_by:       string | null;
    verified_at:       string | null;
};

type Props = {
    documents:          DocumentItem[];
    candidateStatus:    "draft" | "submitted" | "verified" | "accepted" | "rejected";
    docTarget:          number | null;
    docStatus:          "verified" | "rejected";
    docReason:          string;
    docProcessing:      boolean;
    candidateFinalStatus:    "accepted" | "rejected";
    candidateReason:    string;
    candidateProcessing: boolean;
    onSelectDoc:        (id: number, currentStatus: "pending" | "verified" | "rejected", reason: string | null) => void;
    onDocStatusChange:  (v: "verified" | "rejected") => void;
    onDocReasonChange:  (v: string) => void;
    onSubmitDoc:        (e: React.FormEvent) => void;
    onCandidateStatusChange: (v: "accepted" | "rejected") => void;
    onCandidateReasonChange: (v: string) => void;
    onSubmitCandidateStatus: (e: React.FormEvent) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DOC_STATUS_CLASS: Record<DocumentItem["status"], string> = {
    pending:  "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    verified: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    rejected: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const DOC_STATUS_LABEL: Record<DocumentItem["status"], string> = {
    pending:  "Pending",
    verified: "Verified",
    rejected: "Rejected",
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TabDokumen({
    documents,
    candidateStatus,
    docTarget,
    docStatus,
    docReason,
    docProcessing,
    candidateFinalStatus,
    candidateReason,
    candidateProcessing,
    onSelectDoc,
    onDocStatusChange,
    onDocReasonChange,
    onSubmitDoc,
    onCandidateStatusChange,
    onCandidateReasonChange,
    onSubmitCandidateStatus,
}: Props) {
    const selectedDoc = documents.find((d) => d.id === docTarget) ?? null;
    const pendingCount = documents.filter((d) => d.status === "pending").length;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ── Dokumen list ─────────────────────────────────────────────── */}
            <div className="xl:col-span-2 rounded-2xl border border-slate-200 dark:border-white/5
                            overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5
                                bg-slate-50 dark:bg-white/[0.02]">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Daftar Dokumen
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {documents.length} dokumen
                        {pendingCount > 0 && ` · ${pendingCount} pending review`}
                    </p>
                </div>

                {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5
                                        flex items-center justify-center mb-3">
                            <i className="fa-solid fa-file-circle-question text-slate-400 text-lg" />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Belum ada dokumen tersedia
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-white/5">
                        {documents.map((doc) => {
                            const isSelected = docTarget === doc.id;
                            return (
                                <li
                                    key={doc.id}
                                    className={`px-5 py-4 transition-colors duration-150
                                                ${isSelected
                                                    ? "bg-emerald-50 dark:bg-emerald-500/5"
                                                    : ""}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold truncate
                                                          text-slate-800 dark:text-slate-100">
                                                {doc.original_filename}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {doc.doc_type}
                                                {doc.doc_group ? ` · ${doc.doc_group}` : ""}
                                            </p>
                                            {doc.rejection_reason && (
                                                <p className="text-xs text-red-500 mt-1.5">
                                                    Alasan reject: {doc.rejection_reason}
                                                </p>
                                            )}
                                            {doc.verified_by && (
                                                <p className="text-[11px] text-slate-400 mt-1">
                                                    Oleh: {doc.verified_by}
                                                    {doc.verified_at ? ` (${doc.verified_at})` : ""}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`inline-flex items-center px-2.5 py-1
                                                              rounded-lg text-[11px] font-semibold
                                                              ${DOC_STATUS_CLASS[doc.status]}`}>
                                                {DOC_STATUS_LABEL[doc.status]}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onSelectDoc(doc.id, doc.status, doc.rejection_reason)}
                                                className={`h-10 px-3 rounded-xl text-xs font-semibold
                                                            transition-all duration-150
                                                            ${isSelected
                                                                ? "bg-emerald-500 text-white border border-emerald-500"
                                                                : "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-500"}`}
                                            >
                                                {isSelected ? "Dipilih" : "Tinjau"}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* ── Action panel ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4">

                {/* Verify document form */}
                <form
                    onSubmit={onSubmitDoc}
                    className="rounded-2xl border border-slate-200 dark:border-white/5 p-5"
                >
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Verifikasi Dokumen
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedDoc
                            ? selectedDoc.original_filename
                            : "Pilih dokumen dari daftar"}
                    </p>

                    <div className="mt-4 flex flex-col gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                Status
                            </label>
                            <select
                                value={docStatus}
                                onChange={(e) => onDocStatusChange(e.target.value as "verified" | "rejected")}
                                disabled={!selectedDoc}
                                className="w-full h-11 px-3 rounded-xl text-sm
                                           bg-white dark:bg-slate-900
                                           border border-slate-200 dark:border-white/10
                                           text-slate-700 dark:text-slate-200
                                           focus:outline-none focus:border-emerald-500
                                           disabled:opacity-50 disabled:cursor-not-allowed
                                           transition-colors"
                            >
                                <option value="verified">Verified</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        {docStatus === "rejected" && (
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                    Alasan Penolakan
                                </label>
                                <textarea
                                    value={docReason}
                                    onChange={(e) => onDocReasonChange(e.target.value)}
                                    placeholder="Tulis alasan penolakan yang jelas..."
                                    rows={4}
                                    className="w-full rounded-xl text-sm p-3
                                               bg-white dark:bg-slate-900
                                               border border-slate-200 dark:border-white/10
                                               text-slate-700 dark:text-slate-200
                                               placeholder:text-slate-400 dark:placeholder:text-slate-500
                                               focus:outline-none focus:border-emerald-500
                                               resize-none transition-colors"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!selectedDoc || docProcessing || (docStatus === "rejected" && !docReason.trim())}
                            className="h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       text-white text-sm font-semibold
                                       shadow-sm shadow-emerald-500/20
                                       transition-all inline-flex items-center justify-center gap-2"
                        >
                            {docProcessing ? (
                                <><i className="fa-solid fa-spinner fa-spin" /> Menyimpan...</>
                            ) : (
                                <><i className="fa-solid fa-check" /> Simpan Verifikasi</>
                            )}
                        </button>
                    </div>
                </form>

                {/* Candidate final status form */}
                <form
                    onSubmit={onSubmitCandidateStatus}
                    className="rounded-2xl border border-slate-200 dark:border-white/5 p-5"
                >
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Status Akhir Kandidat
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {candidateStatus !== "verified"
                            ? "Hanya valid jika kandidat sudah terverifikasi"
                            : "Kandidat siap untuk keputusan akhir"}
                    </p>

                    {candidateStatus !== "verified" && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl
                                        bg-amber-50 dark:bg-amber-500/10
                                        border border-amber-200 dark:border-amber-500/20">
                            <i className="fa-solid fa-triangle-exclamation text-amber-500 text-xs shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                Status kandidat: {candidateStatus}
                            </p>
                        </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3">
                        <select
                            value={candidateFinalStatus}
                            onChange={(e) => onCandidateStatusChange(e.target.value as "accepted" | "rejected")}
                            disabled={candidateStatus !== "verified"}
                            className="w-full h-11 px-3 rounded-xl text-sm
                                       bg-white dark:bg-slate-900
                                       border border-slate-200 dark:border-white/10
                                       text-slate-700 dark:text-slate-200
                                       focus:outline-none focus:border-emerald-500
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-colors"
                        >
                            <option value="accepted">Diterima</option>
                            <option value="rejected">Ditolak</option>
                        </select>

                        {candidateFinalStatus === "rejected" && (
                            <textarea
                                value={candidateReason}
                                onChange={(e) => onCandidateReasonChange(e.target.value)}
                                placeholder="Alasan keputusan ditolak..."
                                rows={3}
                                className="w-full rounded-xl text-sm p-3
                                           bg-white dark:bg-slate-900
                                           border border-slate-200 dark:border-white/10
                                           text-slate-700 dark:text-slate-200
                                           placeholder:text-slate-400 dark:placeholder:text-slate-500
                                           focus:outline-none focus:border-emerald-500
                                           resize-none transition-colors"
                            />
                        )}

                        <button
                            type="submit"
                            disabled={
                                candidateProcessing ||
                                candidateStatus !== "verified" ||
                                (candidateFinalStatus === "rejected" && !candidateReason.trim())
                            }
                            className="h-11 rounded-xl
                                       bg-slate-800 hover:bg-slate-700
                                       dark:bg-white dark:hover:bg-slate-100
                                       disabled:opacity-40 disabled:cursor-not-allowed
                                       text-white dark:text-slate-900
                                       text-sm font-semibold
                                       transition-all inline-flex items-center justify-center gap-2"
                        >
                            {candidateProcessing ? (
                                <><i className="fa-solid fa-spinner fa-spin" /> Memproses...</>
                            ) : (
                                <><i className="fa-solid fa-flag-checkered" /> Update Status</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
