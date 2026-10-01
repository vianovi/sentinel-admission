import { useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";

// Minimal SVG Icons
const PhotoIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>;
const TrashIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const PencilSquareIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
const ClipboardDocumentIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.566 2.25h-3.132a2.25 2.25 0 0 0-2.1 1.638m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184m7.332 0V5.25c0 .621-.504 1.125-1.125 1.125h-3.132c-.621 0-1.125-.504-1.125-1.125V3.888m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184m7.332 0V5.25c0 .621-.504 1.125-1.125 1.125h-3.132c-.621 0-1.125-.504-1.125-1.125V3.888" /></svg>;
const ArchiveBoxArrowDownIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" /></svg>;

type MediaFile = {
    name: string;
    url: string;
    size: number;
    last_modified: number;
};

export default function MediaManager({ media }: { media: MediaFile[] }) {
    const [uploading, setUploading] = useState(false);
    
    // File upload logic
    const { data, setData, post, progress } = useForm({
        files: [] as File[],
    });

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.files.length === 0) return;
        
        setUploading(true);
        post(route("admin.exams.media.store"), {
            onSuccess: () => {
                setData("files", []);
                setUploading(false);
            },
            onError: () => setUploading(false),
            preserveScroll: true,
        });
    };

    const copyTag = (filename: string) => {
        navigator.clipboard.writeText(`[GAMBAR: ${filename}]`);
        alert(`Tag [GAMBAR: ${filename}] berhasil disalin!`);
    };

    const renameFile = (oldName: string) => {
        const newName = prompt("Masukkan nama file baru (tanpa ekstensi tidak apa-apa):", oldName);
        if (newName && newName !== oldName) {
            router.put(route("admin.exams.media.rename"), {
                old_name: oldName,
                new_name: newName,
            }, { preserveScroll: true });
        }
    };

    const deleteFile = (filename: string) => {
        if (confirm(`Yakin ingin menghapus ${filename}?`)) {
            router.delete(route("admin.exams.media.destroy"), {
                data: { name: filename },
                preserveScroll: true,
            });
        }
    };

    return (
        <DashboardLayout>
            <Head title="Bank Media Ujian" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bank Media Ujian</h1>
                        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                            Kelola seluruh gambar yang akan disisipkan ke dalam soal ujian. Anda dapat mengunggah file gambar satuan ataupun file <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs">.zip</code> untuk upload massal secara instan.
                        </p>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-6 md:p-8">
                    <form onSubmit={handleUpload} className="max-w-3xl mx-auto">
                        <label className="group relative flex flex-col items-center justify-center w-full p-12 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-colors">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="p-4 bg-white rounded-full shadow-sm ring-1 ring-slate-900/5 mb-4 group-hover:scale-110 transition-transform">
                                    <ArchiveBoxArrowDownIcon className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="mb-1 text-lg font-semibold text-slate-700 group-hover:text-blue-700">
                                    Pilih file atau tarik ke sini
                                </h3>
                                <p className="text-sm text-slate-500">Mendukung format PNG, JPG, WEBP, atau file ZIP.</p>
                            </div>
                            <input 
                                type="file" 
                                className="hidden" 
                                multiple 
                                accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.zip"
                                onChange={(e) => setData("files", Array.from(e.target.files || []))}
                            />
                        </label>

                        {data.files.length > 0 && (
                            <div className="mt-6 bg-slate-50 rounded-xl p-4 flex items-center justify-between ring-1 ring-slate-900/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {data.files.length}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">File siap diunggah</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                                >
                                    {uploading ? 'Memproses Upload...' : 'Mulai Upload'}
                                </button>
                            </div>
                        )}
                        
                        {progress && (
                            <div className="w-full mt-4 bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progress.percentage}%` }}></div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Media Grid */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <PhotoIcon className="w-5 h-5 text-slate-400" />
                        Koleksi Gambar ({media.length})
                    </h2>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {media.map((file) => (
                            <div key={file.name} className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
                                <div className="aspect-square bg-slate-100 relative overflow-hidden flex-shrink-0">
                                    <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <div className="p-3.5 flex flex-col flex-1 justify-between">
                                    <p className="text-xs font-semibold text-slate-700 truncate" title={file.name}>{file.name}</p>
                                    
                                    <div className="mt-3 grid grid-cols-3 gap-1">
                                        <button onClick={() => copyTag(file.name)} title="Salin Tag [GAMBAR:...]" className="flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <ClipboardDocumentIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => renameFile(file.name)} title="Ganti Nama" className="flex items-center justify-center p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteFile(file.name)} title="Hapus File" className="flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {media.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 py-24 text-center">
                            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100">
                                <PhotoIcon className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">Belum ada gambar</h3>
                            <p className="mt-1 text-sm text-slate-500">Gambar yang diunggah akan tampil di sini.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
