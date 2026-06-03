import { useState } from "react";
import { EmptyState, InfoField, SectionTitle } from "./ReadonlyParts";
import {
    EDUCATION_LABELS,
    HOUSE_LABELS,
    INCOME_LABELS,
    MARITAL_LABELS,
    STATUS_LABELS,
    VEHICLE_LABELS,
    type GuardianData,
} from "@/Components/Dashboard/Candidate/DataWali/types";

export type StaffGuardian = (GuardianData & {
    completion_percentage?: number;
}) | null;

type TabId = "ayah" | "ibu" | "wali" | "profil-keluarga" | "rangkuman";

const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "ayah", label: "Ayah", icon: "fa-solid fa-person" },
    { id: "ibu", label: "Ibu", icon: "fa-solid fa-person-dress" },
    { id: "wali", label: "Wali", icon: "fa-solid fa-user-shield" },
    { id: "profil-keluarga", label: "Profil Keluarga", icon: "fa-solid fa-house" },
    { id: "rangkuman", label: "Rangkuman", icon: "fa-solid fa-list-check" },
];

function TabButton({ tab, active, onClick }: { tab: (typeof TABS)[number]; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={tab.label}
            className={[
                "flex min-h-[36px] min-w-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 sm:px-3",
                active
                    ? "bg-violet-500 text-white shadow-sm"
                    : "text-slate-500 hover:bg-black/[0.04] hover:text-slate-700 dark:text-slate-400 dark:hover:bg-content-muted dark:hover:text-slate-300",
            ].join(" ")}
        >
            <i className={`${tab.icon} text-xs shrink-0`}></i>
            <span className="hidden whitespace-nowrap sm:inline">{tab.label}</span>
        </button>
    );
}

function valueOf(data: GuardianData, key: string) {
    const value = data[key];
    if (value === null || value === undefined || value === "") return null;
    return String(value);
}

function labelFrom<T extends string>(labels: Record<T, string>, value: unknown) {
    if (!value || typeof value !== "string") return null;
    return labels[value as T] ?? value;
}

function PersonSection({ data, prefix, title, icon }: { data: GuardianData; prefix: "father" | "mother" | "guardian"; title: string; icon: string }) {
    const isGuardian = prefix === "guardian";

    return (
        <div className="space-y-6">
            <SectionTitle
                icon={icon}
                title={title}
                subtitle={isGuardian ? "Data wali pendamping jika diisi kandidat." : "Data orang tua sesuai formulir kandidat."}
                tone="violet"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <InfoField label="Status" value={labelFrom(STATUS_LABELS, data[`${prefix}_status`])} />
                <InfoField label="Nama" value={valueOf(data, `${prefix}_name`)} />
                {isGuardian && <InfoField label="Hubungan" value={valueOf(data, "guardian_relation")} />}
                <InfoField label="NIK" value={valueOf(data, `${prefix}_nik`)} />
                <InfoField label="Tempat Lahir" value={valueOf(data, `${prefix}_place_of_birth`)} />
                <InfoField label="Tanggal Lahir" value={valueOf(data, `${prefix}_date_of_birth`)} />
                <InfoField label="Pendidikan" value={labelFrom(EDUCATION_LABELS, data[`${prefix}_education`])} />
                <InfoField label="Pekerjaan KTP" value={valueOf(data, `${prefix}_job_ktp`)} />
                <InfoField label="Pekerjaan Aktual" value={valueOf(data, `${prefix}_job_actual`)} />
                <InfoField label="Penghasilan" value={labelFrom(INCOME_LABELS, data[`${prefix}_income_range`])} />
                <InfoField label="Nomor HP" value={valueOf(data, `${prefix}_phone`)} />
            </div>

            <SectionTitle
                icon="fa-solid fa-location-dot"
                title={`Alamat ${title}`}
                subtitle="Alamat kontak keluarga kandidat."
                tone="violet"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <InfoField label="Provinsi" value={valueOf(data, `${prefix}_province`)} />
                <InfoField label="Kota/Kabupaten" value={valueOf(data, `${prefix}_city`)} />
                <InfoField label="Kecamatan" value={valueOf(data, `${prefix}_district`)} />
                <InfoField label="Kelurahan" value={valueOf(data, `${prefix}_village`)} />
                <InfoField label="Alamat" value={valueOf(data, `${prefix}_address`)} className="sm:col-span-2 xl:col-span-3" />
                <InfoField label="Kode Pos" value={valueOf(data, `${prefix}_postal_code`)} />
            </div>
        </div>
    );
}

function ProfileSection({ data }: { data: GuardianData }) {
    return (
        <div className="space-y-6">
            <SectionTitle
                icon="fa-solid fa-house"
                title="Profil Keluarga"
                subtitle="Data administrasi keluarga dan kondisi ekonomi."
                tone="violet"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <InfoField label="Nomor Kartu Keluarga" value={valueOf(data, "no_kk")} />
                <InfoField label="Email Keluarga" value={valueOf(data, "family_email")} />
                <InfoField label="Tipe Penghasilan" value={data.income_type === "combined" ? "Gabungan" : "Terpisah"} />
                <InfoField label="Status Pernikahan" value={labelFrom(MARITAL_LABELS, data.marital_status)} />
                <InfoField label="Kepemilikan Rumah" value={labelFrom(HOUSE_LABELS, data.house_ownership)} />
                <InfoField label="Kepemilikan Kendaraan" value={labelFrom(VEHICLE_LABELS, data.vehicle_ownership)} />
                <InfoField label="Jumlah Tanggungan" value={data.family_dependents === null || data.family_dependents === undefined ? null : String(data.family_dependents)} />
                <InfoField label="Alamat Orang Tua Sama" value={data.alamat_shared ? "Ya" : "Tidak"} />
            </div>
        </div>
    );
}

export default function TabWali({ guardian }: { guardian: StaffGuardian }) {
    const [activeTab, setActiveTab] = useState<TabId>("ayah");

    if (!guardian) {
        return (
            <EmptyState
                icon="fa-solid fa-people-roof"
                title="Data wali belum tersedia"
                description="Kandidat belum memiliki record wali."
            />
        );
    }

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

            {activeTab === "ayah" && <PersonSection data={guardian} prefix="father" title="Ayah" icon="fa-solid fa-person" />}
            {activeTab === "ibu" && <PersonSection data={guardian} prefix="mother" title="Ibu" icon="fa-solid fa-person-dress" />}
            {activeTab === "wali" && <PersonSection data={guardian} prefix="guardian" title="Wali" icon="fa-solid fa-user-shield" />}
            {activeTab === "profil-keluarga" && <ProfileSection data={guardian} />}
            {activeTab === "rangkuman" && (
                <div className="space-y-6">
                    <SectionTitle
                        icon="fa-solid fa-list-check"
                        title="Rangkuman Data Wali"
                        subtitle="Ringkasan cepat untuk pengecekan staff."
                        tone="violet"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <InfoField label="Kelengkapan" value={`${guardian.completion_percentage ?? 0}%`} />
                        <InfoField label="Ibu" value={guardian.mother_name} />
                        <InfoField label="Ayah" value={guardian.father_name} />
                        <InfoField label="Wali" value={guardian.guardian_name} />
                        <InfoField label="No. KK" value={guardian.no_kk} />
                        <InfoField label="Kontak Utama" value={guardian.mother_phone ?? guardian.father_phone ?? guardian.guardian_phone} />
                    </div>
                </div>
            )}
        </div>
    );
}
