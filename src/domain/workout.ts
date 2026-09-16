import { COMPATIBILITY, DURATION_DEFINITIONS, SAFETY_RULES } from './config'
import { createRandom, pick, randomInteger } from './random'
import { RECIPE_BUILDERS, type RecipeFrame } from './recipes'
import type { DurationMinutes, FinishId, FocusId, PatternId, WorkoutBlock, WorkoutInterval, WorkoutPlan } from './types'
import { validateWorkout } from './validate'

function distributeUnits(total: number, count: number) {
  const minimum = Math.floor(total / count)
  const remainder = total % count
  return Array.from({ length: count }, (_, index) => minimum + (index < remainder ? 1 : 0))
}

function framesToIntervals(frames: RecipeFrame[], blockId: string, startSeconds: number, idPrefix: string): WorkoutInterval[] {
  const intervals: WorkoutInterval[] = []
  for (const frame of frames) {
    const previous = intervals.at(-1)
    if (previous && previous.intensity === frame.intensity && previous.incline === frame.incline) {
      previous.durationSeconds += SAFETY_RULES.unitSeconds
      continue
    }
    const offset = intervals.reduce((total, interval) => total + interval.durationSeconds, 0)
    intervals.push({
      id: `${idPrefix}-${intervals.length + 1}`,
      blockId,
      intensity: frame.intensity,
      incline: frame.incline,
      startSeconds: startSeconds + offset,
      durationSeconds: SAFETY_RULES.unitSeconds,
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

function injectMax(frames: RecipeFrame[], duration: DurationMinutes, finish: FinishId, focus: FocusId, random: () => number) {
  if (focus !== 'speed' && focus !== 'mixed' && finish !== 'sprint') return
  const maxBudget = Math.floor((duration * 60 * SAFETY_RULES.maxEffortRatio) / SAFETY_RULES.unitSeconds)
  const desiredBursts = duration >= 45 ? 2 : 1
  let remaining = maxBudget
  for (let burst = 0; burst < desiredBursts && remaining > 0; burst += 1) {
    const length = remaining >= 2 && random() > 0.45 ? 2 : 1
    const finalStart = Math.max(0, frames.length - length)
    const distributedStart = Math.floor(((burst + 1) / (desiredBursts + 1)) * frames.length)
    const start = finish === 'sprint' && burst === desiredBursts - 1
      ? finalStart
      : Math.min(Math.max(2, distributedStart), Math.max(2, frames.length - length - length))
    for (let index = start; index < start + length; index += 1) {
      const frame = frames[index]
      if (frame) Object.assign(frame, { intensity: 'max' as const, incline: 1 + (burst % 2) })
    }
    for (let index = start + length; index < start + length * 2 && index < frames.length; index += 1) {
      const frame = frames[index]
      if (frame) Object.assign(frame, { intensity: 'easy' as const, incline: 1 })
    }
    remaining -= length
  }
}

function createPlan(duration: DurationMinutes, seed: number, focus: FocusId, pattern: PatternId, finish: FinishId): WorkoutPlan {
  const random = createRandom(seed)
  const definition = DURATION_DEFINITIONS[duration]
  const blockCount = randomInteger(definition.blockRange[0], definition.blockRange[1], random)
  const bookendUnits = definition.bookendMinutes * 2
  const mainUnits = duration * 2 - bookendUnits * 2
  const blockUnits = distributeUnits(mainUnits, blockCount)
  const mainFrames = blockUnits.flatMap((units, blockIndex) => RECIPE_BUILDERS[pattern]({ units, focus, blockIndex, blockCount }))

  applyFinish(mainFrames, finish)
  injectMax(mainFrames, duration, finish, focus, random)

  const warmupSeconds = definition.bookendMinutes * 60
  const warmup: WorkoutBlock = {
    id: 'warmup',
    label: 'Warm-up',
    kind: 'warmup',
    intervals: [{
      id: 'warmup-1', blockId: 'warmup', intensity: 'easy', incline: 1, startSeconds: 0,
      durationSeconds: warmupSeconds, cue: 'Ease in and find your stride', bookend: 'warmup',
    }],
  }

  let frameOffset = 0
  let timeOffset = warmupSeconds
  const mainBlocks = blockUnits.map((units, blockIndex) => {
    const blockId = `block-${blockIndex + 1}`
    const frames = mainFrames.slice(frameOffset, frameOffset + units)
    const intervals = framesToIntervals(frames, blockId, timeOffset, blockId)
    frameOffset += units
    timeOffset += units * SAFETY_RULES.unitSeconds
    return { id: blockId, label: `Block ${blockIndex + 1}`, kind: 'main' as const, intervals }
  })

  const cooldown: WorkoutBlock = {
    id: 'cooldown',
    label: 'Cool-down',
    kind: 'cooldown',
    intervals: [{
      id: 'cooldown-1', blockId: 'cooldown', intensity: 'easy', incline: 1, startSeconds: timeOffset,
      durationSeconds: warmupSeconds, cue: 'Walk it down and breathe', bookend: 'cooldown',
    }],
  }

  return {
    id: `${duration}-${seed >>> 0}`,
    seed: seed >>> 0,
    durationMinutes: duration,
    plannedDurationSeconds: duration * 60,
    effectiveDurationSeconds: duration * 60,
    focus,
    pattern,
    finish,
    blocks: [warmup, ...mainBlocks, cooldown],
    includeWarmup: true,
    includeCooldown: true,
  }
}

function createSafeFallback(duration: DurationMinutes, seed: number) {
  return createPlan(duration, seed, 'endurance', 'long', 'steady')
}

export function generateWorkout(duration: DurationMinutes, seed: number): WorkoutPlan {
  for (let attempt = 0; attempt < SAFETY_RULES.generationAttempts; attempt += 1) {
    const attemptSeed = (seed + Math.imul(attempt, 0x9e3779b1)) >>> 0
    const random = createRandom(attemptSeed)
    const focus = pick(Object.keys(COMPATIBILITY) as FocusId[], random)
    const pattern = pick(COMPATIBILITY[focus].patterns, random)
    const finish = pick(COMPATIBILITY[focus].finishes, random)
    const plan = createPlan(duration, seed >>> 0, focus, pattern, finish)
    if (validateWorkout(plan).length === 0) return plan
  }
  const fallback = createSafeFallback(duration, seed >>> 0)
  const issues = validateWorkout(fallback)
  if (issues.length > 0) throw new Error(`Safe workout generation failed: ${issues.map((issue) => issue.code).join(', ')}`)
  return fallback
}

export function getEffectiveIntervals(plan: WorkoutPlan): WorkoutInterval[] {
  let startSeconds = 0
  return plan.blocks
    .filter((block) => (block.kind !== 'warmup' || plan.includeWarmup) && (block.kind !== 'cooldown' || plan.includeCooldown))
    .flatMap((block) => block.intervals)
    .map((interval) => {
      const rebased = { ...interval, startSeconds }
      startSeconds += interval.durationSeconds
      return rebased
    })
}

export function withBookendPreference(plan: WorkoutPlan, kind: 'warmup' | 'cooldown', included: boolean): WorkoutPlan {
  const next = {
    ...plan,
    includeWarmup: kind === 'warmup' ? included : plan.includeWarmup,
    includeCooldown: kind === 'cooldown' ? included : plan.includeCooldown,
  }
  const effectiveDurationSeconds = getEffectiveIntervals(next).reduce((total, interval) => total + interval.durationSeconds, 0)
  return { ...next, effectiveDurationSeconds }
}

