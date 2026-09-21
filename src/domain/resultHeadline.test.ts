import { generateWorkout } from './workout'
import { getResultHeadline } from './resultHeadline'
import type { ResultSummary } from './types'

function result(status: ResultSummary['status'], dateIso: string): ResultSummary {
  return {
    status,
    dateIso,
    elapsedSeconds: 900,
    plannedSeconds: 900,
    templateType: 'speed',
    blockCount: 3,
    intensitySeconds: { easy: 450, strong: 270, max: 90, recovery: 90 },
    maximumIncline: 2,
  }
}

describe('Given multiple workout sessions finish', () => {
  it('selects varied completion headlines that remain stable across reloads', () => {
    const headlines = Array.from({ length: 12 }, (_, index) => {
      const plan = generateWorkout({ durationMinutes: 15, includeWarmup: true, includeCooldown: true }, 1_000 + index)
      const summary = result('completed', new Date(Date.UTC(2026, 8, 21, 5, index)).toISOString())
      expect(getResultHeadline(plan, summary)).toBe(getResultHeadline(plan, summary))
      return getResultHeadline(plan, summary)
    })

    expect(new Set(headlines).size).toBeGreaterThan(2)
  })

  it('uses supportive rather than celebratory copy when a session ends early', () => {
    const plan = generateWorkout({ durationMinutes: 15, includeWarmup: true, includeCooldown: true }, 42)
    const completed = getResultHeadline(plan, result('completed', '2026-09-21T05:00:00.000Z'))
    const ended = getResultHeadline(plan, result('ended', '2026-09-21T05:00:00.000Z'))

    expect(ended).not.toBe(completed)
  })
})
