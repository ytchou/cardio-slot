import { loadPersistedState, savePersistedState, STORAGE_KEY } from './storage'

describe('Given saved workout state from the browser', () => {
  it('discards unknown schema versions safely', () => {
    const storage = { getItem: () => JSON.stringify({ version: 99, activeRun: { unsafe: true } }) }
    expect(loadPersistedState(storage)).toBeNull()
  })

  it('round-trips the supported state envelope', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }
    const state = { version: 1 as const, theme: 'neon' as const, currentTicket: null, activeRun: null, latestResult: null }
    expect(savePersistedState(state, storage)).toBe(true)
    expect(values.has(STORAGE_KEY)).toBe(true)
    expect(loadPersistedState(storage)).toEqual(state)
  })
})
