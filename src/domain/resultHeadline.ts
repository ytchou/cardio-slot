import type { ResultSummary, WorkoutPlan } from './types'

const COMPLETED_HEADLINES = [
  'Strong finish.',
  'Run complete.',
  'Done and dusted.',
  'That’s a wrap.',
  'Workout locked in.',
  'You showed up.',
] as const

const ENDED_HEADLINES = [
  'Session saved.',
  'You listened.',
  'That counts.',
  'Run recorded.',
  'Good call.',
] as const

export function getResultHeadline(plan: WorkoutPlan, result: ResultSummary) {
  const headlines = result.status === 'completed' ? COMPLETED_HEADLINES : ENDED_HEADLINES
  let hash = plan.seed >>> 0
  for (const character of result.dateIso) hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619) >>> 0
  return headlines[hash % headlines.length]
}
