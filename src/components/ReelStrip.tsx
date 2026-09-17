import { useLayoutEffect, useRef } from 'react'

export function ReelStrip({ labels, value, index, requestId, reduced, spinning }: { labels: string[]; value: string; index: number; requestId: number; reduced: boolean; spinning: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const selected = Math.max(0, labels.indexOf(value))
  const target = labels.length * 5 + selected
  const rows = Array.from({ length: labels.length * 7 }, (_, row) => labels[row % labels.length])
  useLayoutEffect(() => {
    const strip = ref.current
    if (!strip || !requestId || reduced || !spinning) return
    const animation = strip.animate([
      { transform: 'translateY(calc(var(--reel-row) * -1))', offset: 0 },
      { transform: `translateY(calc(var(--reel-row) * -${target - 0.16}))`, offset: 0.93 },
      { transform: `translateY(calc(var(--reel-row) * -${target}))`, offset: 1 },
    ], { duration: 1200 + index * 400, delay: 220, easing: 'cubic-bezier(.18,.62,.22,1)', fill: 'backwards' })
    return () => animation.cancel()
  }, [requestId, index, target, reduced, spinning])
  return <div className="reel-window" aria-hidden="true"><div className="reel-strip" ref={ref} style={{ transform: `translateY(calc(var(--reel-row) * -${target}))` }}>
    {rows.map((label, row) => <div className="reel-row" key={row}>{label}</div>)}
  </div><div className="reel-shade" /><div className="reel-payline" /></div>
}
