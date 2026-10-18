import { useState, useMemo, useEffect, FormEvent } from "react";
import { Head, Link, useForm, router, usePage } from "@inertiajs/react";
import axios from "axios";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    ExamWorkspace,
    PageHeader,
    FlashMessage,
    StatCard,
    WorkflowRail,
    EmptyState,
    primaryButtonClass,
    secondaryButtonClass,
    dangerButtonClass,
    inputClass,
    labelClass,
    cardClass,
} from "@/Components/Dashboard/Admin/Exam/ExamAdminUi";
import { swalDark, showSuccessToast, showErrorToast, confirmAction } from "@/utils/swal";
import type { PageProps } from "@/types";

type MediaFile = {
    name: string;
    url: string;
    size: number;
    last_modified: number;
};

type ExamPackage = {
    id: number;
    title: string;
    code: string;
};

type ExamQuestion = {
    id: number;
    sort_order: number;
    preview: string;
    has_image: boolean;
};

type Props = {
    media: MediaFile[];
    trash_count?: number;
};

export default function MediaManager({ media, trash_count = 0 }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPreview, setSelectedPreview] = useState<MediaFile | null>(null);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    // Assign modal state
    const [assignTarget, setAssignTarget] = useState<MediaFile | null>(null);
    const [packages, setPackages] = useState<ExamPackage[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    const [questions, setQuestions] = useState<ExamQuestion[]>([]);
    const [loadingPackages, setLoadingPackages] = useState(false);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [assignPosition, setAssignPosition] = useState<"prepend" | "append">("append");
    const [assigningId, setAssigningId] = useState<number | null>(null);

    // Upload form
    const form = useForm<{ files: File[] }>({
        files: [],
    });

    // Load packages when assign modal opens
    useEffect(() => {
        if (!assignTarget) return;
        setLoadingPackages(true);
        setPackages([]);
        setSelectedPackageId(null);
        setQuestions([]);
        axios
            .get<ExamPackage[]>(route("admin.exams.media.packages"))
            .then((res) => setPackages(res.data))
            .catch(() => showErrorToast("Gagal memuat daftar paket soal."))
            .then(() => setLoadingPackages(false));
    }, [assignTarget]);

    // Load questions when package selected
    useEffect(() => {
        if (!selectedPackageId) {
            setQuestions([]);
            return;
        }
        setLoadingQuestions(true);
        setQuestions([]);
        axios
            .get<ExamQuestion[]>(route("admin.exams.media.questions", { packageId: selectedPackageId }))
            .then((res) => setQuestions(res.data))
            .catch(() => showErrorToast("Gagal memuat daftar soal."))
            .then(() => setLoadingQuestions(false));
    }, [selectedPackageId]);

    const handleUpload = (e: FormEvent) => {
        e.preventDefault();
        if (form.data.files.length === 0) return;

        form.post(route("admin.exams.media.store"), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset("files");
            },
        });
    };

    const copyTag = (filename: string) => {
        const tag = `[GAMBAR: ${filename}]`;
        navigator.clipboard.writeText(tag);
        showSuccessToast(`Tag ${tag} disalin ke clipboard!`);
    };

    const handleRename = async (oldName: string) => {
        const { value: newName, isConfirmed } = await swalDark.fire({
            title: "Ubah Nama File",
            text: "Nama file baru akan disesuaikan dengan tag [GAMBAR: ...] pada soal ujian Anda.",
            input: "text",
            inputValue: oldName,
            showCancelButton: true,
            confirmButtonText: "Simpan Nama Baru",
            cancelButtonText: "Batal",
            inputValidator: (val) => {
                if (!val || !val.trim()) {
                    return "Nama file tidak boleh kosong!";
                }
                return null;
            },
        });

        if (isConfirmed && newName && newName !== oldName) {
            router.put(
                route("admin.exams.media.rename"),
                {
                    old_name: oldName,
                    new_name: newName.trim(),
                },
                { preserveScroll: true }
            );
        }
    };

    const handleDelete = async (filename: string) => {
        const confirmed = await confirmAction(
            "Pindahkan ke Tempat Sampah?",
            `Gambar "${filename}" akan dipindahkan ke Tempat Sampah (tersedia 30 hari). Relasi tag [GAMBAR: ...] pada butir soal akan dibersihkan secara aman.`,
            "Ya, Pindahkan ke Sampah"
        );

        if (confirmed) {
            router.delete(route("admin.exams.media.destroy"), {
                data: { name: filename },
                preserveScroll: true,
            });
        }
    };

    const handleAssign = async (questionId: number) => {
        if (!assignTarget) return;
        setAssigningId(questionId);
        try {
            const res = await axios.post<{ already_exists: boolean; message: string }>(route("admin.exams.media.assign"), {
                filename: assignTarget.name,
                question_id: questionId,
                position: assignPosition,
            });
            const data = res.data;
            if (data.already_exists) {
                showErrorToast("Tag gambar ini sudah ada di soal tersebut.");
            } else {
                showSuccessToast(data.message);
                // Refresh question list to update has_image indicator
                if (selectedPackageId) {
                    axios
                        .get<ExamQuestion[]>(route("admin.exams.media.questions", { packageId: selectedPackageId }))
                        .then((r) => setQuestions(r.data));
                }
            }
        } catch {
            showErrorToast("Gagal menghubungkan gambar ke soal. Coba lagi.");
        } finally {
            setAssigningId(null);
        }
    };

    const filteredMedia = useMemo(() => {
        if (!searchQuery.trim()) return media;
        const q = searchQuery.toLowerCase();
        return media.filter((item) => item.name.toLowerCase().includes(q));
    }, [media, searchQuery]);

    const totalBytes = useMemo(() => {
        return media.reduce((acc, curr) => acc + (curr.size || 0), 0);
    }, [media]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Byte";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <>
            <Head title="Bank Media & Gambar Soal - Panel Ujian" />

            <ExamWorkspace active="packages">
                <PageHeader
                    title="Bank Media & Ilustrasi Soal"
                    badge="ASSET MANAGER: SELEKSI & UJIAN"
                    description="Penyimpanan terpusat gambar soal ujian. Unggah satuan atau arsip ZIP untuk otomatis diekstrak dan diberi tag [GAMBAR: nama_file]."
                    icon="fa-solid fa-photo-film"
                    actions={
                        <div className="flex items-center gap-2">
                            <Link
                                href="/dashboard/admin/system/trash/media"
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 text-sm font-bold text-amber-500 transition hover:bg-amber-500/20"
                            >
                                <i className="fa-solid fa-trash-can text-xs" /> Tempat Sampah
                                {trash_count > 0 && (
                                    <span className="rounded-full bg-amber-500 text-slate-950 px-1.5 py-0.5 text-[10px] font-black">
                                        {trash_count}
                                    </span>
                                )}
                            </Link>
                            <Link
                                href="/dashboard/admin/exams/packages"
                                className={secondaryButtonClass}
                            >
                                <i className="fa-solid fa-box-archive text-xs" /> Kelola Paket Soal
                            </Link>
                        </div>
                    }
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? pageErrors.files ?? pageErrors.name} />

                {/* Workflow Rail / Guide */}
                <WorkflowRail
                    items={[
                        {
                            label: "Langkah 1",
                            title: "Unggah Media",
                            description: "Unggah satu atau beberapa file gambar sekaligus. Dukungan ZIP dinonaktifkan sementara untuk keamanan.",
                            icon: "fa-solid fa-cloud-arrow-up",
                            state: media.length > 0 ? "done" : "active",
                        },
                        {
                            label: "Langkah 2",
                            title: "Sesuaikan Nama (Rename)",
                            description: "Ubah nama file acak kamera/WhatsApp (misal: soal_1.jpg) langsung dari tombol aksi kartu gambar.",
                            icon: "fa-solid fa-signature",
                            state: media.length > 0 ? "done" : "idle",
                        },
                        {
                            label: "Langkah 3",
                            title: "Hubungkan ke Soal",
                            description: "Klik ikon link di kartu gambar, pilih paket & soal, sistem otomatis menyisipkan tag [GAMBAR: ...].",
                            icon: "fa-solid fa-link",
                            state: "idle",
                        },
                    ]}
                />

                {/* Stat Cards */}
                <div className="grid gap-3 md:grid-cols-4">
                    <StatCard
                        label="Total Gambar Tersimpan"
                        value={media.length}
                        icon="fa-solid fa-images"
                        tone="text-amber-500"
                    />
                    <StatCard
                        label="Total Ukuran Penyimpanan"
                        value={formatBytes(totalBytes)}
                        icon="fa-solid fa-hard-drive"
                        tone="text-blue-500"
                    />
                    <StatCard
                        label="Format Didukung"
                        value="JPG, PNG, GIF, SVG, WEBP"
                        icon="fa-solid fa-file-image"
                        tone="text-emerald-500"
                    />
                    <StatCard
                        label="Sintaks Excel"
                        value="[GAMBAR: file.ext]"
                        icon="fa-solid fa-code"
                        tone="text-violet-500"
                    />
                </div>

                {/* Upload Section & Gallery Container */}
                <div className="grid gap-5 xl:grid-cols-[380px_1fr] items-start">

                    {/* Left Panel: Upload Form */}
                    <section className={`${cardClass} space-y-4`}>
                        <div className="border-b border-slate-200 dark:border-white/10 pb-3">
                            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <i className="fa-solid fa-upload text-amber-500" /> Unggah Gambar Soal
                            </h2>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Seret file langsung ke area ini atau klik tombol pilih file.
                            </p>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-4">
                            <label className="group relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl cursor-pointer bg-slate-50 dark:bg-white/[0.02] hover:bg-amber-500/5 hover:border-amber-400 dark:hover:border-amber-400 transition-all">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <i className="fa-solid fa-cloud-arrow-up text-xl" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition-colors">
                                        Klik untuk pilih file atau Drag & Drop
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        Maks 50MB per file · JPG, PNG, GIF, SVG, atau WEBP
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.webp,.gif,.svg"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            form.setData("files", Array.from(e.target.files));
                                        }
                                    }}
                                />
                            </label>

                            {/* Selected Files Preview */}
                            {form.data.files.length > 0 && (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                                        <span>
                                            <i className="fa-solid fa-file-circle-check mr-1.5" />
                                            {form.data.files.length} file dipilih
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => form.setData("files", [])}
                                            className="text-slate-500 hover:text-red-500 text-[11px]"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                    <div className="mt-2 max-h-28 overflow-y-auto space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                                        {form.data.files.slice(0, 5).map((f, idx) => (
                                            <div key={idx} className="truncate flex items-center gap-1.5">
                                                <i className="fa-solid fa-image text-blue-500" />
                                                <span className="truncate">{f.name}</span>
                                            </div>
                                        ))}
                                        {form.data.files.length > 5 && (
                                            <p className="text-[10px] text-slate-400 italic">
                                                ...dan {form.data.files.length - 5} file lainnya
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Progress bar */}
                            {form.progress && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                        <span>Mengunggah...</span>
                                        <span>{form.progress.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${form.progress.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={form.processing || form.data.files.length === 0}
                                className={`${primaryButtonClass} w-full min-h-11`}
                            >
                                {form.processing ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin text-xs" />
                                        Mengekstrak & Mengunggah...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-arrow-up-from-bracket text-xs" />
                                        Mulai Unggah ({form.data.files.length} File)
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Tips Note */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.02] text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <i className="fa-solid fa-circle-question text-amber-500" /> Petunjuk Tag Excel
                            </p>
                            <p className="text-[11px] leading-relaxed">
                                Tuliskan <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-amber-600 dark:text-amber-400 font-mono">[GAMBAR: nama_file.ext]</code> di kolom <b>Teks Soal</b> atau klik tombol <i className="fa-solid fa-link" /> di kartu gambar untuk sisipkan otomatis.
                            </p>
                        </div>
                    </section>

                    {/* Right Panel: Media Gallery */}
                    <section className={`${cardClass} space-y-4`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
                            <div>
                                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <i className="fa-solid fa-layer-group text-amber-500" /> Koleksi Media ({filteredMedia.length})
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Daftar seluruh gambar yang aktif dan dapat dipakai di semua paket ujian.
                                </p>
                            </div>

                            {/* Search bar */}
                            <div className="relative min-w-[240px]">
                                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari nama gambar..."
                                    className={`${inputClass} pl-8 text-xs py-2`}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                                    >
                                        <i className="fa-solid fa-xmark" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Gallery Grid */}
                        {filteredMedia.length === 0 ? (
                            <EmptyState
                                icon="fa-solid fa-images"
                                title={searchQuery ? "Gambar Tidak Ditemukan" : "Belum Ada Gambar di Bank Media"}
                                description={
                                    searchQuery
                                        ? `Tidak ada file yang cocok dengan kata kunci "${searchQuery}".`
                                        : "Silakan unggah file gambar atau arsip ZIP melalui formulir di sebelah kiri."
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredMedia.map((item) => (
                                    <div
                                        key={item.name}
                                        className="group rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-amber-500/50 hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
                                    >
                                        {/* Image Box */}
                                        <div
                                            className="relative aspect-[4/3] bg-slate-900/5 dark:bg-black/30 overflow-hidden cursor-pointer"
                                            onClick={() => !imageErrors[item.name] && setSelectedPreview(item)}
                                            title="Klik untuk pratinjau besar"
                                        >
                                            {imageErrors[item.name] ? (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-400 p-3 text-center">
                                                    <i className="fa-solid fa-triangle-exclamation text-amber-500 mb-1.5 text-base" />
                                                    <span className="text-xs">Gambar belum dimuat</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <img
                                                        src={item.url}
                                                        alt={item.name}
                                                        onError={() => setImageErrors((prev) => ({ ...prev, [item.name]: true }))}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="w-9 h-9 rounded-full bg-white/90 text-slate-900 flex items-center justify-center text-sm shadow-lg">
                                                            <i className="fa-solid fa-expand" />
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Info & Actions */}
                                        <div className="p-3.5 space-y-3">
                                            <div>
                                                <p
                                                    className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate"
                                                    title={item.name}
                                                >
                                                    {item.name}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {formatBytes(item.size)}
                                                </p>
                                            </div>

                                            {/* Action Buttons — 4 cols */}
                                            <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-200/80 dark:border-white/10">
                                                {/* Assign to question */}
                                                <button
                                                    type="button"
                                                    onClick={() => setAssignTarget(item)}
                                                    title="Hubungkan ke Soal"
                                                    className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-500 hover:bg-indigo-500/15 transition-colors"
                                                >
                                                    <i className="fa-solid fa-link text-sm" />
                                                </button>
                                                {/* Copy tag */}
                                                <button
                                                    type="button"
                                                    onClick={() => copyTag(item.name)}
                                                    title="Salin Tag [GAMBAR:...]"
                                                    className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:bg-amber-500/15 transition-colors"
                                                >
                                                    <i className="fa-solid fa-copy text-sm" />
                                                </button>
                                                {/* Rename */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRename(item.name)}
                                                    title="Ganti Nama File"
                                                    className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-500/15 transition-colors"
                                                >
                                                    <i className="fa-solid fa-pen text-sm" />
                                                </button>
                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item.name)}
                                                    title="Hapus Gambar"
                                                    className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-500/15 transition-colors"
                                                >
                                                    <i className="fa-solid fa-trash text-sm" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Lightbox / Preview Modal */}
                {selectedPreview && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
                        onClick={() => setSelectedPreview(null)}
                    >
                        <div
                            className="relative max-w-3xl w-full bg-slate-900 rounded-2xl border border-amber-500/30 overflow-hidden shadow-2xl p-4 space-y-3"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-white truncate max-w-md">
                                        {selectedPreview.name}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Ukuran: {formatBytes(selectedPreview.size)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPreview(null);
                                            setAssignTarget(selectedPreview);
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
                                    >
                                        <i className="fa-solid fa-link text-xs" /> Hubungkan ke Soal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => copyTag(selectedPreview.name)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                                    >
                                        <i className="fa-solid fa-copy text-xs" /> Salin Tag
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPreview(null)}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                    >
                                        <i className="fa-solid fa-xmark" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-center max-h-[70vh] overflow-hidden bg-black/40 rounded-xl p-2">
                                <img
                                    src={selectedPreview.url}
                                    alt={selectedPreview.name}
                                    className="max-h-[65vh] max-w-full object-contain rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Assign to Question Modal ── */}
                {assignTarget && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
                        onClick={() => setAssignTarget(null)}
                    >
                        <div
                            className="relative w-full max-w-2xl bg-slate-900 rounded-2xl border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-link" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white">
                                            Hubungkan Gambar ke Soal
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono truncate max-w-xs">
                                            {assignTarget.name}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAssignTarget(null)}
                                    className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center text-xs"
                                >
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {/* Posisi tag */}
                                <div>
                                    <p className={`${labelClass} mb-2`}>Posisi Tag Gambar</p>
                                    <div className="flex gap-2">
                                        {(["prepend", "append"] as const).map((pos) => (
                                            <button
                                                key={pos}
                                                type="button"
                                                onClick={() => setAssignPosition(pos)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                                    assignPosition === pos
                                                        ? "bg-indigo-600 border-indigo-500 text-white"
                                                        : "bg-white/5 border-white/10 text-slate-400 hover:border-indigo-500/50"
                                                }`}
                                            >
                                                {pos === "prepend" ? (
                                                    <><i className="fa-solid fa-arrow-up mr-1.5" />Di Awal Soal</>
                                                ) : (
                                                    <><i className="fa-solid fa-arrow-down mr-1.5" />Di Akhir Soal</>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Pilih Paket */}
                                <div>
                                    <label className={`${labelClass} mb-1.5 block`}>
                                        <i className="fa-solid fa-box-archive mr-1.5 text-indigo-400" />
                                        Pilih Paket Soal
                                    </label>
                                    {loadingPackages ? (
                                        <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                                            <i className="fa-solid fa-spinner fa-spin" /> Memuat paket...
                                        </div>
                                    ) : (
                                        <select
                                            className={`${inputClass} w-full`}
                                            value={selectedPackageId ?? ""}
                                            onChange={(e) => setSelectedPackageId(e.target.value ? Number(e.target.value) : null)}
                                        >
                                            <option value="">-- Pilih Paket --</option>
                                            {packages.map((pkg) => (
                                                <option key={pkg.id} value={pkg.id}>
                                                    [{pkg.code}] {pkg.title}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Daftar Soal */}
                                {selectedPackageId && (
                                    <div>
                                        <p className={`${labelClass} mb-2`}>
                                            <i className="fa-solid fa-list-ol mr-1.5 text-indigo-400" />
                                            Pilih Soal &mdash; Klik tombol <i className="fa-solid fa-link" /> untuk menghubungkan
                                        </p>

                                        {loadingQuestions ? (
                                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-6">
                                                <i className="fa-solid fa-spinner fa-spin" /> Memuat soal...
                                            </div>
                                        ) : questions.length === 0 ? (
                                            <div className="text-center py-6 text-xs text-slate-500">
                                                <i className="fa-solid fa-inbox text-2xl mb-2 block" />
                                                Paket ini belum memiliki soal.
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                                                {questions.map((q) => (
                                                    <div
                                                        key={q.id}
                                                        className="flex items-center gap-3 p-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
                                                    >
                                                        {/* No soal */}
                                                        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black flex items-center justify-center">
                                                            {q.sort_order}
                                                        </span>

                                                        {/* Preview */}
                                                        <p className="flex-1 text-xs text-slate-300 truncate" title={q.preview}>
                                                            {q.preview || <em className="text-slate-500">Soal tanpa teks</em>}
                                                        </p>

                                                        {/* Already has image badge */}
                                                        {q.has_image && (
                                                            <span className="flex-shrink-0 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                                                <i className="fa-solid fa-image" /> Ada
                                                            </span>
                                                        )}

                                                        {/* Assign button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAssign(q.id)}
                                                            disabled={assigningId === q.id}
                                                            title={`Hubungkan ${assignTarget.name} ke soal #${q.sort_order}`}
                                                            className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-2.5 py-1.5 transition-colors disabled:opacity-60 disabled:cursor-wait"
                                                        >
                                                            {assigningId === q.id ? (
                                                                <i className="fa-solid fa-spinner fa-spin" />
                                                            ) : (
                                                                <i className="fa-solid fa-link" />
                                                            )}
                                                            Sisipkan
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-white/10 flex items-center justify-between">
                                <p className="text-[11px] text-slate-500">
                                    Tag <code className="text-indigo-400 font-mono">[GAMBAR: {assignTarget.name}]</code> akan disisipkan otomatis.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setAssignTarget(null)}
                                    className={secondaryButtonClass}
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </ExamWorkspace>
        </>
    );
}

MediaManager.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
