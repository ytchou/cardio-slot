import type { WorkoutPlan } from './types'

export function getEffectiveIntervals(plan: WorkoutPlan) {
  return plan.blocks.flatMap(block => block.intervals)
}
