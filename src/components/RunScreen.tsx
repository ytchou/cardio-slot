import { useEffect, useRef, useState, type Dispatch } from 'react'
import type { AppAction, AppState } from '../app/state'
import { getIntervalTransition } from '../domain/runtime'
import type { RunSnapshot } from '../domain/types'
import type { WakeLockStatus } from '../platform/wakeLock'
import { formatDuration } from './Ticket'

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
    setAnnouncement(`${snapshot.phaseLabel}. ${transition.interval.intensity}, incline ${transition.interval.incline}%. ${transition.interval.cue}`)
  }, [snapshot, runIdentity])
  const current = snapshot.currentInterval
  if (!current) return null
  const next = snapshot.nextInterval
  const soon = snapshot.intervalRemainingSeconds <= 5
  return <main className={`run-screen effort-${snapshot.phaseKind === 'recovery' ? 'recovery' : current.intensity}`} data-motion={state.preferences.motion && !reduced}>
    <header className="run-progress"><div><strong>{formatDuration(Math.floor(snapshot.elapsedSeconds))}</strong><span>elapsed</span></div>
      <div className="progress-track" role="progressbar" aria-label="Workout progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(snapshot.overallProgress * 100)}><i style={{ width: `${snapshot.overallProgress * 100}%` }} /></div>
      <div><strong>{formatDuration(Math.ceil(snapshot.remainingSeconds))}</strong><span>remaining</span></div>
    </header>
    <section className="run-cue"><span className="sr-only" role="status">{announcement}</span><p className="phase-label">{snapshot.phaseLabel}</p>
      <h1 className="run-intensity">{current.intensity}</h1><strong className="run-time">{formatDuration(Math.ceil(snapshot.intervalRemainingSeconds))}</strong>
      <p className="run-incline">Incline <strong>{current.incline}%</strong></p><p className="run-instruction">{current.cue}</p>
      {state.activeRun?.plan.generationVersion === 1 && <small>Saved session · original timing</small>}
    </section>
    <aside className="run-next"><div className="next-panel" aria-live="polite"><p>{soon ? `NEXT IN ${Math.ceil(snapshot.intervalRemainingSeconds)}…` : 'UP NEXT'}</p>
      <strong>{next?.intensity ?? 'FINISH'}</strong><span>{next ? `${formatDuration(next.durationSeconds)} · Incline ${next.incline}%` : 'Your full session, complete'}</span>
    </div><button className="end-button" onClick={() => dispatch({ type: 'request-end' })}>End workout</button>
      <div className="run-options"><span className="wake-status">{wake === 'active' ? 'Screen awake' : wake === 'denied' ? 'Wake lock denied' : wake === 'unsupported' ? 'Keep screen on' : 'Requesting wake lock'}</span>
        <button aria-pressed={state.preferences.motion && !reduced} onClick={() => dispatch({ type: 'preferences', patch: { motion: !state.preferences.motion } })} disabled={reduced}>Motion {state.preferences.motion && !reduced ? 'on' : 'off'}</button>
      </div>
    </aside>
    {state.confirmEnd && <EndConfirmation dispatch={dispatch} />}
  </main>
}
