/**
 * useWizardCleanup
 *
 * Dipanggil di halaman Dashboard saat pertama mount.
 * Hapus semua data wizard dari localStorage — user sudah berhasil buat akun
 * jadi data draft di browser tidak diperlukan lagi.
 *
 * Cara pakai di Dashboard.tsx:
 *
 *   import { useWizardCleanup } from '@/hooks/useWizardCleanup'
 *   export default function Dashboard() {
 *       useWizardCleanup()
 *       // ...
 *   }
 */

import { useEffect } from 'react'
import { clearWizardStorage } from '@/Components/Wizard/useWizardStorage'

export function useWizardCleanup() {
    useEffect(() => {
        clearWizardStorage()
    }, [])
}
