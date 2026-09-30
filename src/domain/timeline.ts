import type { WorkoutPlan } from './types'

export function getEffectiveIntervals(plan: WorkoutPlan) {
  return plan.blocks.flatMap(block => block.intervals)
}

export function getRecordedIntervals(plan: WorkoutPlan, elapsedSeconds: number) {
  const elapsed = Math.max(0, Math.min(elapsedSeconds, plan.effectiveDurationSeconds))
  return getEffectiveIntervals(plan).flatMap(interval => {
    const durationSeconds = Math.min(interval.durationSeconds, elapsed - interval.startSeconds)
    return durationSeconds > 0 ? [{ ...interval, durationSeconds }] : []
  })
}
