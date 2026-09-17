import {
  COMPATIBILITY,
  DURATION_DEFINITIONS,
  SAFETY_RULES,
  type DurationDefinition,
  type SafetyRules,
} from './config'
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

  if (totalSeconds !== plan.durationMinutes * 60 || totalSeconds !== plan.effectiveDurationSeconds) {
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
    if (!['easy', 'strong', 'max'].includes(interval.intensity)) issues.push({ code: 'intensity', message: 'Unknown effort.' })
    if (interval.startSeconds !== expectedStart) {
      issues.push({ code: 'ordering', message: `Interval ${interval.id} does not follow the preceding interval.` })
    }
    expectedStart += interval.durationSeconds
    if (!Number.isFinite(interval.durationSeconds) || interval.durationSeconds <= 0 || interval.durationSeconds % safetyRules.unitSeconds !== 0) {
      issues.push({ code: 'unit', message: `Interval ${interval.id} is not aligned to 30 seconds.` })
    }
    if (!Number.isFinite(interval.incline) || interval.incline < safetyRules.inclineMin || interval.incline > safetyRules.inclineMax) {
      issues.push({ code: 'incline', message: `Interval ${interval.id} has an unsafe incline.` })
    }
    if (interval.bookend && (interval.intensity !== 'easy' || interval.incline !== 1)) {
      issues.push({ code: 'bookend', message: `${interval.bookend} must stay Easy at 1%.` })
    }
  }

  const maxIntervals = allIntervals.filter((interval) => interval.intensity === 'max')
  const maxSeconds = maxIntervals.reduce((total, interval) => total + interval.durationSeconds, 0)
  if (maxSeconds > plan.effectiveDurationSeconds * safetyRules.maxEffortRatio) {
    issues.push({ code: 'max-total', message: 'MAX effort exceeds 10% of planned time.' })
  }
  for (const interval of maxIntervals) {
    if (interval.durationSeconds < safetyRules.maxIntervalMinSeconds || interval.durationSeconds > safetyRules.maxIntervalMaxSeconds) {
      issues.push({ code: 'max-duration', message: `MAX interval ${interval.id} must last 30–60 seconds.` })
    }
    if (!Number.isFinite(interval.incline) || interval.incline < safetyRules.maxInclineMin || interval.incline > safetyRules.maxInclineMax) {
      issues.push({ code: 'max-incline', message: `MAX interval ${interval.id} must stay at 1–2%.` })
    }
    const index = allIntervals.indexOf(interval)
    const previous = allIntervals[index - 1]
    const next = allIntervals[index + 1]
    if (previous?.intensity === 'max' || next?.intensity === 'max') {
      issues.push({ code: 'max-adjacent', message: 'MAX efforts cannot be adjacent.' })
    }
    if (!next || next.blockId !== interval.blockId || next.intensity !== 'easy' || next.durationSeconds < interval.durationSeconds) {
      issues.push({ code: 'max-recovery', message: `MAX interval ${interval.id} needs equal Easy recovery.` })
    }
  }

  const recoveries = plan.blocks.filter(block => block.kind === 'recovery')
  if (recoveries.length !== mainBlocks.length - 1) issues.push({ code: 'recoveries', message: 'Every main block boundary needs one recovery.' })
  const warmups = plan.blocks.filter(block => block.kind === 'warmup')
  const cooldowns = plan.blocks.filter(block => block.kind === 'cooldown')
  if (warmups.length !== Number(plan.includeWarmup) || cooldowns.length !== Number(plan.includeCooldown) ||
      (plan.includeWarmup && plan.blocks.at(0)?.kind !== 'warmup') || (plan.includeCooldown && plan.blocks.at(-1)?.kind !== 'cooldown')) {
    issues.push({ code: 'bookend-placement', message: 'Enabled bookends must bound the timeline.' })
  }
  const ids = new Set<string>()
  for (const [index, block] of plan.blocks.entries()) {
    const total = block.intervals.reduce((sum, interval) => sum + interval.durationSeconds, 0)
    if (!block.intervals.length || ids.has(block.id) || block.intervals.some(interval => interval.blockId !== block.id)) {
      issues.push({ code: 'phase', message: 'Phases need unique identities and owned intervals.' })
    }
    ids.add(block.id)
    if (block.kind === 'main' && (total < 120 || block.mainBlockIndex !== mainBlocks.indexOf(block) + 1)) {
      issues.push({ code: 'main-block', message: 'Main blocks need at least two minutes and sequential indices.' })
    }
    if (block.kind === 'recovery' && (total !== 60 || block.intervals.length !== 1 ||
        block.intervals.some(interval => interval.intensity !== 'easy' || interval.incline !== 1) ||
        plan.blocks[index - 1]?.kind !== 'main' || plan.blocks[index + 1]?.kind !== 'main' ||
        block.nextMainBlockIndex !== plan.blocks[index + 1]?.mainBlockIndex)) {
      issues.push({ code: 'recovery-placement', message: 'Recovery must be Easy at 1% between main blocks.' })
    }
    if ((block.kind === 'warmup' || block.kind === 'cooldown') && (total !== definition.bookendMinutes * 60 ||
        block.intervals.some(interval => interval.intensity !== 'easy' || interval.incline !== 1))) {
      issues.push({ code: 'bookend', message: 'Bookends must match their duration and stay Easy at 1%.' })
    }
  }
  if (new Set(allIntervals.map(interval => interval.id)).size !== allIntervals.length) issues.push({ code: 'interval-id', message: 'Interval identities must be unique.' })
  return issues
}
