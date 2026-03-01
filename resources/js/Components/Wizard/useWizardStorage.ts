/**
 * useWizardStorage
 *
 * Hook untuk auto-save & restore wizard state ke/dari localStorage.
 * Data disimpan per-field dengan debounce agar tidak terlalu sering write.
 *
 * Key: 'wizard_step1', 'wizard_step2', 'wizard_step3', 'wizard_draft_id'
 */

import { useCallback, useEffect, useRef } from 'react'

const KEYS = {
    step1:    'wizard_step1',
    step2:    'wizard_step2',
    step3:    'wizard_step3',
    draftId:  'wizard_draft_id',
    lastStep: 'wizard_last_step',
}

// ── Read ─────────────────────────────────────────────────────────────────────

export function readWizardStorage() {
    try {
        return {
            step1:    JSON.parse(localStorage.getItem(KEYS.step1)    || 'null'),
            step2:    JSON.parse(localStorage.getItem(KEYS.step2)    || 'null'),
            step3:    JSON.parse(localStorage.getItem(KEYS.step3)    || 'null'),
            draftId:  localStorage.getItem(KEYS.draftId)  ?? null,
            lastStep: Number(localStorage.getItem(KEYS.lastStep) ?? '1') as 1 | 2 | 3,
        }
    } catch {
        return { step1: null, step2: null, step3: null, draftId: null, lastStep: 1 as const }
    }
}

export function clearWizardStorage() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}

export function saveDraftId(id: string) {
    localStorage.setItem(KEYS.draftId, id)
}

export function saveLastStep(step: 1 | 2 | 3) {
    localStorage.setItem(KEYS.lastStep, String(step))
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWizardStorage<T extends object>(
    key: keyof typeof KEYS,
    value: T,
    debounceMs = 500,
) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const save = useCallback((data: T) => {
        try {
            localStorage.setItem(KEYS[key], JSON.stringify(data))
        } catch { /* storage full — ignore */ }
    }, [key])

    // Debounced auto-save setiap kali value berubah
    useEffect(() => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => save(value), debounceMs)
        return () => {
            if (timer.current) clearTimeout(timer.current)
        }
    }, [value, save, debounceMs])
}
