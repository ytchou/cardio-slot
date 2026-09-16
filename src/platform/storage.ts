import type { ResultSummary, RunRecord, ThemeId, WorkoutPlan } from '../domain/types'

export const STORAGE_KEY = 'cardio-slot-state'

export interface PersistedStateV1 {
  version: 1
  theme: ThemeId
  currentTicket: WorkoutPlan | null
  activeRun: RunRecord | null
  latestResult: ResultSummary | null
}

export function loadPersistedState(storage: Pick<Storage, 'getItem'> = localStorage): PersistedStateV1 | null {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1) return null
    return value as PersistedStateV1
  } catch {
    return null
  }
}

export function savePersistedState(state: PersistedStateV1, storage: Pick<Storage, 'setItem'> = localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    return false
  }
  return true
}

