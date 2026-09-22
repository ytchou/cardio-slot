import { useLayoutEffect, useRef } from 'react'

function ReelMark({ label }: { label: string }) {
  const type = label.replace('-mark', '')
  if (type === 'endurance') return <svg className="reel-mark" viewBox="0 0 64 40" focusable="false"><ellipse cx="32" cy="20" rx="25" ry="13" /><ellipse cx="32" cy="20" rx="15" ry="6" /></svg>
  if (type === 'hills') return <svg className="reel-mark" viewBox="0 0 64 40" focusable="false"><path d="M5 33 22 13l9 11L42 8l17 25" /><path d="M14 33h41" /></svg>
  return <svg className="reel-mark" viewBox="0 0 64 40" focusable="false"><path d="M8 10h30M8 20h48M8 30h37" /><path d="m45 7 11 13-11 13" /></svg>
}

interface ReelItem { id: string; label: string }

export function ReelStrip({ items, value, index, requestId, reduced, spinning }: { items: ReelItem[]; value: string; index: number; requestId: number; reduced: boolean; spinning: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const selected = Math.max(0, items.findIndex(item => item.id === value))
  const target = items.length * 36 + selected
  const rows = Array.from({ length: items.length * 38 }, (_, row) => items[row % items.length]).filter(item => item !== undefined)
  useLayoutEffect(() => {
    const strip = ref.current
    if (!strip || !requestId || reduced || !spinning) return
    const animation = strip.animate([
      { transform: 'translateY(calc(var(--reel-row) * -1))', opacity: 1, filter: 'blur(0)', offset: 0, easing: 'cubic-bezier(.6,0,.9,.3)' },
      { transform: 'translateY(calc(var(--reel-row) * -4))', opacity: .8, filter: 'blur(.5px)', offset: .08, easing: 'cubic-bezier(.4,0,.8,.6)' },
      { transform: 'translateY(calc(var(--reel-row) * -22))', opacity: .4, filter: 'blur(2px)', offset: .22, easing: 'linear' },
      { transform: 'translateY(calc(var(--reel-row) * -70))', opacity: .4, filter: 'blur(2px)', offset: .52, easing: 'linear' },
      { transform: `translateY(calc(var(--reel-row) * -${target - 18}))`, opacity: .48, filter: 'blur(1.5px)', offset: .72, easing: 'cubic-bezier(.25,.33,.35,1)' },
      { transform: `translateY(calc(var(--reel-row) * -${target + .12}))`, opacity: 1, filter: 'blur(0)', offset: .96, easing: 'ease-out' },
      { transform: `translateY(calc(var(--reel-row) * -${target}))`, opacity: 1, filter: 'blur(0)', offset: 1 },
    ], { duration: 3_200 + index * 400, fill: 'backwards' })
    return () => animation.cancel()
  }, [requestId, index, target, reduced, spinning])
  return <div className={`reel-window ${spinning && !reduced ? 'is-spinning' : ''}`} aria-hidden="true"><div className="reel-strip" ref={ref} style={{ transform: `translateY(calc(var(--reel-row) * -${target}))` }}>
    {rows.map((item, row) => <div className="reel-row" key={row}>{item.id.endsWith('-mark') ? <ReelMark label={item.id} /> : item.label}</div>)}
  </div><div className="reel-shade" /><div className="reel-payline" /></div>
}
