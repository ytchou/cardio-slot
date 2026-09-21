import { DURATION_DEFINITIONS, SAFETY_RULES, TEMPLATE_MAX_RATIOS, TEMPLATE_TYPES } from './config'
import { createRandom, pick, randomInteger } from './random'
import type { Intensity, TemplateType, WorkoutBlock, WorkoutInterval, WorkoutPlan, WorkoutRequest } from './types'
import { validateWorkout } from './validate'

interface Segment {
  intensity: Intensity
  incline: number
  durationSeconds: number
  cue: string
}

const CUES: Record<Intensity, string> = {
  easy: 'Run easy and stay in control',
  strong: 'Run strong at a controlled effort',
  max: 'Short, powerful effort',
  recovery: 'Walk or jog very easily until ready',
}

function options(min: number, max: number) {
  return Array.from({ length: (max - min) / SAFETY_RULES.unitSeconds + 1 }, (_, index) => min + index * SAFETY_RULES.unitSeconds)
}

function rotate<T>(values: readonly T[], random: () => number) {
  const offset = Math.floor(random() * values.length)
  return [...values.slice(offset), ...values.slice(0, offset)]
}

function distributeSeconds(total: number, count: number) {
  const units = total / SAFETY_RULES.unitSeconds
  const minimum = Math.floor(units / count)
  const remainder = units % count
  return Array.from({ length: count }, (_, index) => (minimum + (index < remainder ? 1 : 0)) * SAFETY_RULES.unitSeconds)
}

function composeAlternating(
  total: number,
  intensities: readonly [Intensity, Intensity],
  durationOptions: Record<Intensity, number[]>,
  random: () => number,
) {
  const orders = new Map<Intensity, number[]>()
  for (const intensity of intensities) orders.set(intensity, rotate(durationOptions[intensity], random))
  const failed = new Set<string>()
  const visit = (remaining: number, index: number): Array<{ intensity: Intensity; durationSeconds: number }> | null => {
    if (remaining === 0) return []
    const key = `${remaining}-${index % intensities.length}`
    if (failed.has(key)) return null
    const intensity = intensities[index % intensities.length]
    if (!intensity) return null
    for (const durationSeconds of orders.get(intensity) ?? []) {
      if (durationSeconds > remaining) continue
      const tail = visit(remaining - durationSeconds, index + 1)
      if (tail) return [{ intensity, durationSeconds }, ...tail]
    }
    failed.add(key)
    return null
  }
  return visit(total, 0)
}

function allocateMaxDurations(count: number, capSeconds: number, targetSeconds: number, allowed: number[], random: () => number) {
  const durations = Array.from({ length: count }, () => 30)
  const target = Math.min(capSeconds, Math.max(count * 30, targetSeconds))
  let current = count * 30
  while (current < target) {
    const candidates = durations.map((duration, index) => ({ duration, index })).filter(({ duration }) => allowed.some(value => value > duration && value <= duration + 15))
    if (!candidates.length) break
    const chosen = pick(candidates, random)
    durations[chosen.index] = chosen.duration + 15
    current += 15
  }
  return durations
}

function segment(intensity: Intensity, incline: number, durationSeconds: number): Segment {
  return { intensity, incline, durationSeconds, cue: CUES[intensity] }
}

function buildEnduranceBlock(total: number, maxDuration: number | null, random: () => number) {
  const workSeconds = total - (maxDuration ?? 0)
  const composed = composeAlternating(workSeconds, ['easy', 'strong'], {
    easy: options(45, 135), strong: options(90, 180), max: [], recovery: [],
  }, random)
  if (!composed || !composed.some(part => part.intensity === 'strong')) throw new Error('Could not compose Endurance block')
  const intervals = composed.map(part => segment(part.intensity, random() < 0.5 ? 1 : 2, part.durationSeconds))
  if (maxDuration) intervals.push(segment('max', random() < 0.5 ? 1 : 2, maxDuration))
  return intervals
}

function buildHillsBlock(total: number, maxDuration: number | null, random: () => number) {
  const flatSeconds = Math.max(30, Math.round(total * 0.2 / SAFETY_RULES.unitSeconds) * SAFETY_RULES.unitSeconds)
  const startOptions = [30, 45, 60].filter(value => value <= flatSeconds && (flatSeconds - value === 0 || flatSeconds - value >= 30))
  const startSeconds = pick(startOptions, random)
  const resetSeconds = flatSeconds - startSeconds
  const hillSeconds = total - flatSeconds - (maxDuration ?? 0)
  const composed = composeAlternating(hillSeconds, random() < 0.5 ? ['easy', 'strong'] : ['strong', 'easy'], {
    easy: options(30, 120), strong: options(30, 120), max: [], recovery: [],
  }, random)
  if (!composed) throw new Error('Could not compose Hills block')
  const hills = composed.map(part => segment(part.intensity, part.intensity === 'easy' ? randomInteger(3, 8, random) : randomInteger(3, 5, random), part.durationSeconds))
  const intervals: Segment[] = [segment('easy', 1, startSeconds)]
  const midpoint = Math.ceil(hills.length / 2)
  intervals.push(...hills.slice(0, midpoint))
  if (resetSeconds) intervals.push(segment('easy', 1, resetSeconds))
  intervals.push(...hills.slice(midpoint))
  if (maxDuration) intervals.push(segment('max', 2, maxDuration))
  return intervals
}

function buildProgressionBlock(total: number, maxDuration: number, random: () => number) {
  const remaining = total - maxDuration - 60
  const composed = composeAlternating(remaining, ['easy', 'strong'], {
    easy: options(30, 120), strong: options(30, 90), max: [], recovery: [],
  }, random)
  if (!composed) throw new Error(`Could not compose Speed progression: ${total}/${maxDuration}`)
  return [segment('easy', 1, 30), segment('strong', random() < 0.5 ? 1 : 2, 30),
    ...composed.map(part => segment(part.intensity, random() < 0.5 ? 1 : 2, part.durationSeconds)), segment('max', 1, maxDuration)]
}

function buildSprintBlock(total: number, maxDurations: number[]) {
  const recoveries = maxDurations.slice(0, -1).map(duration => [45, 60, 75, 90].find(value => value >= duration) ?? 90)
  let used = maxDurations.reduce((sum, duration) => sum + duration, 0) + recoveries.reduce((sum, duration) => sum + duration, 0)
  let remaining = total - used
  for (let index = 0; index < recoveries.length && remaining > 0; index++) {
    const current = recoveries[index]
    if (current === undefined) continue
    const room = 90 - current
    const increase = Math.min(room, remaining)
    let aligned = Math.floor(increase / SAFETY_RULES.unitSeconds) * SAFETY_RULES.unitSeconds
    if (remaining - aligned === 15) aligned -= 15
    recoveries[index] += aligned
    remaining -= aligned
    used += aligned
  }
  if (remaining > 0 && remaining < 30) throw new Error(`Could not compose Speed sprint recovery: ${total}/${maxDurations.join(',')}/${recoveries.join(',')}/${remaining}`)
  const intervals: Segment[] = []
  if (remaining) intervals.push(segment('easy', 1, remaining))
  for (const [index, duration] of maxDurations.entries()) {
    intervals.push(segment('max', 1, duration))
    const recovery = recoveries[index]
    if (recovery) intervals.push(segment('recovery', 1, recovery))
  }
  return intervals
}

function intervalsForSegments(segments: Segment[], blockId: string, startSeconds: number) {
  let offset = startSeconds
  return segments.map((part, index): WorkoutInterval => {
    const interval = { ...part, id: `${blockId}-${index + 1}`, blockId, startSeconds: offset }
    offset += part.durationSeconds
    return interval
  })
}

function createPlan(request: WorkoutRequest, seed: number, templateType: TemplateType) {
  const random = createRandom((seed ^ ({ endurance: 0x45d9f3b, hills: 0x119de1f3, speed: 0x3449d })[templateType]) >>> 0)
  const definition = DURATION_DEFINITIONS[request.durationMinutes]
  const range = definition.blockRanges[templateType]
  const blockCount = randomInteger(range[0], range[1], random)
  const bookendSeconds = definition.bookendMinutes * 60
  const enabledBookends = Number(request.includeWarmup) + Number(request.includeCooldown)
  const mainSeconds = request.durationMinutes * 60 - enabledBookends * bookendSeconds - blockCount * 60
  if (mainSeconds < blockCount * 120) throw new Error('No feasible main block count')
  const blockSeconds = distributeSeconds(mainSeconds, blockCount)
  const sessionSeconds = request.durationMinutes * 60
  const maxCap = Math.floor(sessionSeconds * TEMPLATE_MAX_RATIOS[templateType] / SAFETY_RULES.unitSeconds) * SAFETY_RULES.unitSeconds
  const maxAllowed = request.durationMinutes >= 45 ? [30, 45, 60] : [30, 45]
  const maxByBlock = Array.from({ length: blockCount }, () => [] as number[])

  if (templateType === 'endurance') {
    maxByBlock[blockCount - 1] = allocateMaxDurations(1, maxCap, maxCap, maxAllowed, random)
  } else if (templateType === 'hills') {
    const selected = Array.from({ length: blockCount }, (_, index) => index).filter(index => index % 2 === 0 || index === blockCount - 1)
    const allocated = allocateMaxDurations(selected.length, maxCap, selected.length * 30, maxAllowed, random)
    selected.forEach((blockIndex, index) => { maxByBlock[blockIndex] = [allocated[index] ?? 30] })
  } else {
    const order = rotate(Array.from({ length: blockCount }, (_, index) => index), random)
    const sprintCount = Math.max(1, Math.floor(blockCount / 2))
    const sprintBlocks = new Set(order.slice(0, sprintCount))
    const burstCounts: number[] = Array.from({ length: blockCount }, (_, index) => sprintBlocks.has(index) ? 2 : 1)
    let burstTotal = burstCounts.reduce((sum, count) => sum + count, 0)
    for (const index of order) {
      if (!sprintBlocks.has(index) || blockSeconds[index] === undefined || blockSeconds[index] < 225 || (burstTotal + 1) * 30 > maxCap) continue
      burstCounts[index] = (burstCounts[index] ?? 0) + 1
      burstTotal++
    }
    const minimumTarget = Math.ceil(sessionSeconds * 0.08 / SAFETY_RULES.unitSeconds) * SAFETY_RULES.unitSeconds
    const allocated = allocateMaxDurations(burstTotal, maxCap, minimumTarget, maxAllowed, random)
    let cursor = 0
    burstCounts.forEach((count, index) => {
      maxByBlock[index] = allocated.slice(cursor, cursor + count)
      cursor += count
    })
  }

  const blocks: WorkoutBlock[] = []
  let offset = 0
  const addStatic = (kind: 'warmup' | 'recovery' | 'cooldown', seconds: number, nextMainBlockIndex?: number) => {
    const id = kind === 'recovery' ? `recovery-${blocks.filter(block => block.kind === 'recovery').length + 1}` : kind
    const label = kind === 'warmup' ? 'Warm-up' : kind === 'cooldown' ? 'Cool-down' : 'Recovery'
    const intensity: Intensity = kind === 'recovery' ? 'recovery' : 'easy'
    blocks.push({ id, kind, label, ...(nextMainBlockIndex ? { nextMainBlockIndex } : {}), intervals: [{
      id: `${id}-1`, blockId: id, intensity, incline: 1, startSeconds: offset, durationSeconds: seconds,
      cue: kind === 'warmup' ? 'Ease in and find your stride' : kind === 'cooldown' ? 'Walk it down and breathe' : CUES.recovery,
      ...(kind === 'warmup' || kind === 'cooldown' ? { bookend: kind } : {}),
    }] })
    offset += seconds
  }

  if (request.includeWarmup) addStatic('warmup', bookendSeconds)
  for (const [index, seconds] of blockSeconds.entries()) {
    const durations = maxByBlock[index] ?? []
    let segments: Segment[]
    if (templateType === 'endurance') segments = buildEnduranceBlock(seconds, durations[0] ?? null, random)
    else if (templateType === 'hills') segments = buildHillsBlock(seconds, durations[0] ?? null, random)
    else segments = durations.length > 1 ? buildSprintBlock(seconds, durations) : buildProgressionBlock(seconds, durations[0] ?? 30, random)
    const id = `block-${index + 1}`
    const intervals = intervalsForSegments(segments, id, offset)
    blocks.push({ id, kind: 'main', mainBlockIndex: index + 1, label: `Block ${index + 1} of ${blockCount}`, intervals })
    offset += seconds
    addStatic('recovery', 60, index < blockCount - 1 ? index + 2 : undefined)
  }
  if (request.includeCooldown) addStatic('cooldown', bookendSeconds)

  return {
    id: `v3-${request.durationMinutes}-${Number(request.includeWarmup)}${Number(request.includeCooldown)}-${seed >>> 0}`,
    seed: seed >>> 0,
    generationVersion: 3 as const,
    effectiveDurationSeconds: sessionSeconds,
    templateType,
    blocks,
    ...request,
  }
}

export function generateWorkout(request: WorkoutRequest, seed: number, forcedTemplate?: TemplateType): WorkoutPlan {
  const templateType = forcedTemplate ?? pick(TEMPLATE_TYPES, createRandom(seed))
  const plan = createPlan(request, seed, templateType)
  const issues = validateWorkout(plan)
  if (issues.length) throw new Error(`Safe workout generation failed: ${issues.map(issue => issue.code).join(', ')}`)
  return plan
}

function visibleWorkoutSignature(plan: WorkoutPlan) {
  return JSON.stringify({
    request: [plan.durationMinutes, plan.includeWarmup, plan.includeCooldown],
    templateType: plan.templateType,
    phases: plan.blocks.map(block => ({
      kind: block.kind,
      intervals: block.intervals.map(interval => [interval.durationSeconds, interval.intensity, interval.incline]),
    })),
  })
}

export function generateDifferentWorkout(request: WorkoutRequest, seed: number, previousPlan: WorkoutPlan, attempts = 12) {
  const previousSignature = visibleWorkoutSignature(previousPlan)
  for (let attempt = 0; attempt < attempts; attempt++) {
    const plan = generateWorkout(request, (seed + attempt) >>> 0)
    if (visibleWorkoutSignature(plan) !== previousSignature) return plan
  }
  throw new Error('Safe workout generation failed: duplicate-workout')
}
