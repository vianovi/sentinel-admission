import { useState, useMemo, FormEvent } from "react";
import { Head, Link, useForm, router, usePage } from "@inertiajs/react";
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

type Props = {
    media: MediaFile[];
};

export default function MediaManager({ media }: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPreview, setSelectedPreview] = useState<MediaFile | null>(null);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    // Upload form
    const form = useForm<{ files: File[] }>({
        files: [],
    });

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
            "Hapus Gambar?",
            `Apakah Anda yakin ingin menghapus "${filename}"? Tag pada soal yang memuat gambar ini tidak akan lagi menampilkan gambar.`,
            "Ya, Hapus Gambar"
        );

        if (confirmed) {
            router.delete(route("admin.exams.media.destroy"), {
                data: { name: filename },
                preserveScroll: true,
            });
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
                            title: "Unggah Media / ZIP",
                            description: "Unggah gambar satu-per-satu atau kompresi satu folder menjadi .ZIP untuk ekstrak otomatis.",
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
                            title: "Salin Tag ke Excel",
                            description: "Klik ikon salin untuk menempelkan tag [GAMBAR: nama_file.jpg] ke dalam kolom teks soal XLSX.",
                            icon: "fa-solid fa-copy",
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
                        value="JPG, PNG, WEBP, ZIP"
                        icon="fa-solid fa-file-zipper"
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
                                        Maks 50MB · JPG, PNG, WEBP, atau ZIP
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.zip"
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
                                                <i className={f.name.endsWith(".zip") ? "fa-solid fa-file-zipper text-amber-500" : "fa-solid fa-image text-blue-500"} />
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
                                Tuliskan <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-amber-600 dark:text-amber-400 font-mono">[GAMBAR: nama_file.ext]</code> di kolom <b>Teks Soal</b> atau kolom opsi jawaban pada template Excel.
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                                {filteredMedia.map((item) => (
                                    <div
                                        key={item.name}
                                        className="group rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-amber-500/50 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                                    >
                                        {/* Image Box */}
                                        <div
                                            className="relative aspect-square bg-slate-900/5 dark:bg-black/20 overflow-hidden cursor-pointer"
                                            onClick={() => !imageErrors[item.name] && setSelectedPreview(item)}
                                            title="Klik untuk pratinjau besar"
                                        >
                                            {imageErrors[item.name] ? (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-400 p-2 text-center">
                                                    <i className="fa-solid fa-triangle-exclamation text-amber-500 mb-1" />
                                                    <span className="text-[10px]">Gambar belum dimuat</span>
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
                                                        <span className="w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center text-xs shadow-lg">
                                                            <i className="fa-solid fa-expand" />
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Info & Actions */}
                                        <div className="p-2.5 space-y-2">
                                            <div>
                                                <p
                                                    className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate"
                                                    title={item.name}
                                                >
                                                    {item.name}
                                                </p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {formatBytes(item.size)}
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-200/60 dark:border-white/5">
                                                <button
                                                    type="button"
                                                    onClick={() => copyTag(item.name)}
                                                    title="Salin Tag [GAMBAR:...]"
                                                    className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                                >
                                                    <i className="fa-solid fa-copy text-xs" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRename(item.name)}
                                                    title="Ganti Nama File"
                                                    className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                                                >
                                                    <i className="fa-solid fa-pen text-xs" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item.name)}
                                                    title="Hapus Gambar"
                                                    className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <i className="fa-solid fa-trash text-xs" />
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
            </ExamWorkspace>
        </>
    );
}

MediaManager.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
