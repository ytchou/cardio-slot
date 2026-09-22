import { DURATION_DEFINITIONS, TEMPLATE_LABELS, THEMES } from '../domain/config'
import { summarizeResult } from '../domain/summary'
import type { Intensity, Preferences, ResultSummary, RunRecord, WorkoutPlan } from '../domain/types'
import { validateWorkout } from '../domain/validate'

export const STORAGE_KEY = 'cardio-slot-state-v3'
export const PREVIOUS_STORAGE_KEY = 'cardio-slot-state-v2'
export const LEGACY_STORAGE_KEY = 'cardio-slot-state'
export const DEFAULT_PREFERENCES: Preferences = { durationMinutes: 30, includeWarmup: true, includeCooldown: true, theme: 'track' }
export interface SavedResult { plan: WorkoutPlan; summary: ResultSummary }
export interface PersistedStateV3 {
  version: 3
  preferences: Preferences
  currentTicket: WorkoutPlan | null
  activeRun: RunRecord | null
  latestResult: SavedResult | null
}

const INTENSITIES: Intensity[] = ['easy', 'strong', 'max', 'recovery']

function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) }
function registered(value: unknown, registry: object): value is string { return typeof value === 'string' && Object.hasOwn(registry, value) }

function readPreferences(value: unknown): Preferences | null {
  if (!object(value) || !finite(value.durationMinutes) || !registered(String(value.durationMinutes), DURATION_DEFINITIONS) ||
      !registered(value.theme, THEMES) || typeof value.includeWarmup !== 'boolean' || typeof value.includeCooldown !== 'boolean') return null
  return { durationMinutes: value.durationMinutes, includeWarmup: value.includeWarmup, includeCooldown: value.includeCooldown, theme: 'track' } as Preferences
}

function readPlan(value: unknown): WorkoutPlan | null {
  if (!object(value) || value.generationVersion !== 3 || typeof value.id !== 'string' ||
      !finite(value.durationMinutes) || !registered(String(value.durationMinutes), DURATION_DEFINITIONS) ||
      !finite(value.seed) || !Number.isInteger(value.seed) || value.seed < 0 || value.seed > 0xffffffff ||
      !finite(value.effectiveDurationSeconds) || typeof value.includeWarmup !== 'boolean' || typeof value.includeCooldown !== 'boolean' ||
      !registered(value.templateType, TEMPLATE_LABELS) || !Array.isArray(value.blocks) || !value.blocks.length || value.blocks.length > 40) return null

  for (const block of value.blocks) {
    if (!object(block) || typeof block.id !== 'string' || typeof block.label !== 'string' ||
        !['warmup', 'main', 'recovery', 'cooldown'].includes(String(block.kind)) || !Array.isArray(block.intervals) || !block.intervals.length || block.intervals.length > 240) return null
    if (block.kind === 'recovery') block.label = 'Recovery'
    for (const interval of block.intervals) {
      if (!object(interval) || typeof interval.id !== 'string' || interval.blockId !== block.id ||
          !INTENSITIES.includes(String(interval.intensity) as Intensity) || !finite(interval.incline) ||
          !finite(interval.durationSeconds) || interval.durationSeconds < 30 || interval.durationSeconds % 15 !== 0 ||
          !finite(interval.startSeconds) || interval.startSeconds < 0 || typeof interval.cue !== 'string') return null
    }
  }
  const plan = structuredClone(value) as unknown as WorkoutPlan
  if (plan.id !== `v3-${plan.durationMinutes}-${Number(plan.includeWarmup)}${Number(plan.includeCooldown)}-${plan.seed}` || validateWorkout(plan).length) return null
  return plan
}

function readResult(value: unknown, plan: WorkoutPlan): SavedResult | null {
  if (!object(value) || !finite(value.elapsedSeconds) || value.elapsedSeconds < 0 || value.elapsedSeconds > plan.effectiveDurationSeconds ||
      typeof value.dateIso !== 'string' || !Number.isFinite(Date.parse(value.dateIso))) return null
  const summary = summarizeResult(plan, value.elapsedSeconds, Date.parse(value.dateIso))
  if (value.status !== summary.status || value.plannedSeconds !== summary.plannedSeconds || value.templateType !== summary.templateType ||
      value.blockCount !== summary.blockCount || value.maximumIncline !== summary.maximumIncline || !object(value.intensitySeconds) ||
      INTENSITIES.some(intensity => (value.intensitySeconds as Record<string, unknown>)[intensity] !== summary.intensitySeconds[intensity])) return null
  return { plan, summary }
}

function migratePreferences(storage: Pick<Storage, 'getItem'>) {
  const previousRaw = storage.getItem(PREVIOUS_STORAGE_KEY)
  if (previousRaw) {
    try {
      const previous: unknown = JSON.parse(previousRaw)
      if (object(previous) && previous.version === 2) return readPreferences(previous.preferences)
    } catch { return null }
  }
  const legacyRaw = storage.getItem(LEGACY_STORAGE_KEY)
  if (!legacyRaw) return null
  try {
    const legacy: unknown = JSON.parse(legacyRaw)
    if (!object(legacy) || legacy.version !== 1 || !registered(legacy.theme, THEMES)) return null
    return { ...DEFAULT_PREFERENCES }
  } catch { return null }
}

export function loadPersistedState(storage?: Pick<Storage, 'getItem'>): PersistedStateV3 | null {
  try {
    storage ??= localStorage
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) {
      const preferences = migratePreferences(storage)
      return preferences ? { version: 3, preferences, currentTicket: null, activeRun: null, latestResult: null } : null
    }
    const value: unknown = JSON.parse(raw)
    if (!object(value) || value.version !== 3) return null
    const preferences = readPreferences(value.preferences)
    if (!preferences) return null
    const currentTicket = value.currentTicket == null ? null : readPlan(value.currentTicket)
    if (value.currentTicket != null && !currentTicket) return null
    let activeRun: RunRecord | null = null
    if (value.activeRun != null) {
      if (!object(value.activeRun) || !finite(value.activeRun.startTimestamp)) return null
      const plan = readPlan(value.activeRun.plan)
      if (!plan) return null
      activeRun = { plan, startTimestamp: value.activeRun.startTimestamp }
    }
    let latestResult: SavedResult | null = null
    if (value.latestResult != null) {
      if (!object(value.latestResult)) return null
      const plan = readPlan(value.latestResult.plan)
      if (!plan) return null
      latestResult = readResult(value.latestResult.summary, plan)
      if (!latestResult) return null
    }
    return { version: 3, preferences, currentTicket, activeRun, latestResult }
  } catch { return null }
}

export function savePersistedState(state: PersistedStateV3, storage?: Pick<Storage, 'setItem'>) {
  try { (storage ?? localStorage).setItem(STORAGE_KEY, JSON.stringify(state)); return true } catch { return false }
}
