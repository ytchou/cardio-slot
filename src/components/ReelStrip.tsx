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
    {rows.map((label, row) => <div className="reel-row" key={row}>{label.endsWith('-mark') ? <ReelMark label={label} /> : label}</div>)}
  </div><div className="reel-shade" /><div className="reel-payline" /></div>
}
