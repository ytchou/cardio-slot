import { useId, useState, type KeyboardEvent } from 'react'
import { FINISH_LABELS, FOCUS_LABELS, PATTERN_LABELS } from '../domain/config'
import type { Intensity, ResultSummary, WorkoutPlan } from '../domain/types'

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
  const accordionId = useId()
  const [openBlockId, setOpenBlockId] = useState(() => plan.blocks.find(block => block.kind === 'main')?.id ?? plan.blocks.at(0)?.id ?? null)
  const movePhaseFocus = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const buttons = Array.from(event.currentTarget.closest('.ticket-body')?.querySelectorAll<HTMLButtonElement>('.ticket-phase-toggle') ?? [])
    const current = buttons.indexOf(event.currentTarget)
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    event.preventDefault()
    buttons.at(target)?.focus()
  }
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
        <aside className="ticket-safety"><strong>Before you start</strong><p>Pace by feel. Adjust freely. Stop if you feel pain, dizziness, or unwell.</p></aside>
        {plan.blocks.map(block => {
          const duration = block.intervals.reduce((total, interval) => total + interval.durationSeconds, 0)
          const effortSeconds: Record<Intensity, number> = { easy: 0, strong: 0, max: 0 }
          for (const interval of block.intervals) effortSeconds[interval.intensity] += interval.durationSeconds
          const efforts = (Object.keys(effortSeconds) as Intensity[]).filter(effort => effortSeconds[effort] > 0)
          const headingId = `${accordionId}-${block.id}-heading`
          const regionId = `${accordionId}-${block.id}-region`
          const expanded = openBlockId === block.id
          return <section className="ticket-phase" key={block.id}>
            <h3><button id={headingId} className="ticket-phase-toggle" type="button" aria-expanded={expanded} aria-controls={regionId} onClick={() => setOpenBlockId(block.id)} onKeyDown={movePhaseFocus}>
              <span className="ticket-phase-title"><span>{block.label}</span><span>{formatDuration(duration)}</span></span>
              <span className="ticket-phase-meta">{block.intervals.length} {block.intervals.length === 1 ? 'interval' : 'intervals'} · {efforts.map(effort => effort[0]?.toUpperCase() + effort.slice(1)).join(' · ')}</span>
              <span className="ticket-effort-strip" aria-label={`Effort mix: ${efforts.map(effort => `${effort} ${formatDuration(effortSeconds[effort])}`).join(', ')}`}>
                {efforts.map(effort => <i className={`effort-strip-${effort}`} key={effort} style={{ flexGrow: effortSeconds[effort] }} />)}
              </span>
            </button></h3>
            <div id={regionId} role="region" aria-labelledby={headingId} hidden={!expanded}>
              <ol>{block.intervals.map(interval => <li key={interval.id} data-interval-id={interval.id}>
                <div className="ticket-interval"><time>{formatDuration(interval.durationSeconds)}</time><strong>{interval.intensity}</strong><span>{interval.incline}%</span></div><p>{interval.cue}</p>
              </li>)}</ol>
            </div>
          </section>
        })}
      </div>
    </>}
    {plan.generationVersion === 1 && <p>Saved session · original timing</p>}
    {children}
  </article>
}
