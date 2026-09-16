import { summarizeResult } from '../domain/summary'
import type { DurationMinutes, ResultSummary, RunRecord, ThemeId, WorkoutPlan } from '../domain/types'
import { withBookendPreference } from '../domain/workout'
import type { PersistedStateV1 } from '../platform/storage'

export type AppFlow = 'configure' | 'spinning' | 'ticket' | 'countdown' | 'running' | 'result'

export interface AppState {
  flow: AppFlow
  duration: DurationMinutes
  theme: ThemeId
  currentTicket: WorkoutPlan | null
  activeRun: RunRecord | null
  latestResult: ResultSummary | null
  countdownStartedAt: number | null
  now: number
  confirmEnd: boolean
}

export type AppAction =
  | { type: 'set-duration'; duration: DurationMinutes }
  | { type: 'set-theme'; theme: ThemeId }
  | { type: 'pull'; plan: WorkoutPlan }
  | { type: 'reveal' }
  | { type: 'toggle-bookend'; kind: 'warmup' | 'cooldown'; included: boolean }
  | { type: 'start-countdown'; timestamp: number }
  | { type: 'start-run'; timestamp: number }
  | { type: 'tick'; timestamp: number }
  | { type: 'request-end' }
  | { type: 'cancel-end' }
  | { type: 'end-run'; timestamp: number }
  | { type: 'new-workout' }

export function createInitialState(saved: PersistedStateV1 | null, now = Date.now()): AppState {
  const activeRun = saved?.activeRun ?? null
  const currentTicket = activeRun?.plan ?? saved?.currentTicket ?? null
  return {
    flow: activeRun ? 'running' : saved?.latestResult && currentTicket ? 'result' : currentTicket ? 'ticket' : 'configure',
    duration: currentTicket?.durationMinutes ?? 30,
    theme: saved?.theme ?? 'track',
    currentTicket,
    activeRun,
    latestResult: saved?.latestResult ?? null,
    countdownStartedAt: null,
    now,
    confirmEnd: false,
  }
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'set-duration': return { ...state, duration: action.duration }
    case 'set-theme': return { ...state, theme: action.theme }
    case 'pull': return { ...state, flow: 'spinning', currentTicket: action.plan, latestResult: null, confirmEnd: false }
    case 'reveal': return { ...state, flow: 'ticket' }
    case 'toggle-bookend': return state.currentTicket ? {
      ...state,
      currentTicket: withBookendPreference(state.currentTicket, action.kind, action.included),
    } : state
    case 'start-countdown': return { ...state, flow: 'countdown', countdownStartedAt: action.timestamp, now: action.timestamp }
    case 'start-run': return state.currentTicket ? {
      ...state,
      flow: 'running',
      countdownStartedAt: null,
      activeRun: { plan: state.currentTicket, startTimestamp: action.timestamp },
      now: action.timestamp,
    } : state
    case 'tick': {
      if (!state.activeRun || action.timestamp < state.activeRun.startTimestamp) return { ...state, now: action.timestamp }
      const elapsedSeconds = (action.timestamp - state.activeRun.startTimestamp) / 1000
      if (elapsedSeconds < state.activeRun.plan.effectiveDurationSeconds) return { ...state, now: action.timestamp }
      return {
        ...state,
        flow: 'result',
        now: action.timestamp,
        latestResult: summarizeResult(state.activeRun.plan, elapsedSeconds, action.timestamp),
        currentTicket: state.activeRun.plan,
        activeRun: null,
        confirmEnd: false,
      }
    }
    case 'request-end': return { ...state, confirmEnd: true }
    case 'cancel-end': return { ...state, confirmEnd: false }
    case 'end-run': {
      if (!state.activeRun) return state
      const elapsedSeconds = Math.max(0, (action.timestamp - state.activeRun.startTimestamp) / 1000)
      return {
        ...state,
        flow: 'result',
        now: action.timestamp,
        latestResult: summarizeResult(state.activeRun.plan, elapsedSeconds, action.timestamp),
        currentTicket: state.activeRun.plan,
        activeRun: null,
        confirmEnd: false,
      }
    }
    case 'new-workout': return state.flow === 'running' || state.flow === 'countdown' ? state : {
      ...state,
      flow: 'configure',
      currentTicket: null,
      activeRun: null,
      latestResult: null,
      countdownStartedAt: null,
      confirmEnd: false,
    }
  }
}

export function toPersistedState(state: AppState): PersistedStateV1 {
  return {
    version: 1,
    theme: state.theme,
    currentTicket: state.currentTicket,
    activeRun: state.activeRun,
    latestResult: state.latestResult,
  }
}
