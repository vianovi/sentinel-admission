import { FORM_TYPES, STATUS_OPTIONS } from "@/Components/Dashboard/Candidate/Calendar/constants";
import { CalendarStatus, EventFormState } from "@/Components/Dashboard/Candidate/Calendar/types";

type Props = {
    form: EventFormState;
    setForm: React.Dispatch<React.SetStateAction<EventFormState>>;
    onClose: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function AgendaFormModal({ form, setForm, onClose, onSubmit }: Props) {
    return (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0d1424]"
            >
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-gold">
                            Agenda Baru
                        </p>
                        <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                            Tambahkan catatan kalender
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                        aria-label="Tutup form agenda"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <div className="grid gap-4">
                    <Field label="Judul agenda">
                        <input
                            value={form.title}
                            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                            className="input-field dark:border-white/10 dark:bg-white/5 dark:text-white"
                            placeholder="Contoh: Siapkan berkas daftar ulang"
                            required
                            maxLength={140}
                        />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Tanggal">
                            <input
                                type="date"
                                value={form.event_date}
                                onChange={(event) => setForm((prev) => ({ ...prev, event_date: event.target.value }))}
                                className="input-field dark:border-white/10 dark:bg-white/5 dark:text-white"
                                required
                            />
                        </Field>
                        <Field label="Kategori">
                            <select
                                value={form.type}
                                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as EventFormState["type"] }))}
                                className="input-field dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                                {FORM_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Status">
                            <select
                                value={form.status}
                                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as CalendarStatus }))}
                                className="input-field dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Lokasi opsional">
                            <input
                                value={form.location}
                                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                                className="input-field dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="Online / Sekolah"
                                maxLength={160}
                            />
                        </Field>
                    </div>

                    <Field label="Deskripsi opsional">
                        <textarea
                            value={form.description}
                            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                            className="input-field min-h-[110px] resize-y dark:border-white/10 dark:bg-white/5 dark:text-white"
                            placeholder="Tambahkan detail singkat agar mudah diingat."
                            maxLength={2000}
                        />
                    </Field>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-[44px] rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        className="min-h-[44px] rounded-xl bg-gold px-5 py-2 text-sm font-black text-navy shadow-glow transition hover:bg-goldhover"
                    >
                        Simpan Agenda
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="label dark:text-slate-200">{label}</span>
            {children}
        </label>
    );
}
