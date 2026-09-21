import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { WorkoutPlan } from '../domain/types'
import { Ticket } from './Ticket'

export function TicketDialog({ plan, opening, reduced, paperRef, onClose, onPull, onStart, onSettled }: {
  plan: WorkoutPlan; opening: boolean; reduced: boolean; paperRef: RefObject<HTMLDivElement | null>;
  onClose: () => void; onPull: () => void; onStart: () => void; onSettled: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const animationRef = useRef<Animation | null>(null)
  const callbacks = useRef({ onSettled })
  useLayoutEffect(() => { callbacks.current = { onSettled } })
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const scrollY = window.scrollY
    const oldStyle = document.body.style.cssText
    const source = paperRef.current?.getBoundingClientRect()
    const feed = paperRef.current?.closest('.paper-feed')?.getBoundingClientRect()
    const visibleHeight = source && feed ? Math.max(0, Math.min(source.bottom, feed.bottom) - Math.max(source.top, feed.top)) : 0
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    dialog.showModal()
    const receipt = dialog.querySelector<HTMLElement>('.ticket')
    let animation: Animation | undefined
    if (opening && !reduced && source && source.width && receipt) {
      const target = receipt.getBoundingClientRect()
      animation = receipt.animate([
        { transform: `translate(${source.x - target.x}px, ${source.y - target.y}px) scale(${source.width / target.width})`, clipPath: `inset(0 0 ${Math.max(0, target.height - visibleHeight * target.width / source.width)}px 0)` },
        { transform: 'none', clipPath: 'inset(0)' },
      ], { duration: 500, easing: 'cubic-bezier(.2,.7,.2,1)' })
    }
    animationRef.current = animation ?? null
    const settle = () => { animation?.cancel(); callbacks.current.onSettled() }
    window.addEventListener('resize', settle)
    window.visualViewport?.addEventListener('resize', settle)
    return () => {
      animation?.cancel()
      window.removeEventListener('resize', settle)
      window.visualViewport?.removeEventListener('resize', settle)
      dialog.close()
      document.body.style.cssText = oldStyle
      window.scrollTo(0, scrollY)
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
    // Keep the mounted dialog and scroll lock intact when opening becomes ticket.
  }, [])
  useLayoutEffect(() => {
    if (reduced && opening) { animationRef.current?.cancel(); callbacks.current.onSettled() }
  }, [reduced, opening])
  return <dialog onKeyDown={event => {
    if (event.key !== 'Tab') return
    const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]'))
    if (!targets.length) return
    event.preventDefault()
    const current = targets.indexOf(document.activeElement as HTMLElement)
    const next = (current + (event.shiftKey ? -1 : 1) + targets.length) % targets.length
    targets.at(next)?.focus()
  }} className="ticket-dialog" data-opening={opening} ref={dialogRef} aria-label="Your workout ticket" onCancel={event => { event.preventDefault(); if (!opening) onClose() }}>
    <Ticket plan={plan}><footer className="ticket-actions">
      <button className="primary-button" disabled={opening} autoFocus onClick={onStart}>Start workout</button>
      <button disabled={opening} onClick={onPull}>Pull again</button>
    </footer></Ticket>
    <button className="close-ticket" disabled={opening} onClick={onClose} aria-label="Close ticket">×</button>
  </dialog>
}
