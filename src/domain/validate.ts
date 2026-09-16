import {
  COMPATIBILITY,
  DURATION_DEFINITIONS,
  SAFETY_RULES,
  type DurationDefinition,
  type SafetyRules,
} from './config'
import { getEffectiveIntervals } from './workout'
import type { DurationMinutes, ValidationIssue, WorkoutPlan } from './types'

interface WorkoutValidationConfig {
  durations: Record<DurationMinutes, DurationDefinition>
  compatibility: typeof COMPATIBILITY
}

const DEFAULT_VALIDATION_CONFIG: WorkoutValidationConfig = {
  durations: DURATION_DEFINITIONS,
  compatibility: COMPATIBILITY,
}

export function validateWorkout(
  plan: WorkoutPlan,
  safetyRules: SafetyRules = SAFETY_RULES,
  config: WorkoutValidationConfig = DEFAULT_VALIDATION_CONFIG,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const allIntervals = plan.blocks.flatMap((block) => block.intervals)
  const totalSeconds = allIntervals.reduce((total, interval) => total + interval.durationSeconds, 0)
  const definition = config.durations[plan.durationMinutes]
  const mainBlocks = plan.blocks.filter((block) => block.kind === 'main')

  if (totalSeconds !== plan.durationMinutes * 60) {
    issues.push({ code: 'duration', message: 'The planned intervals must exactly fill the selected duration.' })
  }
  if (mainBlocks.length < definition.blockRange[0] || mainBlocks.length > definition.blockRange[1]) {
    issues.push({ code: 'block-count', message: 'The main block count is outside its duration range.' })
  }
  const compatibility = config.compatibility[plan.focus]
  if (!compatibility.patterns.includes(plan.pattern) || !compatibility.finishes.includes(plan.finish)) {
    issues.push({ code: 'compatibility', message: 'The selected reels are not compatible.' })
  }

  let expectedStart = 0
  for (const interval of allIntervals) {
    if (interval.startSeconds !== expectedStart) {
      issues.push({ code: 'ordering', message: `Interval ${interval.id} does not follow the preceding interval.` })
    }
    expectedStart += interval.durationSeconds
    if (interval.durationSeconds % safetyRules.unitSeconds !== 0) {
      issues.push({ code: 'unit', message: `Interval ${interval.id} is not aligned to 30 seconds.` })
    }
    if (interval.incline < safetyRules.inclineMin || interval.incline > safetyRules.inclineMax) {
      issues.push({ code: 'incline', message: `Interval ${interval.id} has an unsafe incline.` })
    }
    if (interval.bookend && (interval.intensity !== 'easy' || interval.incline !== 1)) {
      issues.push({ code: 'bookend', message: `${interval.bookend} must stay Easy at 1%.` })
    }
  }

  const maxIntervals = allIntervals.filter((interval) => interval.intensity === 'max')
  const maxSeconds = maxIntervals.reduce((total, interval) => total + interval.durationSeconds, 0)
  if (maxSeconds > plan.plannedDurationSeconds * safetyRules.maxEffortRatio) {
    issues.push({ code: 'max-total', message: 'MAX effort exceeds 10% of planned time.' })
  }
  for (const interval of maxIntervals) {
    if (interval.durationSeconds < safetyRules.maxIntervalMinSeconds || interval.durationSeconds > safetyRules.maxIntervalMaxSeconds) {
      issues.push({ code: 'max-duration', message: `MAX interval ${interval.id} must last 30–60 seconds.` })
    }
    if (interval.incline < safetyRules.maxInclineMin || interval.incline > safetyRules.maxInclineMax) {
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
