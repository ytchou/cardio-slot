import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { WorkoutPlan } from '../domain/types'
import { Ticket } from './Ticket'

export function TicketHandoff({ plan, paperRef, reduced, onSettled }: {
  plan: WorkoutPlan
  paperRef: RefObject<HTMLDivElement | null>
  reduced: boolean
  onSettled: () => void
}) {
  const handoffRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onSettled)
  useLayoutEffect(() => { callbackRef.current = onSettled })

  useLayoutEffect(() => {
    let active = true
    let settled = false
    const settle = () => {
      if (!active || settled) return
      settled = true
      callbackRef.current()
    }
    if (reduced) {
      queueMicrotask(settle)
      return () => { active = false }
    }

    const source = paperRef.current?.getBoundingClientRect()
    const feed = paperRef.current?.closest('.paper-feed')?.getBoundingClientRect()
    const handoff = handoffRef.current
    if (!source?.width || !feed || !handoff || typeof handoff.animate !== 'function') {
      queueMicrotask(settle)
      return () => { active = false }
    }

    const target = handoff.getBoundingClientRect()
    const scale = source.width / target.width
    const visibleHeight = Math.max(0, Math.min(source.bottom, feed.bottom) - Math.max(source.top, feed.top))
    const clippedBottom = Math.max(0, target.height - visibleHeight / scale)
    const animation = handoff.animate([
      {
        transform: `translate(${source.x - target.x}px, ${source.y - target.y}px) scale(${scale})`,
        clipPath: `inset(0 0 ${clippedBottom}px 0)`,
        boxShadow: '0 4px 12px #0002',
      },
      {
        transform: 'none',
        clipPath: 'inset(0)',
        boxShadow: '0 15px 55px #0005',
      },
    ], { duration: 650, easing: 'cubic-bezier(.2,.72,.2,1)', fill: 'both' })
    void animation.finished.then(settle, settle)
    window.addEventListener('resize', settle)
    window.visualViewport?.addEventListener('resize', settle)
    return () => {
      active = false
      animation.cancel()
      window.removeEventListener('resize', settle)
      window.visualViewport?.removeEventListener('resize', settle)
    }
  }, [paperRef, reduced])

  return <div className="ticket-handoff-stage" aria-hidden="true" data-reduced={reduced}>
    <div className="ticket-handoff" ref={handoffRef} inert>
      <Ticket plan={plan}><footer className="ticket-actions">
        <button className="primary-button" disabled>Start workout</button>
        <button disabled>Pull again</button>
      </footer></Ticket>
    </div>
  </div>
}
