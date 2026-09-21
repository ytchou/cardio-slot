import { getEffectiveIntervals } from './timeline'
import type { Intensity, ResultSummary, WorkoutPlan } from './types'

export function summarizeResult(plan: WorkoutPlan, elapsedSeconds: number, completedAt: number): ResultSummary {
  const clampedElapsed = Math.max(0, Math.min(elapsedSeconds, plan.effectiveDurationSeconds))
  const intensitySeconds: Record<Intensity, number> = { easy: 0, strong: 0, max: 0, recovery: 0 }
  let maximumIncline = 1

  for (const interval of getEffectiveIntervals(plan)) {
    const contributed = Math.max(0, Math.min(interval.durationSeconds, clampedElapsed - interval.startSeconds))
    if (contributed <= 0) continue
    intensitySeconds[interval.intensity] += contributed
    maximumIncline = Math.max(maximumIncline, interval.incline)
  }

  return {
    status: clampedElapsed >= plan.effectiveDurationSeconds ? 'completed' : 'ended',
    dateIso: new Date(completedAt).toISOString(),
    elapsedSeconds: clampedElapsed,
    plannedSeconds: plan.effectiveDurationSeconds,
    templateType: plan.templateType,
    blockCount: plan.blocks.filter((block) => block.kind === 'main').length,
    intensitySeconds,
    maximumIncline,
  }
}
