import type { DurationMinutes, FinishId, FocusId, PatternId, ThemeId } from './types'

export interface DurationDefinition {
  minutes: DurationMinutes
  bookendMinutes: number
  blockRange: readonly [number, number]
}

export const DURATION_DEFINITIONS: Record<DurationMinutes, DurationDefinition> = {
  15: { minutes: 15, bookendMinutes: 2, blockRange: [2, 3] },
  30: { minutes: 30, bookendMinutes: 3, blockRange: [3, 5] },
  45: { minutes: 45, bookendMinutes: 4, blockRange: [4, 6] },
  60: { minutes: 60, bookendMinutes: 5, blockRange: [5, 8] },
}

export const FOCUS_LABELS: Record<FocusId, string> = {
  endurance: 'Endurance',
  hills: 'Hills',
  speed: 'Speed',
  mixed: 'Mixed',
}

export const PATTERN_LABELS: Record<PatternId, string> = {
  long: 'Long',
  waves: 'Waves',
  ladder: 'Ladder',
  repeats: 'Repeats',
  progressive: 'Progressive',
}

export const FINISH_LABELS: Record<FinishId, string> = {
  steady: 'Steady',
  'fast-close': 'Fast Close',
  sprint: 'Sprint',
  climb: 'Climb',
}

export const THEMES: Record<ThemeId, { label: string; description: string; ink: string; paper: string; accent: string; muted: string }> = {
  track: { label: 'Track', description: 'Cinder, chalk, signal red', ink: '#181713', paper: '#f4f0e6', accent: '#e8442e', muted: '#63705a' },
  neon: { label: 'Neon', description: 'Night, cyan, pulse pink', ink: '#07131e', paper: '#d8fbff', accent: '#ff4fa7', muted: '#37e6f6' },
  mono: { label: 'Mono', description: 'Paper, ink, graphite', ink: '#171717', paper: '#f3f1ea', accent: '#5b5b56', muted: '#a7a49b' },
}

export const COMPATIBILITY: Record<FocusId, { patterns: readonly PatternId[]; finishes: readonly FinishId[] }> = {
  endurance: { patterns: ['long', 'waves', 'progressive'], finishes: ['steady', 'fast-close', 'climb'] },
  hills: { patterns: ['long', 'waves', 'ladder', 'repeats'], finishes: ['steady', 'fast-close', 'climb'] },
  speed: { patterns: ['waves', 'ladder', 'repeats', 'progressive'], finishes: ['steady', 'fast-close', 'sprint'] },
  mixed: { patterns: ['long', 'waves', 'ladder', 'repeats', 'progressive'], finishes: ['steady', 'fast-close', 'sprint', 'climb'] },
}

export const SAFETY_RULES = {
  unitSeconds: 30,
  inclineMin: 1,
  inclineMax: 8,
  maxIntervalMinSeconds: 30,
  maxIntervalMaxSeconds: 60,
  maxInclineMin: 1,
  maxInclineMax: 2,
  maxEffortRatio: 0.1,
  generationAttempts: 12,
} as const
