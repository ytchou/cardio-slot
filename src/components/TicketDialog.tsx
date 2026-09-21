import { useLayoutEffect, useRef } from 'react'
import type { WorkoutPlan } from '../domain/types'
import { Ticket } from './Ticket'

export function TicketDialog({ plan, onClose, onPull, onStart }: {
  plan: WorkoutPlan
  onClose: () => void
  onPull: () => void
  onStart: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const scrollY = window.scrollY
    const oldStyle = document.body.style.cssText
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.cssText = oldStyle
      window.scrollTo(0, scrollY)
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])
  return <dialog onKeyDown={event => {
    if (event.key !== 'Tab') return
    const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]'))
    if (!targets.length) return
    event.preventDefault()
    const current = targets.indexOf(document.activeElement as HTMLElement)
    const next = (current + (event.shiftKey ? -1 : 1) + targets.length) % targets.length
    targets.at(next)?.focus()
  }} className="ticket-dialog" ref={dialogRef} aria-label="Your workout ticket" onCancel={event => { event.preventDefault(); onClose() }}>
    <Ticket plan={plan}><footer className="ticket-actions">
      <button className="primary-button" autoFocus onClick={onStart}>Start workout</button>
      <button onClick={onPull}>Pull again</button>
    </footer></Ticket>
    <button className="close-ticket" onClick={onClose} aria-label="Close ticket">×</button>
  </dialog>
}
