import { getEffectiveIntervals } from './workout'
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
  const activeBlocks = plan.blocks.filter((block) =>
    (block.kind !== 'warmup' || plan.includeWarmup) && (block.kind !== 'cooldown' || plan.includeCooldown),
  )
  const blockIndex = currentInterval ? Math.max(0, activeBlocks.findIndex((block) => block.id === currentInterval.blockId)) : 0

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
    blockIndex,
    blockCount: mainBlockIds.length + Number(plan.includeWarmup) + Number(plan.includeCooldown),
  }
}

export function getIntervalTransition(
  snapshot: RunSnapshot,
  lastAnnouncedIntervalId: string | null,
  reason: 'tick' | 'resume',
): IntervalTransition | null {
  if (!snapshot.currentInterval || snapshot.currentInterval.id === lastAnnouncedIntervalId) return null
  return {
    interval: snapshot.currentInterval,
    elapsedBoundarySeconds: snapshot.currentInterval.startSeconds,
    reason,
  }
}
