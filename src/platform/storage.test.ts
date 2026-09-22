import { generateWorkout } from '../domain/workout'
import { summarizeResult } from '../domain/summary'
import { DEFAULT_PREFERENCES, LEGACY_STORAGE_KEY, loadPersistedState, PREVIOUS_STORAGE_KEY, savePersistedState, STORAGE_KEY, type PersistedStateV3 } from './storage'

function memory() {
  const values = new Map<string, string>()
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}

const plan = generateWorkout(DEFAULT_PREFERENCES, 8192, 'hills')
const empty: PersistedStateV3 = { version: 3, preferences: DEFAULT_PREFERENCES, currentTicket: null, activeRun: null, latestResult: null }

describe('Given version 3 preferences and sessions', () => {
  it('round-trips a generated ticket, active run, and result', () => {
    const storage = memory()
    const summary = summarizeResult(plan, plan.effectiveDurationSeconds, 1800000000000)
    const state: PersistedStateV3 = {
      ...empty,
      currentTicket: plan,
      activeRun: { plan, startTimestamp: 1800000000000 },
      latestResult: { plan, summary },
    }
    expect(savePersistedState(state, storage)).toBe(true)
    expect(loadPersistedState(storage)).toEqual(state)
    expect(savePersistedState(empty, { setItem: () => { throw new Error('quota') } })).toBe(false)
  })

  it('normalizes recovery labels without changing interval identity', () => {
    const storage = memory()
    const savedPlan = structuredClone(plan)
    const recovery = savedPlan.blocks.find(block => block.kind === 'recovery')
    if (!recovery) throw new Error('Missing recovery block')
    recovery.label = 'Recovery · Next: Block 2'
    savePersistedState({ ...empty, currentTicket: savedPlan }, storage)
    const restored = loadPersistedState(storage)?.currentTicket
    expect(restored?.blocks.find(block => block.kind === 'recovery')?.label).toBe('Recovery')
    expect(restored?.blocks.flatMap(block => block.intervals.map(interval => interval.id))).toEqual(plan.blocks.flatMap(block => block.intervals.map(interval => interval.id)))
  })

  it('normalizes a saved cabinet theme to Track', () => {
    const storage = memory()
    savePersistedState({ ...empty, preferences: { ...DEFAULT_PREFERENCES, theme: 'neon' } }, storage)
    expect(loadPersistedState(storage)?.preferences.theme).toBe('track')
  })

  it('rejects malformed version 3 workout state', () => {
    const storage = memory()
    for (const value of [{ version: 99 }, { ...empty, activeRun: { plan, startTimestamp: 'tomorrow' } }, { ...empty, currentTicket: { ...plan, blocks: [] } }, { ...empty, currentTicket: { ...plan, id: 'wrong-request' } }]) {
      storage.setItem(STORAGE_KEY, JSON.stringify(value))
      expect(loadPersistedState(storage)).toBeNull()
    }
  })
})

describe('Given state from an older engine', () => {
  it('preserves compatible preferences while discarding tickets, runs, and results', () => {
    const storage = memory()
    const preferences = { durationMinutes: 45, includeWarmup: false, includeCooldown: true, theme: 'neon' }
    storage.setItem(PREVIOUS_STORAGE_KEY, JSON.stringify({ version: 2, preferences, currentTicket: { focus: 'mixed' }, activeRun: { plan: {} }, latestResult: { plan: {} } }))
    expect(loadPersistedState(storage)).toEqual({ version: 3, preferences: { ...preferences, theme: 'track' }, currentTicket: null, activeRun: null, latestResult: null })
  })

  it('can preserve a legacy cabinet theme without importing a legacy workout', () => {
    const storage = memory()
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ version: 1, theme: 'mono', currentTicket: { focus: 'endurance' } }))
    expect(loadPersistedState(storage)).toEqual({ version: 3, preferences: DEFAULT_PREFERENCES, currentTicket: null, activeRun: null, latestResult: null })
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
