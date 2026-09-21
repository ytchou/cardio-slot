import type { DurationMinutes, TemplateType, ThemeId } from './types'

export interface DurationDefinition {
  minutes: DurationMinutes
  bookendMinutes: number
  blockRanges: Record<TemplateType, readonly [number, number]>
}

export interface SafetyRules {
  unitSeconds: number
  inclineMin: number
  inclineMax: number
  maxIntervalMinSeconds: number
  maxIntervalMaxSeconds: number
  maxInclineMin: number
  maxInclineMax: number
}

export const DURATION_DEFINITIONS: Record<DurationMinutes, DurationDefinition> = {
  15: { minutes: 15, bookendMinutes: 2, blockRanges: { endurance: [2, 2], hills: [2, 3], speed: [3, 3] } },
  30: { minutes: 30, bookendMinutes: 3, blockRanges: { endurance: [3, 4], hills: [4, 4], speed: [4, 5] } },
  45: { minutes: 45, bookendMinutes: 4, blockRanges: { endurance: [4, 5], hills: [5, 5], speed: [5, 6] } },
  60: { minutes: 60, bookendMinutes: 5, blockRanges: { endurance: [5, 6], hills: [6, 7], speed: [7, 8] } },
}

export const TEMPLATE_LABELS: Record<TemplateType, string> = {
  endurance: 'Endurance',
  hills: 'Hills',
  speed: 'Speed',
}

export const TEMPLATE_TYPES = Object.keys(TEMPLATE_LABELS) as TemplateType[]
export const TEMPLATE_MAX_RATIOS: Record<TemplateType, number> = { endurance: 0.05, hills: 0.08, speed: 0.15 }

export const THEMES: Record<ThemeId, { label: string; description: string; ink: string; paper: string; accent: string; muted: string }> = {
  track: { label: 'Track', description: 'Cinder, chalk, signal red', ink: '#181713', paper: '#f4f0e6', accent: '#e8442e', muted: '#63705a' },
  neon: { label: 'Neon', description: 'Night, cyan, pulse pink', ink: '#07131e', paper: '#d8fbff', accent: '#ff4fa7', muted: '#37e6f6' },
  mono: { label: 'Mono', description: 'Paper, ink, graphite', ink: '#171717', paper: '#f3f1ea', accent: '#5b5b56', muted: '#a7a49b' },
}

export const SAFETY_RULES: SafetyRules = {
  unitSeconds: 15,
  inclineMin: 1,
  inclineMax: 8,
  maxIntervalMinSeconds: 30,
  maxIntervalMaxSeconds: 60,
  maxInclineMin: 1,
  maxInclineMax: 2,
}
