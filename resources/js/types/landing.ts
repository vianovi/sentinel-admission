// ============================================
// Types untuk Landing Page
// Di-pass dari WelcomeController via Inertia
// ============================================

export interface AdmissionWaveData {
    id: number
    title: string
    academic_year: string
    registration_fee: number
    quota_target: number
    candidates_count: number        // Realtime via withCount('candidates')
    start_date: string              // YYYY-MM-DD
    end_date: string
    exam_info: string | null
    announcement_info: string | null
    reregistration_date: string | null
    is_active: boolean
}

export interface WelcomeProps {
    activeWave: AdmissionWaveData | null
    auth: {
        user: {
            name: string
            role: 'admin' | 'staff' | 'candidate'
        } | null
    }
}

// Helper: Format angka ke Rupiah
export const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

// Helper: Format tanggal ke "dd MMMM YYYY"
export const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

// Helper: Hitung sisa kuota
export const remainingQuota = (target: number, filled: number): number => {
    return Math.max(0, target - filled)
}
