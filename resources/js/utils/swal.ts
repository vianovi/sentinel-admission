import Swal from "sweetalert2";

export const swalDark = Swal.mixin({
    background: "#0f172a",
    color: "#f8fafc",
    confirmButtonColor: "#f59e0b",
    cancelButtonColor: "#334155",
    customClass: {
        popup: "!rounded-2xl !border !border-amber-500/20 !shadow-2xl",
        confirmButton: "!rounded-xl !px-6 !py-2.5 !text-xs !font-bold !text-slate-950",
        cancelButton: "!rounded-xl !px-6 !py-2.5 !text-xs !font-bold !text-slate-300",
    },
});

export const showSuccessToast = (message: string) => {
    swalDark.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: {
            popup: "!bg-slate-900 !text-white !border !border-emerald-500/30 !rounded-xl",
        },
    });
};

export const showErrorToast = (message: string) => {
    swalDark.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: message,
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
        customClass: {
            popup: "!bg-slate-900 !text-white !border !border-red-500/30 !rounded-xl",
        },
    });
};

export const confirmAction = async (title: string, text: string, confirmText = "Ya, Lanjutkan"): Promise<boolean> => {
    const target = (typeof document !== "undefined" && document.fullscreenElement)
        ? (document.fullscreenElement as HTMLElement)
        : undefined;

    const result = await swalDark.fire({
        target,
        title,
        text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: "Batal",
    });
    return result.isConfirmed;
};

export const confirmExamSubmission = async ({
    answeredCount,
    totalQuestions,
}: {
    answeredCount?: number;
    totalQuestions?: number;
} = {}): Promise<boolean> => {
    const target = (typeof document !== "undefined" && document.fullscreenElement)
        ? (document.fullscreenElement as HTMLElement)
        : undefined;

    const remaining = (totalQuestions !== undefined && answeredCount !== undefined)
        ? Math.max(0, totalQuestions - answeredCount)
        : 0;

    let htmlContent = `<p style="font-size: 0.925rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 0.5rem;">Bismillah, jawaban kamu yang telah tersimpan akan dikirimkan dan sesi ujian dinyatakan selesai.</p>`;

    if (totalQuestions !== undefined && answeredCount !== undefined) {
        if (remaining > 0) {
            htmlContent += `
                <div style="margin-top: 1rem; border-radius: 1rem; border: 1px solid rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.12); padding: 0.875rem 1rem; font-size: 0.85rem; color: #fde68a; text-align: left; line-height: 1.5;">
                    <p style="font-weight: 800; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem; color: #fbbf24;">
                        <i class="fa-solid fa-triangle-exclamation"></i> Perhatian:
                    </p>
                    <p>Kamu baru menjawab <strong style="color: #fff;">${answeredCount}</strong> dari <strong style="color: #fff;">${totalQuestions}</strong> soal. Masih ada <strong style="color: #f87171; font-weight: 800;">${remaining}</strong> butir soal yang belum terjawab!</p>
                </div>
            `;
        } else {
            htmlContent += `
                <div style="margin-top: 1rem; border-radius: 1rem; border: 1px solid rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.12); padding: 0.875rem 1rem; font-size: 0.85rem; color: #6ee7b7; text-align: left; line-height: 1.5;">
                    <p style="font-weight: 800; display: flex; align-items: center; gap: 0.5rem; color: #34d399;">
                        <i class="fa-solid fa-circle-check"></i> Alhamdulillaah!
                    </p>
                    <p>Seluruh <strong>${totalQuestions}</strong> soal sudah berhasil kamu jawab lengkap.</p>
                </div>
            `;
        }
    }

    const result = await swalDark.fire({
        target,
        topLayer: true,
        title: "Kumpulkan Jawaban Ujian?",
        html: htmlContent,
        icon: remaining > 0 ? "warning" : "question",
        iconColor: remaining > 0 ? "#f59e0b" : "#10b981",
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-paper-plane" style="margin-right: 0.5rem;"></i>Ya, Kumpulkan Jawaban',
        cancelButtonText: remaining > 0 ? "Periksa Kembali Dulu" : "Batal",
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#334155",
        focusCancel: remaining > 0,
        customClass: {
            popup: "!rounded-3xl !border !border-amber-500/30 !shadow-2xl !bg-slate-900 !text-white !p-6",
            confirmButton: "!rounded-2xl !px-6 !py-3 !text-xs sm:!text-sm !font-black !text-slate-950 !bg-emerald-400 hover:!bg-emerald-300 !transition-all",
            cancelButton: "!rounded-2xl !px-6 !py-3 !text-xs sm:!text-sm !font-bold !text-slate-200 !bg-slate-700 hover:!bg-slate-600 !transition-all",
        },
    });

    return result.isConfirmed;
};
