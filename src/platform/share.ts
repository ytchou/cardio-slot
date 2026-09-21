import { THEMES } from '../domain/config'
import type { ResultSummary, ThemeId, WorkoutPlan } from '../domain/types'
import { effortLabel, templateLabel, translate, type Locale } from '../i18n'

const FONT_LOAD_TIMEOUT_MS = 2_000

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

function font(locale: Locale, size: number, weight: number, mono = false) {
  const family = locale === 'zh-TW' ? '"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif' : mono ? '"IBM Plex Mono",monospace' : '"Barlow Condensed",sans-serif'
  return `${weight} ${size}px ${family}`
}

function drawLabel(context: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, color: string, locale: Locale) {
  context.fillStyle = color
  context.font = font(locale, 25, 500, true)
  context.fillText(label, x, y)
  context.font = font(locale, 48, 600)
  context.fillText(value, x, y + 52)
}

export async function createResultImage(_plan: WorkoutPlan, result: ResultSummary, themeId: ThemeId, locale: Locale) {
  let timeout: number | undefined
  try {
    await Promise.race([
      Promise.allSettled((locale === 'en' ? [
        '700 45px "Barlow Condensed"',
        '800 118px "Barlow Condensed"',
        '600 48px "Barlow Condensed"',
        '500 25px "IBM Plex Mono"',
      ] : []).map(face => document.fonts.load(face))),
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
  context.font = font(locale, 25, 500, true)
  context.fillText(new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(result.dateIso)), 945, 155)
  context.textAlign = 'left'

  context.fillStyle = theme.accent
  context.font = font(locale, 96, 800)
  context.fillText(translate(locale, result.status === 'completed' ? 'image.completed' : 'image.ended'), 135, 285)
  context.fillStyle = theme.ink
  context.font = font(locale, 25, 500, true)
  context.fillText(translate(locale, 'image.workoutType'), 135, 350)
  context.fillStyle = theme.accent
  context.font = font(locale, 72, 700)
  context.fillText(templateLabel(locale, result.templateType).toUpperCase(), 135, 425)

  context.fillStyle = theme.ink
  context.font = font(locale, 29, 500, true)
  context.fillText(translate(locale, 'image.sessionSummary'), 135, 515)
  context.fillRect(135, 540, 810, 3)
  drawLabel(context, translate(locale, 'image.time'), formatClock(result.elapsedSeconds), 135, 600, theme.ink, locale)
  drawLabel(context, translate(locale, 'image.blocks'), String(result.blockCount), 430, 600, theme.ink, locale)
  drawLabel(context, translate(locale, 'image.topIncline'), `${result.maximumIncline}%`, 725, 600, theme.ink, locale)

  context.font = font(locale, 29, 500, true)
  context.fillText(translate(locale, 'image.timeByEffort'), 135, 780)
  context.fillRect(135, 805, 810, 3)
  drawLabel(context, effortLabel(locale, 'easy').toUpperCase(), formatClock(result.intensitySeconds.easy), 135, 870, theme.ink, locale)
  drawLabel(context, effortLabel(locale, 'strong').toUpperCase(), formatClock(result.intensitySeconds.strong), 340, 870, theme.ink, locale)
  drawLabel(context, effortLabel(locale, 'max').toUpperCase(), formatClock(result.intensitySeconds.max), 545, 870, theme.ink, locale)
  drawLabel(context, effortLabel(locale, 'recovery').toUpperCase(), formatClock(result.intensitySeconds.recovery), 750, 870, theme.ink, locale)

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
