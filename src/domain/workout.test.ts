import { COMPATIBILITY, DURATION_DEFINITIONS } from './config'
import { RECIPE_BUILDERS } from './recipes'
import { generateWorkout, getEffectiveIntervals, withBookendPreference } from './workout'
import { validateWorkout } from './validate'
import type { DurationMinutes, PatternId } from './types'

describe('Given a runner pulls a workout ticket', () => {
  it('reproduces the same workout from the same seed', () => {
    expect(generateWorkout(30, 4_294_967_001)).toEqual(generateWorkout(30, 4_294_967_001))
  })

  it('has a recipe and compatible result for every registered reel value', () => {
    const compatiblePatterns = new Set(Object.values(COMPATIBILITY).flatMap((entry) => entry.patterns))
    expect(new Set(Object.keys(RECIPE_BUILDERS))).toEqual(new Set<PatternId>(compatiblePatterns))
    for (const entry of Object.values(COMPATIBILITY)) {
      expect(entry.patterns.length).toBeGreaterThan(0)
      expect(entry.finishes.length).toBeGreaterThan(0)
    }
  })

  it('keeps every duration safe across a large deterministic seed set', () => {
    for (const duration of Object.keys(DURATION_DEFINITIONS).map(Number) as DurationMinutes[]) {
      for (let seed = 0; seed < 500; seed += 1) {
        const plan = generateWorkout(duration, seed * 7_919 + 17)
        expect(validateWorkout(plan), `${duration} minutes, seed ${seed}`).toEqual([])
      }
    }
  })

  it('removes either bookend without changing the generated main workout', () => {
    const plan = generateWorkout(30, 2_026)
    const mainBefore = plan.blocks.filter((block) => block.kind === 'main')
    const withoutWarmup = withBookendPreference(plan, 'warmup', false)
    const withoutCooldown = withBookendPreference(plan, 'cooldown', false)

    expect(withoutWarmup.blocks.filter((block) => block.kind === 'main')).toEqual(mainBefore)
    expect(withoutCooldown.blocks.filter((block) => block.kind === 'main')).toEqual(mainBefore)
    expect(getEffectiveIntervals(withoutWarmup)[0]?.bookend).not.toBe('warmup')
    expect(getEffectiveIntervals(withoutCooldown).at(-1)?.bookend).not.toBe('cooldown')
    expect(withoutWarmup.effectiveDurationSeconds).toBe(plan.effectiveDurationSeconds - 180)
    expect(withoutCooldown.effectiveDurationSeconds).toBe(plan.effectiveDurationSeconds - 180)
  })
})

