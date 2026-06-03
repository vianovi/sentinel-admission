import { useState } from "react";
import { EmptyState, InfoField, Pill, SectionTitle } from "./ReadonlyParts";

type Program = {
    name: string;
    quota_zone: "green" | "yellow" | "red" | "open";
    warning: string | null;
    is_open_quota: boolean;
};

type AdmissionWave = {
    title: string;
    academic_year: string | null;
    programs: Program[];
    available_majors: string[];
    majors_enabled: boolean;
};

type DataChangeRequest = {
    field: string;
    old_value: string;
    new_value: string;
    reason: string;
    status: "pending" | "approved" | "rejected";
    requested_at: string;
} | null;

export type StaffCandidateData = {
    id: number;
    candidate_code: string;
    full_name: string;
    nisn: string | null;
    nik: string | null;
    gender: string | null;
    gender_label: string | null;
    place_of_birth: string | null;
    date_of_birth: string | null;
    date_of_birth_label: string | null;
    address_full: string | null;
    address_detail: {
        jalan?: string;
        rt?: string;
        rw?: string;
        kelurahan?: string;
        kecamatan?: string;
        kabupaten?: string;
        provinsi?: string;
    } | null;
    school_origin: string | null;
    email: string | null;
    account_email: string | null;
    phone_number: string | null;
    religion: string | null;
    child_order: number | null;
    siblings_count: number | null;
    hobbies: string | null;
    ambitions: string | null;
    habits: string | null;
    extracurricular_interests: string[];
    postal_code: string | null;
    school_npsn: string | null;
    certificate_number: string | null;
    birth_certificate_number: string | null;
    family_card_number: string | null;
    program_choice: string | null;
    major_choice: string | null;
    is_transfer: boolean;
    status: "draft" | "submitted" | "verified" | "accepted" | "rejected";
    has_pending_change: boolean;
    data_change_request: DataChangeRequest;
    admission_wave: AdmissionWave | null;
};

type TabId = "identitas" | "alamat" | "minat" | "program" | "rangkuman";

const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "identitas", label: "Identitas", icon: "fa-solid fa-id-card" },
    { id: "alamat", label: "Alamat & Sekolah", icon: "fa-solid fa-map-location-dot" },
    { id: "minat", label: "Minat & Bakat", icon: "fa-solid fa-star" },
    { id: "program", label: "Program", icon: "fa-solid fa-graduation-cap" },
    { id: "rangkuman", label: "Rangkuman", icon: "fa-solid fa-chart-pie" },
];

const FIELD_LABELS: Record<string, string> = {
    full_name: "Nama Lengkap",
    nisn: "NISN",
    nik: "NIK",
    gender: "Jenis Kelamin",
    place_of_birth: "Tempat Lahir",
    date_of_birth: "Tanggal Lahir",
    address_detail: "Alamat",
    school_origin: "Asal Sekolah",
};

function TabButton({ tab, active, onClick }: { tab: (typeof TABS)[number]; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "flex min-h-[36px] min-w-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 sm:px-3",
                active
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-slate-500 hover:bg-black/[0.04] hover:text-slate-700 dark:text-slate-400 dark:hover:bg-content-muted dark:hover:text-slate-300",
            ].join(" ")}
            title={tab.label}
        >
            <i className={`${tab.icon} text-xs shrink-0`}></i>
            <span className="hidden whitespace-nowrap sm:inline">{tab.label}</span>
        </button>
    );
}

function ChangeRequestBox({ request }: { request: DataChangeRequest }) {
    if (!request || request.status !== "pending") return null;

    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <div className="flex items-start gap-3">
                <i className="fa-solid fa-clock mt-0.5 text-xs text-amber-500"></i>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        Pengajuan perubahan data menunggu persetujuan staff
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-amber-700/80 dark:text-amber-300/80">
                        {FIELD_LABELS[request.field] ?? request.field}: {request.old_value || "-"} menjadi {request.new_value}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-amber-700/80 dark:text-amber-300/80">
                        Alasan: {request.reason}
                    </p>
                </div>
            </div>
        </div>
    );
}

function ChipList({ items }: { items: string[] }) {
    if (items.length === 0) {
        return <span className="text-slate-400 dark:text-slate-500">-</span>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {items.map(item => (
                <Pill key={item} tone="blue">{item}</Pill>
            ))}
        </div>
    );
}

export default function TabDataDiri({ candidate }: { candidate: StaffCandidateData }) {
    const [activeTab, setActiveTab] = useState<TabId>("identitas");
    const address = candidate.address_detail;

    return (
        <div className="space-y-5">
            <div className="flex overflow-x-auto rounded-xl border border-black/[0.08] bg-slate-50 p-1 gap-1 no-scrollbar dark:border-content-border dark:bg-content-card">
                {TABS.map(tab => (
                    <TabButton
                        key={tab.id}
                        tab={tab}
                        active={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                    />
                ))}
            </div>

            {activeTab === "identitas" && (
                <div className="space-y-6">
                    <SectionTitle
                        icon="fa-solid fa-shield"
                        title="Data Identitas Resmi"
                        subtitle="Mengikuti data awal kandidat dan hanya ditinjau oleh staff."
                        tone="blue"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <InfoField label="Nama Lengkap" value={candidate.full_name} />
                        <InfoField label="Kode Kandidat" value={candidate.candidate_code} />
                        <InfoField label="NISN" value={candidate.nisn} />
                        <InfoField label="NIK" value={candidate.nik} />
                        <InfoField label="Jenis Kelamin" value={candidate.gender_label} />
                        <InfoField label="Tempat / Tanggal Lahir" value={[candidate.place_of_birth, candidate.date_of_birth_label].filter(Boolean).join(" / ")} />
                    </div>

                    <ChangeRequestBox request={candidate.data_change_request} />

                    <SectionTitle
                        icon="fa-solid fa-address-card"
                        title="Data Tambahan"
                        subtitle="Kolom yang diisi kandidat setelah login."
                        tone="blue"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <InfoField label="Agama" value={candidate.religion} />
                        <InfoField label="Nomor HP/WA Siswa" value={candidate.phone_number} />
                        <InfoField label="Email Siswa" value={candidate.email} />
                        <InfoField label="Email Akun Login" value={candidate.account_email} />
                        <InfoField label="Nomor Akta Lahir" value={candidate.birth_certificate_number} />
                        <InfoField label="Nomor Kartu Keluarga" value={candidate.family_card_number} />
                        <InfoField label="Anak ke-" value={candidate.child_order?.toString()} />
                        <InfoField label="Jumlah Saudara" value={candidate.siblings_count?.toString()} />
                    </div>
                </div>
            )}

            {activeTab === "alamat" && (
                <div className="space-y-6">
                    <SectionTitle
                        icon="fa-solid fa-location-dot"
                        title="Alamat Domisili"
                        subtitle="Alamat dari pendaftaran awal dan data pos tambahan kandidat."
                        tone="blue"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoField label="Alamat Lengkap" value={candidate.address_full} className="sm:col-span-2 xl:col-span-4" />
                        <InfoField label="RT/RW" value={address ? `${address.rt ?? "-"}/${address.rw ?? "-"}` : null} />
                        <InfoField label="Kelurahan" value={address?.kelurahan} />
                        <InfoField label="Kecamatan" value={address?.kecamatan} />
                        <InfoField label="Kabupaten" value={address?.kabupaten} />
                        <InfoField label="Provinsi" value={address?.provinsi} />
                        <InfoField label="Kode Pos" value={candidate.postal_code} />
                    </div>

                    <SectionTitle
                        icon="fa-solid fa-school"
                        title="Riwayat Pendidikan"
                        subtitle="Data sekolah asal dan status pindahan."
                        tone="blue"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <InfoField label="Nama Sekolah Asal" value={candidate.school_origin} />
                        <InfoField label="NPSN Sekolah" value={candidate.school_npsn} />
                        <InfoField label="Nomor Ijazah" value={candidate.certificate_number} />
                        <InfoField label="Siswa Pindahan" value={candidate.is_transfer ? "Ya" : "Tidak"} />
                    </div>
                </div>
            )}

            {activeTab === "minat" && (
                <div className="space-y-6">
                    <SectionTitle
                        icon="fa-solid fa-star"
                        title="Hobi, Minat & Bakat"
                        subtitle="Dipakai staff untuk memahami profil kandidat secara non-akademik."
                        tone="blue"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InfoField label="Hobi / Minat Bakat" value={candidate.hobbies} />
                        <InfoField label="Cita-cita" value={candidate.ambitions} />
                        <InfoField label="Kebiasaan Positif" value={candidate.habits} className="sm:col-span-2" />
                        <InfoField
                            label="Minat Ekstrakurikuler"
                            value={<ChipList items={candidate.extracurricular_interests ?? []} />}
                            className="sm:col-span-2"
                        />
                    </div>
                </div>
            )}

            {activeTab === "program" && (
                <div className="space-y-6">
                    <SectionTitle
                        icon="fa-solid fa-graduation-cap"
                        title="Pilihan Program"
                        subtitle={candidate.admission_wave ? `${candidate.admission_wave.title} - ${candidate.admission_wave.academic_year ?? "-"}` : "Gelombang belum tersedia."}
                        tone="blue"
                    />
                    {!candidate.admission_wave ? (
                        <EmptyState icon="fa-solid fa-graduation-cap" title="Gelombang belum tersedia" description="Kandidat belum terhubung ke gelombang aktif." />
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                <InfoField label="Program Dipilih" value={candidate.program_choice} />
                                <InfoField label="Jurusan Dipilih" value={candidate.major_choice} />
                                <InfoField label="Gelombang" value={candidate.admission_wave.title} />
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {candidate.admission_wave.programs.map(program => {
                                    const selected = program.name === candidate.program_choice;
                                    return (
                                        <div
                                            key={program.name}
                                            className={[
                                                "rounded-2xl border p-4 transition",
                                                selected
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                                                    : "border-black/[0.07] bg-white dark:border-white/[0.07] dark:bg-white/[0.02]",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{program.name}</p>
                                                    {program.warning && (
                                                        <p className="mt-1 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">{program.warning}</p>
                                                    )}
                                                </div>
                                                {selected && <Pill tone="blue">Dipilih</Pill>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "rangkuman" && (
                <div className="space-y-6">
                    <SectionTitle
                        icon="fa-solid fa-chart-pie"
                        title="Rangkuman Data Diri"
                        subtitle="Ringkasan cepat untuk proses review staff."
                        tone="blue"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <InfoField label="Identitas" value={`${candidate.full_name} / ${candidate.candidate_code}`} />
                        <InfoField label="Kontak" value={[candidate.phone_number, candidate.email].filter(Boolean).join(" / ")} />
                        <InfoField label="Sekolah" value={candidate.school_origin} />
                        <InfoField label="Program" value={candidate.program_choice} />
                        <InfoField label="Siswa Pindahan" value={candidate.is_transfer ? "Ya" : "Tidak"} />
                        <InfoField label="Pengajuan Perubahan" value={candidate.has_pending_change ? "Ada pengajuan pending" : "Tidak ada"} />
                    </div>
                </div>
            )}
        </div>
    );
}
