// resources/js/Components/Dashboard/Candidate/DataWali/types.ts

// ─── Core Types ───────────────────────────────────────────────────────────────

export type EducationLevel =
    | 'tidak_sekolah' | 'sd_sederajat' | 'smp_sederajat'
    | 'sma_smk_sederajat' | 'd1' | 'd2' | 'd3' | 'd4_s1' | 's2' | 's3'

export type IncomeRange =
    | 'tidak_berpenghasilan' | 'di_bawah_1jt' | '1jt_2_5jt'
    | '2_5jt_3_5jt' | '3_5jt_5jt' | '5jt_10jt' | 'di_atas_10jt'

export type PersonStatus     = 'hidup' | 'meninggal' | 'tidak_diketahui'
export type MaritalStatus    = 'nikah_tercatat' | 'cerai_hidup' | 'cerai_mati'
export type HouseOwnership   = 'milik_sendiri' | 'kontrak' | 'menumpang' | 'rumah_dinas'
export type VehicleOwnership = 'tidak_ada' | 'motor' | 'mobil' | 'motor_dan_mobil'
export type IncomeType       = 'separate' | 'combined'

// ─── GuardianData ─────────────────────────────────────────────────────────────
// Pakai `type` (bukan `interface`) agar bisa pakai index signature.
// Index signature [key: string]: unknown diperlukan untuk dynamic field access
// via prefix pattern — cth: data[`${prefix}_name`]

export type GuardianData = {
    [key: string]: unknown

    id: number
    candidate_id: number
    candidate_code: string

    // Shared
    no_kk: string | null
    income_type: IncomeType
    alamat_shared: boolean

    // Ayah
    father_status: PersonStatus
    father_name: string | null
    father_nik: string | null
    father_place_of_birth: string | null
    father_date_of_birth: string | null
    father_education: EducationLevel | null
    father_job_ktp: string | null
    father_job_actual: string | null
    father_income_range: IncomeRange | null
    father_phone: string | null
    father_province: string | null
    father_city: string | null
    father_district: string | null
    father_village: string | null
    father_address: string | null
    father_postal_code: string | null

    // Ibu
    mother_status: PersonStatus
    mother_name: string
    mother_nik: string | null
    mother_place_of_birth: string | null
    mother_date_of_birth: string | null
    mother_education: EducationLevel | null
    mother_job_ktp: string | null
    mother_job_actual: string | null
    mother_income_range: IncomeRange | null
    mother_phone: string | null
    mother_province: string | null
    mother_city: string | null
    mother_district: string | null
    mother_village: string | null
    mother_address: string | null
    mother_postal_code: string | null

    // Wali
    guardian_status: PersonStatus | null
    guardian_name: string | null
    guardian_relation: string | null
    guardian_nik: string | null
    guardian_place_of_birth: string | null
    guardian_date_of_birth: string | null
    guardian_education: EducationLevel | null
    guardian_job_ktp: string | null
    guardian_job_actual: string | null
    guardian_income_range: IncomeRange | null
    guardian_phone: string | null
    guardian_province: string | null
    guardian_city: string | null
    guardian_district: string | null
    guardian_village: string | null
    guardian_address: string | null
    guardian_postal_code: string | null

    // Profil Keluarga
    family_email: string | null
    marital_status: MaritalStatus | null
    house_ownership: HouseOwnership | null
    vehicle_ownership: VehicleOwnership | null
    family_dependents: number | null
}

// ─── Candidate Address (untuk fitur salin alamat kandidat) ───────────────────

export type CandidateAddress = {
    full_name: string
    candidate_code: string
    province: string | null
    city: string | null
    district: string | null
    village: string | null
    address: string | null
    postal_code: string | null
}

// ─── Label Maps ───────────────────────────────────────────────────────────────

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
    tidak_sekolah:      'Tidak Sekolah',
    sd_sederajat:       'SD / Sederajat',
    smp_sederajat:      'SMP / Sederajat',
    sma_smk_sederajat:  'SMA / SMK / Sederajat',
    d1:                 'D1',
    d2:                 'D2',
    d3:                 'D3',
    d4_s1:              'D4 / S1',
    s2:                 'S2',
    s3:                 'S3',
}

export const INCOME_LABELS: Record<IncomeRange, string> = {
    tidak_berpenghasilan: 'Tidak Berpenghasilan',
    di_bawah_1jt:         '< Rp 1.000.000',
    '1jt_2_5jt':          'Rp 1.000.000 – 2.500.000',
    '2_5jt_3_5jt':        'Rp 2.500.000 – 3.500.000',
    '3_5jt_5jt':          'Rp 3.500.000 – 5.000.000',
    '5jt_10jt':           'Rp 5.000.000 – 10.000.000',
    di_atas_10jt:         '> Rp 10.000.000',
}

export const STATUS_LABELS: Record<PersonStatus, string> = {
    hidup:           'Hidup',
    meninggal:       'Meninggal',
    tidak_diketahui: 'Tidak Diketahui',
}

export const MARITAL_LABELS: Record<MaritalStatus, string> = {
    nikah_tercatat: 'Nikah Tercatat',
    cerai_hidup:    'Cerai Hidup',
    cerai_mati:     'Cerai Mati',
}

export const HOUSE_LABELS: Record<HouseOwnership, string> = {
    milik_sendiri: 'Milik Sendiri',
    kontrak:       'Kontrak / Sewa',
    menumpang:     'Menumpang',
    rumah_dinas:   'Rumah Dinas',
}

export const VEHICLE_LABELS: Record<VehicleOwnership, string> = {
    tidak_ada:       'Tidak Ada',
    motor:           'Motor',
    mobil:           'Mobil',
    motor_dan_mobil: 'Motor & Mobil',
}

export const EDUCATION_OPTIONS = Object.entries(EDUCATION_LABELS).map(([value, label]) => ({ value, label }))
export const INCOME_OPTIONS    = Object.entries(INCOME_LABELS).map(([value, label]) => ({ value, label }))
export const STATUS_OPTIONS    = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
export const MARITAL_OPTIONS   = Object.entries(MARITAL_LABELS).map(([value, label]) => ({ value, label }))
export const HOUSE_OPTIONS     = Object.entries(HOUSE_LABELS).map(([value, label]) => ({ value, label }))
export const VEHICLE_OPTIONS   = Object.entries(VEHICLE_LABELS).map(([value, label]) => ({ value, label }))