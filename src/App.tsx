import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { appReducer, createInitialState, toPersistedState } from './app/state'
import { ReelMachine } from './components/ReelMachine'
import { formatDuration, Ticket } from './components/Ticket'
import { DURATION_DEFINITIONS, FINISH_LABELS, FOCUS_LABELS, PATTERN_LABELS, THEMES } from './domain/config'
import { getIntervalTransition, getRunSnapshot } from './domain/runtime'
import type { DurationMinutes, ThemeId } from './domain/types'
import { generateWorkout } from './domain/workout'
import { useInstallPrompt } from './platform/install'
import { createWorkoutSeed } from './platform/random'
import { createResultImage, shareOrDownloadResult } from './platform/share'
import { loadPersistedState, savePersistedState } from './platform/storage'
import { useWakeLock } from './platform/wakeLock'
import './styles.css'

const COUNTDOWN_SECONDS = 5

function formatSeconds(seconds: number) {
  return formatDuration(Math.max(0, Math.ceil(seconds)))
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, () => createInitialState(loadPersistedState()))
  const [resultFile, setResultFile] = useState<File | null>(null)
  const [shareMessage, setShareMessage] = useState('')
  const [updateReady, setUpdateReady] = useState(false)
  const lastTransitionId = useRef<string | null>(null)
  const installPrompt = useInstallPrompt()
  const wakeLockStatus = useWakeLock(state.flow === 'running')
  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh: () => setUpdateReady(true),
  })

  const runSnapshot = useMemo(() => state.activeRun
    ? getRunSnapshot(state.activeRun.plan, state.activeRun.startTimestamp, state.now)
    : null, [state.activeRun, state.now])

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
    savePersistedState(toPersistedState(state))
  }, [state])

  useEffect(() => {
    if (state.flow !== 'spinning' || state.pendingSeed === null) return
    const timer = window.setTimeout(() => {
      dispatch({ type: 'reveal', plan: generateWorkout(state.duration, state.pendingSeed ?? 0) })
    }, 2_150)
    return () => window.clearTimeout(timer)
  }, [state.duration, state.flow, state.pendingSeed])

  useEffect(() => {
    if (state.flow !== 'countdown' && state.flow !== 'running') return
    const tick = () => dispatch({ type: 'tick', timestamp: Date.now() })
    tick()
    const timer = window.setInterval(tick, state.flow === 'countdown' ? 100 : 250)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [state.flow])

  useEffect(() => {
    if (state.flow !== 'countdown' || state.countdownStartedAt === null) return
    const startTimestamp = state.countdownStartedAt + COUNTDOWN_SECONDS * 1000
    if (state.now >= startTimestamp) dispatch({ type: 'start-run', timestamp: startTimestamp })
  }, [state.countdownStartedAt, state.flow, state.now])

  useEffect(() => {
    if (!runSnapshot?.currentInterval) return
    const reason = document.visibilityState === 'visible' && lastTransitionId.current ? 'tick' : 'resume'
    const transition = getIntervalTransition(runSnapshot, lastTransitionId.current, reason)
    if (transition) lastTransitionId.current = transition.interval.id
  }, [runSnapshot])

  useEffect(() => {
    if (!state.latestResult || !state.currentTicket) {
      setResultFile(null)
      return
    }
    let cancelled = false
    void createResultImage(state.currentTicket, state.latestResult, state.theme)
      .then((file) => { if (!cancelled) setResultFile(file) })
      .catch(() => { if (!cancelled) setShareMessage('Image preparation is unavailable in this browser.') })
    return () => { cancelled = true }
  }, [state.currentTicket, state.latestResult, state.theme])

  useEffect(() => {
    if (!updateReady || state.flow === 'running' || state.flow === 'countdown') return
    void updateServiceWorker(true)
  }, [state.flow, updateReady, updateServiceWorker])

  const pull = () => dispatch({ type: 'pull', seed: createWorkoutSeed() })
  const countdownNumber = state.countdownStartedAt === null
    ? COUNTDOWN_SECONDS
    : Math.max(1, Math.ceil(COUNTDOWN_SECONDS - (state.now - state.countdownStartedAt) / 1000))

  const shareResult = async () => {
    if (!resultFile) return
    try {
      const outcome = await shareOrDownloadResult(resultFile)
      setShareMessage(outcome === 'shared' ? 'Shared.' : 'PNG downloaded.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareMessage('Sharing did not finish. Try again.')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="wordmark" onClick={() => dispatch({ type: 'new-workout' })} aria-label="Cardio Slot home">
          <span className="wordmark-mark" aria-hidden="true">CS</span>
          <span>CARDIO SLOT</span>
        </button>
        <div className="topbar-actions">
          <span className="offline-badge"><i /> READY OFFLINE</span>
          {installPrompt.canInstall && <button className="text-button" onClick={() => void installPrompt.install()}>Install app</button>}
        </div>
      </header>

      {installPrompt.showIosHelp && (
        <div className="install-help" role="dialog" aria-modal="true" aria-labelledby="install-title">
          <div>
            <button className="close-button" onClick={installPrompt.closeIosHelp} aria-label="Close install help">×</button>
            <h2 id="install-title">Add to Home Screen</h2>
            <p>In Safari, tap Share, then choose “Add to Home Screen.” Your workouts will launch full screen and stay available offline.</p>
            <button className="secondary-button" onClick={installPrompt.closeIosHelp}>Got it</button>
          </div>
        </div>
      )}

      {(state.flow === 'configure' || state.flow === 'spinning' || state.flow === 'ticket') && (
        <main className="machine-layout">
          <section className="control-panel" aria-labelledby="control-title">
            <div className="panel-index">TREADMILL WORKOUT GENERATOR / 01</div>
            <h1 id="control-title">Pull a run.<br />Follow the cues.</h1>
            <p className="intro">A different treadmill session every time—built from safe visual intervals, never speed prescriptions.</p>

            <fieldset>
              <legend>How long?</legend>
              <div className="segmented duration-options">
                {(Object.keys(DURATION_DEFINITIONS).map(Number) as DurationMinutes[]).map((duration) => (
                  <button key={duration} className={state.duration === duration ? 'selected' : ''} onClick={() => dispatch({ type: 'set-duration', duration })} aria-pressed={state.duration === duration}>
                    <strong>{duration}</strong><span>MIN</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Choose a skin</legend>
              <div className="theme-options">
                {(Object.keys(THEMES) as ThemeId[]).map((theme) => (
                  <button key={theme} className={state.theme === theme ? 'selected' : ''} onClick={() => dispatch({ type: 'set-theme', theme })} aria-pressed={state.theme === theme}>
                    <i className={`theme-swatch swatch-${theme}`} aria-hidden="true" />
                    <span><strong>{THEMES[theme].label}</strong><small>{THEMES[theme].description}</small></span>
                  </button>
                ))}
              </div>
            </fieldset>

            <aside className="safety-note">
              <strong>Run by feel.</strong>
              <p>Choose your own speeds, adjust freely, and stop if you feel pain, dizziness, or unwell.</p>
            </aside>
          </section>

          <section className="slot-panel" aria-label="Workout slot machine">
            <div className="machine-screws" aria-hidden="true"><i /><i /></div>
            <p className="machine-label">FOCUS / PATTERN / FINISH</p>
            <ReelMachine spinning={state.flow === 'spinning'} plan={state.currentTicket} />
            <button className={`pull-button ${state.flow === 'spinning' ? 'is-pulling' : ''}`} onClick={pull} disabled={state.flow === 'spinning'}>
              <span className="lever-knob" aria-hidden="true" />
              <span>{state.flow === 'ticket' ? 'PULL AGAIN' : state.flow === 'spinning' ? 'SPINNING' : 'PULL WORKOUT'}</span>
            </button>

            {state.flow === 'ticket' && state.currentTicket && (
              <div className="ticket-stage">
                <Ticket plan={state.currentTicket}>
                  <div className="bookend-controls">
                    <label><input type="checkbox" checked={state.currentTicket.includeWarmup} onChange={(event) => dispatch({ type: 'toggle-bookend', kind: 'warmup', included: event.target.checked })} /> Warm-up</label>
                    <label><input type="checkbox" checked={state.currentTicket.includeCooldown} onChange={(event) => dispatch({ type: 'toggle-bookend', kind: 'cooldown', included: event.target.checked })} /> Cool-down</label>
                  </div>
                  <button className="primary-button ticket-start" onClick={() => dispatch({ type: 'start-countdown', timestamp: Date.now() })}>Start workout</button>
                </Ticket>
              </div>
            )}
            {state.flow !== 'ticket' && <p className="machine-hint">One pull builds a complete session.<br />Every pick is checked before it prints.</p>}
          </section>
        </main>
      )}

      {state.flow === 'countdown' && state.currentTicket && (
        <main className="countdown-screen" aria-live="assertive">
          <p>GET READY</p>
          <strong>{countdownNumber}</strong>
          <span>{FOCUS_LABELS[state.currentTicket.focus]} / {PATTERN_LABELS[state.currentTicket.pattern]} / {FINISH_LABELS[state.currentTicket.finish]}</span>
        </main>
      )}

      {state.flow === 'running' && state.currentTicket && runSnapshot?.currentInterval && (
        <main className={`run-screen intensity-${runSnapshot.currentInterval.intensity} ${runSnapshot.intervalRemainingSeconds <= 5 && runSnapshot.nextInterval ? 'is-transitioning' : ''}`}>
          <header className="run-header">
            <span>BLOCK {runSnapshot.blockIndex + 1} / {runSnapshot.blockCount}</span>
            <span className={`wake-status wake-${wakeLockStatus}`}><i /> {wakeLockStatus === 'active' ? 'SCREEN AWAKE' : wakeLockStatus === 'unsupported' ? 'KEEP SCREEN ON' : wakeLockStatus === 'denied' ? 'WAKE LOCK DENIED' : 'REQUESTING WAKE LOCK'}</span>
          </header>
          <section className="run-cue" aria-live="polite">
            <p className="run-intensity">{runSnapshot.currentInterval.intensity}</p>
            <strong className="run-time">{formatSeconds(runSnapshot.intervalRemainingSeconds)}</strong>
            <p className="run-incline">INCLINE <strong>{runSnapshot.currentInterval.incline}%</strong></p>
            <p className="run-instruction">{runSnapshot.currentInterval.cue}</p>
            <div className="next-cue">
              <span>NEXT</span>
              <strong>{runSnapshot.nextInterval ? `${runSnapshot.nextInterval.intensity.toUpperCase()} · ${runSnapshot.nextInterval.incline}%` : 'FINISH'}</strong>
              {runSnapshot.intervalRemainingSeconds <= 5 && runSnapshot.nextInterval && <em>IN {Math.ceil(runSnapshot.intervalRemainingSeconds)}</em>}
            </div>
          </section>
          <footer className="run-footer">
            <div className="progress-meta"><span>{formatSeconds(runSnapshot.elapsedSeconds)} ELAPSED</span><span>{formatSeconds(runSnapshot.remainingSeconds)} LEFT</span></div>
            <div className="progress-track"><i style={{ width: `${runSnapshot.overallProgress * 100}%` }} /></div>
            {!state.confirmEnd ? (
              <button className="end-button" onClick={() => dispatch({ type: 'request-end' })}>End workout</button>
            ) : (
              <div className="end-confirm" role="dialog" aria-label="Confirm end workout">
                <span>End this session now?</span>
                <button onClick={() => dispatch({ type: 'cancel-end' })}>Keep running</button>
                <button className="danger-button" onClick={() => dispatch({ type: 'end-run', timestamp: Date.now() })}>Yes, end</button>
              </div>
            )}
          </footer>
        </main>
      )}

      {state.flow === 'result' && state.currentTicket && state.latestResult && (
        <main className="result-screen">
          <div className="result-copy">
            <p>{state.latestResult.status === 'completed' ? 'RUN BANKED' : 'EFFORT RECORDED'}</p>
            <h1>{state.latestResult.status === 'completed' ? 'Nice work.' : 'You called it.'}</h1>
            <span>{state.latestResult.status === 'completed' ? 'The whole ticket, start to finish.' : 'Listening to your body always counts.'}</span>
          </div>
          <Ticket plan={state.currentTicket} result={state.latestResult}>
            <div className="result-actions">
              <button className="primary-button" disabled={!resultFile} onClick={() => void shareResult()}>{resultFile ? 'Share result' : 'Preparing image…'}</button>
              <button className="secondary-button" onClick={() => dispatch({ type: 'new-workout' })}>Pull another</button>
            </div>
            {shareMessage && <p className="share-message" role="status">{shareMessage}</p>}
          </Ticket>
        </main>
      )}

      <footer className="site-footer"><span>VISUAL CUES ONLY · NO SPEED TARGETS</span><span>v1.0 / BUILT FOR THE TREADMILL</span></footer>
    </div>
  )
}

