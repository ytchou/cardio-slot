import { FINISH_LABELS, FOCUS_LABELS, PATTERN_LABELS } from '../domain/config'
import { getEffectiveIntervals } from '../domain/timeline'
import type { ResultSummary, WorkoutPlan } from '../domain/types'

export function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
}

export function TicketHeading({ plan }: { plan: WorkoutPlan }) {
  return <header className="ticket-heading"><span className="ticket-brand">CARDIO SLOT</span><h2>Your workout</h2>
    <p className="ticket-reels">{FOCUS_LABELS[plan.focus]} / {PATTERN_LABELS[plan.pattern]} / {FINISH_LABELS[plan.finish]}</p>
    <p className="ticket-duration"><strong>{formatDuration(plan.effectiveDurationSeconds)}</strong> total</p>
  </header>
}

export function Ticket({ plan, result, children }: { plan: WorkoutPlan; result?: ResultSummary; children?: React.ReactNode }) {
  const intervals = getEffectiveIntervals(plan)
  const inclines = intervals.map(interval => interval.incline)
  return <article className="ticket" aria-label={result ? 'Workout result ticket' : 'Workout plan ticket'}>
    {result ? <><header className="ticket-heading"><span className="ticket-brand">CARDIO SLOT</span><h2>{result.status === 'completed' ? 'COMPLETED' : 'SESSION ENDED'}</h2></header>
      <div className="result-grid">
        <div><span>Time</span><strong>{formatDuration(result.elapsedSeconds)} / {formatDuration(result.plannedSeconds)}</strong></div>
        <div><span>Main blocks planned</span><strong>{result.blockCount}</strong></div>
        {(['easy', 'strong', 'max'] as const).map(effort => <div key={effort}><span>{effort}</span><strong>{formatDuration(result.intensitySeconds[effort])}</strong></div>)}
        <div><span>Top incline</span><strong>{result.maximumIncline}%</strong></div>
      </div></> : <>
      <TicketHeading plan={plan} />
      <div className="ticket-body" tabIndex={0} aria-label="Workout instructions">
        {plan.blocks.map(block => <section className="ticket-phase" key={block.id}><h3><span>{block.label}</span><span>{formatDuration(block.intervals.reduce((total, interval) => total + interval.durationSeconds, 0))}</span></h3>
          <ol>{block.intervals.map(interval => <li key={interval.id} data-interval-id={interval.id}>
            <div className="ticket-interval"><time>{formatDuration(interval.durationSeconds)}</time><strong>{interval.intensity}</strong><span>{interval.incline}%</span></div><p>{interval.cue}</p>
          </li>)}</ol>
        </section>)}
        <p>{plan.blocks.filter(block => block.kind === 'main').length} main blocks · Incline {Math.min(...inclines)}–{Math.max(...inclines)}%</p>
        <p className="ticket-seed">Seed {plan.seed.toString(16).toUpperCase().padStart(8, '0')}</p>
        <p>Pace by feel. Adjust freely. Stop if you feel pain, dizziness, or unwell.</p>
      </div>
    </>}
    {plan.generationVersion === 1 && <p>Saved session · original timing</p>}
    {children}
  </article>
}
