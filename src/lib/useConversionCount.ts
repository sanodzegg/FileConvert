import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { supabase } from './supabase'
import { useAuthStore } from '@/store/useAuthStore'
import type { User } from '@supabase/supabase-js'

export type EngineType = 'image' | 'document' | 'video' | 'audio'

export interface ConversionCounts {
    image: number
    document: number
    video: number
    audio: number
}

const STORAGE_KEY = 'cone_conversion_counts'
const DAILY_STORAGE_KEY = 'cone_daily_counts'

const LIMITS: ConversionCounts = {
    image: 100,
    document: 50,
    video: 20,
    audio: 10,
}

const DAILY_LIMITS: ConversionCounts = {
    image: 20,
    document: 20,
    video: 10,
    audio: 10,
}

export const TRIAL_LIMITS = LIMITS
export const LIMITED_DAILY_LIMITS = DAILY_LIMITS

interface DailyCounts {
    image: number
    document: number
    video: number
    audio: number
    resetAt: number // epoch ms when the window expires
}

function getDailyLocal(): DailyCounts {
    try {
        const raw = localStorage.getItem(DAILY_STORAGE_KEY)
        if (!raw) return { image: 0, document: 0, video: 0, audio: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 }
        const parsed = JSON.parse(raw) as DailyCounts
        if (Date.now() > parsed.resetAt) {
            const fresh: DailyCounts = { image: 0, document: 0, video: 0, audio: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 }
            localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(fresh))
            return fresh
        }
        return parsed
    } catch {
        return { image: 0, document: 0, video: 0, audio: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 }
    }
}

function setDailyLocal(counts: DailyCounts) {
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(counts))
}

export function incrementDailyCount(engine: EngineType) {
    const counts = getDailyLocal()
    if (counts[engine] >= DAILY_LIMITS[engine]) return
    counts[engine] = (counts[engine] ?? 0) + 1
    setDailyLocal(counts)
}

export function getDailyCounts(): DailyCounts {
    return getDailyLocal()
}

export function isTrialExhausted(): boolean {
    const counts = getLocal()
    return counts.image >= LIMITS.image || counts.document >= LIMITS.document || counts.video >= LIMITS.video || counts.audio >= LIMITS.audio
}

function getLocal(): ConversionCounts {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { image: 0, document: 0, video: 0, audio: 0 }
        const parsed = JSON.parse(raw)
        return {
            image: parsed.image ?? 0,
            document: parsed.document ?? 0,
            video: parsed.video ?? 0,
            audio: parsed.audio ?? 0,
        }
    } catch {
        return { image: 0, document: 0, video: 0, audio: 0 }
    }
}

function setLocal(counts: ConversionCounts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts))
    useCountsStore.setState({ counts })
}

// Reactive store so UI re-renders when counts change (sign-in merge, increments, Realtime overwrites)
export const useCountsStore = create<{ counts: ConversionCounts }>()(() => ({
    counts: getLocal(),
}))

export function incrementLocalCount(engine: EngineType) {
    const counts = getLocal()
    if (counts[engine] >= LIMITS[engine]) {
        // Past trial limit — only track daily window, don't keep inflating the total
        incrementDailyCount(engine)
        return
    }
    counts[engine] = (counts[engine] ?? 0) + 1
    setLocal(counts)
}

export function getLocalCounts(): ConversionCounts {
    return getLocal()
}

export function isAtLimit(engine: EngineType, plan: string): boolean {
    if (plan !== 'trial' && plan !== 'limited') return false
    // Per-category: if trial budget remains, gate on trial total; otherwise on daily window.
    // This way hitting the trial cap on one category doesn't retroactively put every other
    // category on a daily leash.
    const counts = getLocal()
    if (counts[engine] < LIMITS[engine]) return false
    const daily = getDailyLocal()
    return daily[engine] >= DAILY_LIMITS[engine]
}

export function useConversionCount(user: User | null, plan: string) {
    const synced = useRef(false)

    useEffect(() => {
        if (!user || !navigator.onLine || synced.current) return

        // Fetch server counts and take the higher of server vs local
        supabase
            .from('conversion_counts')
            .select('*')
            .eq('user_id', user.id)
            .single()
            .then(({ data }) => {
                if (!data) return
                const local = getLocal()
                const merged: ConversionCounts = {
                    image: Math.max(local.image, data.image_count),
                    document: Math.max(local.document, data.document_count),
                    video: Math.max(local.video, data.video_count),
                    audio: Math.max(local.audio, data.audio_count ?? 0),
                }
                setLocal(merged)

                // Push merged back to server if local was higher
                if (
                    merged.image !== data.image_count ||
                    merged.document !== data.document_count ||
                    merged.video !== data.video_count ||
                    merged.audio !== (data.audio_count ?? 0)
                ) {
                    supabase.from('conversion_counts').upsert({
                        user_id: user.id,
                        image_count: merged.image,
                        document_count: merged.document,
                        video_count: merged.video,
                        audio_count: merged.audio,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' })
                }

                synced.current = true
            })
    }, [user, plan])

    // Listen for manual DB edits to conversion_counts via Realtime.
    // Supabase is authoritative here — we overwrite local outright (no Math.max merge).
    useEffect(() => {
        if (!user) return
        const channel = supabase
            .channel(`counts-${user.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'conversion_counts' },
                (payload) => {
                    if (payload.new.user_id !== user.id) return
                    const remote: ConversionCounts = {
                        image: payload.new.image_count ?? 0,
                        document: payload.new.document_count ?? 0,
                        video: payload.new.video_count ?? 0,
                        audio: payload.new.audio_count ?? 0,
                    }
                    // Echo guard: our own syncCountToServer round-trips back here
                    const local = getLocal()
                    if (remote.image === local.image && remote.document === local.document
                        && remote.video === local.video && remote.audio === local.audio) return

                    setLocal(remote)

                    // If all categories are back within trial limits, clear daily window
                    // and auto-revert limited → trial (support resetting a user's plan by
                    // just lowering their counts in Supabase)
                    const allUnderTrial = remote.image < LIMITS.image && remote.document < LIMITS.document
                        && remote.video < LIMITS.video && remote.audio < LIMITS.audio
                    if (allUnderTrial) {
                        localStorage.removeItem(DAILY_STORAGE_KEY)
                        const { plan: currentPlan, setPlan } = useAuthStore.getState()
                        if (currentPlan === 'limited') {
                            setPlan('trial')
                            supabase.from('users').update({ plan: 'trial' }).eq('id', user.id)
                                .then(({ error }) => {
                                    if (error) console.error('[conversionCount] failed to revert plan:', error)
                                })
                        }
                    }
                }
            )
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [user])

    // When online, sync local increments to server
    function syncCountToServer() {
        if (!user || !navigator.onLine) return
        const counts = getLocal()
        supabase.from('conversion_counts').upsert({
            user_id: user.id,
            image_count: counts.image,
            document_count: counts.document,
            video_count: counts.video,
            audio_count: counts.audio,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' }).then(({ error }) => {
            if (error) console.error('[conversionCount] sync error:', error)
        })
    }

    return { syncCountToServer }
}
