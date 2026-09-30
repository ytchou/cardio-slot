import { useEffect, useRef, useState, type CSSProperties, type Dispatch } from 'react'
import type { AppAction, AppState } from '../app/state'
import { getIntervalTransition } from '../domain/runtime'
import type { Intensity, RunSnapshot, WorkoutPlan } from '../domain/types'
import { effortLabel, intervalCue, phaseLabel, useI18n } from '../i18n'
import type { WakeLockStatus } from '../platform/wakeLock'
import { formatDuration } from './Ticket'
import type { mountRunningDog } from '../platform/runningDog'

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
    <div className="workout-map-rail" aria-hidden="true">
      {plan.blocks.map(block => {
        const duration = block.intervals.reduce((total, interval) => total + interval.durationSeconds, 0)
        return <span key={block.id} className={`workout-map-phase phase-${block.kind}`} style={{ flexGrow: duration }}>
          {block.intervals.map(interval => <i key={interval.id} data-interval-id={interval.id}
            className={`workout-map-interval interval-${interval.intensity}${interval.id === snapshot.currentInterval?.id ? ' is-current' : ''}`}
            style={{ flexGrow: interval.durationSeconds }} />)}
        </span>
      })}
      <span className="workout-map-elapsed" style={{ width: `${progress}%` }} />
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
    <h2>{t('run.confirmTitle')}</h2><p>{t('run.confirmBody')}</p>
    <button autoFocus onClick={() => dispatch({ type: 'cancel-end' })}>{t('run.keepRunning')}</button>
    <button className="primary-button" onClick={() => dispatch({ type: 'end-run', timestamp: Date.now() })}>{t('run.yesEnd')}</button>
  </dialog>
}

export function RunScreen({ state, snapshot, wake, reduced, dispatch }: { state: AppState; snapshot: RunSnapshot; wake: WakeLockStatus; reduced: boolean; dispatch: Dispatch<AppAction> }) {
  const { locale, t } = useI18n()
  const lastIdentity = useRef<string | null>(null)
  const lastLocale = useRef(locale)
  const [announcement, setAnnouncement] = useState('')
  const dogHost = useRef<HTMLDivElement>(null)
  const dogAnimation = useRef<ReturnType<typeof mountRunningDog> | null>(null)
  const current = snapshot.currentInterval
  const dogSettings = useRef<{ effort: Intensity; reduced: boolean }>({ effort: current?.intensity ?? 'easy', reduced })
  dogSettings.current = { effort: current?.intensity ?? 'easy', reduced }
  useEffect(() => {
    let cancelled = false
    void import('../platform/runningDog').then(({ mountRunningDog }) => {
      if (cancelled || !dogHost.current) return
      dogAnimation.current = mountRunningDog(dogHost.current, dogSettings.current.effort, dogSettings.current.reduced)
    })
    return () => { cancelled = true; dogAnimation.current?.destroy(); dogAnimation.current = null }
  }, [])
  useEffect(() => { if (current) dogAnimation.current?.setEffort(current.intensity, reduced) }, [current?.intensity, reduced])
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
  const plan = state.activeRun?.plan
  if (!current || !plan) return null
  const next = snapshot.nextInterval
  const soon = snapshot.intervalRemainingSeconds <= 5
  const slope = `${-Math.atan(current.incline / 100) * 360 / Math.PI}deg`
  return <main className={`run-screen effort-${current.intensity}`}>
    <header className="run-progress"><div className="run-progress-time"><span>{t('run.elapsed')}</span><strong>{formatDuration(Math.floor(snapshot.elapsedSeconds))}</strong></div>
      <WorkoutMap plan={plan} snapshot={snapshot} />
      <div className="run-progress-time"><span>{t('run.remaining')}</span><strong>{formatDuration(Math.ceil(snapshot.remainingSeconds))}</strong></div>
    </header>
    <section className="run-cue"><span className="sr-only" role="status">{announcement}</span><div className="run-cue-content">
      <h1 className="run-intensity">{effortLabel(locale, current.intensity)}</h1><strong className="run-time">{formatDuration(Math.ceil(snapshot.intervalRemainingSeconds))}</strong></div>
      <div className="run-companion" aria-hidden="true" style={{ '--slope': slope } as CSSProperties}>
        <span className="run-speed-lines" />
        <div className="run-dog" ref={dogHost} />
      </div>
      <p className="run-incline"><span>{t('ticket.incline')}</span><strong>{current.incline}%</strong></p>
    </section>
    <aside className="run-next"><div className={`next-panel${next ? ` effort-${next.intensity}` : ''}${soon ? ' is-soon' : ''}`} aria-live="polite"><p>{soon ? t('run.nextIn', { seconds: Math.ceil(snapshot.intervalRemainingSeconds) }) : t('run.next')}</p>
      <div className="next-details"><strong>{next ? effortLabel(locale, next.intensity) : t('run.finish')}</strong><span>{next ? `${formatDuration(next.durationSeconds)} · ${next.incline}%` : t('run.sessionComplete')}</span></div>
    </div><button className="end-button" aria-label={t('run.end')} onClick={() => dispatch({ type: 'request-end' })}><span aria-hidden="true">■</span> {t('run.end')}</button>
      {(wake === 'denied' || wake === 'unsupported') && <div className="run-options"><span className="wake-status">{t('run.wakeUnavailable')}</span></div>}
    </aside>
    {state.confirmEnd && <EndConfirmation dispatch={dispatch} />}
  </main>
}
