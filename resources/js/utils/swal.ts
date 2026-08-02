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
    const result = await swalDark.fire({
        title,
        text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: "Batal",
    });
    return result.isConfirmed;
};
