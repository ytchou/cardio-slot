import { useEffect, useRef, useState, type Dispatch } from 'react'
import type { AppAction, AppState } from '../app/state'
import { getIntervalTransition } from '../domain/runtime'
import type { Intensity, RunSnapshot, WorkoutBlock, WorkoutPlan } from '../domain/types'
import type { WakeLockStatus } from '../platform/wakeLock'
import { formatDuration } from './Ticket'

const EFFORT_LABELS: Record<Intensity, string> = { easy: 'Easy', strong: 'Strong', max: 'Max', recovery: 'Walk / Easy' }

function phaseMarker(block: WorkoutBlock) {
  if (block.kind === 'warmup') return 'W'
  if (block.kind === 'cooldown') return 'C'
  if (block.kind === 'main') return String(block.mainBlockIndex ?? '')
  return ''
}

function WorkoutMap({ plan, snapshot }: { plan: WorkoutPlan; snapshot: RunSnapshot }) {
  const progress = Math.max(0, Math.min(100, snapshot.overallProgress * 100))
  const progressText = `${formatDuration(Math.floor(snapshot.elapsedSeconds))} elapsed of ${formatDuration(plan.effectiveDurationSeconds)}. ${snapshot.phaseLabel}, ${snapshot.currentInterval ? EFFORT_LABELS[snapshot.currentInterval.intensity] : 'finished'}, ${formatDuration(Math.ceil(snapshot.intervalRemainingSeconds))} remaining in this interval.`
  return <div className="workout-map" data-workout-map role="progressbar" aria-label="Workout progress"
    aria-valuemin={0} aria-valuemax={plan.effectiveDurationSeconds} aria-valuenow={Math.floor(snapshot.elapsedSeconds)} aria-valuetext={progressText}>
    <div className="workout-map-labels" aria-hidden="true">
      {plan.blocks.map(block => {
        const duration = block.intervals.reduce((total, interval) => total + interval.durationSeconds, 0)
        return <span key={block.id} className={`workout-map-phase-label phase-${block.kind}`} style={{ flexGrow: duration }}>{phaseMarker(block)}</span>
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
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = ref.current
    dialog?.showModal()
    return () => { dialog?.close(); previous?.focus() }
  }, [])
  return <dialog ref={ref} className="end-confirm" aria-label="Confirm end workout" onCancel={event => { event.preventDefault(); dispatch({ type: 'cancel-end' }) }}>
    <h2>End this session now?</h2><p>The workout clock keeps running.</p>
    <button autoFocus onClick={() => dispatch({ type: 'cancel-end' })}>Keep running</button>
    <button className="primary-button" onClick={() => dispatch({ type: 'end-run', timestamp: Date.now() })}>Yes, end</button>
  </dialog>
}

export function RunScreen({ state, snapshot, wake, reduced, dispatch }: { state: AppState; snapshot: RunSnapshot; wake: WakeLockStatus; reduced: boolean; dispatch: Dispatch<AppAction> }) {
  const lastIdentity = useRef<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const runIdentity = `${state.activeRun?.plan.id}-${state.activeRun?.startTimestamp}`
  useEffect(() => {
    const transition = getIntervalTransition(snapshot, lastIdentity.current, document.visibilityState === 'visible' ? 'tick' : 'resume', runIdentity)
    if (!transition) return
    lastIdentity.current = transition.identity
    setAnnouncement(`${snapshot.phaseLabel}. ${EFFORT_LABELS[transition.interval.intensity]}, incline ${transition.interval.incline}%. ${transition.interval.cue}`)
  }, [snapshot, runIdentity])
  const current = snapshot.currentInterval
  const plan = state.activeRun?.plan
  if (!current || !plan) return null
  const next = snapshot.nextInterval
  const soon = snapshot.intervalRemainingSeconds <= 5
  return <main className={`run-screen effort-${current.intensity}`} data-motion={!reduced}>
    <header className="run-progress"><div><strong>{formatDuration(Math.floor(snapshot.elapsedSeconds))}</strong><span>elapsed</span></div>
      <WorkoutMap plan={plan} snapshot={snapshot} />
      <div><strong>{formatDuration(Math.ceil(snapshot.remainingSeconds))}</strong><span>remaining</span></div>
    </header>
    <section className="run-cue"><span className="sr-only" role="status">{announcement}</span><div className="run-cue-content" key={current.id}><p className="phase-label">{snapshot.phaseLabel}</p>
      <h1 className="run-intensity">{EFFORT_LABELS[current.intensity]}</h1><strong className="run-time">{formatDuration(Math.ceil(snapshot.intervalRemainingSeconds))}</strong>
      <p className="run-incline"><span>Incline</span><strong>{current.incline}%</strong></p><p className="run-instruction">{current.cue}</p></div>
    </section>
    <aside className="run-next"><div className={`next-panel${soon ? ' is-soon' : ''}`} aria-live="polite"><p>{soon ? `NEXT IN ${Math.ceil(snapshot.intervalRemainingSeconds)}…` : 'NEXT'}</p>
      <div className="next-details"><strong>{next ? EFFORT_LABELS[next.intensity] : 'FINISH'}</strong><span>{next ? `${formatDuration(next.durationSeconds)} · ${next.incline}%` : 'Session complete'}</span></div>
    </div><button className="end-button" aria-label="End session" onClick={() => dispatch({ type: 'request-end' })}><span aria-hidden="true">■</span> End session</button>
      {(wake === 'denied' || wake === 'unsupported') && <div className="run-options"><span className="wake-status">Keep your screen on — automatic display lock is unavailable.</span></div>}
    </aside>
    {state.confirmEnd && <EndConfirmation dispatch={dispatch} />}
  </main>
}
