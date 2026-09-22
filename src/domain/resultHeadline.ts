import type { ResultSummary, WorkoutPlan } from './types'
import type { MessageKey } from '../i18n'

const COMPLETED_HEADLINES = [
  'result.completed.0', 'result.completed.1', 'result.completed.2', 'result.completed.3', 'result.completed.4', 'result.completed.5',
] as const satisfies readonly MessageKey[]

const ENDED_HEADLINES = [
  'result.ended.0', 'result.ended.1', 'result.ended.2', 'result.ended.3', 'result.ended.4',
] as const satisfies readonly MessageKey[]

export function getResultHeadlineKey(plan: WorkoutPlan, result: ResultSummary) {
  const headlines = result.status === 'completed' ? COMPLETED_HEADLINES : ENDED_HEADLINES
  let hash = plan.seed >>> 0
  for (const character of result.dateIso) hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619) >>> 0
  return headlines[hash % headlines.length] ?? headlines[0]
}
