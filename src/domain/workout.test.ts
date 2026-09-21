import { DURATION_DEFINITIONS, TEMPLATE_MAX_RATIOS } from './config'
import { generateDifferentWorkout, generateWorkout } from './workout'
import { validateWorkout } from './validate'
import type { DurationMinutes, TemplateType, WorkoutPlan } from './types'

const templateTypes: TemplateType[] = ['endurance', 'hills', 'speed']

function intervals(plan: WorkoutPlan) {
  return plan.blocks.flatMap(block => block.intervals)
}

describe('Given a runner pulls one workout template', () => {
  it('constructs exact, deterministic sessions across every duration, bookend, and template', () => {
    for (const durationMinutes of [15, 30, 45, 60] as DurationMinutes[]) {
      for (const includeWarmup of [false, true]) for (const includeCooldown of [false, true]) {
        for (const templateType of templateTypes) for (let seed = 0; seed < 100; seed++) {
          const request = { durationMinutes, includeWarmup, includeCooldown }
          const plan = generateWorkout(request, seed, templateType)
          expect(plan).toEqual(generateWorkout(request, seed, templateType))
          expect(plan.generationVersion).toBe(3)
          expect(plan.templateType).toBe(templateType)
          expect(validateWorkout(plan)).toEqual([])

          const main = plan.blocks.filter(block => block.kind === 'main')
          const recoveries = plan.blocks.filter(block => block.kind === 'recovery')
          const range = DURATION_DEFINITIONS[durationMinutes].blockRanges[templateType]
          expect(main.length).toBeGreaterThanOrEqual(range[0])
          expect(main.length).toBeLessThanOrEqual(range[1])
          expect(recoveries).toHaveLength(main.length)
          expect(recoveries.every(block => block.intervals.length === 1 && block.intervals[0]?.intensity === 'recovery')).toBe(true)

          const timeline = intervals(plan)
          expect(timeline.reduce((total, interval) => total + interval.durationSeconds, 0)).toBe(durationMinutes * 60)
          expect(timeline.every(interval => interval.durationSeconds >= 30 && interval.durationSeconds % 15 === 0)).toBe(true)
          for (const [index, interval] of timeline.entries()) {
            if (interval.intensity !== 'max') continue
            expect(timeline[index + 1]?.intensity).toBe('recovery')
            expect(timeline[index + 1]?.durationSeconds).toBeGreaterThanOrEqual(interval.durationSeconds)
          }
          const maxSeconds = timeline.filter(interval => interval.intensity === 'max').reduce((total, interval) => total + interval.durationSeconds, 0)
          expect(maxSeconds).toBeLessThanOrEqual(durationMinutes * 60 * TEMPLATE_MAX_RATIOS[templateType])
        }
      }
    }
  }, 30_000)

  it('keeps each template recognizable through its hard construction rules', () => {
    for (const durationMinutes of [15, 30, 45, 60] as DurationMinutes[]) {
      const request = { durationMinutes, includeWarmup: true, includeCooldown: true }
      for (let seed = 0; seed < 100; seed++) {
        const endurance = generateWorkout(request, seed, 'endurance')
        const enduranceMain = endurance.blocks.filter(block => block.kind === 'main')
        expect(enduranceMain.flatMap(block => block.intervals).filter(interval => interval.intensity === 'max')).toHaveLength(1)
        expect(enduranceMain.at(-1)?.intervals.at(-1)?.intensity).toBe('max')
        expect(enduranceMain.slice(0, -1).flatMap(block => block.intervals).some(interval => interval.intensity === 'recovery')).toBe(false)
        expect(enduranceMain.flatMap(block => block.intervals).filter(interval => interval.intensity === 'strong').every(interval => interval.durationSeconds <= 180 && interval.incline <= 2)).toBe(true)

        const hills = generateWorkout(request, seed, 'hills')
        const hillsMain = hills.blocks.filter(block => block.kind === 'main')
        expect(hillsMain.every(block => block.intervals[0]?.intensity === 'easy' && block.intervals[0]?.incline === 1)).toBe(true)
        expect(hillsMain.flatMap(block => block.intervals).filter(interval => interval.intensity === 'strong').every(interval => interval.durationSeconds <= 120 && interval.incline <= 5)).toBe(true)
        for (const block of hillsMain) {
          const aboveFlat = block.intervals.filter(interval => interval.incline > 1).reduce((total, interval) => total + interval.durationSeconds, 0)
          const total = block.intervals.reduce((sum, interval) => sum + interval.durationSeconds, 0)
          expect(aboveFlat / total).toBeGreaterThanOrEqual(0.7)
          expect(aboveFlat / total).toBeLessThanOrEqual(0.85)
        }

        const speed = generateWorkout(request, seed, 'speed')
        const speedMain = speed.blocks.filter(block => block.kind === 'main')
        expect(speedMain.every(block => block.intervals.some(interval => interval.intensity === 'max'))).toBe(true)
        expect(speedMain.some(block => block.intervals.filter(interval => interval.intensity === 'max').length > 1)).toBe(true)
        expect(speedMain.some(block => block.intervals.some(interval => interval.intensity === 'strong'))).toBe(true)
        expect(speedMain.flatMap(block => block.intervals).filter(interval => interval.intensity === 'strong').every(interval => interval.durationSeconds <= 90 && interval.incline <= 2)).toBe(true)
      }
    }
  }, 20_000)

  it('selects all templates from the seeded pull and can move past a duplicate', () => {
    const request = { durationMinutes: 30 as const, includeWarmup: true, includeCooldown: true }
    const seen = new Set(Array.from({ length: 60 }, (_, seed) => generateWorkout(request, seed).templateType))
    expect(seen).toEqual(new Set(templateTypes))
    const completed = generateWorkout(request, 10)
    expect(generateDifferentWorkout(request, 10, completed)).not.toEqual(completed)
  })
})

describe('Given a corrupted timeline reaches final validation', () => {
  it('rejects invalid timing and missing recovery', () => {
    const original = generateWorkout({ durationMinutes: 30, includeWarmup: true, includeCooldown: true }, 10, 'speed')
    const malformed = structuredClone(original)
    const interval = malformed.blocks.at(0)?.intervals.at(0)
    if (!interval) throw new Error('Missing interval')
    interval.durationSeconds = 15
    expect(validateWorkout(malformed).some(issue => issue.code === 'unit')).toBe(true)

    const missingRecovery = structuredClone(original)
    const timeline = missingRecovery.blocks.flatMap(block => block.intervals)
    const maxIndex = timeline.findIndex(interval => interval.intensity === 'max')
    const recovery = timeline[maxIndex + 1]
    if (!recovery) throw new Error('Missing recovery')
    recovery.intensity = 'easy'
    expect(validateWorkout(missingRecovery).some(issue => issue.code === 'max-recovery')).toBe(true)
  })
})
