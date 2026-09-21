import { useEffect, useRef, useState, type Dispatch } from 'react'
import type { AppAction, AppState } from '../app/state'
import { getIntervalTransition } from '../domain/runtime'
import type { RunSnapshot, WorkoutBlock, WorkoutPlan } from '../domain/types'
import { effortLabel, intervalCue, phaseLabel, useI18n, type Locale } from '../i18n'
import type { WakeLockStatus } from '../platform/wakeLock'
import { LanguageSwitcher } from './LanguageSwitcher'
import { formatDuration } from './Ticket'

function phaseMarker(block: WorkoutBlock, locale: Locale) {
  if (block.kind === 'warmup') return locale === 'zh-TW' ? '暖' : 'W'
  if (block.kind === 'cooldown') return locale === 'zh-TW' ? '緩' : 'C'
  if (block.kind === 'main') return String(block.mainBlockIndex ?? '')
  return ''
}

function WorkoutMap({ plan, snapshot }: { plan: WorkoutPlan; snapshot: RunSnapshot }) {
  const { locale, t } = useI18n()
  const progress = Math.max(0, Math.min(100, snapshot.overallProgress * 100))
  const block = plan.blocks.find(candidate => candidate.id === snapshot.currentInterval?.blockId)
  const currentPhase = block ? phaseLabel(locale, block, snapshot.blockCount) : t('phase.workout')
  const progressText = t('run.progressText', {
    elapsed: formatDuration(Math.floor(snapshot.elapsedSeconds)), total: formatDuration(plan.effectiveDurationSeconds), phase: currentPhase,
    effort: snapshot.currentInterval ? effortLabel(locale, snapshot.currentInterval.intensity) : t('run.finished'), remaining: formatDuration(Math.ceil(snapshot.intervalRemainingSeconds)),
  })
  return <div className="workout-map" data-workout-map role="progressbar" aria-label={t('run.progress')}
    aria-valuemin={0} aria-valuemax={plan.effectiveDurationSeconds} aria-valuenow={Math.floor(snapshot.elapsedSeconds)} aria-valuetext={progressText}>
    <div className="workout-map-labels" aria-hidden="true">
      {plan.blocks.map(block => {
        const duration = block.intervals.reduce((total, interval) => total + interval.durationSeconds, 0)
        return <span key={block.id} className={`workout-map-phase-label phase-${block.kind}`} style={{ flexGrow: duration }}>{phaseMarker(block, locale)}</span>
      })}
    </div>
    <div className="workout-map-rail" aria-hidden="true">
      {plan.blocks.map(block => {
        const duration = block.intervals.reduce((total, interval) => total + interval.durationSeconds, 0)
        return <span key={block.id} className={`workout-map-phase phase-${block.kind}${block.id === snapshot.currentInterval?.blockId ? ' is-current' : ''}`} style={{ flexGrow: duration }}>
          {block.intervals.map(interval => <i key={interval.id} data-interval-id={interval.id}
            className={`workout-map-interval interval-${interval.intensity}${interval.id === snapshot.currentInterval?.id ? ' is-current' : ''}${interval.startSeconds + interval.durationSeconds <= snapshot.elapsedSeconds ? ' is-complete' : ''}`}
            style={{ flexGrow: interval.durationSeconds }} />)}
        </span>
      })}
      <span className="workout-map-playhead" style={{ left: `${progress}%` }} />
    </div>
  </div>
}

function EndConfirmation({ dispatch }: { dispatch: Dispatch<AppAction> }) {
  const { t } = useI18n()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = ref.current
    dialog?.showModal()
    return () => { dialog?.close(); previous?.focus() }
  }, [])
  return <dialog ref={ref} className="end-confirm" aria-label={t('run.confirm')} onCancel={event => { event.preventDefault(); dispatch({ type: 'cancel-end' }) }}>
    <LanguageSwitcher className="dialog-language-switcher" /><h2>{t('run.confirmTitle')}</h2><p>{t('run.confirmBody')}</p>
    <button autoFocus onClick={() => dispatch({ type: 'cancel-end' })}>{t('run.keepRunning')}</button>
    <button className="primary-button" onClick={() => dispatch({ type: 'end-run', timestamp: Date.now() })}>{t('run.yesEnd')}</button>
  </dialog>
}

export function RunScreen({ state, snapshot, wake, reduced, dispatch }: { state: AppState; snapshot: RunSnapshot; wake: WakeLockStatus; reduced: boolean; dispatch: Dispatch<AppAction> }) {
  const { locale, t } = useI18n()
  const lastIdentity = useRef<string | null>(null)
  const lastLocale = useRef(locale)
  const [announcement, setAnnouncement] = useState('')
  const runIdentity = `${state.activeRun?.plan.id}-${state.activeRun?.startTimestamp}`
  useEffect(() => {
    const transition = getIntervalTransition(snapshot, lastIdentity.current, document.visibilityState === 'visible' ? 'tick' : 'resume', runIdentity)
    const localeChanged = lastLocale.current !== locale
    if (!transition && !localeChanged) return
    if (transition) lastIdentity.current = transition.identity
    lastLocale.current = locale
    const interval = transition?.interval ?? snapshot.currentInterval
    if (!interval) return
    const block = state.activeRun?.plan.blocks.find(candidate => candidate.id === interval.blockId)
    setAnnouncement(t('run.announcement', {
      phase: block ? phaseLabel(locale, block, snapshot.blockCount) : t('phase.workout'), effort: effortLabel(locale, interval.intensity), incline: interval.incline, cue: intervalCue(locale, interval),
    }))
  }, [locale, runIdentity, snapshot, state.activeRun?.plan.blocks, t])
  const current = snapshot.currentInterval
  const plan = state.activeRun?.plan
  if (!current || !plan) return null
  const next = snapshot.nextInterval
  const soon = snapshot.intervalRemainingSeconds <= 5
  const currentBlock = plan.blocks.find(block => block.id === current.blockId)
  const currentPhase = currentBlock ? phaseLabel(locale, currentBlock, snapshot.blockCount) : t('phase.workout')
  return <main className={`run-screen effort-${current.intensity}`} data-motion={!reduced}>
    <LanguageSwitcher className="active-language-switcher" />
    <header className="run-progress"><div><strong>{formatDuration(Math.floor(snapshot.elapsedSeconds))}</strong><span>{t('run.elapsed')}</span></div>
      <WorkoutMap plan={plan} snapshot={snapshot} />
      <div><strong>{formatDuration(Math.ceil(snapshot.remainingSeconds))}</strong><span>{t('run.remaining')}</span></div>
    </header>
    <section className="run-cue"><span className="sr-only" role="status">{announcement}</span><div className="run-cue-content" key={current.id}><p className="phase-label">{currentPhase}</p>
      <h1 className="run-intensity">{effortLabel(locale, current.intensity)}</h1><strong className="run-time">{formatDuration(Math.ceil(snapshot.intervalRemainingSeconds))}</strong>
      <p className="run-incline"><span>{t('ticket.incline')}</span><strong>{current.incline}%</strong></p><p className="run-instruction">{intervalCue(locale, current)}</p></div>
    </section>
    <aside className="run-next"><div className={`next-panel${soon ? ' is-soon' : ''}`} aria-live="polite"><p>{soon ? t('run.nextIn', { seconds: Math.ceil(snapshot.intervalRemainingSeconds) }) : t('run.next')}</p>
      <div className="next-details"><strong>{next ? effortLabel(locale, next.intensity) : t('run.finish')}</strong><span>{next ? `${formatDuration(next.durationSeconds)} · ${next.incline}%` : t('run.sessionComplete')}</span></div>
    </div><button className="end-button" aria-label={t('run.end')} onClick={() => dispatch({ type: 'request-end' })}><span aria-hidden="true">■</span> {t('run.end')}</button>
      {(wake === 'denied' || wake === 'unsupported') && <div className="run-options"><span className="wake-status">{t('run.wakeUnavailable')}</span></div>}
    </aside>
    {state.confirmEnd && <EndConfirmation dispatch={dispatch} />}
  </main>
}
