import { FINISH_LABELS, FOCUS_LABELS, PATTERN_LABELS, THEMES } from '../domain/config'
import type { ResultSummary, ThemeId, WorkoutPlan } from '../domain/types'

const FONT_LOAD_TIMEOUT_MS = 2_000

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

function drawLabel(context: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, color: string) {
  context.fillStyle = color
  context.font = '500 25px "IBM Plex Mono"'
  context.fillText(label, x, y)
  context.font = '600 48px "Barlow Condensed"'
  context.fillText(value, x, y + 52)
}

export async function createResultImage(plan: WorkoutPlan, result: ResultSummary, themeId: ThemeId) {
  let timeout: number | undefined
  try {
    await Promise.race([
      Promise.allSettled([
        '700 45px "Barlow Condensed"',
        '800 118px "Barlow Condensed"',
        '600 48px "Barlow Condensed"',
        '500 25px "IBM Plex Mono"',
      ].map(font => document.fonts.load(font))),
      new Promise<void>(resolve => { timeout = window.setTimeout(resolve, FONT_LOAD_TIMEOUT_MS) }),
    ])
  } finally {
    window.clearTimeout(timeout)
  }
  const theme = THEMES[themeId]
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available')

  context.fillStyle = theme.ink
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = theme.paper
  context.fillRect(70, 55, 940, 1240)
  context.strokeStyle = theme.ink
  context.lineWidth = 4
  context.setLineDash([12, 12])
  context.strokeRect(100, 85, 880, 1180)
  context.setLineDash([])

  context.fillStyle = theme.ink
  context.font = '700 45px "Barlow Condensed"'
  context.fillText('CARDIO SLOT', 135, 165)
  context.textAlign = 'right'
  context.font = '500 25px "IBM Plex Mono"'
  context.fillText(new Date(result.dateIso).toLocaleDateString(undefined, { dateStyle: 'medium' }), 945, 160)
  context.textAlign = 'left'

  context.fillStyle = theme.accent
  context.font = '800 118px "Barlow Condensed"'
  context.fillText(result.status === 'completed' ? 'COMPLETED' : 'SESSION ENDED', 135, 315)
  context.fillStyle = theme.ink
  context.font = '600 58px "Barlow Condensed"'
  context.fillText(`${FOCUS_LABELS[result.focus]} / ${PATTERN_LABELS[result.pattern]} / ${FINISH_LABELS[result.finish]}`, 135, 400)

  drawLabel(context, 'TIME', `${formatClock(result.elapsedSeconds)} / ${formatClock(result.plannedSeconds)}`, 135, 510, theme.ink)
  drawLabel(context, 'MAIN BLOCKS PLANNED', String(result.blockCount), 650, 510, theme.ink)
  drawLabel(context, 'EASY', formatClock(result.intensitySeconds.easy), 135, 670, theme.muted)
  drawLabel(context, 'STRONG', formatClock(result.intensitySeconds.strong), 440, 670, theme.ink)
  drawLabel(context, 'MAX', formatClock(result.intensitySeconds.max), 745, 670, theme.accent)
  drawLabel(context, 'TOP INCLINE', `${result.maximumIncline}%`, 135, 830, theme.ink)
  drawLabel(context, 'ORIGINAL PICK', `${plan.durationMinutes} MIN`, 650, 830, theme.ink)

  context.fillStyle = theme.ink
  context.fillRect(135, 1000, 810, 5)
  context.font = '500 31px "IBM Plex Mono"'
  context.fillText('Personal pace. Real effort. Your run.', 135, 1075)
  context.font = '500 24px "IBM Plex Mono"'
  context.fillText('cardio-slot · visual treadmill workouts', 135, 1190)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not render result image')), 'image/png')
  })
  return new File([blob], `cardio-slot-${result.status}.png`, { type: 'image/png' })
}

export function canShareResultImage(file: File) {
  try {
    return typeof navigator.share === 'function' && Boolean(navigator.canShare?.({ files: [file] }))
  } catch {
    return false
  }
}

export function shareResultImage(file: File) {
  if (!canShareResultImage(file)) return Promise.reject(new Error('File sharing is unavailable'))
  return navigator.share({ files: [file] })
}

export function downloadResultImage(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}

export function formatResultSummary(plan: WorkoutPlan, result: ResultSummary) {
  return [
    `Cardio Slot — ${result.status === 'completed' ? 'Completed' : 'Session ended'}`,
    `${FOCUS_LABELS[result.focus]} / ${PATTERN_LABELS[result.pattern]} / ${FINISH_LABELS[result.finish]}`,
    `Time: ${formatClock(result.elapsedSeconds)} / ${formatClock(result.plannedSeconds)}`,
    `Main blocks planned: ${result.blockCount}`,
    `Easy: ${formatClock(result.intensitySeconds.easy)} · Strong: ${formatClock(result.intensitySeconds.strong)} · Max: ${formatClock(result.intensitySeconds.max)}`,
    `Top incline: ${result.maximumIncline}% · Original pick: ${plan.durationMinutes} min`,
  ].join('\n')
}

export function copyResultSummary(plan: WorkoutPlan, result: ResultSummary) {
  return navigator.clipboard.writeText(formatResultSummary(plan, result))
}
