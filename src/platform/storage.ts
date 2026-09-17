import { COMPATIBILITY, DURATION_DEFINITIONS, FINISH_LABELS, FOCUS_LABELS, PATTERN_LABELS, THEMES } from '../domain/config'
import { summarizeResult } from '../domain/summary'
import type { Preferences, ResultSummary, RunRecord, WorkoutPlan } from '../domain/types'
import { validateWorkout } from '../domain/validate'

export const STORAGE_KEY = 'cardio-slot-state-v2'
export const LEGACY_STORAGE_KEY = 'cardio-slot-state'
export const DEFAULT_PREFERENCES: Preferences = { durationMinutes: 30, includeWarmup: true, includeCooldown: true, theme: 'track', motion: true }
export interface SavedResult { plan: WorkoutPlan; summary: ResultSummary }
export interface PersistedStateV2 {
  version: 2
  preferences: Preferences
  currentTicket: WorkoutPlan | null
  activeRun: RunRecord | null
  latestResult: SavedResult | null
}

function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) }
function registered(value: unknown, registry: object): value is string { return typeof value === 'string' && Object.hasOwn(registry, value) }

function readPlan(value: unknown, legacy = false): WorkoutPlan | null {
  if (!object(value) || !finite(value.durationMinutes) || !registered(String(value.durationMinutes), DURATION_DEFINITIONS) ||
      !finite(value.seed) || !Number.isInteger(value.seed) || value.seed < 0 || value.seed > 0xffffffff ||
      typeof value.id !== 'string' || !value.id || !finite(value.effectiveDurationSeconds) || value.effectiveDurationSeconds <= 0 ||
      typeof value.includeWarmup !== 'boolean' || typeof value.includeCooldown !== 'boolean' ||
      !registered(value.focus, FOCUS_LABELS) || !registered(value.pattern, PATTERN_LABELS) || !registered(value.finish, FINISH_LABELS) ||
      !Array.isArray(value.blocks) || !value.blocks.length || value.blocks.length > 32 ||
      (!legacy && value.generationVersion !== 1 && value.generationVersion !== 2)) return null
  const blocks = []
  let offset = 0
  let mainIndex = 0
  let originalOffset = 0
  for (const raw of value.blocks) {
    if (!object(raw) || typeof raw.id !== 'string' || typeof raw.label !== 'string' ||
        !['warmup', 'main', 'recovery', 'cooldown'].includes(String(raw.kind)) || !Array.isArray(raw.intervals) || !raw.intervals.length || raw.intervals.length > 240) return null
    for (const interval of raw.intervals) {
      if (!object(interval) || typeof interval.id !== 'string' || interval.blockId !== raw.id ||
          !['easy', 'strong', 'max'].includes(String(interval.intensity)) || !finite(interval.incline) || interval.incline < 1 || interval.incline > 8 ||
          !finite(interval.durationSeconds) || interval.durationSeconds <= 0 || interval.durationSeconds % 30 !== 0 ||
          !finite(interval.startSeconds) || interval.startSeconds < 0 || typeof interval.cue !== 'string') return null
      if (legacy && interval.startSeconds !== originalOffset) return null
      originalOffset += interval.durationSeconds
    }
    if (legacy && ((raw.kind === 'warmup' && !value.includeWarmup) || (raw.kind === 'cooldown' && !value.includeCooldown))) continue
    const block = structuredClone(raw) as unknown as WorkoutPlan['blocks'][number]
    if (block.kind === 'main') {
      mainIndex++
      if (legacy) { block.mainBlockIndex = mainIndex; block.label = `Block ${mainIndex}` }
    }
    for (const interval of block.intervals) {
      if (legacy) interval.startSeconds = offset
      if (interval.startSeconds !== offset) return null
      offset += interval.durationSeconds
    }
    blocks.push(block)
  }
  if (legacy && (originalOffset !== value.durationMinutes * 60 || value.plannedDurationSeconds !== originalOffset)) return null
  if (offset !== value.effectiveDurationSeconds || offset > Number(value.durationMinutes) * 60 || !mainIndex) return null
  const plan = { id: value.id, seed: value.seed, durationMinutes: value.durationMinutes, includeWarmup: value.includeWarmup, includeCooldown: value.includeCooldown, effectiveDurationSeconds: value.effectiveDurationSeconds, focus: value.focus, pattern: value.pattern, finish: value.finish, blocks, generationVersion: legacy ? 1 : value.generationVersion } as WorkoutPlan
  if (plan.generationVersion === 2 && plan.id !== `v2-${plan.durationMinutes}-${Number(plan.includeWarmup)}${Number(plan.includeCooldown)}-${plan.seed}`) return null
  const compatibility = COMPATIBILITY[plan.focus]
  if (!compatibility.patterns.includes(plan.pattern) || !compatibility.finishes.includes(plan.finish)) return null
  if (plan.generationVersion === 2 && validateWorkout(plan).length) return null
  return plan
}

function readResult(value: unknown, plan: WorkoutPlan): SavedResult | null {
  if (!object(value) || !finite(value.elapsedSeconds) || value.elapsedSeconds < 0 || value.elapsedSeconds > plan.effectiveDurationSeconds ||
      typeof value.dateIso !== 'string' || !Number.isFinite(Date.parse(value.dateIso))) return null
  const summary = summarizeResult(plan, value.elapsedSeconds, Date.parse(value.dateIso))
  if (value.status !== summary.status || value.plannedSeconds !== summary.plannedSeconds || value.focus !== plan.focus || value.pattern !== plan.pattern || value.finish !== plan.finish ||
      value.blockCount !== summary.blockCount || value.maximumIncline !== summary.maximumIncline || !object(value.intensitySeconds) ||
      (['easy', 'strong', 'max'] as const).some(intensity => value.intensitySeconds && (value.intensitySeconds as Record<string, unknown>)[intensity] !== summary.intensitySeconds[intensity])) return null
  return { plan, summary }
}

export function loadPersistedState(storage?: Pick<Storage, 'getItem'>): PersistedStateV2 | null {
  try {
    storage ??= localStorage
    const current = storage.getItem(STORAGE_KEY)
    const raw = current ?? storage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (!object(value)) return null
    const legacy = current === null && value.version === 1
    if (!legacy && value.version !== 2) return null
    let preferences = { ...DEFAULT_PREFERENCES }
    if (legacy) {
      if (registered(value.theme, THEMES)) preferences.theme = value.theme as Preferences['theme']
    } else {
      const p = value.preferences
      if (!object(p) || !finite(p.durationMinutes) || !registered(String(p.durationMinutes), DURATION_DEFINITIONS) ||
          !registered(p.theme, THEMES) || typeof p.motion !== 'boolean' || typeof p.includeWarmup !== 'boolean' || typeof p.includeCooldown !== 'boolean') return null
      preferences = p as unknown as Preferences
    }
    let activeRun: RunRecord | null = null
    if (value.activeRun != null) {
      if (!object(value.activeRun) || !finite(value.activeRun.startTimestamp) || !Number.isFinite(new Date(value.activeRun.startTimestamp).getTime())) return null
      const plan = readPlan(value.activeRun.plan, legacy)
      if (!plan) return null
      activeRun = { plan, startTimestamp: value.activeRun.startTimestamp }
    }
    let latestResult: SavedResult | null = null
    if (value.latestResult != null) {
      const source = legacy ? value.currentTicket : object(value.latestResult) ? value.latestResult.plan : null
      const plan = readPlan(source, legacy)
      if (!plan) return null
      latestResult = readResult(legacy ? value.latestResult : (value.latestResult as Record<string, unknown>).summary, plan)
      if (!latestResult) return null
    }
    const currentTicket = legacy || value.currentTicket == null ? null : readPlan(value.currentTicket)
    if (!legacy && value.currentTicket != null && (!currentTicket || currentTicket.generationVersion !== 2 ||
        currentTicket.durationMinutes !== preferences.durationMinutes || currentTicket.includeWarmup !== preferences.includeWarmup || currentTicket.includeCooldown !== preferences.includeCooldown)) return null
    return { version: 2, preferences, currentTicket, activeRun, latestResult }
  } catch { return null }
}

export function savePersistedState(state: PersistedStateV2, storage?: Pick<Storage, 'setItem'>) {
  try { (storage ?? localStorage).setItem(STORAGE_KEY, JSON.stringify(state)); return true } catch { return false }
}
