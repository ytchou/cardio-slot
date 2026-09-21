import type { ReactNode } from 'react'
import { TEMPLATE_LABELS, TEMPLATE_TYPES } from '../domain/config'
import type { WorkoutPlan } from '../domain/types'
import { ReelStrip } from './ReelStrip'

export function ReelMachine({ busy, spinning, plan, requestId, reduced, pull, children }: { busy: boolean; spinning: boolean; plan: WorkoutPlan | null; requestId: number; reduced: boolean; pull: () => void; children: ReactNode }) {
  const markLabels = TEMPLATE_TYPES.map(template => `${template}-mark`)
  const registries = [markLabels, TEMPLATE_TYPES.map(template => TEMPLATE_LABELS[template]), markLabels]
  const templateType = plan?.templateType ?? 'endurance'
  const values = [`${templateType}-mark`, TEMPLATE_LABELS[templateType], `${templateType}-mark`]
  return <section className="cabinet" aria-label="Workout slot machine">
    <header className="marquee"><i aria-hidden="true" /><h1>CARDIO SLOT</h1><i aria-hidden="true" /></header>
    <div className="reel-bay">
      <div className="reels">{registries.map((registry, index) => <ReelStrip key={index} labels={registry} value={values[index] ?? ''} index={index} requestId={requestId} reduced={reduced} spinning={spinning} />)}</div>
    </div>
    <div className="sr-only" role="status">{!busy && plan ? `${TEMPLATE_LABELS[plan.templateType]} workout selected` : spinning ? 'Reels rolling' : ''}</div>
    <div className="lever-rail"><span className="lever-caption">Pull<br />lever ↓</span><span className="lever-bracket" aria-hidden="true" />
      <button className={`lever ${spinning && !reduced ? 'is-pulling' : ''}`} disabled={busy} onClick={pull} aria-label="Pull workout"><span className="lever-rod" /><span className="lever-ball" /><span className="lever-pivot" /></button>
    </div>
    {children}
  </section>
}
