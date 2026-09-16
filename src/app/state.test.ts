import { generateWorkout } from '../domain/workout'
import { appReducer, createInitialState, toPersistedState } from './state'

describe('Given the workout app is resumed or advanced', () => {
  const plan = generateWorkout(15, 123_456)
  const start = Date.UTC(2026, 8, 17, 8, 0, 0)

  it('restores an active run and catches up from its absolute timestamp', () => {
    const saved = { version: 1 as const, theme: 'track' as const, currentTicket: plan, activeRun: { plan, startTimestamp: start }, latestResult: null }
    const restored = createInitialState(saved, start + 600_000)
    expect(restored.flow).toBe('running')
    expect(appReducer(restored, { type: 'tick', timestamp: start + 600_000 }).flow).toBe('running')
    const completed = appReducer(restored, { type: 'tick', timestamp: start + plan.effectiveDurationSeconds * 1000 + 1 })
    expect(completed.flow).toBe('result')
    expect(completed.latestResult?.status).toBe('completed')
  })

  it('persists only the versioned durable state', () => {
    const state = createInitialState(null, start)
    const ticket = appReducer(appReducer(state, { type: 'pull', plan }), { type: 'reveal' })
    const running = appReducer(ticket, { type: 'start-run', timestamp: start })
    expect(toPersistedState(running)).toEqual({
      version: 1,
      theme: 'track',
      currentTicket: plan,
      activeRun: { plan, startTimestamp: start },
      latestResult: null,
    })
  })

  it('keeps an active workout when the home action is triggered accidentally', () => {
    const state = createInitialState(null, start)
    const ticket = appReducer(appReducer(state, { type: 'pull', plan }), { type: 'reveal' })
    const running = appReducer(ticket, { type: 'start-run', timestamp: start })
    expect(appReducer(running, { type: 'new-workout' })).toBe(running)
  })
})
