import type { FocusId, Intensity, PatternId } from './types'

export interface RecipeFrame {
  intensity: Intensity
  incline: number
}

export interface RecipeInput {
  units: number
  focus: FocusId
  blockIndex: number
  blockCount: number
}

export type RecipeBuilder = (input: RecipeInput) => RecipeFrame[]

function inclineFor(focus: FocusId, step: number) {
  if (focus === 'hills') return Math.min(8, 3 + step)
  if (focus === 'mixed') return Math.min(6, 2 + step)
  return Math.min(4, 1 + step)
}

function buildFrames(input: RecipeInput, intensityAt: (index: number) => Intensity, inclineAt: (index: number) => number) {
  return Array.from({ length: input.units }, (_, index) => ({
    intensity: intensityAt(index),
    incline: inclineAt(index),
  }))
}

export const RECIPE_BUILDERS: Record<PatternId, RecipeBuilder> = {
  long: (input) => buildFrames(
    input,
    (index) => (index < 2 || index >= input.units - 2 ? 'easy' : 'strong'),
    (index) => inclineFor(input.focus, Math.min(2, Math.floor(index / 4))),
  ),
  waves: (input) => buildFrames(
    input,
    (index) => (index % 6 < 2 ? 'easy' : 'strong'),
    (index) => inclineFor(input.focus, index % 6 < 3 ? 1 : 2),
  ),
  ladder: (input) => buildFrames(
    input,
    (index) => (index % 5 === 0 ? 'easy' : 'strong'),
    (index) => inclineFor(input.focus, Math.min(4, Math.floor((index / Math.max(1, input.units - 1)) * 4))),
  ),
  repeats: (input) => buildFrames(
    input,
    (index) => (index % 4 < 2 ? 'strong' : 'easy'),
    () => inclineFor(input.focus, input.blockIndex % 3),
  ),
  progressive: (input) => buildFrames(
    input,
    (index) => (index < Math.ceil(input.units / 3) ? 'easy' : 'strong'),
    (index) => inclineFor(input.focus, Math.floor((index / Math.max(1, input.units - 1)) * 3)),
  ),
}
