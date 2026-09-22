import { DURATION_DEFINITIONS, SAFETY_RULES, TEMPLATE_MAX_RATIOS } from './config'
import type { Intensity, ValidationIssue, WorkoutPlan } from './types'

const INTENSITIES: Intensity[] = ['easy', 'strong', 'max', 'recovery']

export function validateWorkout(plan: WorkoutPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const allIntervals = plan.blocks.flatMap(block => block.intervals)
  const mainBlocks = plan.blocks.filter(block => block.kind === 'main')
  const definition = DURATION_DEFINITIONS[plan.durationMinutes]
  const totalSeconds = allIntervals.reduce((total, interval) => total + interval.durationSeconds, 0)
  const range = definition.blockRanges[plan.templateType]

  if (plan.generationVersion !== 3) issues.push({ code: 'version', message: 'Only generation version 3 is supported.' })
  if (totalSeconds !== plan.effectiveDurationSeconds || totalSeconds !== plan.durationMinutes * 60) {
    issues.push({ code: 'duration', message: 'The planned intervals must exactly fill the selected duration.' })
  }
  if (mainBlocks.length < range[0] || mainBlocks.length > range[1]) {
    issues.push({ code: 'block-count', message: 'The main block count is outside its template range.' })
  }

  let expectedStart = 0
  for (const interval of allIntervals) {
    if (!INTENSITIES.includes(interval.intensity)) issues.push({ code: 'intensity', message: 'Unknown effort.' })
    if (interval.startSeconds !== expectedStart) issues.push({ code: 'ordering', message: `Interval ${interval.id} is out of order.` })
    expectedStart += interval.durationSeconds
    if (!Number.isFinite(interval.durationSeconds) || interval.durationSeconds < 30 || interval.durationSeconds % SAFETY_RULES.unitSeconds !== 0) {
      issues.push({ code: 'unit', message: `Interval ${interval.id} must use the 15-second grid and last at least 30 seconds.` })
    }
    if (!Number.isFinite(interval.incline) || interval.incline < SAFETY_RULES.inclineMin || interval.incline > SAFETY_RULES.inclineMax) {
      issues.push({ code: 'incline', message: `Interval ${interval.id} has an unsafe incline.` })
    }
    if (interval.bookend && (interval.intensity !== 'easy' || interval.incline !== 1)) {
      issues.push({ code: 'bookend', message: `${interval.bookend} must stay Easy at 1%.` })
    }
  }

  const maxIntervals = allIntervals.filter(interval => interval.intensity === 'max')
  const maxSeconds = maxIntervals.reduce((total, interval) => total + interval.durationSeconds, 0)
  if (maxSeconds > plan.effectiveDurationSeconds * TEMPLATE_MAX_RATIOS[plan.templateType]) {
    issues.push({ code: 'max-total', message: 'MAX effort exceeds the template budget.' })
  }
  if (plan.templateType === 'speed' && maxSeconds < plan.effectiveDurationSeconds * 0.08) {
    issues.push({ code: 'max-minimum', message: 'Speed needs at least 8% MAX effort.' })
  }
  for (const interval of maxIntervals) {
    if (interval.durationSeconds < SAFETY_RULES.maxIntervalMinSeconds || interval.durationSeconds > SAFETY_RULES.maxIntervalMaxSeconds ||
        (interval.durationSeconds === 60 && plan.durationMinutes < 45)) {
      issues.push({ code: 'max-duration', message: `MAX interval ${interval.id} has an invalid duration.` })
    }
    if (interval.incline < SAFETY_RULES.maxInclineMin || interval.incline > SAFETY_RULES.maxInclineMax) {
      issues.push({ code: 'max-incline', message: `MAX interval ${interval.id} must stay at 1–2%.` })
    }
    const index = allIntervals.indexOf(interval)
    const next = allIntervals[index + 1]
    const isLowEffortRecovery = next?.intensity === 'recovery' || (next?.intensity === 'easy' && next.incline === 1)
    if (!next || !isLowEffortRecovery || next.durationSeconds < interval.durationSeconds) {
      issues.push({ code: 'max-recovery', message: `MAX interval ${interval.id} needs equal-or-longer Easy or WALK / EASY.` })
    }
  }
  for (let index = 1; index < allIntervals.length; index++) {
    if (allIntervals[index - 1]?.intensity === 'recovery' && allIntervals[index]?.intensity === 'recovery') {
      issues.push({ code: 'recovery-adjacent', message: 'Recovery intervals cannot be consecutive.' })
    }
  }

  const recoveries = plan.blocks.filter(block => block.kind === 'recovery')
  if (recoveries.length !== Math.max(0, mainBlocks.length - 1)) issues.push({ code: 'recoveries', message: 'Main blocks need one recovery between each pair.' })
  const warmups = plan.blocks.filter(block => block.kind === 'warmup')
  const cooldowns = plan.blocks.filter(block => block.kind === 'cooldown')
  if (warmups.length !== Number(plan.includeWarmup) || cooldowns.length !== Number(plan.includeCooldown) ||
      (plan.includeWarmup && plan.blocks.at(0)?.kind !== 'warmup') || (plan.includeCooldown && plan.blocks.at(-1)?.kind !== 'cooldown')) {
    issues.push({ code: 'bookend-placement', message: 'Enabled bookends must bound the timeline.' })
  }

  const ids = new Set<string>()
  for (const [index, block] of plan.blocks.entries()) {
    const seconds = block.intervals.reduce((total, interval) => total + interval.durationSeconds, 0)
    if (!block.intervals.length || ids.has(block.id) || block.intervals.some(interval => interval.blockId !== block.id)) {
      issues.push({ code: 'phase', message: 'Phases need unique identities and owned intervals.' })
    }
    ids.add(block.id)
    if (block.kind === 'main' && (seconds < 120 || block.mainBlockIndex !== mainBlocks.indexOf(block) + 1)) {
      issues.push({ code: 'main-block', message: 'Main blocks need at least two minutes and sequential indices.' })
    }
    if (block.kind === 'main' && block.intervals.at(-1)?.intensity === 'recovery') {
      issues.push({ code: 'main-ending', message: 'Main blocks cannot end with WALK / EASY.' })
    }
    if (block.kind === 'recovery' && (seconds !== 60 || block.intervals.length !== 1 || block.intervals[0]?.intensity !== 'recovery' || block.intervals[0]?.incline !== 1 ||
        plan.blocks[index - 1]?.kind !== 'main' || plan.blocks[index + 1]?.kind !== 'main')) {
      issues.push({ code: 'recovery-placement', message: 'Boundary recovery must sit between main blocks and last one minute.' })
    }
    if ((block.kind === 'warmup' || block.kind === 'cooldown') && (seconds !== definition.bookendMinutes * 60 || block.intervals.some(interval => interval.intensity !== 'easy' || interval.incline !== 1))) {
      issues.push({ code: 'bookend', message: 'Bookends must match their duration and stay Easy at 1%.' })
    }
  }

  if (plan.templateType === 'endurance') {
    const mainIntervals = mainBlocks.flatMap(block => block.intervals)
    const finalIntervals = mainBlocks.at(-1)?.intervals ?? []
    const validFinish = plan.includeCooldown ? finalIntervals.at(-1)?.intensity === 'max' :
      finalIntervals.at(-2)?.intensity === 'max' && finalIntervals.at(-1)?.intensity === 'easy' && finalIntervals.at(-1)?.incline === 1
    if (mainIntervals.filter(interval => interval.intensity === 'max').length !== 1 || !validFinish ||
        mainBlocks.slice(0, -1).some(block => block.intervals.some(interval => interval.intensity === 'recovery'))) {
      issues.push({ code: 'endurance-shape', message: 'Endurance must stay continuous through one final MAX and its low-effort follow-up.' })
    }
    if (mainIntervals.some(interval => interval.incline > 2 || (interval.intensity === 'strong' && interval.durationSeconds > 180))) {
      issues.push({ code: 'endurance-effort', message: 'Endurance exceeds its incline or Strong duration.' })
    }
  }

  if (plan.templateType === 'hills') {
    for (const block of mainBlocks) {
      if (block.intervals[0]?.intensity !== 'easy' || block.intervals[0]?.incline !== 1) issues.push({ code: 'hills-start', message: 'Hills blocks must begin Easy at 1%.' })
      if (block.intervals.some(interval => interval.intensity === 'strong' && (interval.durationSeconds > 120 || interval.incline > 5))) {
        issues.push({ code: 'hills-strong', message: 'Hills Strong work exceeds its duration or incline cap.' })
      }
      const activeIntervals = block === mainBlocks.at(-1) && !plan.includeCooldown ? block.intervals.slice(0, -1) : block.intervals
      const aboveFlat = activeIntervals.filter(interval => interval.incline > 1).reduce((total, interval) => total + interval.durationSeconds, 0)
      const ratio = aboveFlat / secondsFor(activeIntervals)
      if (ratio < 0.7 || ratio > 0.85) issues.push({ code: 'hills-ratio', message: 'Hills incline time must stay within its target band.' })
    }
  }

  if (plan.templateType === 'speed') {
    if (mainBlocks.some(block => !block.intervals.some(interval => interval.intensity === 'max')) ||
        !mainBlocks.some(block => block.intervals.filter(interval => interval.intensity === 'max').length > 1) ||
        !mainBlocks.some(block => block.intervals.some(interval => interval.intensity === 'strong'))) {
      issues.push({ code: 'speed-shape', message: 'Speed must mix sprint repeats and build-to-sprint blocks.' })
    }
    if (mainBlocks.flatMap(block => block.intervals).some(interval => interval.intensity === 'strong' && (interval.durationSeconds > 90 || interval.incline > 2))) {
      issues.push({ code: 'speed-strong', message: 'Speed Strong work exceeds its duration or incline cap.' })
    }
  }

  if (new Set(allIntervals.map(interval => interval.id)).size !== allIntervals.length) issues.push({ code: 'interval-id', message: 'Interval identities must be unique.' })
  return issues
}

function secondsFor(intervals: WorkoutPlan['blocks'][number]['intervals']) {
  return intervals.reduce((total, interval) => total + interval.durationSeconds, 0)
}
