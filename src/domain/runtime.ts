import { getEffectiveIntervals } from './timeline'
import type { IntervalTransition, RunSnapshot, WorkoutPlan } from './types'

export function getRunSnapshot(plan: WorkoutPlan, startTimestamp: number, now: number): RunSnapshot {
  const intervals = getEffectiveIntervals(plan)
  const elapsedSeconds = Math.max(0, Math.min(plan.effectiveDurationSeconds, (now - startTimestamp) / 1000))
  const status = elapsedSeconds >= plan.effectiveDurationSeconds ? 'complete' : 'running'
  const intervalIndex = status === 'complete'
    ? Math.max(0, intervals.length - 1)
    : Math.max(0, intervals.findIndex((interval) => elapsedSeconds < interval.startSeconds + interval.durationSeconds))
  const currentInterval = intervals[intervalIndex] ?? null
  const intervalElapsedSeconds = currentInterval
    ? Math.max(0, Math.min(currentInterval.durationSeconds, elapsedSeconds - currentInterval.startSeconds))
    : 0
  const mainBlockIds = [...new Set(plan.blocks.filter((block) => block.kind === 'main').map((block) => block.id))]
  const phase = plan.blocks.find(block => block.id === currentInterval?.blockId)
  const blockIndex = (phase?.mainBlockIndex ?? phase?.nextMainBlockIndex ?? 1) - 1

  return {
    status,
    elapsedSeconds,
    remainingSeconds: Math.max(0, plan.effectiveDurationSeconds - elapsedSeconds),
    overallProgress: plan.effectiveDurationSeconds === 0 ? 1 : elapsedSeconds / plan.effectiveDurationSeconds,
    intervalIndex,
    currentInterval,
    intervalElapsedSeconds,
    intervalRemainingSeconds: currentInterval ? Math.max(0, currentInterval.durationSeconds - intervalElapsedSeconds) : 0,
    intervalProgress: currentInterval ? intervalElapsedSeconds / currentInterval.durationSeconds : 1,
    nextInterval: intervals[intervalIndex + 1] ?? null,
    phaseLabel: phase?.label ?? 'Workout',
    phaseKind: phase?.kind ?? 'main',
    blockIndex,
    blockCount: mainBlockIds.length,
  }
}

export function getIntervalTransition(
  snapshot: RunSnapshot,
  lastAnnouncedIdentity: string | null,
  reason: 'tick' | 'resume',
  runIdentity: string,
): IntervalTransition | null {
  if (!snapshot.currentInterval || snapshot.status === 'complete') return null
  const identity = `${runIdentity}:${snapshot.currentInterval.id}`
  if (identity === lastAnnouncedIdentity) return null
  return {
    identity,
    interval: snapshot.currentInterval,
    elapsedBoundarySeconds: snapshot.currentInterval.startSeconds,
    reason,
  }
}
