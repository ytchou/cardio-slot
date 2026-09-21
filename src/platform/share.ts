import { TEMPLATE_LABELS, THEMES } from '../domain/config'
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

export async function createResultImage(_plan: WorkoutPlan, result: ResultSummary, themeId: ThemeId) {
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
  context.textAlign = 'right'
  context.font = '500 25px "IBM Plex Mono"'
  context.fillText(new Date(result.dateIso).toLocaleDateString(undefined, { dateStyle: 'medium' }), 945, 155)
  context.textAlign = 'left'

  context.fillStyle = theme.accent
  context.font = '800 96px "Barlow Condensed"'
  context.fillText(result.status === 'completed' ? 'SESSION COMPLETED' : 'SESSION ENDED', 135, 285)
  context.fillStyle = theme.ink
  context.font = '500 25px "IBM Plex Mono"'
  context.fillText('WORKOUT TYPE', 135, 350)
  context.fillStyle = theme.accent
  context.font = '700 72px "Barlow Condensed"'
  context.fillText(TEMPLATE_LABELS[result.templateType].toUpperCase(), 135, 425)

  context.fillStyle = theme.ink
  context.font = '500 29px "IBM Plex Mono"'
  context.fillText('SESSION SUMMARY', 135, 515)
  context.fillRect(135, 540, 810, 3)
  drawLabel(context, 'TIME', formatClock(result.elapsedSeconds), 135, 600, theme.ink)
  drawLabel(context, '# BLOCKS', String(result.blockCount), 430, 600, theme.ink)
  drawLabel(context, 'TOP INCLINE', `${result.maximumIncline}%`, 725, 600, theme.ink)

  context.font = '500 29px "IBM Plex Mono"'
  context.fillText('TIME BY EFFORT', 135, 780)
  context.fillRect(135, 805, 810, 3)
  drawLabel(context, 'EASY', formatClock(result.intensitySeconds.easy), 135, 870, theme.ink)
  drawLabel(context, 'STRONG', formatClock(result.intensitySeconds.strong), 340, 870, theme.ink)
  drawLabel(context, 'MAX', formatClock(result.intensitySeconds.max), 545, 870, theme.ink)
  drawLabel(context, 'WALK / EASY', formatClock(result.intensitySeconds.recovery), 750, 870, theme.ink)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not render result image')), 'image/png')
  })
  return new File([blob], `cardio-slot-${result.status}.png`, { type: 'image/png' })
}

export function downloadResultImage(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}
