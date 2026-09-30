import { getEffectiveIntervals, getRecordedIntervals } from '../domain/timeline'
import type { Intensity, ResultSummary, WorkoutPlan } from '../domain/types'
import { effortLabel, templateLabel, translate, type Locale } from '../i18n'

const FONT_LOAD_TIMEOUT_MS = 2_000
const BRAND_FONT = '600 26px "IBM Plex Mono",monospace'
const CARD_SIZE = 1080
const MARGIN = 80
const COLORS = { paper: '#101413', ink: '#f1f5f2', secondary: '#b1bdb5', rule: '#39433c', profile: '#c4f56b' }
const CHART = { left: 156, right: CARD_SIZE - MARGIN, top: 394, bottom: 598 }
const EFFORT_LEVELS: readonly Intensity[] = ['recovery', 'easy', 'strong', 'max']

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
}

function font(size: number, weight = 400, locale: Locale = 'en') {
  const family = locale === 'zh-TW' ? '"Cardio Sans TC","PingFang TC","Microsoft JhengHei",sans-serif' : '"IBM Plex Mono",monospace'
  return `${weight} ${size}px ${family}`
}

function drawProfile(context: CanvasRenderingContext2D, plan: WorkoutPlan, result: ResultSummary, locale: Locale) {
  const hills = result.templateType === 'hills'
  const maximum = hills ? Math.max(2, ...getEffectiveIntervals(plan).map(interval => interval.incline)) : EFFORT_LEVELS.length - 1
  const minimum = hills ? 1 : 0
  const x = (seconds: number) => CHART.left + seconds / plan.effectiveDurationSeconds * (CHART.right - CHART.left)
  const y = (level: number) => CHART.bottom - (level - minimum) / (maximum - minimum) * (CHART.bottom - CHART.top)
  const ticks = hills
    ? [{ level: minimum, label: `${minimum}%` }, { level: maximum, label: `${maximum}%` }]
    : EFFORT_LEVELS.map((effort, level) => ({ level, label: effortLabel(locale, effort) }))
  context.fillStyle = COLORS.ink
  context.textAlign = 'left'
  context.font = font(30, 500, locale)
  context.fillText(translate(locale, hills ? 'image.inclineProfile' : 'image.effortProfile'), MARGIN, 342)
  context.font = font(24, 400, locale)
  context.fillStyle = COLORS.secondary
  context.textAlign = 'right'
  for (const tick of ticks) context.fillText(tick.label, CHART.left - 18, y(tick.level) + 9)
  context.strokeStyle = COLORS.rule
  context.lineWidth = 1.5
  context.beginPath()
  context.moveTo(CHART.left, CHART.top - 14)
  context.lineTo(CHART.left, CHART.bottom)
  context.lineTo(CHART.right, CHART.bottom)
  context.stroke()
  for (let tick = 0; tick <= 3; tick++) {
    const seconds = plan.effectiveDurationSeconds * tick / 3
    context.textAlign = tick === 0 ? 'left' : tick === 3 ? 'right' : 'center'
    context.font = font(24, 500)
    context.fillText(formatClock(seconds), x(seconds), CHART.bottom + 42)
    if (tick > 0 && tick < 3) {
      context.setLineDash([4, 7])
      context.beginPath()
      context.moveTo(x(seconds), CHART.top - 14)
      context.lineTo(x(seconds), CHART.bottom)
      context.stroke()
    }
  }
  context.setLineDash([])
  const intervals = getRecordedIntervals(plan, result.elapsedSeconds)
  if (!intervals.length) {
    context.textAlign = 'center'
    context.font = font(30, 400, locale)
    context.fillText(translate(locale, 'image.noIntervals'), (CHART.left + CHART.right) / 2, (CHART.top + CHART.bottom) / 2)
    return
  }
  context.strokeStyle = COLORS.profile
  context.lineWidth = 4
  context.lineJoin = 'round'
  context.beginPath()
  let endX = CHART.left
  let endY = CHART.bottom
  for (const [index, interval] of intervals.entries()) {
    const level = hills ? interval.incline : EFFORT_LEVELS.indexOf(interval.intensity)
    const startX = x(interval.startSeconds)
    endX = x(interval.startSeconds + interval.durationSeconds)
    endY = y(level)
    if (index === 0) context.moveTo(startX, endY)
    else context.lineTo(startX, endY)
    context.lineTo(endX, endY)
  }
  context.stroke()
  context.fillStyle = COLORS.profile
  context.beginPath()
  context.arc(endX, endY, 5, 0, Math.PI * 2)
  context.fill()
}

export async function createResultImage(plan: WorkoutPlan, result: ResultSummary, locale: Locale) {
  let timeout: number | undefined
  try {
    await Promise.race([
      Promise.allSettled([
        ...(locale === 'zh-TW' ? [
          '400 30px "Cardio Sans TC"',
          '500 30px "Cardio Sans TC"',
          '600 76px "Cardio Sans TC"',
        ] : []),
        '400 38px "IBM Plex Mono"',
        '500 24px "IBM Plex Mono"',
        '600 76px "IBM Plex Mono"',
      ].map(face => document.fonts.load(face, '訓練摘要 0123456789'))),
      new Promise<void>(resolve => { timeout = window.setTimeout(resolve, FONT_LOAD_TIMEOUT_MS) }),
    ])
  } finally {
    window.clearTimeout(timeout)
  }
  const canvas = document.createElement('canvas')
  canvas.width = CARD_SIZE
  canvas.height = CARD_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available')
  context.fillStyle = COLORS.paper
  context.fillRect(0, 0, CARD_SIZE, CARD_SIZE)
  context.fillStyle = COLORS.ink
  context.textAlign = 'left'
  context.font = BRAND_FONT
  context.fillText('CARDIO SLOT', MARGIN, 86)
  context.textAlign = 'right'
  context.font = font(26, 400, locale)
  context.fillText(new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(result.dateIso)), CARD_SIZE - MARGIN, 86)
  context.textAlign = 'left'
  context.font = font(64, 600, locale)
  context.fillText(translate(locale, 'image.title', { type: templateLabel(locale, result.templateType).toUpperCase() }), MARGIN, 201, CARD_SIZE - MARGIN * 2)
  context.fillStyle = COLORS.secondary
  context.font = font(30, 400, locale)
  context.fillText(translate(locale, result.status === 'completed' ? 'image.completed' : 'image.ended'), MARGIN, 258)
  drawProfile(context, plan, result, locale)

  const metrics = [
    [translate(locale, 'image.time'), formatClock(result.elapsedSeconds)],
    [translate(locale, 'image.topIncline'), result.elapsedSeconds > 0 ? `${result.maximumIncline}%` : '—'],
    [translate(locale, result.status === 'completed' ? 'image.blocks' : 'image.plannedBlocks'), String(result.blockCount)],
  ] as const
  const columnWidth = (CARD_SIZE - MARGIN * 2) / metrics.length
  for (const [index, [label, value]] of metrics.entries()) {
    const center = MARGIN + columnWidth * (index + 0.5)
    context.textAlign = 'center'
    context.fillStyle = COLORS.secondary
    context.font = font(28, 400, locale)
    context.fillText(label, center, 720, columnWidth - 24)
    context.fillStyle = COLORS.ink
    context.font = font(76, 600)
    context.fillText(value, center, 817, columnWidth - 24)
    if (index > 0) {
      context.strokeStyle = COLORS.rule
      context.lineWidth = 1.5
      context.beginPath()
      context.moveTo(MARGIN + columnWidth * index, 688)
      context.lineTo(MARGIN + columnWidth * index, 842)
      context.stroke()
    }
  }
  context.strokeStyle = COLORS.rule
  context.beginPath()
  context.moveTo(MARGIN, 876)
  context.lineTo(CARD_SIZE - MARGIN, 876)
  context.moveTo(MARGIN, 954)
  context.lineTo(CARD_SIZE - MARGIN, 954)
  context.moveTo(CARD_SIZE / 2, 876)
  context.lineTo(CARD_SIZE / 2, 1030)
  context.stroke()
  for (const [index, effort] of (['easy', 'strong', 'max', 'recovery'] as const).entries()) {
    const left = index % 2 === 0 ? MARGIN : CARD_SIZE / 2 + 24
    const right = index % 2 === 0 ? CARD_SIZE / 2 - 24 : CARD_SIZE - MARGIN
    const baseline = index < 2 ? 930 : 1008
    context.fillStyle = COLORS.ink
    context.textAlign = 'left'
    context.font = font(30, 500, locale)
    context.fillText(effortLabel(locale, effort), left, baseline)
    context.textAlign = 'right'
    context.font = font(38)
    context.fillText(formatClock(result.intensitySeconds[effort]), right, baseline)
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not render result image')), 'image/png')
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
