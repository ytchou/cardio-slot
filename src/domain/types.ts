export type DurationMinutes = 15 | 30 | 45 | 60
export type Intensity = 'easy' | 'strong' | 'max'
export type FocusId = 'endurance' | 'hills' | 'speed' | 'mixed'
export type PatternId = 'long' | 'waves' | 'ladder' | 'repeats' | 'progressive'
export type FinishId = 'steady' | 'fast-close' | 'sprint' | 'climb'
export type ThemeId = 'track' | 'neon' | 'mono'
export interface WorkoutRequest {
  durationMinutes: DurationMinutes
  includeWarmup: boolean
  includeCooldown: boolean
}

export interface Preferences extends WorkoutRequest {
  theme: ThemeId
  motion: boolean
}

export type BookendKind = 'warmup' | 'cooldown'

export interface WorkoutInterval {
  id: string
  blockId: string
  intensity: Intensity
  incline: number
  startSeconds: number
  durationSeconds: number
  cue: string
  bookend?: BookendKind
}

export interface WorkoutBlock {
  id: string
  label: string
  kind: 'warmup' | 'main' | 'recovery' | 'cooldown'
  mainBlockIndex?: number
  nextMainBlockIndex?: number
  intervals: WorkoutInterval[]
}

export interface WorkoutPlan {
  id: string
  seed: number
  durationMinutes: DurationMinutes
  generationVersion: 1 | 2
  effectiveDurationSeconds: number
  focus: FocusId
  pattern: PatternId
  finish: FinishId
  blocks: WorkoutBlock[]
  includeWarmup: boolean
  includeCooldown: boolean
}

export interface RunRecord {
  plan: WorkoutPlan
  startTimestamp: number
}

export interface ResultSummary {
  status: 'completed' | 'ended'
  dateIso: string
  elapsedSeconds: number
  plannedSeconds: number
  focus: FocusId
  pattern: PatternId
  finish: FinishId
  blockCount: number
  intensitySeconds: Record<Intensity, number>
  maximumIncline: number
}

export interface RunSnapshot {
  status: 'running' | 'complete'
  elapsedSeconds: number
  remainingSeconds: number
  overallProgress: number
  intervalIndex: number
  currentInterval: WorkoutInterval | null
  intervalElapsedSeconds: number
  intervalRemainingSeconds: number
  intervalProgress: number
  nextInterval: WorkoutInterval | null
  phaseLabel: string
  phaseKind: WorkoutBlock['kind']
  blockIndex: number
  blockCount: number
}

export interface IntervalTransition {
  identity: string
  interval: WorkoutInterval
  elapsedBoundarySeconds: number
  reason: 'tick' | 'resume'
}

export interface ValidationIssue {
  code: string
  message: string
}
