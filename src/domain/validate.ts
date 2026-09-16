import { COMPATIBILITY, DURATION_DEFINITIONS, SAFETY_RULES } from './config'
import { getEffectiveIntervals } from './workout'
import type { ValidationIssue, WorkoutPlan } from './types'

export function validateWorkout(plan: WorkoutPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const allIntervals = plan.blocks.flatMap((block) => block.intervals)
  const totalSeconds = allIntervals.reduce((total, interval) => total + interval.durationSeconds, 0)
  const definition = DURATION_DEFINITIONS[plan.durationMinutes]
  const mainBlocks = plan.blocks.filter((block) => block.kind === 'main')

  if (totalSeconds !== plan.durationMinutes * 60) {
    issues.push({ code: 'duration', message: 'The planned intervals must exactly fill the selected duration.' })
  }
  if (mainBlocks.length < definition.blockRange[0] || mainBlocks.length > definition.blockRange[1]) {
    issues.push({ code: 'block-count', message: 'The main block count is outside its duration range.' })
  }
  if (!COMPATIBILITY[plan.focus].patterns.includes(plan.pattern) || !COMPATIBILITY[plan.focus].finishes.includes(plan.finish)) {
    issues.push({ code: 'compatibility', message: 'The selected reels are not compatible.' })
  }

  let expectedStart = 0
  for (const interval of allIntervals) {
    if (interval.startSeconds !== expectedStart) {
      issues.push({ code: 'ordering', message: `Interval ${interval.id} does not follow the preceding interval.` })
    }
    expectedStart += interval.durationSeconds
    if (interval.durationSeconds % SAFETY_RULES.unitSeconds !== 0) {
      issues.push({ code: 'unit', message: `Interval ${interval.id} is not aligned to 30 seconds.` })
    }
    if (interval.incline < SAFETY_RULES.inclineMin || interval.incline > SAFETY_RULES.inclineMax) {
      issues.push({ code: 'incline', message: `Interval ${interval.id} has an unsafe incline.` })
    }
    if (interval.bookend && (interval.intensity !== 'easy' || interval.incline !== 1)) {
      issues.push({ code: 'bookend', message: `${interval.bookend} must stay Easy at 1%.` })
    }
  }

  const maxIntervals = allIntervals.filter((interval) => interval.intensity === 'max')
  const maxSeconds = maxIntervals.reduce((total, interval) => total + interval.durationSeconds, 0)
  if (maxSeconds > plan.plannedDurationSeconds * SAFETY_RULES.maxEffortRatio) {
    issues.push({ code: 'max-total', message: 'MAX effort exceeds 10% of planned time.' })
  }
  for (const interval of maxIntervals) {
    if (interval.durationSeconds < SAFETY_RULES.maxIntervalMinSeconds || interval.durationSeconds > SAFETY_RULES.maxIntervalMaxSeconds) {
      issues.push({ code: 'max-duration', message: `MAX interval ${interval.id} must last 30–60 seconds.` })
    }
    if (interval.incline < SAFETY_RULES.maxInclineMin || interval.incline > SAFETY_RULES.maxInclineMax) {
      issues.push({ code: 'max-incline', message: `MAX interval ${interval.id} must stay at 1–2%.` })
    }
    const index = allIntervals.indexOf(interval)
    const previous = allIntervals[index - 1]
    const next = allIntervals[index + 1]
    if (previous?.intensity === 'max' || next?.intensity === 'max') {
      issues.push({ code: 'max-adjacent', message: 'MAX efforts cannot be adjacent.' })
    }
    if (!next || next.intensity !== 'easy' || next.durationSeconds < interval.durationSeconds) {
      issues.push({ code: 'max-recovery', message: `MAX interval ${interval.id} needs equal Easy recovery.` })
    }
  }

  const effectiveSeconds = getEffectiveIntervals(plan).reduce((total, interval) => total + interval.durationSeconds, 0)
  if (effectiveSeconds !== plan.effectiveDurationSeconds) {
    issues.push({ code: 'effective-duration', message: 'The effective duration does not match enabled bookends.' })
  }
  return issues
}

