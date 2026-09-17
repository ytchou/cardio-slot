import type { ReactNode } from 'react'
import { FINISH_LABELS, FOCUS_LABELS, PATTERN_LABELS } from '../domain/config'
import type { WorkoutPlan } from '../domain/types'
import { ReelStrip } from './ReelStrip'

export function ReelMachine({ busy, spinning, plan, requestId, reduced, pull, children }: { busy: boolean; spinning: boolean; plan: WorkoutPlan | null; requestId: number; reduced: boolean; pull: () => void; children: ReactNode }) {
  const registries = [FOCUS_LABELS, PATTERN_LABELS, FINISH_LABELS]
  const values = plan ? [FOCUS_LABELS[plan.focus], PATTERN_LABELS[plan.pattern], FINISH_LABELS[plan.finish]] : ['Endurance', 'Waves', 'Steady']
  return <section className="cabinet" aria-label="Workout slot machine">
    <header className="marquee"><i aria-hidden="true" /><h1>CARDIO SLOT</h1><i aria-hidden="true" /></header>
    <div className="reel-bay"><div className="reel-labels"><span>Focus</span><span>Pattern</span><span>Finish</span></div>
      <div className="reels">{registries.map((registry, index) => <ReelStrip key={index} labels={Object.values(registry)} value={values[index] ?? ''} index={index} requestId={requestId} reduced={reduced} spinning={spinning} />)}</div>
    </div>
    <div className="sr-only" role="status">{!busy && plan ? values.join(', ') : spinning ? 'Reels rolling' : ''}</div>
    <div className="lever-rail"><span className="lever-caption">Pull<br />lever ↓</span><span className="lever-bracket" aria-hidden="true" />
      <button className={`lever ${spinning && !reduced ? 'is-pulling' : ''}`} disabled={busy} onClick={pull} aria-label="Pull workout"><span className="lever-rod" /><span className="lever-ball" /><span className="lever-pivot" /></button>
    </div>
    {children}
  </section>
}
