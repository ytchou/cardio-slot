import { generateWorkout } from '../domain/workout'
import { appReducer, createInitialState, toPersistedState } from './state'

const plan = generateWorkout({ durationMinutes: 15, includeWarmup: true, includeCooldown: true }, 123456)
const start = Date.UTC(2026, 8, 17, 8)
function ticket() {
  return appReducer(appReducer(createInitialState(null, start), { type: 'pull', plan, requestId: 1 }), { type: 'sequence', flow: 'ticket', requestId: 1 })
}

describe('Given a runner configures and resumes a session', () => {
  it('starts clean after a reload instead of restoring an unstarted ticket', () => {
    const beforeReload = ticket()
    const restored = createInitialState(toPersistedState(beforeReload), start)
    expect(restored.flow).toBe('configure')
    expect(restored.currentTicket).toBeNull()
    expect(restored.preferences).toEqual(beforeReload.preferences)
  })
  it('invalidates a ticket on timing edits permanently while cabinet skin edits preserve it', () => {
    const initial = ticket()
    const skin = appReducer(initial, { type: 'preferences', patch: { theme: 'neon' } })
    expect(skin.currentTicket).toBe(plan)
    const changed = appReducer(skin, { type: 'preferences', patch: { includeCooldown: false } })
    expect(changed.currentTicket).toBeNull()
    expect(appReducer(changed, { type: 'preferences', patch: { includeCooldown: true } }).currentTicket).toBeNull()
  })
  it('rejects duplicate pulls, stale completions, and configuration during mechanics', () => {
    const spinning = appReducer(createInitialState(null), { type: 'pull', plan, requestId: 4 })
    expect(appReducer(spinning, { type: 'pull', plan, requestId: 5 })).toBe(spinning)
    expect(appReducer(spinning, { type: 'sequence', flow: 'ticket', requestId: 3 })).toBe(spinning)
    expect(appReducer(spinning, { type: 'preferences', patch: { durationMinutes: 60 } })).toBe(spinning)
    expect(appReducer(spinning, { type: 'sequence', flow: 'ticket', requestId: 4 }).flow).toBe('ticket')
  })
  it('persists the future start so countdown and running reload keep their position', () => {
    const countdown = appReducer(ticket(), { type: 'start-countdown', timestamp: start })
    expect(countdown.activeRun?.startTimestamp).toBe(start + 5000)
    expect(createInitialState(toPersistedState(countdown), start + 2000).flow).toBe('countdown')
    const resumed = createInitialState(toPersistedState(countdown), start + 65000)
    expect(resumed.flow).toBe('running')
    expect(resumed.activeRun?.startTimestamp).toBe(start + 5000)
    expect(toPersistedState(appReducer(resumed, { type: 'tick', timestamp: start + 66000 }))).toEqual(toPersistedState(resumed))
    expect(appReducer(resumed, { type: 'new-workout' })).toBe(resumed)
  })
  it('uses the scheduled endpoint when natural completion wins an end confirmation race', () => {
    const countdown = appReducer(ticket(), { type: 'start-countdown', timestamp: start })
    const running = appReducer(countdown, { type: 'tick', timestamp: start + 6000 })
    const confirming = appReducer(running, { type: 'request-end' })
    const ended = appReducer(confirming, { type: 'end-run', timestamp: start + 1000000 })
    expect(ended.latestResult?.summary.status).toBe('completed')
    expect(ended.latestResult?.summary.dateIso).toBe(new Date(start + 905000).toISOString())
    expect(ended.latestResult?.plan).toBe(plan)
    expect(ended.confirmEnd).toBe(false)
  })
})
