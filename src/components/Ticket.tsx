import { FINISH_LABELS, FOCUS_LABELS, PATTERN_LABELS } from '../domain/config'
import type { ResultSummary, WorkoutPlan } from '../domain/types'

interface TicketProps {
  plan: WorkoutPlan
  result?: ResultSummary | null
  children?: React.ReactNode
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

export function Ticket({ plan, result, children }: TicketProps) {
  const mainBlocks = plan.blocks.filter((block) => block.kind === 'main')
  const heading = result ? (result.status === 'completed' ? 'COMPLETED' : 'SESSION ENDED') : 'YOUR WORKOUT'
  return (
    <article className={`ticket ${result?.status === 'completed' ? 'ticket-complete' : ''}`} aria-label={result ? 'Workout result ticket' : 'Workout plan ticket'}>
      <div className="ticket-tear" aria-hidden="true" />
      <header className="ticket-header">
        <span className="ticket-brand">CARDIO SLOT</span>
        <span>{result ? new Date(result.dateIso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : `SEED ${plan.seed.toString(16).toUpperCase().padStart(8, '0')}`}</span>
      </header>
      <h2>{heading}</h2>
      <p className="ticket-reels">
        <strong>{FOCUS_LABELS[plan.focus]}</strong>
        <span>{PATTERN_LABELS[plan.pattern]}</span>
        <span>{FINISH_LABELS[plan.finish]}</span>
      </p>

      {result ? (
        <div className="result-grid">
          <div><span>Time</span><strong>{formatDuration(result.elapsedSeconds)} / {formatDuration(result.plannedSeconds)}</strong></div>
          <div><span>Blocks</span><strong>{result.blockCount}</strong></div>
          <div><span>Easy</span><strong>{formatDuration(result.intensitySeconds.easy)}</strong></div>
          <div><span>Strong</span><strong>{formatDuration(result.intensitySeconds.strong)}</strong></div>
          <div><span>Max</span><strong>{formatDuration(result.intensitySeconds.max)}</strong></div>
          <div><span>Top incline</span><strong>{result.maximumIncline}%</strong></div>
        </div>
      ) : (
        <>
          <div className="ticket-duration">
            <span>Run time</span>
            <strong>{formatDuration(plan.effectiveDurationSeconds)}</strong>
          </div>
          <ol className="block-list">
            {plan.blocks.filter((block) =>
              (block.kind !== 'warmup' || plan.includeWarmup) && (block.kind !== 'cooldown' || plan.includeCooldown),
            ).map((block) => (
              <li key={block.id}>
                <span>{block.label}</span>
                <span>{formatDuration(block.intervals.reduce((total, interval) => total + interval.durationSeconds, 0))}</span>
                <span>{block.kind === 'main' ? `${block.intervals.length} cues` : 'Easy · 1%'}</span>
              </li>
            ))}
          </ol>
          <p className="ticket-footnote">{mainBlocks.length} main blocks · Incline 1–8% · Pace by feel</p>
        </>
      )}
      {children}
      <div className="ticket-code" aria-hidden="true">|||| || ||||| | |||| ||| |</div>
    </article>
  )
}
