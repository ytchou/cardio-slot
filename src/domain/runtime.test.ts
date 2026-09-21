import { getIntervalTransition, getRunSnapshot } from './runtime'
import { summarizeResult } from './summary'
import { generateWorkout } from './workout'

describe('Given a workout is running from an absolute start time', () => {
  const plan = generateWorkout({ durationMinutes: 15, includeWarmup: true, includeCooldown: true }, 86_753)
  const start = Date.UTC(2026, 8, 17, 5, 0, 0)

  it('jumps directly to the correct interval after background throttling or reload', () => {
    const snapshot = getRunSnapshot(plan, start, start + 8 * 60_000 + 15_000)
    expect(snapshot.elapsedSeconds).toBe(495)
    expect(snapshot.currentInterval?.startSeconds).toBeLessThanOrEqual(495)
    expect((snapshot.currentInterval?.startSeconds ?? 0) + (snapshot.currentInterval?.durationSeconds ?? 0)).toBeGreaterThan(495)
  })

  it('announces only the current interval instead of replaying missed cues', () => {
    const snapshot = getRunSnapshot(plan, start, start + 8 * 60_000)
    const transition = getIntervalTransition(snapshot, null, 'resume', 'session-one')
    expect(transition?.interval.id).toBe(snapshot.currentInterval?.id)
    expect(transition?.reason).toBe('resume')
    expect(getIntervalTransition(snapshot, transition?.identity ?? null, 'tick', 'session-one')).toBeNull()
    expect(getIntervalTransition(snapshot, transition?.identity ?? null, 'tick', 'session-two')?.interval.id).toBe(snapshot.currentInterval?.id)
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

describe('Given exact phase and incline boundaries', () => {
  it('keeps the old interval until the boundary then advances directly to the next phase', () => {
    const plan = generateWorkout({ durationMinutes: 15, includeWarmup: true, includeCooldown: false }, 10)
    const intervals = plan.blocks.flatMap(block => block.intervals)
    for (const interval of intervals.slice(1)) {
      const before = getRunSnapshot(plan, 0, interval.startSeconds * 1000 - 1)
      const at = getRunSnapshot(plan, 0, interval.startSeconds * 1000)
      expect(before.currentInterval?.id).not.toBe(interval.id)
      expect(at.currentInterval?.id).toBe(interval.id)
      expect(at.intervalRemainingSeconds).toBe(interval.durationSeconds)
      const phase = plan.blocks.find(block => block.id === interval.blockId)
      expect(at.phaseLabel).toBe(phase?.label)
    }
    const recovery = plan.blocks.find(block => block.kind === 'recovery')?.intervals.at(0)
    if (!recovery) throw new Error('Missing recovery')
    const summary = summarizeResult(plan, recovery.startSeconds + 37, 1800000000000)
    const before = summarizeResult(plan, recovery.startSeconds, 1800000000000)
    expect(summary.intensitySeconds.recovery - before.intensitySeconds.recovery).toBe(37)
  })
})
