import { useLayoutEffect, useRef } from 'react'

function ReelMark({ label }: { label: string }) {
  const type = label.replace('-mark', '')
  if (type === 'endurance') return <svg className="reel-mark" viewBox="0 0 64 40" focusable="false"><ellipse cx="32" cy="20" rx="25" ry="13" /><ellipse cx="32" cy="20" rx="15" ry="6" /></svg>
  if (type === 'hills') return <svg className="reel-mark" viewBox="0 0 64 40" focusable="false"><path d="M5 33 22 13l9 11L42 8l17 25" /><path d="M14 33h41" /></svg>
  return <svg className="reel-mark" viewBox="0 0 64 40" focusable="false"><path d="M8 10h30M8 20h48M8 30h37" /><path d="m45 7 11 13-11 13" /></svg>
}

export function ReelStrip({ labels, value, index, requestId, reduced, spinning }: { labels: string[]; value: string; index: number; requestId: number; reduced: boolean; spinning: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const selected = Math.max(0, labels.indexOf(value))
  const target = labels.length * 10 + selected
  const rows = Array.from({ length: labels.length * 12 }, (_, row) => labels[row % labels.length])
  useLayoutEffect(() => {
    const strip = ref.current
    if (!strip || !requestId || reduced || !spinning) return
    const animation = strip.animate([
      { transform: 'translateY(calc(var(--reel-row) * -1))', opacity: 1, offset: 0, easing: 'cubic-bezier(.42,0,1,1)' },
      { transform: 'translateY(calc(var(--reel-row) * -3))', opacity: .72, offset: .1, easing: 'linear' },
      { transform: `translateY(calc(var(--reel-row) * -${target - 3}))`, opacity: .72, offset: .72, easing: 'cubic-bezier(.12,.75,.2,1)' },
      { transform: `translateY(calc(var(--reel-row) * -${target + .12}))`, opacity: 1, offset: .96, easing: 'ease-out' },
      { transform: `translateY(calc(var(--reel-row) * -${target}))`, opacity: 1, offset: 1 },
    ], { duration: 3_200 + index * 400, fill: 'backwards' })
    return () => animation.cancel()
  }, [requestId, index, target, reduced, spinning])
  return <div className={`reel-window ${spinning && !reduced ? 'is-spinning' : ''}`} aria-hidden="true"><div className="reel-strip" ref={ref} style={{ transform: `translateY(calc(var(--reel-row) * -${target}))` }}>
    {rows.map((label, row) => <div className="reel-row" key={row}>{label.endsWith('-mark') ? <ReelMark label={label} /> : label}</div>)}
  </div><div className="reel-shade" /><div className="reel-payline" /></div>
}
