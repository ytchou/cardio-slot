import { generateWorkout } from '../domain/workout'
import { summarizeResult } from '../domain/summary'
import { DEFAULT_PREFERENCES, LEGACY_STORAGE_KEY, loadPersistedState, savePersistedState, STORAGE_KEY, type PersistedStateV2 } from './storage'

function memory() {
  const values = new Map<string, string>()
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}
const plan = generateWorkout(DEFAULT_PREFERENCES, 8192)
const empty: PersistedStateV2 = { version: 2, preferences: DEFAULT_PREFERENCES, currentTicket: null, activeRun: null, latestResult: null }

describe('Given saved preferences and sessions', () => {
  it('round-trips preferences independently from a ticket and handles write failures', () => {
    const storage = memory()
    expect(savePersistedState(empty, storage)).toBe(true)
    expect(loadPersistedState(storage)).toEqual(empty)
    expect(savePersistedState(empty, { setItem: () => { throw new Error('quota') } })).toBe(false)
  })
  it('rejects malformed and unknown envelopes without falling back to legacy data', () => {
    const storage = memory()
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ version: 1, theme: 'track' }))
    for (const value of [{ version: 99 }, { ...empty, activeRun: { plan, startTimestamp: 'tomorrow' } }, { ...empty, currentTicket: { ...plan, blocks: [] } }, { ...empty, currentTicket: { ...plan, effectiveDurationSeconds: 0 } }, { ...empty, currentTicket: { ...plan, durationMinutes: '30' } }, { ...empty, currentTicket: { ...plan, id: 'wrong-request' } }]) {
      storage.setItem(STORAGE_KEY, JSON.stringify(value))
      expect(loadPersistedState(storage)).toBeNull()
    }
  })
  it('imports legacy active timing and results but discards unstarted previews', () => {
    const storage = memory()
    const legacyPlan = {
      id: '15-8192', seed: 8192, durationMinutes: 15, plannedDurationSeconds: 900, effectiveDurationSeconds: 780,
      focus: 'endurance', pattern: 'long', finish: 'steady', includeWarmup: true, includeCooldown: false,
      blocks: [
        { id: 'warmup', label: 'Warm-up', kind: 'warmup', intervals: [{ id: 'warmup-1', blockId: 'warmup', intensity: 'easy', incline: 1, startSeconds: 0, durationSeconds: 120, cue: 'Ease in', bookend: 'warmup' }] },
        { id: 'block-1', label: 'Block 1', kind: 'main', intervals: [{ id: 'block-1-1', blockId: 'block-1', intensity: 'strong', incline: 2, startSeconds: 120, durationSeconds: 330, cue: 'Controlled effort' }] },
        { id: 'block-2', label: 'Block 2', kind: 'main', intervals: [{ id: 'block-2-1', blockId: 'block-2', intensity: 'easy', incline: 1, startSeconds: 450, durationSeconds: 330, cue: 'Recover' }] },
        { id: 'cooldown', label: 'Cool-down', kind: 'cooldown', intervals: [{ id: 'cooldown-1', blockId: 'cooldown', intensity: 'easy', incline: 1, startSeconds: 780, durationSeconds: 120, cue: 'Walk it down', bookend: 'cooldown' }] },
      ],
    }
    const total = 780
    const legacy = { version: 1, theme: 'neon', currentTicket: legacyPlan, activeRun: { plan: legacyPlan, startTimestamp: 1800000000000 }, latestResult: null }
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacy))
    const imported = loadPersistedState(storage)
    expect(imported?.activeRun?.plan.effectiveDurationSeconds).toBe(total)
    expect(imported?.activeRun?.plan.generationVersion).toBe(1)
    expect(imported?.activeRun?.plan.blocks.some(block => block.kind === 'recovery')).toBe(false)
    expect(imported?.currentTicket).toBeNull()
    const importedPlan = imported?.activeRun?.plan
    if (!importedPlan) throw new Error('Missing imported run')
    const summary = summarizeResult(importedPlan, 187, 1800000187000)
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ ...legacy, activeRun: null, latestResult: summary }))
    expect(loadPersistedState(storage)?.latestResult?.summary).toEqual(summary)
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ ...legacy, activeRun: null }))
    expect(loadPersistedState(storage)?.currentTicket).toBeNull()
    const malformed = structuredClone(legacy)
    const malformedInterval = malformed.activeRun.plan.blocks.at(0)?.intervals.at(0)
    if (malformedInterval) malformedInterval.startSeconds = 30
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(malformed))
    expect(loadPersistedState(storage)).toBeNull()
    savePersistedState(empty, storage)
    expect(loadPersistedState(storage)).toEqual(empty)
  })
})

describe('Given browser policy blocks access to local storage', () => {
  it('keeps loading and saving non-throwing when the storage getter itself fails', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new DOMException('Storage blocked', 'SecurityError') } })
    try {
      expect(loadPersistedState()).toBeNull()
      expect(savePersistedState(empty)).toBe(false)
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
    }
  })
})
