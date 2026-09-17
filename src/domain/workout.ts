import { COMPATIBILITY, DURATION_DEFINITIONS, SAFETY_RULES, type DurationDefinition } from './config'
import { createRandom, pick } from './random'
import { RECIPE_BUILDERS, type RecipeBuilder, type RecipeFrame } from './recipes'
import type { DurationMinutes, FinishId, FocusId, PatternId, WorkoutBlock, WorkoutInterval, WorkoutPlan, WorkoutRequest } from './types'
import { validateWorkout } from './validate'

function distributeUnits(total: number, count: number) {
  const minimum = Math.floor(total / count)
  const remainder = total % count
  return Array.from({ length: count }, (_, index) => minimum + (index < remainder ? 1 : 0))
}

export interface WorkoutGenerationConfig {
  durations: Record<DurationMinutes, DurationDefinition>
  compatibility: typeof COMPATIBILITY
  recipeBuilders: Record<PatternId, RecipeBuilder>
}

export const WORKOUT_CONFIG: WorkoutGenerationConfig = {
  durations: DURATION_DEFINITIONS,
  compatibility: COMPATIBILITY,
  recipeBuilders: RECIPE_BUILDERS,
}

function framesToIntervals(frames: RecipeFrame[], blockId: string, startSeconds: number, idPrefix: string, unitSeconds: number): WorkoutInterval[] {
  const intervals: WorkoutInterval[] = []
  for (const frame of frames) {
    const previous = intervals.at(-1)
    if (previous && previous.intensity === frame.intensity && previous.incline === frame.incline) {
      previous.durationSeconds += unitSeconds
      continue
    }
    const offset = intervals.reduce((total, interval) => total + interval.durationSeconds, 0)
    intervals.push({
      id: `${idPrefix}-${intervals.length + 1}`,
      blockId,
      intensity: frame.intensity,
      incline: frame.incline,
      startSeconds: startSeconds + offset,
      durationSeconds: unitSeconds,
      cue: frame.intensity === 'easy' ? 'Settle and recover' : frame.intensity === 'strong' ? 'Build a controlled effort' : 'Quick, powerful effort',
    })
  }
  return intervals
}

function applyFinish(frames: RecipeFrame[], finish: FinishId) {
  if (finish === 'fast-close') {
    for (let index = Math.max(0, frames.length - 4); index < frames.length; index += 1) {
      const frame = frames[index]
      if (frame) Object.assign(frame, { intensity: 'strong' as const, incline: Math.min(frame.incline, 4) })
    }
  }
  if (finish === 'climb') {
    for (let index = Math.max(0, frames.length - 4); index < frames.length; index += 1) {
      const frame = frames[index]
      if (frame) Object.assign(frame, { intensity: 'strong' as const, incline: Math.min(8, 5 + index - Math.max(0, frames.length - 4)) })
    }
  }
}

function createPlan(request: WorkoutRequest, seed: number, focus: FocusId, pattern: PatternId, finish: FinishId, config: WorkoutGenerationConfig, fallback = false): WorkoutPlan {
  const random = createRandom(seed)
  const definition = config.durations[request.durationMinutes]
  const bookendSeconds = definition.bookendMinutes * 60
  const enabledBookends = Number(request.includeWarmup) + Number(request.includeCooldown)
  const available = request.durationMinutes * 60 - enabledBookends * bookendSeconds
  const feasible = Array.from({ length: definition.blockRange[1] - definition.blockRange[0] + 1 }, (_, index) => definition.blockRange[0] + index)
    .filter(count => available - (count - 1) * 60 >= count * 120)
  if (!feasible.length) throw new Error('No feasible main block count')
  const blockCount = pick(feasible, random)
  const blockUnits = distributeUnits((available - (blockCount - 1) * 60) / 30, blockCount)
  const blocks: WorkoutBlock[] = []
  let offset = 0
  const addEasy = (kind: 'warmup' | 'recovery' | 'cooldown', seconds: number, nextMainBlockIndex?: number) => {
    const id = kind === 'recovery' ? `recovery-${nextMainBlockIndex}` : kind
    const label = kind === 'warmup' ? 'Warm-up' : kind === 'cooldown' ? 'Cool-down' : `Recovery · Next: Block ${nextMainBlockIndex} of ${blockCount}`
    blocks.push({ id, kind, label, ...(nextMainBlockIndex ? { nextMainBlockIndex } : {}), intervals: [{
      id: `${id}-1`, blockId: id, intensity: 'easy', incline: 1, startSeconds: offset, durationSeconds: seconds,
      cue: kind === 'warmup' ? 'Ease in and find your stride' : kind === 'cooldown' ? 'Walk it down and breathe' : 'Recover and prepare for the next block',
      ...(kind === 'recovery' ? {} : { bookend: kind }),
    }] })
    offset += seconds
  }
  if (request.includeWarmup) addEasy('warmup', bookendSeconds)
  let maxBudget = Math.floor(request.durationMinutes * 60 * SAFETY_RULES.maxEffortRatio / 30)
  for (const [index, units] of blockUnits.entries()) {
    const frames: RecipeFrame[] = fallback
      ? Array.from({ length: units }, (_, frame) => ({ intensity: frame < 2 || frame >= units - 2 ? 'easy' : 'strong', incline: 1 }))
      : config.recipeBuilders[pattern]({ units, focus, blockIndex: index, blockCount }).map(frame => ({ ...frame }))
    const final = index === blockCount - 1
    if (final) applyFinish(frames, finish)
    const wantsMax = !fallback && (finish === 'sprint' ? final : (focus === 'speed' || focus === 'mixed') && index === 0)
    if (wantsMax && maxBudget > 0 && frames.length >= 4) {
      const length = Math.min(maxBudget, random() > 0.45 ? 2 : 1, Math.floor(frames.length / 2))
      const start = final && finish === 'sprint' ? frames.length - length * 2 : Math.min(2, frames.length - length * 2)
      for (let i = start; i < start + length * 2; i++) {
        const frame = frames[i]
        if (frame) Object.assign(frame, { intensity: i < start + length ? 'max' : 'easy', incline: 1 })
      }
      maxBudget -= length
    }
    const id = `block-${index + 1}`
    blocks.push({ id, kind: 'main', mainBlockIndex: index + 1, label: `Block ${index + 1} of ${blockCount}`, intervals: framesToIntervals(frames, id, offset, id, 30) })
    offset += frames.length * 30
    if (!final) addEasy('recovery', 60, index + 2)
  }
  if (request.includeCooldown) addEasy('cooldown', bookendSeconds)
  return {
    durationMinutes: request.durationMinutes, includeWarmup: request.includeWarmup, includeCooldown: request.includeCooldown, id: `v2-${request.durationMinutes}-${Number(request.includeWarmup)}${Number(request.includeCooldown)}-${seed >>> 0}`,
    seed: seed >>> 0, generationVersion: 2, effectiveDurationSeconds: request.durationMinutes * 60,
    focus, pattern, finish, blocks,
  }
}

export function generateWorkout(request: WorkoutRequest, seed: number, config: WorkoutGenerationConfig = WORKOUT_CONFIG): WorkoutPlan {
  for (let attempt = 0; attempt < SAFETY_RULES.generationAttempts; attempt++) {
    const random = createRandom((seed + Math.imul(attempt, 0x9e3779b1)) >>> 0)
    const focus = pick(Object.keys(config.compatibility) as FocusId[], random)
    const pattern = pick(config.compatibility[focus].patterns, random)
    const finish = pick(config.compatibility[focus].finishes, random)
    const plan = createPlan(request, seed, focus, pattern, finish, config)
    if (!validateWorkout(plan, SAFETY_RULES, config).length) return plan
  }
  const fallback = createPlan(request, seed, 'endurance', 'long', 'steady', WORKOUT_CONFIG, true)
  const issues = validateWorkout(fallback)
  if (issues.length) throw new Error(`Safe workout generation failed: ${issues.map(issue => issue.code).join(', ')}`)
  return fallback
}
