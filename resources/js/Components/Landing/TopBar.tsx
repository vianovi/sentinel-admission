export default function TopBar() {
    return (
        <div className="bg-navy text-gray-300 text-sm py-3 border-b border-gray-800 hidden md:block">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <span className="flex items-center cursor-default">
                        <i className="fa-solid fa-phone mr-2 text-gold text-base"></i>
                        +62 812-3456-7890
                    </span>
                    <span className="text-gray-600">|</span>
                    <a href="mailto:psb@sekolah.sch.id" className="flex items-center hover:text-white transition">
                        <i className="fa-solid fa-envelope mr-2 text-gold text-base"></i>
                        psb@sekolah.sch.id
                    </a>
                </div>
                <div className="flex items-center gap-5">
                    <span className="font-medium text-gray-400">Ikuti Update:</span>
                    <a href="#" aria-label="TikTok" className="hover:text-gold transition hover:-translate-y-0.5 transform"><i className="fa-brands fa-tiktok"></i></a>
                    <a href="#" aria-label="Instagram" className="hover:text-gold transition hover:-translate-y-0.5 transform"><i className="fa-brands fa-instagram"></i></a>
                    <a href="#" aria-label="YouTube" className="hover:text-gold transition hover:-translate-y-0.5 transform"><i className="fa-brands fa-youtube"></i></a>
                </div>
            </div>
        </div>
    )
}
