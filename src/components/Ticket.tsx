import { useId, useState, type KeyboardEvent } from 'react'
import type { Intensity, ResultSummary, WorkoutBlock, WorkoutInterval, WorkoutPlan } from '../domain/types'
import { effortHelp, effortLabel, phaseLabel as localizedPhaseLabel, templateLabel, useI18n } from '../i18n'

const EFFORTS: Intensity[] = ['easy', 'strong', 'max', 'recovery']

export function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
}

export function TicketHeading({ plan, utility }: { plan: WorkoutPlan; utility?: React.ReactNode }) {
  const { locale, t } = useI18n()
  const type = templateLabel(locale, plan.templateType).toUpperCase()
  return <header className={`ticket-heading${utility ? ' has-utility' : ''}`}>{utility}<span className="ticket-brand">CARDIO SLOT</span><h2>{t('ticket.heading', { type })}</h2>
    <p className="ticket-duration">{t('ticket.duration', { clock: formatDuration(plan.effectiveDurationSeconds), minutes: plan.durationMinutes })}</p>
  </header>
}

function IntervalCards({ intervals }: { intervals: WorkoutInterval[] }) {
  const { locale, t } = useI18n()
  return <ol className="ticket-interval-cards" aria-label={t('ticket.intervals')}>
    {intervals.map(interval => <li className={`interval-card-${interval.intensity}`} key={interval.id} data-interval-id={interval.id}>
      <time>{formatDuration(interval.durationSeconds)}</time>
      <strong className={`ticket-effort-label effort-label-${interval.intensity}`}>{effortLabel(locale, interval.intensity)}</strong>
      <span className="ticket-incline" aria-label={t('ticket.inclineValue', { incline: interval.incline })}><small aria-hidden="true">{t('ticket.incline')}</small><strong aria-hidden="true">{interval.incline}%</strong></span>
    </li>)}
  </ol>
}

function StaticPhase({ block, mainCount }: { block: WorkoutBlock; mainCount: number }) {
  const { locale, t } = useI18n()
  const interval = block.intervals.at(0)
  if (!interval) return null
  const duration = block.intervals.reduce((total, current) => total + current.durationSeconds, 0)
  return <section className={`ticket-static-phase ticket-${block.kind}`} data-phase-kind={block.kind} data-interval-id={interval.id}>
    <div><strong>{localizedPhaseLabel(locale, block, mainCount)}</strong><time>{formatDuration(duration)}</time></div>
    <p><strong className={`ticket-effort-label effort-label-${interval.intensity}`}>{effortLabel(locale, interval.intensity)}</strong>
      <span>{block.kind === 'recovery' ? effortHelp(locale, 'recovery') : t('ticket.inclineValue', { incline: interval.incline })}</span></p>
  </section>
}

function EffortGuide() {
  const { locale, t } = useI18n()
  const tooltipId = useId()
  const controlsId = useId()
  const [expanded, setExpanded] = useState(false)
  return <aside className="ticket-effort-guide" aria-label={t('ticket.effortGuide')}>
    <button className="ticket-effort-guide-toggle" type="button" aria-expanded={expanded} aria-controls={controlsId}
      onClick={() => setExpanded(current => !current)}>{t('ticket.effortGuide')}</button>
    <div className="ticket-effort-guide-controls" id={controlsId} hidden={!expanded}>
      {EFFORTS.map(effort => <span key={effort} role="term" tabIndex={0} className={`ticket-effort-chip effort-label-${effort}`}
        aria-label={effortLabel(locale, effort)} aria-describedby={`${tooltipId}-${effort}`}>{effortLabel(locale, effort)}
        <span id={`${tooltipId}-${effort}`} role="tooltip" className="ticket-effort-tooltip">{effortHelp(locale, effort)}</span>
      </span>)}
    </div>
  </aside>
}

export function Ticket({ plan, headerUtility, children }: { plan: WorkoutPlan; result?: ResultSummary; headerUtility?: React.ReactNode; children?: React.ReactNode }) {
  const { locale, t } = useI18n()
  const accordionId = useId()
  const mainCount = plan.blocks.filter(block => block.kind === 'main').length
  const [openBlockId, setOpenBlockId] = useState(() => plan.blocks.find(block => block.kind === 'main')?.id ?? plan.blocks.at(0)?.id ?? null)
  const movePhaseFocus = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const buttons = Array.from(event.currentTarget.closest('.ticket-body')?.querySelectorAll<HTMLButtonElement>('.ticket-phase-toggle') ?? [])
    const current = buttons.indexOf(event.currentTarget)
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    event.preventDefault()
    buttons.at(target)?.focus()
  }
  return <article className="ticket" aria-label={t('ticket.plan')}>
      <TicketHeading plan={plan} utility={headerUtility} />
      <div className="ticket-body" tabIndex={0} aria-label={t('ticket.instructions')}>
        <aside className="ticket-safety"><strong>{t('ticket.beforeStart')}</strong><p>{t('ticket.safety')}</p></aside>
        <EffortGuide />
        {plan.blocks.map(block => {
          if (block.kind !== 'main') return <StaticPhase block={block} mainCount={mainCount} key={block.id} />
          const duration = block.intervals.reduce((total, interval) => total + interval.durationSeconds, 0)
          const headingId = `${accordionId}-${block.id}-heading`
          const regionId = `${accordionId}-${block.id}-region`
          const expanded = openBlockId === block.id
          return <section className="ticket-phase" key={block.id}>
            <h3><button id={headingId} className="ticket-phase-toggle" type="button" aria-expanded={expanded} aria-controls={regionId} onClick={() => setOpenBlockId(current => current === block.id ? null : block.id)} onKeyDown={movePhaseFocus}>
              <span className="ticket-phase-title"><span>{localizedPhaseLabel(locale, block, mainCount)}</span><span>{formatDuration(duration)}</span></span>
              <span className="ticket-effort-strip" aria-label={t('ticket.effortSequence', { sequence: block.intervals.map(interval => `${effortLabel(locale, interval.intensity)} ${formatDuration(interval.durationSeconds)}`).join(', ') })}>
                {block.intervals.map(interval => <i className={`effort-strip-${interval.intensity}`} key={interval.id} style={{ flexGrow: interval.durationSeconds }} />)}
              </span>
            </button></h3>
            <div id={regionId} role="region" aria-labelledby={headingId} hidden={!expanded}>
              <IntervalCards intervals={block.intervals} />
            </div>
          </section>
        })}
      </div>
    {children}
  </article>
}
