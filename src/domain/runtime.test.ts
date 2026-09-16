import { getIntervalTransition, getRunSnapshot } from './runtime'
import { summarizeResult } from './summary'
import { generateWorkout } from './workout'

describe('Given a workout is running from an absolute start time', () => {
  const plan = generateWorkout(15, 86_753)
  const start = Date.UTC(2026, 8, 17, 5, 0, 0)

  it('jumps directly to the correct interval after background throttling or reload', () => {
    const snapshot = getRunSnapshot(plan, start, start + 8 * 60_000 + 15_000)
    expect(snapshot.elapsedSeconds).toBe(495)
    expect(snapshot.currentInterval?.startSeconds).toBeLessThanOrEqual(495)
    expect((snapshot.currentInterval?.startSeconds ?? 0) + (snapshot.currentInterval?.durationSeconds ?? 0)).toBeGreaterThan(495)
  })

  it('announces only the current interval instead of replaying missed cues', () => {
    const snapshot = getRunSnapshot(plan, start, start + 8 * 60_000)
    const transition = getIntervalTransition(snapshot, null, 'resume')
    expect(transition?.interval.id).toBe(snapshot.currentInterval?.id)
    expect(transition?.reason).toBe('resume')
    expect(getIntervalTransition(snapshot, transition?.interval.id ?? null, 'tick')).toBeNull()
  })

  it('calculates accurate natural and early result summaries', () => {
    const complete = summarizeResult(plan, plan.effectiveDurationSeconds, start + plan.effectiveDurationSeconds * 1000)
    const early = summarizeResult(plan, 187, start + 187_000)
    expect(complete.status).toBe('completed')
    expect(Object.values(complete.intensitySeconds).reduce((total, value) => total + value, 0)).toBe(plan.effectiveDurationSeconds)
    expect(early.status).toBe('ended')
    expect(Object.values(early.intensitySeconds).reduce((total, value) => total + value, 0)).toBe(187)
  })
})
