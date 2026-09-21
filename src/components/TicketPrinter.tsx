import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { AppFlow } from '../app/state'
import type { WorkoutPlan } from '../domain/types'
import { TicketHeading } from './Ticket'

export function TicketPrinter({ plan, flow, paperRef, reopen }: { plan: WorkoutPlan | null; flow: AppFlow; paperRef: RefObject<HTMLDivElement | null>; reopen: (button: HTMLButtonElement) => void }) {
  const feedRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const feed = feedRef.current
    const paper = paperRef.current
    if (!feed || !paper) return
    const resize = () => paper.style.setProperty('--paper-scale', String(feed.clientWidth / paper.offsetWidth))
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(feed)
    observer.observe(paper)
    return () => observer.disconnect()
  }, [paperRef])
  return <div className="printer"><div className="printer-slit" />
    <div ref={feedRef} className={`paper-feed ${flow === 'printing' ? 'is-feeding' : ''} ${flow === 'opening' ? 'is-handoff' : ''}`} aria-hidden="true">
      <div className="paper-travel"><div className="printer-paper" ref={paperRef}><div className="ticket">{plan && <TicketHeading plan={plan} />}</div></div></div>
    </div><div className="printer-lip" />
    {plan && ['configure', 'ticket'].includes(flow) && <button className="view-ticket" onClick={event => reopen(event.currentTarget)}>View ticket</button>}
  </div>
}
