interface VideoModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function VideoModal({ isOpen, onClose }: VideoModalProps) {
    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label="Tutup video profil"
                    className="absolute top-4 right-4 text-white hover:text-red-500 z-10 bg-black/50 hover:bg-black rounded-full w-10 h-10 flex items-center justify-center transition"
                >
                    <i className="fa-solid fa-times text-xl"></i>
                </button>
                <div className="aspect-video w-full bg-black">
                    <video className="w-full h-full object-contain" controls autoPlay>
                        <source src="/assets/test-video.mp4" type="video/mp4" />
                        Browser Anda tidak mendukung tag video.
                    </video>
                </div>
            </div>
        </div>
    )
}
