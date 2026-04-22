import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export type Plan = 'trial' | 'limited' | 'monthly' | 'annual' | 'lifetime'

const PLAN_KEY = 'cone_plan'

function getStoredPlan(): Plan {
    return (localStorage.getItem(PLAN_KEY) as Plan) ?? 'trial'
}

function storePlan(plan: Plan) {
    localStorage.setItem(PLAN_KEY, plan)
}

interface AuthState {
    user: User | null
    plan: Plan
    loading: boolean
    setPlan: (plan: Plan) => void
}

export const useAuthStore = create<AuthState>()(() => ({
    user: null,
    plan: getStoredPlan(),
    loading: true,
    setPlan: (plan) => {
        storePlan(plan)
        useAuthStore.setState({ plan })
    },
}))

async function fetchAndSetPlan(u: User) {
    const { data: row } = await supabase.from('users').select('plan').eq('id', u.id).single()
    const plan: Plan = (row?.plan as Plan) ?? 'trial'
    storePlan(plan)
    useAuthStore.setState({ user: u, plan, loading: false })
}

// Listen for manual DB edits to users.plan via Realtime — Supabase is authoritative
let planChannel: ReturnType<typeof supabase.channel> | null = null

function subscribeToPlanChanges(userId: string) {
    unsubscribeFromPlanChanges()
    planChannel = supabase
        .channel(`plan-${userId}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'users' },
            (payload) => {
                if (payload.new.id !== userId) return
                const fresh: Plan = (payload.new.plan as Plan) ?? 'trial'
                if (fresh !== useAuthStore.getState().plan) {
                    storePlan(fresh)
                    useAuthStore.setState({ plan: fresh })
                }
            }
        )
        .subscribe()
}

function unsubscribeFromPlanChanges() {
    if (planChannel) {
        supabase.removeChannel(planChannel)
        planChannel = null
    }
}

supabase.auth.getSession().then(async ({ data }) => {
    const u = data.session?.user ?? null
    if (!u) {
        useAuthStore.setState({ loading: false })
        return
    }
    await fetchAndSetPlan(u)
    subscribeToPlanChanges(u.id)
})

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, loading: false })
        unsubscribeFromPlanChanges()
    } else if (event === 'SIGNED_IN' && session?.user) {
        fetchAndSetPlan(session.user)
        subscribeToPlanChanges(session.user.id)
    }
})
