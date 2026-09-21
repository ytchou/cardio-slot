import { useId, useState, type KeyboardEvent } from 'react'
import { TEMPLATE_LABELS } from '../domain/config'
import type { Intensity, ResultSummary, WorkoutBlock, WorkoutInterval, WorkoutPlan } from '../domain/types'

const EFFORT_GUIDE_COPY: Record<Intensity, string> = {
  easy: 'You can speak in full sentences.',
  strong: 'You can speak in short phrases.',
  max: 'You can only manage a few words.',
  recovery: 'Walk or jog very easily until ready.',
}

const EFFORTS: Intensity[] = ['easy', 'strong', 'max', 'recovery']
const EFFORT_LABELS: Record<Intensity, string> = { easy: 'Easy', strong: 'Strong', max: 'Max', recovery: 'Walk / Easy' }

export function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
}

export function TicketHeading({ plan }: { plan: WorkoutPlan }) {
  return <header className="ticket-heading"><span className="ticket-brand">CARDIO SLOT</span><h2>Workout of the day</h2>
    <p className="ticket-duration"><strong>{formatDuration(plan.effectiveDurationSeconds)}</strong> total</p>
  </header>
}

function IntervalCards({ intervals }: { intervals: WorkoutInterval[] }) {
  return <ol className="ticket-interval-cards" aria-label="Intervals">
    {intervals.map(interval => <li className={`interval-card-${interval.intensity}`} key={interval.id} data-interval-id={interval.id}>
      <time>{formatDuration(interval.durationSeconds)}</time>
      <strong className={`ticket-effort-label effort-label-${interval.intensity}`}>{EFFORT_LABELS[interval.intensity]}</strong>
      <span><small>Incline</small>{interval.incline}%</span>
    </li>)}
  </ol>
}

function StaticPhase({ block }: { block: WorkoutBlock }) {
  const interval = block.intervals.at(0)
  if (!interval) return null
  const duration = block.intervals.reduce((total, current) => total + current.durationSeconds, 0)
  if (block.kind === 'recovery') return <section className="ticket-static-phase ticket-recovery" data-phase-kind="recovery" data-interval-id={interval.id}>
    <div><strong>Walk / Easy</strong><time>{formatDuration(duration)}</time></div><p>Walk or jog very easily until ready.</p>
  </section>
  return <section className={`ticket-static-phase ticket-${block.kind}`} data-phase-kind={block.kind} data-interval-id={interval.id}>
    <div><strong>{block.label}</strong><time>{formatDuration(duration)}</time></div><p><span>{EFFORT_LABELS[interval.intensity]}</span><span>Incline {interval.incline}%</span></p>
  </section>
}

function EffortGuide() {
  const tooltipId = useId()
  return <aside className="ticket-effort-guide" aria-label="Effort guide">
    <strong className="ticket-effort-guide-title">Effort guide</strong>
    <div className="ticket-effort-guide-controls">
      {EFFORTS.map(effort => <span key={effort} role="term" tabIndex={0} className={`ticket-effort-chip effort-label-${effort}`}
        aria-label={EFFORT_LABELS[effort]} aria-describedby={`${tooltipId}-${effort}`}>{EFFORT_LABELS[effort]}
        <span id={`${tooltipId}-${effort}`} role="tooltip" className="ticket-effort-tooltip">{EFFORT_GUIDE_COPY[effort]}</span>
      </span>)}
    </div>
  </aside>
}

export function Ticket({ plan, result, children }: { plan: WorkoutPlan; result?: ResultSummary; children?: React.ReactNode }) {
  const accordionId = useId()
  const descriptor = TEMPLATE_LABELS[plan.templateType]
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
        {EFFORTS.map(effort => <div key={effort}><span>{EFFORT_LABELS[effort]}</span><strong>{formatDuration(result.intensitySeconds[effort])}</strong></div>)}
        <div><span>Top incline</span><strong>{result.maximumIncline}%</strong></div>
      </div></> : <>
      <TicketHeading plan={plan} />
      <div className="ticket-body" tabIndex={0} aria-label="Workout instructions">
        <aside className="ticket-safety"><strong>Before you start</strong><p>Pace by feel. Adjust freely. Stop if you feel pain, dizziness, or unwell.</p></aside>
        <EffortGuide />
        {plan.blocks.map(block => {
          if (block.kind !== 'main') return <StaticPhase block={block} key={block.id} />
          const duration = block.intervals.reduce((total, interval) => total + interval.durationSeconds, 0)
          const effortSeconds: Record<Intensity, number> = { easy: 0, strong: 0, max: 0, recovery: 0 }
          for (const interval of block.intervals) effortSeconds[interval.intensity] += interval.durationSeconds
          const efforts = (Object.keys(effortSeconds) as Intensity[]).filter(effort => effortSeconds[effort] > 0)
          const headingId = `${accordionId}-${block.id}-heading`
          const regionId = `${accordionId}-${block.id}-region`
          const expanded = openBlockId === block.id
          return <section className="ticket-phase" key={block.id}>
            <h3><button id={headingId} className="ticket-phase-toggle" type="button" aria-expanded={expanded} aria-controls={regionId} onClick={() => setOpenBlockId(current => current === block.id ? null : block.id)} onKeyDown={movePhaseFocus}>
              <span className="ticket-phase-title"><span>{block.label}</span><span>{formatDuration(duration)}</span><small>{descriptor}</small></span>
              <span className="ticket-phase-meta">{block.intervals.length} {block.intervals.length === 1 ? 'interval' : 'intervals'} · {efforts.map(effort => EFFORT_LABELS[effort]).join(' · ')}</span>
              <span className="ticket-effort-strip" aria-label={`Effort mix: ${efforts.map(effort => `${EFFORT_LABELS[effort]} ${formatDuration(effortSeconds[effort])}`).join(', ')}`}>
                {efforts.map(effort => <i className={`effort-strip-${effort}`} key={effort} style={{ flexGrow: effortSeconds[effort] }} />)}
              </span>
            </button></h3>
            <div id={regionId} role="region" aria-labelledby={headingId} hidden={!expanded}>
              <IntervalCards intervals={block.intervals} />
            </div>
          </section>
        })}
      </div>
    </>}
    {children}
  </article>
}
