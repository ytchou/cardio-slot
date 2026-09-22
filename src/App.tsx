import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { appReducer, createInitialState, machineBusy, sessionActive, toPersistedState } from './app/state'
import { useMachineSequence, useReducedMotion } from './app/useMachineSequence'
import { MachineControls } from './components/MachineControls'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { ReelMachine } from './components/ReelMachine'
import { RunScreen } from './components/RunScreen'
import { TicketDialog } from './components/TicketDialog'
import { TicketHandoff } from './components/TicketHandoff'
import { TicketPrinter } from './components/TicketPrinter'
import { getResultHeadlineKey } from './domain/resultHeadline'
import { getRunSnapshot } from './domain/runtime'
import { generateDifferentWorkout, generateWorkout } from './domain/workout'
import { useInstallPrompt } from './platform/install'
import { createWorkoutSeed } from './platform/random'
import { createResultImage, downloadResultImage } from './platform/share'
import { loadPersistedState, savePersistedState } from './platform/storage'
import { useWakeLock } from './platform/wakeLock'
import { useI18n } from './i18n'
import './styles.css'

export default function App() {
  const { locale, t } = useI18n()
  const [state, dispatch] = useReducer(appReducer, undefined, () => createInitialState(loadPersistedState()))
  const [resultFile, setResultFile] = useState<File | null>(null)
  const [resultPreviewUrl, setResultPreviewUrl] = useState('')
  const [resultImageFailed, setResultImageFailed] = useState(false)
  const [error, setError] = useState(false)
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
    if (!state.latestResult) return
    let cancelled = false
    void createResultImage(state.latestResult.plan, state.latestResult.summary, state.preferences.theme, locale)
      .then(file => { if (!cancelled) setResultFile(file) })
      .catch(() => { if (!cancelled) setResultImageFailed(true) })
    return () => { cancelled = true }
  }, [locale, state.latestResult, state.preferences.theme])
  useEffect(() => {
    if (!resultFile) { setResultPreviewUrl(''); return }
    const url = URL.createObjectURL(resultFile)
    setResultPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [resultFile])
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
      setError(false)
    } catch {
      pullGuard.current = false
      setError(true)
    }
  }
  const pullAnother = () => {
    previousCompletedPlan.current = state.latestResult?.plan ?? null
    dispatch({ type: 'new-workout' })
  }
  const close = () => { dispatch({ type: 'close-ticket' }); window.requestAnimationFrame(() => (ticketReturnFocus.current?.isConnected ? ticketReturnFocus.current : document.querySelector<HTMLButtonElement>('.lever'))?.focus()) }
  const downloadResult = () => { if (resultFile) downloadResultImage(resultFile) }
  const resultHeadline = state.latestResult ? t(getResultHeadlineKey(state.latestResult.plan, state.latestResult.summary)) : ''
  const machineVisible = !active && state.flow !== 'result'
  const showFullHeader = !active && state.flow !== 'ticket'
  return <div className={`app-shell ${active ? 'session-shell' : ''} ${showFullHeader ? 'has-app-header' : ''}`}>
    {showFullHeader && <header className="app-header"><span className="app-wordmark">CARDIO SLOT</span><div className="app-utilities">
      {installPrompt.canInstall && <button className="install-button" aria-label={t('app.install')} onClick={() => void installPrompt.install()}><span className="install-label-full">{t('app.install')}</span><span className="install-label-short" aria-hidden="true">{t('app.installShort')}</span></button>}
      <LanguageSwitcher />
    </div></header>}
    {persistenceFailed && <p className="storage-warning" role="status">{t('app.storageWarning')}</p>}
    {machineVisible && <main className="machine-page">
      <ReelMachine busy={busy} spinning={state.flow === 'spinning'} attention={state.flow === 'configure' && !state.currentTicket} plan={state.currentTicket} requestId={state.requestId} reduced={reduced} pull={pull}>
        <MachineControls preferences={state.preferences} disabled={busy} dispatch={dispatch} deckRef={deckRef} />
        <TicketPrinter flow={state.flow} plan={state.currentTicket} paperRef={paperRef} reopen={button => { ticketReturnFocus.current = button; dispatch({ type: 'open-ticket' }) }} />
      </ReelMachine>
      {error && <p role="alert">{t('app.generationError')}</p>}
    </main>}
    {state.flow === 'opening' && state.currentTicket && <TicketHandoff key={state.requestId} plan={state.currentTicket} reduced={reduced} paperRef={paperRef}
      onSettled={() => dispatch({ type: 'sequence', flow: 'ticket', requestId: state.requestId })} />}
    {state.flow === 'ticket' && state.currentTicket && <TicketDialog key={state.requestId} plan={state.currentTicket}
      onClose={close} onPull={pull} onStart={() => dispatch({ type: 'start-countdown', timestamp: Date.now() })} />}
    {state.flow === 'countdown' && state.activeRun && <main className="countdown-screen"><LanguageSwitcher className="active-language-switcher" /><p>{t('countdown.ready')}</p><strong aria-live="assertive">{Math.max(1, Math.ceil((state.activeRun.startTimestamp - state.now) / 1000))}</strong><p>{t('countdown.instructions')}</p></main>}
    {state.flow === 'running' && runSnapshot && <RunScreen state={state} snapshot={runSnapshot} wake={wakeLockStatus} reduced={reduced} dispatch={dispatch} />}
    {state.flow === 'result' && state.latestResult && <main className="result-screen"><div className="result-copy"><h1>{resultHeadline}</h1></div>
      <section className="result-output" aria-label={t('result.region')}>
        {resultPreviewUrl && <img className="result-preview" src={resultPreviewUrl} width="1080" height="1350" alt={t('result.preview')} />}
        <div className="result-actions"><div className="result-share-actions">
          {!resultFile && !resultImageFailed && <button className="primary-button" disabled>{t('result.preparing')}</button>}
          {resultFile && <button className="primary-button" onClick={downloadResult}>{t('result.download')}</button>}
        </div><button onClick={pullAnother}>{t('ticket.pullAgain')}</button></div>
        {resultImageFailed && <p role="status">{t('result.imageUnavailable')}</p>}
      </section>
    </main>}
    {installPrompt.showIosHelp && <dialog ref={installDialogRef} onCancel={installPrompt.closeIosHelp} className="install-help" aria-labelledby="install-title"><LanguageSwitcher className="dialog-language-switcher" /><h2 id="install-title">{t('app.installTitle')}</h2><p>{t('app.installInstructions')}</p><button autoFocus onClick={installPrompt.closeIosHelp}>{t('app.gotIt')}</button></dialog>}
  </div>
}
