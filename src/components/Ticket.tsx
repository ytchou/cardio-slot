import type { Intensity, WorkoutBlock, WorkoutInterval, WorkoutPlan } from '../domain/types'
import { effortHelp, effortLabel, phaseLabel as localizedPhaseLabel, templateLabel, useI18n } from '../i18n'

const EFFORTS: Intensity[] = ['easy', 'strong', 'max', 'recovery']

export function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
}

export function TicketHeading({ plan }: { plan: WorkoutPlan }) {
  const { locale, t } = useI18n()
  const type = templateLabel(locale, plan.templateType).toUpperCase()
  return <header className="ticket-heading"><span className="ticket-brand">CARDIO SLOT</span>
    <div className="ticket-heading-copy">
      <p className="ticket-kicker" aria-hidden="true">{t('ticket.headingLabel')}</p>
      <h2 aria-label={t('ticket.heading', { type })}>{type}</h2>
      <time className="ticket-duration" dateTime={`PT${plan.durationMinutes}M`}><span className="sr-only">{t('ticket.duration', { clock: formatDuration(plan.effectiveDurationSeconds), minutes: plan.durationMinutes })}</span><span aria-hidden="true">{formatDuration(plan.effectiveDurationSeconds)}</span></time>
    </div>
  </header>
}

function IntervalCards({ intervals }: { intervals: WorkoutInterval[] }) {
  const { locale, t } = useI18n()
  return <ol className="ticket-interval-cards" aria-label={t('ticket.intervals')}>
    {intervals.map((interval, index) => <li key={interval.id} data-interval-id={interval.id}>
      <span className="ticket-interval-index" aria-hidden="true">{index + 1}</span>
      <time>{formatDuration(interval.durationSeconds)}</time>
      <strong className="ticket-effort-label">{effortLabel(locale, interval.intensity)}</strong>
      <span className="ticket-incline"><span className="sr-only">{t('ticket.inclineValue', { incline: interval.incline })}</span><span aria-hidden="true">{interval.incline}%</span></span>
    </li>)}
  </ol>
}

function TicketPhase({ block, mainCount }: { block: WorkoutBlock; mainCount: number }) {
  const { locale, t } = useI18n()
  const duration = block.intervals.reduce((total, current) => total + current.durationSeconds, 0)
  const isMain = block.kind === 'main'
  return <section className="ticket-phase" aria-label={localizedPhaseLabel(locale, block, mainCount)} data-phase-kind={block.kind}>
    <div className="ticket-phase-title">
      <span className="ticket-phase-index" aria-hidden="true">{isMain ? String(block.mainBlockIndex ?? 1).padStart(2, '0') : null}</span>
      <h3>{localizedPhaseLabel(locale, block, mainCount)}</h3>
      {isMain && <time>{formatDuration(duration)}</time>}
    </div>
    <div className="ticket-phase-content">
      {isMain && <>
        <div className="ticket-phase-timeline" aria-hidden="true">{block.intervals.map(interval => <span key={interval.id} className={`ticket-timeline-${interval.intensity}`} style={{ flexGrow: interval.durationSeconds }} />)}</div>
        <div className="ticket-column-headings" aria-hidden="true"><span /><span>{t('ticket.time')}</span><span>{t('ticket.effort')}</span><span>{t('ticket.incline')}</span></div>
      </>}
      <IntervalCards intervals={block.intervals} />
    </div>
  </section>
}

function EffortGuide() {
  const { locale, t } = useI18n()
  return <aside className="ticket-effort-guide" aria-label={t('ticket.effortGuide')}>
    <h3>{t('ticket.effortGuide')}</h3>
    <dl className="ticket-effort-guide-controls">
      {EFFORTS.map(effort => <div key={effort}>
        <dt><span className={`ticket-timeline-${effort}`} aria-hidden="true" />{effortLabel(locale, effort)}</dt>
        <dd>{effortHelp(locale, effort)}</dd>
      </div>)}
    </dl>
  </aside>
}

export function Ticket({ plan, children }: { plan: WorkoutPlan; children?: React.ReactNode }) {
  const { t } = useI18n()
  const mainCount = plan.blocks.filter(block => block.kind === 'main').length
  return <article className="ticket" aria-label={t('ticket.plan')}>
      <TicketHeading plan={plan} />
      <div className="ticket-body" aria-label={t('ticket.instructions')}>
        {plan.blocks.map(block => <TicketPhase block={block} mainCount={mainCount} key={block.id} />)}
        <EffortGuide />
      </div>
    {children}
  </article>
}
