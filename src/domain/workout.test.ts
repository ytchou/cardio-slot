import { COMPATIBILITY, DURATION_DEFINITIONS } from './config'
import { generateWorkout, WORKOUT_CONFIG } from './workout'
import { validateWorkout } from './validate'
import type { DurationMinutes } from './types'

const request = { durationMinutes: 15 as const, includeWarmup: true, includeCooldown: false }

describe('Given a runner chooses a total and bookends', () => {
  it('keeps the selected total and MAX recovery when cooldown is disabled', () => {
    const plan = generateWorkout(request, 10)
    expect(plan.effectiveDurationSeconds).toBe(900)
    for (const block of plan.blocks) for (const [index, interval] of block.intervals.entries()) {
      if (interval.intensity !== 'max') continue
      expect(block.intervals[index + 1]?.intensity).toBe('easy')
      expect(block.intervals[index + 1]?.durationSeconds).toBeGreaterThanOrEqual(interval.durationSeconds)
    }
  })

  it('constructs exact, contiguous, safe sessions across 8,000 deterministic pulls', () => {
    const seenPatterns = new Set<string>()
    const seenFinishes = new Set<string>()
    for (const durationMinutes of [15, 30, 45, 60] as DurationMinutes[]) {
      for (const includeWarmup of [false, true]) for (const includeCooldown of [false, true]) {
        for (let seed = 0; seed < 500; seed++) {
          const input = { durationMinutes, includeWarmup, includeCooldown }
          const plan = generateWorkout(input, seed)
          seenPatterns.add(plan.pattern)
          seenFinishes.add(plan.finish)
          expect(validateWorkout(plan)).toEqual([])
          const main = plan.blocks.filter(b => b.kind === 'main')
          const recovery = plan.blocks.filter(b => b.kind === 'recovery')
          expect(main.length).toBeGreaterThanOrEqual(DURATION_DEFINITIONS[durationMinutes].blockRange[0])
          expect(main.length).toBeLessThanOrEqual(DURATION_DEFINITIONS[durationMinutes].blockRange[1])
          expect(recovery).toHaveLength(main.length - 1)
          expect(plan.blocks.some(b => b.kind === 'warmup')).toBe(includeWarmup)
          expect(plan.blocks.some(b => b.kind === 'cooldown')).toBe(includeCooldown)
          let elapsed = 0
          let maxSeconds = 0
          for (const [phaseIndex, block] of plan.blocks.entries()) {
            const total = block.intervals.reduce((sum, i) => sum + i.durationSeconds, 0)
            if (block.kind === 'main') {
              expect(total).toBeGreaterThanOrEqual(120)
              expect(block.mainBlockIndex).toBe(main.indexOf(block) + 1)
            }
            if (block.kind === 'recovery') {
              expect(total).toBe(60)
              expect(plan.blocks[phaseIndex - 1]?.kind).toBe('main')
              expect(plan.blocks[phaseIndex + 1]?.mainBlockIndex).toBe(block.nextMainBlockIndex)
              expect(block.intervals).toHaveLength(1)
              expect(block.intervals.at(0)?.intensity).toBe('easy')
              expect(block.intervals.at(0)?.incline).toBe(1)
            }
            for (const [index, i] of block.intervals.entries()) {
              expect(i.startSeconds).toBe(elapsed)
              expect(i.durationSeconds).toBeGreaterThan(0)
              expect(i.durationSeconds % 30).toBe(0)
              expect(i.incline).toBeGreaterThanOrEqual(1)
              expect(i.incline).toBeLessThanOrEqual(8)
              elapsed += i.durationSeconds
              if (i.intensity === 'max') {
                maxSeconds += i.durationSeconds
                expect(i.durationSeconds).toBeGreaterThanOrEqual(30)
                expect(i.durationSeconds).toBeLessThanOrEqual(60)
                expect(i.incline).toBeLessThanOrEqual(2)
                expect(block.intervals[index + 1]?.intensity).toBe('easy')
                expect(block.intervals[index + 1]?.durationSeconds).toBeGreaterThanOrEqual(i.durationSeconds)
              }
            }
          }
          expect(elapsed).toBe(durationMinutes * 60)
          expect(maxSeconds).toBeLessThanOrEqual(elapsed / 10)
          expect(COMPATIBILITY[plan.focus].patterns).toContain(plan.pattern)
          expect(COMPATIBILITY[plan.focus].finishes).toContain(plan.finish)
        }
      }
    }
    expect(seenPatterns.size).toBe(5)
    expect(seenFinishes.size).toBe(4)
  }, 30_000)

  it('reproduces a request and uses a constructive fallback when recipes fail validation', () => {
    expect(generateWorkout(request, 4294967001)).toEqual(generateWorkout(request, 4294967001))
    const badRecipe = () => [{ intensity: 'strong' as const, incline: 99 }]
    const plan = generateWorkout(request, 47, { ...WORKOUT_CONFIG, recipeBuilders: { long: badRecipe, waves: badRecipe, ladder: badRecipe, repeats: badRecipe, progressive: badRecipe } })
    expect([plan.focus, plan.pattern, plan.finish]).toEqual(['endurance', 'long', 'steady'])
    expect(plan.blocks.flatMap(b => b.intervals).some(i => i.intensity === 'max')).toBe(false)
    expect(validateWorkout(plan)).toEqual([])
  })
})

describe('Given a corrupted timeline reaches final validation', () => {
  it('rejects zero, non-finite, out-of-order and foreign-block recovery intervals', () => {
    const original = generateWorkout(request, 10)
    for (const durationSeconds of [0, -30, Number.NaN, Number.POSITIVE_INFINITY]) {
      const plan = structuredClone(original)
      const interval = plan.blocks.at(0)?.intervals.at(0)
      if (!interval) throw new Error('Missing interval')
      interval.durationSeconds = durationSeconds
      expect(validateWorkout(plan).some(issue => issue.code === 'unit')).toBe(true)
    }
    const plan = structuredClone(original)
    const interval = plan.blocks.at(0)?.intervals.at(0)
    if (!interval) throw new Error('Missing interval')
    interval.startSeconds = 30
    expect(validateWorkout(plan).some(issue => issue.code === 'ordering')).toBe(true)
    const main = plan.blocks.find(block => block.kind === 'main')
    const burst = main?.intervals.at(-1)
    if (!main || !burst) throw new Error('Missing main interval')
    burst.intensity = 'max'
    burst.durationSeconds = 30
    burst.incline = 1
    expect(validateWorkout(plan).some(issue => issue.code === 'max-recovery')).toBe(true)
  })
})
