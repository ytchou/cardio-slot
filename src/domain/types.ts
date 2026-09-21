export type DurationMinutes = 15 | 30 | 45 | 60
export type Intensity = 'easy' | 'strong' | 'max' | 'recovery'
export type TemplateType = 'endurance' | 'hills' | 'speed'
export type ThemeId = 'track' | 'neon' | 'mono'
export interface WorkoutRequest {
  durationMinutes: DurationMinutes
  includeWarmup: boolean
  includeCooldown: boolean
}

export interface Preferences extends WorkoutRequest {
  theme: ThemeId
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
  generationVersion: 3
  effectiveDurationSeconds: number
  templateType: TemplateType
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
  templateType: TemplateType
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
