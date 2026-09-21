import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { appReducer, createInitialState, machineBusy, sessionActive, toPersistedState } from './app/state'
import { useMachineSequence, useReducedMotion } from './app/useMachineSequence'
import { MachineControls } from './components/MachineControls'
import { ReelMachine } from './components/ReelMachine'
import { RunScreen } from './components/RunScreen'
import { Ticket } from './components/Ticket'
import { TicketDialog } from './components/TicketDialog'
import { TicketPrinter } from './components/TicketPrinter'
import { getRunSnapshot } from './domain/runtime'
import { generateDifferentWorkout, generateWorkout } from './domain/workout'
import { useInstallPrompt } from './platform/install'
import { createWorkoutSeed } from './platform/random'
import { canShareResultImage, copyResultSummary, createResultImage, downloadResultImage, shareResultImage } from './platform/share'
import { loadPersistedState, savePersistedState } from './platform/storage'
import { useWakeLock } from './platform/wakeLock'
import './styles.css'

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, () => createInitialState(loadPersistedState()))
  const [resultFile, setResultFile] = useState<File | null>(null)
  const [resultPreviewUrl, setResultPreviewUrl] = useState('')
  const [resultImageFailed, setResultImageFailed] = useState(false)
  const [coarsePointer, setCoarsePointer] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const [shareMessage, setShareMessage] = useState('')
  const [error, setError] = useState('')
  const [persistenceFailed, setPersistenceFailed] = useState(false)
  const [updateReady, setUpdateReady] = useState(false)
  const pullGuard = useRef(false)
  const previousCompletedPlan = useRef(state.latestResult?.plan ?? null)
  const requestId = useRef(0)
  const deckRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const installDialogRef = useRef<HTMLDialogElement>(null)
  const ticketReturnFocus = useRef<HTMLElement | null>(null)
  const installPrompt = useInstallPrompt()
  useEffect(() => {
    const dialog = installDialogRef.current
    if (!installPrompt.showIosHelp || !dialog) return
    dialog.showModal()
    return () => dialog.close()
  }, [installPrompt.showIosHelp])
  const reduced = useReducedMotion()
  const busy = machineBusy(state.flow)
  const active = sessionActive(state.flow)
  const wakeLockStatus = useWakeLock(active)
  useMachineSequence(state, dispatch, reduced)
  const { updateServiceWorker } = useRegisterSW({ onNeedRefresh: () => setUpdateReady(true) })
  const runSnapshot = useMemo(() => state.activeRun ? getRunSnapshot(state.activeRun.plan, state.activeRun.startTimestamp, state.now) : null, [state.activeRun, state.now])
  const durable = useMemo(() => toPersistedState(state), [state.preferences, state.currentTicket, state.activeRun, state.latestResult])
  useEffect(() => { setPersistenceFailed(!savePersistedState(durable)) }, [durable])
  useEffect(() => { document.documentElement.dataset.theme = state.preferences.theme }, [state.preferences.theme])
  useEffect(() => { if (!busy) pullGuard.current = false }, [busy])
  useEffect(() => {
    if (!active) return
    const tick = () => dispatch({ type: 'tick', timestamp: Date.now() })
    const onVisibility = () => { if (document.visibilityState === 'visible') tick() }
    tick()
    const timer = window.setInterval(tick, 200)
    document.addEventListener('visibilitychange', onVisibility)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility) }
  }, [active])
  useEffect(() => {
    setResultFile(null)
    setResultImageFailed(false)
    setShareMessage('')
    if (!state.latestResult) return
    let cancelled = false
    void createResultImage(state.latestResult.plan, state.latestResult.summary, state.preferences.theme)
      .then(file => { if (!cancelled) setResultFile(file) })
      .catch(() => { if (!cancelled) { setResultImageFailed(true); setShareMessage('Image preparation is unavailable in this browser.') } })
    return () => { cancelled = true }
  }, [state.latestResult, state.preferences.theme])
  useEffect(() => {
    if (!resultFile) { setResultPreviewUrl(''); return }
    const url = URL.createObjectURL(resultFile)
    setResultPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [resultFile])
  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)')
    const update = () => setCoarsePointer(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (!updateReady || active || busy || persistenceFailed) return
    if (savePersistedState(durable)) void updateServiceWorker(true)
    else setPersistenceFailed(true)
  }, [active, busy, durable, persistenceFailed, updateReady, updateServiceWorker])

  const pull = () => {
    if (pullGuard.current || busy || !['configure', 'ticket'].includes(state.flow)) return
    ticketReturnFocus.current = document.querySelector<HTMLButtonElement>('.lever')
    pullGuard.current = true
    try {
      const { durationMinutes, includeWarmup, includeCooldown } = state.preferences
      const request = { durationMinutes, includeWarmup, includeCooldown }
      const seed = createWorkoutSeed()
      const plan = previousCompletedPlan.current
        ? generateDifferentWorkout(request, seed, previousCompletedPlan.current)
        : generateWorkout(request, seed)
      dispatch({ type: 'pull', requestId: ++requestId.current, plan })
      previousCompletedPlan.current = null
      setError('')
    } catch {
      pullGuard.current = false
      setError('The ticket could not be generated. Please pull again.')
    }
  }
  const pullAnother = () => {
    previousCompletedPlan.current = state.latestResult?.plan ?? null
    dispatch({ type: 'new-workout' })
  }
  const close = () => { dispatch({ type: 'close-ticket' }); window.requestAnimationFrame(() => (ticketReturnFocus.current?.isConnected ? ticketReturnFocus.current : document.querySelector<HTMLButtonElement>('.lever'))?.focus()) }
  const shareResult = () => {
    if (!resultFile) return
    void shareResultImage(resultFile).then(() => setShareMessage('Shared.')).catch(failure => {
      if (!(failure instanceof DOMException && failure.name === 'AbortError')) setShareMessage('Sharing did not finish. Try again.')
    })
  }
  const downloadResult = () => { if (resultFile) { downloadResultImage(resultFile); setShareMessage('PNG downloaded.') } }
  const copySummary = () => {
    if (!state.latestResult) return
    void copyResultSummary(state.latestResult.plan, state.latestResult.summary)
      .then(() => setShareMessage('Summary copied.'))
      .catch(() => setShareMessage('Summary could not be copied.'))
  }
  const canShareImage = resultFile ? canShareResultImage(resultFile) : false
  const canCopySummary = Boolean(navigator.clipboard?.writeText)
  const machineVisible = !active && state.flow !== 'result'
  return <div className={`app-shell ${active ? 'session-shell' : ''}`}>
    {persistenceFailed && <p className="storage-warning" role="status">Saving is unavailable. Keep this tab open to retain this session.</p>}
    {machineVisible && <main className="machine-page">
      <p className="intro">Pull a workout. Run by feel.</p>
      <ReelMachine busy={busy} spinning={state.flow === 'spinning'} plan={state.currentTicket} requestId={state.requestId} reduced={reduced} pull={pull}>
        <MachineControls preferences={state.preferences} disabled={busy} dispatch={dispatch} deckRef={deckRef} />
        <TicketPrinter flow={state.flow} plan={state.currentTicket} paperRef={paperRef} reopen={button => { ticketReturnFocus.current = button; dispatch({ type: 'open-ticket' }) }} />
      </ReelMachine>
      {error && <p role="alert">{error}</p>}
      {installPrompt.canInstall && <footer className="machine-footer"><button onClick={() => void installPrompt.install()}>Install app</button></footer>}
    </main>}
    {(state.flow === 'opening' || state.flow === 'ticket') && state.currentTicket && <TicketDialog key={state.requestId} plan={state.currentTicket} opening={state.flow === 'opening'} reduced={reduced} paperRef={paperRef}
      onClose={close} onPull={pull} onStart={() => dispatch({ type: 'start-countdown', timestamp: Date.now() })}
      onSettled={() => dispatch({ type: 'sequence', flow: 'ticket', requestId: state.requestId })} />}
    {state.flow === 'countdown' && state.activeRun && <main className="countdown-screen"><p>GET READY</p><strong aria-live="assertive">{Math.max(1, Math.ceil((state.activeRun.startTimestamp - state.now) / 1000))}</strong><p>Find your stride. Your session starts in a moment.</p></main>}
    {state.flow === 'running' && runSnapshot && <RunScreen state={state} snapshot={runSnapshot} wake={wakeLockStatus} reduced={reduced} dispatch={dispatch} />}
    {state.flow === 'result' && state.latestResult && <main className="result-screen"><div className="result-copy"><h1>{state.latestResult.summary.status === 'completed' ? 'Nice work.' : 'You called it.'}</h1><p>{state.latestResult.summary.status === 'completed' ? 'The whole ticket, start to finish.' : 'Listening to your body always counts.'}</p></div>
      <Ticket plan={state.latestResult.plan} result={state.latestResult.summary}>
        {resultPreviewUrl && <img className="result-preview" src={resultPreviewUrl} width="1080" height="1350" alt="Shareable workout result preview" />}
        <div className="result-actions"><div className="result-share-actions">
          {!resultFile && !resultImageFailed && <button className="primary-button" disabled>Preparing image…</button>}
          {resultFile && coarsePointer && <>
            {canShareImage && <button className="primary-button" onClick={shareResult}>Share image</button>}
            <button className={canShareImage ? undefined : 'primary-button'} onClick={downloadResult}>Save PNG</button>
            {canCopySummary && <button onClick={copySummary}>Copy summary</button>}
          </>}
          {resultFile && !coarsePointer && <>
            <button className="primary-button" onClick={downloadResult}>Download PNG</button>
            {canCopySummary && <button onClick={copySummary}>Copy summary</button>}
            {canShareImage && <button onClick={shareResult}>Share image</button>}
          </>}
          {!resultFile && resultImageFailed && canCopySummary && <button className="primary-button" onClick={copySummary}>Copy summary</button>}
        </div><button onClick={pullAnother}>Pull another</button></div>
        {shareMessage && <p role="status">{shareMessage}</p>}
      </Ticket>
    </main>}
    {installPrompt.showIosHelp && <dialog ref={installDialogRef} onCancel={installPrompt.closeIosHelp} className="install-help" aria-labelledby="install-title"><h2 id="install-title">Add to Home Screen</h2><p>In Safari, tap Share, then choose “Add to Home Screen.” Your workouts launch full screen and stay available offline.</p><button autoFocus onClick={installPrompt.closeIosHelp}>Got it</button></dialog>}
  </div>
}
