import { summarizeResult } from '../domain/summary'
import type { Preferences, RunRecord, WorkoutPlan } from '../domain/types'
import { DEFAULT_PREFERENCES, type PersistedStateV3, type SavedResult } from '../platform/storage'

export type AppFlow = 'configure' | 'spinning' | 'printing' | 'opening' | 'ticket' | 'countdown' | 'running' | 'result'
export interface AppState {
  flow: AppFlow
  preferences: Preferences
  currentTicket: WorkoutPlan | null
  activeRun: RunRecord | null
  latestResult: SavedResult | null
  requestId: number
  now: number
  confirmEnd: boolean
}
export type AppAction =
  | { type: 'preferences'; patch: Partial<Preferences> }
  | { type: 'pull'; plan: WorkoutPlan; requestId: number }
  | { type: 'sequence'; flow: 'printing' | 'opening' | 'ticket'; requestId: number }
  | { type: 'close-ticket' | 'open-ticket' | 'request-end' | 'cancel-end' | 'new-workout' }
  | { type: 'start-countdown' | 'tick' | 'end-run'; timestamp: number }

export function machineBusy(flow: AppFlow) { return flow === 'spinning' || flow === 'printing' || flow === 'opening' }
export function sessionActive(flow: AppFlow) { return flow === 'countdown' || flow === 'running' }

export function createInitialState(saved: PersistedStateV3 | null, now = Date.now()): AppState {
  const activeRun = saved?.activeRun ?? null
  const state: AppState = {
    flow: activeRun ? (now < activeRun.startTimestamp ? 'countdown' : 'running') : saved?.latestResult ? 'result' : 'configure',
    preferences: saved?.preferences ?? { ...DEFAULT_PREFERENCES }, currentTicket: null,
    activeRun, latestResult: saved?.latestResult ?? null, requestId: 0, now, confirmEnd: false,
  }
  return activeRun ? appReducer(state, { type: 'tick', timestamp: now }) : state
}

function finishRun(state: AppState, now: number): AppState {
  if (!state.activeRun) return state
  const { plan, startTimestamp } = state.activeRun
  const completedAt = Math.min(now, startTimestamp + plan.effectiveDurationSeconds * 1000)
  return { ...state, flow: 'result', now, activeRun: null, currentTicket: null, confirmEnd: false,
    latestResult: { plan, summary: summarizeResult(plan, Math.max(0, (now - startTimestamp) / 1000), completedAt) } }
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'preferences': {
      if (machineBusy(state.flow) || sessionActive(state.flow)) return state
      const preferences = { ...state.preferences, ...action.patch }
      const changed = preferences.durationMinutes !== state.preferences.durationMinutes || preferences.includeWarmup !== state.preferences.includeWarmup || preferences.includeCooldown !== state.preferences.includeCooldown
      return { ...state, preferences, currentTicket: changed ? null : state.currentTicket, flow: changed ? 'configure' : state.flow }
    }
    case 'pull':
      if (!['configure', 'ticket'].includes(state.flow) || action.requestId <= state.requestId) return state
      return { ...state, flow: 'spinning', requestId: action.requestId, currentTicket: action.plan, confirmEnd: false }
    case 'sequence': {
      if (action.requestId !== state.requestId || !machineBusy(state.flow)) return state
      const order = ['spinning', 'printing', 'opening', 'ticket']
      if (order.indexOf(action.flow) <= order.indexOf(state.flow)) return state
      return { ...state, flow: action.flow }
    }
    case 'open-ticket': return state.flow === 'configure' && state.currentTicket ? { ...state, flow: 'ticket' } : state
    case 'close-ticket': return state.flow === 'ticket' ? { ...state, flow: 'configure' } : state
    case 'start-countdown': return state.flow === 'ticket' && state.currentTicket ? {
      ...state, flow: 'countdown', activeRun: { plan: state.currentTicket, startTimestamp: action.timestamp + 5000 }, now: action.timestamp,
    } : state
    case 'tick': {
      if (!state.activeRun) return state
      if (action.timestamp >= state.activeRun.startTimestamp + state.activeRun.plan.effectiveDurationSeconds * 1000) return finishRun(state, action.timestamp)
      return { ...state, now: action.timestamp, flow: action.timestamp < state.activeRun.startTimestamp ? 'countdown' : 'running' }
    }
    case 'request-end': return state.flow === 'running' ? { ...state, confirmEnd: true } : state
    case 'cancel-end': return { ...state, confirmEnd: false }
    case 'end-run': return state.confirmEnd ? finishRun(state, action.timestamp) : state
    case 'new-workout': return sessionActive(state.flow) || machineBusy(state.flow) ? state : { ...state, flow: 'configure', latestResult: null, confirmEnd: false }
  }
}

export function toPersistedState(state: AppState): PersistedStateV3 {
  return { version: 3, preferences: state.preferences, currentTicket: state.currentTicket, activeRun: state.activeRun, latestResult: state.latestResult }
}
